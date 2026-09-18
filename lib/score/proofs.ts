import { THRESHOLDS } from "@/config/thresholds";
import { explorerAddressUrl } from "@/lib/chain/blockscout";
import type { OnchainStats } from "@/lib/chain/onchain-stats";
import type { TrustGraphSummary } from "@/lib/chain/trust-graph";
import type { Address } from "@/lib/score/types";

/**
 * Proof Engine (Spec 02). Mengubah data on-chain ternormalisasi menjadi Proof
 * yang bisa diperiksa. Proof TIDAK memuat skor reputasi.
 *
 * Hanya tipe yang punya data nyata yang direpresentasikan di sini. Tipe ekonomi
 * (economic_history, protocol_history) dan activity_consistency belum punya
 * rumus/klasifikasi — sengaja tidak dibuat.
 */

export type ProofType =
  | "wallet_age"
  | "transaction_history"
  | "unique_counterparty"
  | "repeat_counterparty";
export type VerificationMethod = "indexed" | "derived";

export interface Proof {
  type: ProofType;
  source: string;
  subject: Address;
  value: unknown;
  timestamp: string;
  confidence: number;
  verification_method: VerificationMethod;
  evidence_reference: string;
}

// ponytail: sumber indexed tunggal saat ini. Pindahkan ke kolom/props kalau
// provider berubah, jangan biarkan menyimpang dari yang benar-benar dipakai.
const SOURCE = "blockscout";

const MS_PER_DAY = 86_400_000;

export function generateProofs(
  address: Address,
  stats: OnchainStats,
  graph: TrustGraphSummary | null,
  now: Date,
): Proof[] {
  const proofs: Proof[] = [];
  const observedAt = now.toISOString();
  const evidenceReference = explorerAddressUrl(address);

  if (stats.firstTxAt) {
    const ageDays = Math.floor(
      (now.getTime() - stats.firstTxAt.getTime()) / MS_PER_DAY,
    );
    proofs.push({
      type: "wallet_age",
      source: SOURCE,
      subject: address,
      value: { ageDays, firstTxAt: stats.firstTxAt.toISOString() },
      timestamp: observedAt,
      confidence: THRESHOLDS.proof.confidenceByMethod.derived,
      verification_method: "derived",
      evidence_reference: evidenceReference,
    });
  }

  // txCount null = riwayat belum diketahui (mis. lewat batas pagination).
  // Jangan terbitkan proof yang mengklaim angka yang tidak kita punya.
  if (stats.txCount !== null) {
    proofs.push({
      type: "transaction_history",
      source: SOURCE,
      subject: address,
      value: { txCount: stats.txCount },
      timestamp: observedAt,
      confidence: THRESHOLDS.proof.confidenceByMethod.indexed,
      verification_method: "indexed",
      evidence_reference: evidenceReference,
    });
  }

  // Counterparty proofs hanya saat walk tx lengkap. Saat incomplete, angkanya
  // lower bound — menerbitkannya sebagai fakta akan menyesatkan (Spec 04).
  if (graph && graph.complete) {
    proofs.push({
      type: "unique_counterparty",
      source: SOURCE,
      subject: address,
      value: { uniqueCounterparties: graph.uniqueCounterparties },
      timestamp: observedAt,
      confidence: THRESHOLDS.proof.confidenceByMethod.derived,
      verification_method: "derived",
      evidence_reference: evidenceReference,
    });

    proofs.push({
      type: "repeat_counterparty",
      source: SOURCE,
      subject: address,
      value: {
        repeatCounterparties: graph.repeatCounterparties,
        minInteractions: THRESHOLDS.trustGraph.repeatInteractionMin,
      },
      timestamp: observedAt,
      confidence: THRESHOLDS.proof.confidenceByMethod.derived,
      verification_method: "derived",
      evidence_reference: evidenceReference,
    });
  }

  return proofs;
}
