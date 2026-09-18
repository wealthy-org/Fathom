import { THRESHOLDS } from "@/config/thresholds";
import { explorerAddressUrl } from "@/lib/chain/blockscout";
import type { OnchainStats } from "@/lib/chain/onchain-stats";
import type { TrustGraphSummary } from "@/lib/chain/trust-graph";
import type { Address } from "@/lib/score/types";

/**
 * Proof Engine (Spec 02). Mengubah data on-chain ternormalisasi menjadi Proof
 * yang bisa diperiksa. Proof TIDAK memuat skor reputasi.
 *
 * Semua proof di sini reproducible dari data indexed yang sudah dinormalisasi:
 * stats on-chain (Spec 01), trust graph (Spec 04), dan attestation tersimpan
 * (Spec 07). Tipe yang belum punya rumus (activity_consistency) sengaja tidak
 * dibuat — jangan mengarang.
 */

export type ProofType =
  | "wallet_age"
  | "transaction_history"
  | "unique_counterparty"
  | "repeat_counterparty"
  | "economic_history"
  | "protocol_history"
  | "role_attestation";
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

/** Attestation tersimpan yang cukup untuk diterbitkan sebagai proof (Spec 07). */
export interface AttestationProofInput {
  attester: Address;
  role: string;
  relationship: string;
  durationMonths: number | null;
  /** Pesan kanonik yang ditandatangani — buktinya sendiri, bisa diverifikasi ulang. */
  message: string;
  createdAt: Date;
}

// ponytail: sumber indexed tunggal saat ini. Pindahkan ke kolom/props kalau
// provider berubah, jangan biarkan menyimpang dari yang benar-benar dipakai.
const SOURCE = "blockscout";
const ATTESTATION_SOURCE = "attestation";

const MS_PER_DAY = 86_400_000;
const ZERO = BigInt(0);

/** Anchor bagian Attestations di halaman profil — tempat bukti bisa diperiksa. */
function attestationEvidenceReference(address: Address): string {
  return `/wallets/${address}#attestations`;
}

export function generateProofs(
  address: Address,
  stats: OnchainStats,
  graph: TrustGraphSummary | null,
  attestations: AttestationProofInput[],
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

  // Proof turunan graph hanya saat walk tx lengkap. Saat incomplete, angkanya
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

    // Semantic: native transfer langsung saja (dari wallet_relationships).
    // Contract-creation di-skip oleh derivasi, jadi nilai deploy tidak dihitung.
    let nativeSent = ZERO;
    let nativeReceived = ZERO;
    let contractCounterparties = 0;
    for (const rel of graph.relationships) {
      nativeSent += rel.valueSent;
      nativeReceived += rel.valueReceived;
      if (rel.isContract) contractCounterparties += 1;
    }

    proofs.push({
      type: "economic_history",
      source: SOURCE,
      subject: address,
      value: {
        nativeSentWei: nativeSent.toString(),
        nativeReceivedWei: nativeReceived.toString(),
      },
      timestamp: observedAt,
      confidence: THRESHOLDS.proof.confidenceByMethod.derived,
      verification_method: "derived",
      evidence_reference: evidenceReference,
    });

    proofs.push({
      type: "protocol_history",
      source: SOURCE,
      subject: address,
      value: { contractCounterparties },
      timestamp: observedAt,
      confidence: THRESHOLDS.proof.confidenceByMethod.derived,
      verification_method: "derived",
      evidence_reference: evidenceReference,
    });
  }

  // Satu proof per attestation: tiap attestation berdiri sendiri dan punya
  // tanda tangan sendiri, jadi paling bisa diperiksa satu per satu (Spec 07).
  for (const attestation of attestations) {
    proofs.push({
      type: "role_attestation",
      source: ATTESTATION_SOURCE,
      subject: address,
      value: {
        role: attestation.role,
        relationship: attestation.relationship,
        durationMonths: attestation.durationMonths,
        attester: attestation.attester,
      },
      timestamp: attestation.createdAt.toISOString(),
      confidence: THRESHOLDS.proof.confidenceByMethod.indexed,
      verification_method: "indexed",
      evidence_reference: attestationEvidenceReference(address),
    });
  }

  return proofs;
}
