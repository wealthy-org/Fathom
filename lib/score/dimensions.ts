import type { Proof, ProofType } from "@/lib/score/proofs";

/**
 * Reputation dimensions (Spec 03). Presentasi/kerangka, bukan skor.
 *
 * Hanya dimension yang punya proof nyata yang berstatus "supported". Sisanya
 * tetap ditampilkan sebagai slot dengan alasan jujur + fase yang akan mengisinya,
 * supaya tidak ada nilai 0 palsu yang menyamar sebagai "tidak ada reputasi".
 */

export type DimensionId =
  | "economic_history"
  | "counterparty_history"
  | "protocol_history"
  | "community_trust"
  | "risk_signals";

export type DimensionStatus = "supported" | "unsupported";

export interface DimensionState {
  id: DimensionId;
  label: string;
  status: DimensionStatus;
  /** Proof yang mengisi dimension ini (kosong kalau unsupported). */
  proofTypes: ProofType[];
  /** Alasan kalau unsupported. */
  reason: string | null;
  /** Fase yang akan menyuplai data (null kalau sudah supported). */
  suppliedBy: string | null;
}

interface DimensionDefinition {
  id: DimensionId;
  label: string;
  proofTypes: ProofType[];
  reason: string | null;
  suppliedBy: string | null;
}

// Urutan mengikuti Spec 03 §Dimensions.
const DEFINITIONS: DimensionDefinition[] = [
  {
    id: "economic_history",
    label: "Economic History",
    proofTypes: ["wallet_age", "transaction_history"],
    reason: null,
    suppliedBy: null,
  },
  {
    id: "counterparty_history",
    label: "Counterparty History",
    proofTypes: ["unique_counterparty", "repeat_counterparty"],
    reason: "No counterparty relationship data has been indexed.",
    suppliedBy: "Spec 04",
  },
  {
    id: "protocol_history",
    label: "Protocol History",
    proofTypes: [],
    reason: "Protocol interaction data has not been classified.",
    suppliedBy: "Spec 04",
  },
  {
    id: "community_trust",
    label: "Community Trust",
    proofTypes: [],
    reason: "Vouches and attestations are not yet indexed.",
    suppliedBy: "Spec 07 / Spec 08",
  },
  {
    id: "risk_signals",
    label: "Risk Signals",
    proofTypes: [],
    reason: "Risk signals are not evaluated yet.",
    suppliedBy: "Spec 05",
  },
];

/** Dimension yang punya proof nyata menjadi "supported"; sisanya slot jujur. */
export function getDimensions(proofs: Proof[]): DimensionState[] {
  const present = new Set(proofs.map((proof) => proof.type));

  return DEFINITIONS.map((definition) => {
    const hasProof = definition.proofTypes.some((type) => present.has(type));
    return {
      ...definition,
      status: hasProof ? "supported" : "unsupported",
    };
  });
}
