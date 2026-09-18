import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { wallets } from "@/lib/db/schema";
import { onchainStats } from "@/lib/chain/onchain-stats";
import { trustGraph, type TrustGraphSummary } from "@/lib/chain/trust-graph";
import { generateProofs, type Proof } from "@/lib/score/proofs";
import { getDimensions, type DimensionState } from "@/lib/score/dimensions";
import type { Address } from "@/lib/score/types";

const MS_PER_DAY = 86_400_000;

export interface WalletProfile {
  address: Address;
  txCount: number | null;
  firstTxAt: string | null;
  lastTxAt: string | null;
  walletAgeDays: number | null;
  firstSeenAt: string | null;
  proofs: Proof[];
  dimensions: DimensionState[];
  trustGraph: TrustGraphSummary;
}

/** Basic profile (Spec 01) + proof (Spec 02) + dimensions (Spec 03) + trust graph (Spec 04). Data yang tidak tersedia tetap null — jangan dikarang. */
export async function getWalletProfile(address: Address): Promise<WalletProfile> {
  const [wallet] = await db
    .select({ firstSeenAt: wallets.firstSeenAt })
    .from(wallets)
    .where(eq(wallets.address, address))
    .limit(1);

  const stats = await onchainStats.fetch(address);
  const graph = await trustGraph.fetch(address);
  const proofs = generateProofs(address, stats, graph, new Date());

  return {
    address,
    txCount: stats.txCount,
    firstTxAt: stats.firstTxAt?.toISOString() ?? null,
    lastTxAt: stats.lastTxAt?.toISOString() ?? null,
    // Umur hanya dihitung kalau sumber historis ada.
    walletAgeDays: stats.firstTxAt
      ? Math.floor((Date.now() - stats.firstTxAt.getTime()) / MS_PER_DAY)
      : null,
    firstSeenAt: wallet?.firstSeenAt.toISOString() ?? null,
    proofs,
    dimensions: getDimensions(proofs),
    trustGraph: graph,
  };
}
