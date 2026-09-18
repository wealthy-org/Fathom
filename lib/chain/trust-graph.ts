import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  counterparties,
  trustGraphState,
  walletRelationships,
} from "@/lib/db/schema";
import { normalizeAddress } from "@/lib/chain/address";
import { fetchAddressTransactions } from "@/lib/chain/blockscout";
import { THRESHOLDS } from "@/config/thresholds";
import type { Address } from "@/lib/score/types";

const HOUR_MS = 3_600_000;
const SOURCE = "blockscout";
// ponytail: BigInt(0) bukan literal 0n — target TS proyek masih ES2017.
const ZERO = BigInt(0);

export interface RelationshipSummary {
  counterparty: Address;
  isContract: boolean;
  interactionCount: number;
  // Lower bound saat complete=false.
  valueSent: bigint;
  valueReceived: bigint;
  firstInteractionAt: Date | null;
  lastInteractionAt: Date | null;
}

export interface TrustGraphSummary {
  uniqueCounterparties: number;
  repeatCounterparties: number;
  relationships: RelationshipSummary[];
  /**
   * false = walk tx kena batas halaman. Semua angka adalah lower bound,
   * bukan nilai pasti. Jangan terbitkan proof turunan saat incomplete.
   */
  complete: boolean;
}

export interface TrustGraphProvider {
  fetch(address: Address): Promise<TrustGraphSummary>;
}

function isFresh(fetchedAt: Date): boolean {
  return (
    Date.now() - fetchedAt.getTime() < THRESHOLDS.trustGraph.cacheTtlHours * HOUR_MS
  );
}

function parseWei(value: string): bigint {
  try {
    return BigInt(value);
  } catch {
    return ZERO;
  }
}

interface Aggregate {
  isContract: boolean;
  count: number;
  sent: bigint;
  received: bigint;
  first: Date | null;
  last: Date | null;
}

/** Derivasi pasangan counterparty dari perspektif subject. Pure, tanpa I/O. */
function derive(
  subject: Address,
  txs: {
    from: Address;
    to: Address | null;
    valueWei: string;
    timestamp: Date | null;
    toIsContract: boolean;
  }[],
): Map<Address, Aggregate> {
  const byCounterparty = new Map<Address, Aggregate>();

  const touch = (
    counterparty: Address,
    isContract: boolean,
    sent: bigint,
    received: bigint,
    at: Date | null,
  ) => {
    const agg = byCounterparty.get(counterparty) ?? {
      isContract,
      count: 0,
      sent: ZERO,
      received: ZERO,
      first: null,
      last: null,
    };
    agg.count += 1;
    agg.sent += sent;
    agg.received += received;
    agg.isContract = agg.isContract || isContract;
    if (at) {
      if (!agg.first || at < agg.first) agg.first = at;
      if (!agg.last || at > agg.last) agg.last = at;
    }
    byCounterparty.set(counterparty, agg);
  };

  for (const tx of txs) {
    const value = parseWei(tx.valueWei);
    if (tx.from === subject) {
      if (tx.to === null || tx.to === subject) continue; // deploy / self
      touch(tx.to, tx.toIsContract, value, ZERO, tx.timestamp);
    } else if (tx.to === subject) {
      touch(tx.from, false, ZERO, value, tx.timestamp);
    }
    // else: tx yang melibatkan subject hanya via token/internal — di luar semantik.
  }

  return byCounterparty;
}

function toSummary(pairs: Map<Address, Aggregate>, complete: boolean): TrustGraphSummary {
  const relationships: RelationshipSummary[] = [...pairs.entries()].map(
    ([counterparty, agg]) => ({
      counterparty,
      isContract: agg.isContract,
      interactionCount: agg.count,
      valueSent: agg.sent,
      valueReceived: agg.received,
      firstInteractionAt: agg.first,
      lastInteractionAt: agg.last,
    }),
  );

  return {
    uniqueCounterparties: relationships.length,
    repeatCounterparties: relationships.filter(
      (r) => r.interactionCount >= THRESHOLDS.trustGraph.repeatInteractionMin,
    ).length,
    relationships,
    complete,
  };
}

async function readCached(address: Address): Promise<TrustGraphSummary | null> {
  const [state] = await db
    .select({
      complete: trustGraphState.complete,
      fetchedAt: trustGraphState.fetchedAt,
    })
    .from(trustGraphState)
    .where(eq(trustGraphState.subjectAddress, address))
    .limit(1);

  if (!state) return null;

  const rows = await db
    .select({
      counterparty: walletRelationships.counterpartyAddress,
      interactionCount: walletRelationships.interactionCount,
      valueSent: walletRelationships.valueSent,
      valueReceived: walletRelationships.valueReceived,
      firstInteractionAt: walletRelationships.firstInteractionAt,
      lastInteractionAt: walletRelationships.lastInteractionAt,
      isContract: counterparties.isContract,
    })
    .from(walletRelationships)
    .innerJoin(
      counterparties,
      eq(counterparties.address, walletRelationships.counterpartyAddress),
    )
    .where(eq(walletRelationships.subjectAddress, address));

  const relationships: RelationshipSummary[] = rows.map((row) => ({
    counterparty: row.counterparty as Address,
    isContract: row.isContract,
    interactionCount: row.interactionCount,
    valueSent: row.valueSent,
    valueReceived: row.valueReceived,
    firstInteractionAt: row.firstInteractionAt,
    lastInteractionAt: row.lastInteractionAt,
  }));

  return {
    uniqueCounterparties: relationships.length,
    repeatCounterparties: relationships.filter(
      (r) => r.interactionCount >= THRESHOLDS.trustGraph.repeatInteractionMin,
    ).length,
    relationships,
    complete: state.complete,
  };
}

/**
 * Read-through cache trust graph (Spec 04). Pola sama dengan onchain-stats:
 * pakai baris selama belum lewat TTL; kalau lewat, walk tx explorer lalu persist.
 * Kegagalan fetch mempertahankan data lama — tidak menimpa dengan nol.
 */
class ExplorerTrustGraphProvider implements TrustGraphProvider {
  async fetch(address: Address): Promise<TrustGraphSummary> {
    const normalized = normalizeAddress(address);

    const [state] = await db
      .select({ complete: trustGraphState.complete, fetchedAt: trustGraphState.fetchedAt })
      .from(trustGraphState)
      .where(eq(trustGraphState.subjectAddress, normalized))
      .limit(1);

    if (state && isFresh(state.fetchedAt)) {
      const cached = await readCached(normalized);
      if (cached) return cached;
    }

    const fetched = await fetchAddressTransactions(
      normalized,
      THRESHOLDS.trustGraph.maxCounterpartyPages,
    );

    if (!fetched) {
      const cached = await readCached(normalized);
      return cached ?? toSummary(new Map(), false);
    }

    const pairs = derive(normalized, fetched.transactions);
    const summary = toSummary(pairs, fetched.complete);

    // counterparties.subjectAddress FK + wallet_relationships FK → subject harus ada.
    await db
      .insert(counterparties)
      .values({ address: normalized, isContract: false, source: SOURCE })
      .onConflictDoNothing();

    for (const rel of summary.relationships) {
      await db
        .insert(counterparties)
        .values({ address: rel.counterparty, isContract: rel.isContract, source: SOURCE })
        .onConflictDoUpdate({
          target: counterparties.address,
          set: { isContract: rel.isContract, updatedAt: new Date() },
        });
    }

    // Ganti set relasi subject supaya tidak ada baris basi dari walk sebelumnya.
    // ponytail: delete+insert non-atomik (neon-http tidak dukung tx). Ini cache
    // turunan; kegagalan di tengah sembuh sendiri saat fetch berikutnya.
    await db
      .delete(walletRelationships)
      .where(eq(walletRelationships.subjectAddress, normalized));

    if (summary.relationships.length > 0) {
      await db.insert(walletRelationships).values(
        summary.relationships.map((rel) => ({
          subjectAddress: normalized,
          counterpartyAddress: rel.counterparty,
          interactionCount: rel.interactionCount,
          valueSent: rel.valueSent,
          valueReceived: rel.valueReceived,
          firstInteractionAt: rel.firstInteractionAt,
          lastInteractionAt: rel.lastInteractionAt,
          source: SOURCE,
        })),
      );
    }

    await db
      .insert(trustGraphState)
      .values({
        subjectAddress: normalized,
        complete: summary.complete,
        source: SOURCE,
        fetchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: trustGraphState.subjectAddress,
        set: { complete: summary.complete, source: SOURCE, fetchedAt: new Date() },
      });

    return summary;
  }
}

export const trustGraph: TrustGraphProvider = new ExplorerTrustGraphProvider();
