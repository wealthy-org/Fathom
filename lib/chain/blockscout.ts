import { THRESHOLDS } from "@/config/thresholds";
import type { Address } from "@/lib/score/types";

/**
 * Adapter sumber indexed (Blockscout) untuk riwayat per-address Robinhood Chain testnet.
 * Disetujui sebagai sumber eksternal Spec 01. Read-only, tanpa API key.
 *
 * Semantik txCount = transaksi langsung di mana address jadi from/to (endpoint
 * /api/v2/addresses/{a}/transactions). Bukan internal tx, bukan token transfer.
 *
 * Jangan fabricate: kegagalan fetch atau hasil terpotong mengembalikan null,
 * bukan angka karangan.
 */

const EXPLORER_BASE_URL =
  process.env.ROBINHOOD_EXPLORER_URL ??
  "https://explorer.testnet.chain.robinhood.com";

/** URL halaman address di explorer — dipakai sebagai evidence_reference proof. */
export function explorerAddressUrl(address: Address): string {
  return `${EXPLORER_BASE_URL}/address/${address}`;
}

export interface AddressTxSummary {
  // null = jumlah pasti tidak diketahui (hasil terpotong batas halaman).
  txCount: number | null;
  firstTxAt: Date | null;
  lastTxAt: Date | null;
}

async function fetchJson(url: string): Promise<unknown> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), THRESHOLDS.explorer.requestTimeoutMs);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: { accept: "application/json", "user-agent": "fathom-indexer/1.0" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function parseSeconds(value: unknown): Date | null {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return null;
  return new Date(n * 1000);
}

/**
 * Endpoint v2 mengembalikan timestamp ISO (mis. "2026-09-12T22:58:26.000000Z"),
 * bukan epoch detik seperti v1 txlist. Terima keduanya supaya tidak diam-diam null.
 */
function parseTimestamp(value: unknown): Date | null {
  if (typeof value === "number") return parseSeconds(value);
  if (typeof value !== "string") return null;
  if (/^\d+$/.test(value)) return parseSeconds(value);
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms) : null;
}

/**
 * Blockscout mendukung `next_page_params` di respons v2. Kita konversi ke query
 * string; kalau capaian maxPages, txCount dikembalikan null (tidak mengarang).
 */
async function countDirectTransactions(address: Address): Promise<number | null> {
  let url = `${EXPLORER_BASE_URL}/api/v2/addresses/${address}/transactions`;
  let total = 0;

  for (let page = 0; page < THRESHOLDS.explorer.maxPages; page++) {
    const body = await fetchJson(url);
    if (body === null || typeof body !== "object") return null;
    const items = (body as { items?: unknown }).items;
    if (!Array.isArray(items)) return null;
    total += items.length;

    const next = (body as { next_page_params?: unknown }).next_page_params;
    if (!next || typeof next !== "object") return total;
    const qs = new URLSearchParams(
      Object.entries(next as Record<string, unknown>).map(([k, v]) => [k, String(v)]),
    );
    url = `${EXPLORER_BASE_URL}/api/v2/addresses/${address}/transactions?${qs}`;
  }

  // ponytail: cap maxPages → txCount null (unknown, bukan salah). Naikkan
  // THRESHOLDS.explorer.maxPages atau pakai indexer sendiri kalau perlu pasti.
  return null;
}

/** Ambil ringkasan transaksi langsung dari Blockscout. null = sumber tidak tersedia. */
export async function fetchAddressTxSummary(
  address: Address,
): Promise<AddressTxSummary | null> {
  const listBase = `${EXPLORER_BASE_URL}/api?module=account&action=txlist&address=${address}&page=1&offset=1&sort=`;

  const [asc, desc, txCount] = await Promise.all([
    fetchJson(`${listBase}asc`),
    fetchJson(`${listBase}desc`),
    countDirectTransactions(address),
  ]);

  const firstResult = (asc as { result?: unknown })?.result;
  const lastResult = (desc as { result?: unknown })?.result;
  if (!Array.isArray(firstResult) || !Array.isArray(lastResult)) return null;

  const first = firstResult[0] as { timeStamp?: unknown } | undefined;
  const last = lastResult[0] as { timeStamp?: unknown } | undefined;

  if (!first && !last) {
    // Address tanpa transaksi — 0 itu fakta, bukan karangan.
    return { txCount: 0, firstTxAt: null, lastTxAt: null };
  }

  return {
    txCount,
    firstTxAt: first ? parseSeconds(first.timeStamp) : null,
    lastTxAt: last ? parseSeconds(last.timeStamp) : null,
  };
}

export interface AddressTransaction {
  from: Address;
  // null = contract creation (tidak ada penerima).
  to: Address | null;
  /** Native value dalam wei, string apa adanya dari explorer. */
  valueWei: string;
  timestamp: Date | null;
  toIsContract: boolean;
}

export interface AddressTransactions {
  transactions: AddressTransaction[];
  /**
   * false = walk berhenti di batas halaman, daftar TIDAK lengkap.
   * Jangan sajikan turunan sebagai angka pasti saat incomplete.
   */
  complete: boolean;
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

function asAddress(value: unknown): Address | null {
  if (typeof value !== "string" || !ADDRESS_RE.test(value)) return null;
  return value.toLowerCase() as Address;
}

/**
 * Walk transaksi langsung per-address untuk derivasi counterparty (Spec 04).
 * Bukan internal tx / token transfer — sama semantiknya dengan txCount.
 * null = sumber tidak tersedia.
 */
export async function fetchAddressTransactions(
  address: Address,
  maxPages: number,
): Promise<AddressTransactions | null> {
  let url = `${EXPLORER_BASE_URL}/api/v2/addresses/${address}/transactions`;
  const transactions: AddressTransaction[] = [];

  for (let page = 0; page < maxPages; page++) {
    const body = await fetchJson(url);
    if (body === null || typeof body !== "object") return null;
    const items = (body as { items?: unknown }).items;
    if (!Array.isArray(items)) return null;

    for (const raw of items) {
      if (raw === null || typeof raw !== "object") continue;
      const tx = raw as {
        from?: { hash?: unknown };
        to?: { hash?: unknown; is_contract?: unknown } | null;
        value?: unknown;
        timestamp?: unknown;
      };
      const from = asAddress(tx.from?.hash);
      if (!from) continue;
      transactions.push({
        from,
        to: asAddress(tx.to?.hash),
        valueWei: typeof tx.value === "string" ? tx.value : "0",
        timestamp: parseTimestamp(tx.timestamp),
        toIsContract: tx.to?.is_contract === true,
      });
    }

    const next = (body as { next_page_params?: unknown }).next_page_params;
    if (!next || typeof next !== "object") {
      return { transactions, complete: true };
    }
    const qs = new URLSearchParams(
      Object.entries(next as Record<string, unknown>).map(([k, v]) => [k, String(v)]),
    );
    url = `${EXPLORER_BASE_URL}/api/v2/addresses/${address}/transactions?${qs}`;
  }

  // ponytail: cap tercapai → partial. Naikkan maxCounterpartyPages kalau perlu.
  return { transactions, complete: false };
}
