import type { Address } from "@/lib/score/types";

/**
 * Bentuk ringkasan trust graph untuk visualisasi landing.
 * Type-only: data live dibaca API app eksternal, bukan DB lokal.
 */

export interface RelationshipSummary {
  counterparty: Address;
  isContract: boolean;
  /**
   * Identitas protocol terverifikasi. null = kontrak tanpa mapping
   * verified — node tetap Contract, bukan Protocol karangan.
   */
  protocolId: string | null;
  protocolName: string | null;
  interactionCount: number;
  // Lower bound saat complete=false.
  valueSent: bigint;
  valueReceived: bigint;
  firstInteractionAt: Date | null;
  lastInteractionAt: Date | null;
  /** Jarak hari antara interaksi pertama & terakhir; null kalau tak ada timestamp. */
  durationDays: number | null;
  /** Hash transaksi representatif (capped) untuk evidence_reference tx-level. */
  txHashes: string[];
}

/** Attester → subject (Spec 07). */
export interface AttesterSummary {
  attester: Address;
  role: string;
  relationship: string;
  /**
   * Id kanonik on-chain dari FathomAttestationRegistry. Kosong =
   * baris off-chain (SIWE) — edge attestation tetap terbedakan dari
   * transaction/vouch/invitation/dispute tanpa mengubah bentuk edge.
   */
  attestationIds: string[];
  createdAt: Date | null;
}

/** Reporter → subject (Spec 09). Report != vonis. */
export interface DisputeSummary {
  reporter: Address;
  status: string;
  /**
   * Id kanonik on-chain dari FathomDisputeRegistry. Null = baris
   * off-chain — edge dispute tetap terbedakan tanpa mengubah bentuk edge.
   */
  disputeId: string | null;
  openedAt: Date | null;
}

/** Edge vouch on-chain yang sudah diindeks (Spec 08). */
export interface VouchSummary {
  from: Address;
  to: Address;
  stakeAmount: bigint;
  status: string;
}

export interface TrustGraphSummary {
  uniqueCounterparties: number;
  repeatCounterparties: number;
  /** Relasi terlama (hari) di antara counterparty; null kalau tidak ada. */
  longestRelationshipDays: number | null;
  relationships: RelationshipSummary[];
  /**
   * Edge sosial (attester/dispute/vouch/invitation).
   * Kosong = belum ada baris, bukan tidak dievaluasi.
   * `relationships` tetap khusus transaksi; risk engine tidak tersentuh.
   */
  attesters: AttesterSummary[];
  disputes: DisputeSummary[];
  vouches: VouchSummary[];
  /** Pengundang via wallets.invited_by; null = tidak ada / belum dicari. */
  invitedBy: Address | null;
  /** Hash transaksi pertama yang menyentuh subject — untuk proof wallet_age. */
  firstTxHash: string | null;
  // Kapan state cache ini ditulis — watermark untuk snapshot Proof.
  // null hanya bila tidak ada state cache dan fetch gagal.
  fetchedAt: Date | null;
  /**
   * false = walk tx kena batas halaman. Semua angka adalah lower bound,
   * bukan nilai pasti. Jangan terbitkan proof turunan saat incomplete.
   */
  complete: boolean;
}
