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

/** URL halaman transaksi di explorer — dipakai sebagai evidence_reference proof tx-level. */
export function explorerTransactionUrl(hash: string): string {
  return `${EXPLORER_BASE_URL}/tx/${hash}`;
}

/**
 * Klasifikasi outcome fetch untuk observability (bukan perubahan semantik hasil).
 * Tujuan utama: membedakan "upstream mati / timeout / shape rusak" dari
 * "empty hasil yang valid". Hanya outcome non-ok yang dilog — `ok`/`empty`
 * artinya tidak ada gangguan, bukan indikasi outage.
 */
export type IngestOutcome =
  | "ok"
  | "empty"
  | "timeout"
  | `http_${number}`
  | "malformed"
  | "error";

type IngestContext =
  | "summary" // fetchAddressTxSummary (v1 txlist asc/desc)
  | "count" // countDirectTransactions (v2 walk)
  | "walk"; // fetchAddressTransactions (v2 walk counterpary)

/**
 * Satu baris log per outcome non-ok. Guarded — logging tidak boleh pernah
 * merusak ingestion (error di console.error dibungkam, bukan dilempar).
 * Tidak log body respons, credential, atau payload transaksi. Alamat wallet
 * disertakan hanya karena berguna untuk debug ingestion per-wallet.
 */
function logIngest(
  context: IngestContext,
  address: Address | null,
  outcome: IngestOutcome,
  detail?: string,
): void {
  if (outcome === "ok" || outcome === "empty") return;
  try {
    const addr = address ? ` wallet=${address}` : "";
    const d = detail ? ` detail=${detail}` : "";
    console.error(`[fathom:ingest] ${context}${addr} outcome=${outcome}${d}`);
  } catch {
    // never break ingestion
  }
}

export interface AddressTxSummary {
  // null = jumlah pasti tidak diketahui (hasil terpotong batas halaman).
  txCount: number | null;
  firstTxAt: Date | null;
  lastTxAt: Date | null;
}

/**
 * Hasil fetch bertag: membawa outcome transpor + data JSON. `ok:false`
 * mempertahankan null-semantics lama pada pemanggil (tetap diperlakukan
 * "tidak tersedia"), hanya menambahkan alasan untuk observability.
 */
interface FetchResult {
  ok: boolean;
  data: unknown;
  /** Alasan kegagalan transpor — hanya diisi saat ok:false. */
  outcome?: Extract<IngestOutcome, "timeout" | `http_${number}` | "malformed" | "error">;
  detail?: string;
}

async function fetchJson(
  url: string,
  address: Address | null,
  context: IngestContext,
): Promise<FetchResult> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), THRESHOLDS.explorer.requestTimeoutMs);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: { accept: "application/json", "user-agent": "fathom-indexer/1.0" },
      cache: "no-store",
    });
    if (!res.ok) {
      const outcome = `http_${res.status}` as const;
      logIngest(context, address, outcome);
      return { ok: false, data: null, outcome };
    }
    const body = (await res.json()) as unknown;
    return { ok: true, data: body };
  } catch (e) {
    const aborted = (e as { name?: string })?.name === "AbortError";
    const outcome: IngestOutcome = aborted ? "timeout" : "error";
    logIngest(context, address, outcome);
    return { ok: false, data: null, outcome };
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
    const result = await fetchJson(url, address, "count");
    if (!result.ok) return null;
    const body = result.data;
    if (body === null || typeof body !== "object") {
      logIngest("count", address, "malformed", "body-not-object");
      return null;
    }
    const items = (body as { items?: unknown }).items;
    if (!Array.isArray(items)) {
      logIngest("count", address, "malformed", "items-not-array");
      return null;
    }
    total += items.length;

    // Empty awal = address tanpa transaksi langsung → fakta 0, bukan outage.
    if (items.length === 0) {
      logIngest("count", address, "empty");
      return total;
    }

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
    fetchJson(`${listBase}asc`, address, "summary"),
    fetchJson(`${listBase}desc`, address, "summary"),
    countDirectTransactions(address),
  ]);

  // v1 txlist: result = [] artinya address benar-benar tidak pernah transaction.
  // Inilah cara "empty" membeda dengan fetch failure (ok:false di atas).
  const firstResult = asc.ok ? asc.data : null;
  const lastResult = desc.ok ? desc.data : null;

  const firstArr = Array.isArray((firstResult as { result?: unknown })?.result)
    ? ((firstResult as { result: unknown[] }).result as unknown[])
    : null;
  const lastArr = Array.isArray((lastResult as { result?: unknown })?.result)
    ? ((lastResult as { result: unknown[] }).result as unknown[])
    : null;

  // Keduanya harus array (semantik lama): salah satu gagal/malformed →
  // fetch failure → null, agar refresh parsial tidak menimpa cache valid.
  // Keduanya array (bisa kosong []) → data ada / tidak‑ada.
  if (!firstArr || !lastArr) {
    return null;
  }

  const first = firstArr?.[0] as { timeStamp?: unknown } | undefined;
  const last = lastArr?.[0] as { timeStamp?: unknown } | undefined;

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

const TX_HASH_RE = /^0x[0-9a-fA-F]{64}$/;

function asTxHash(value: unknown): string | null {
  if (typeof value !== "string" || !TX_HASH_RE.test(value)) return null;
  return value.toLowerCase();
}

export interface AddressTransaction {
  from: Address;
  // null = contract creation (tidak ada penerima).
  to: Address | null;
  /** Native value dalam wei, string apa adanya dari explorer. */
  valueWei: string;
  timestamp: Date | null;
  toIsContract: boolean;
  /** Hash transaksi — dipakai untuk evidence_reference tx-level. null = tidak tersedia. */
  hash: string | null;
  /** Nomor block; null bila tidak tersedia di respons. */
  blockNumber: number | null;
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
    const result = await fetchJson(url, address, "walk");
    if (!result.ok) return null;
    const body = result.data;
    if (body === null || typeof body !== "object") {
      logIngest("walk", address, "malformed", "body-not-object");
      return null;
    }
    const items = (body as { items?: unknown }).items;
    if (!Array.isArray(items)) {
      logIngest("walk", address, "malformed", "items-not-array");
      return null;
    }

    for (const raw of items) {
      if (raw === null || typeof raw !== "object") continue;
      const tx = raw as {
        hash?: unknown;
        block?: { height?: unknown } | null;
        from?: { hash?: unknown };
        to?: { hash?: unknown; is_contract?: unknown } | null;
        value?: unknown;
        timestamp?: unknown;
      };
      const from = asAddress(tx.from?.hash);
      if (!from) continue;
      const blockHeight =
        typeof (tx.block as { height?: unknown } | undefined)?.height === "number"
          ? ((tx.block as { height: number }).height)
          : null;
      transactions.push({
        from,
        to: asAddress(tx.to?.hash),
        valueWei: typeof tx.value === "string" ? tx.value : "0",
        timestamp: parseTimestamp(tx.timestamp),
        toIsContract: tx.to?.is_contract === true,
        hash: asTxHash(tx.hash),
        blockNumber: blockHeight,
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
