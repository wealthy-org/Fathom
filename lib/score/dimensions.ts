import type { Proof, ProofType } from "@/lib/score/proofs";

/**
 * Reputation dimensions (Spec 03). Presentasi/kerangka, bukan skor.
 *
 * Hanya dimension yang punya proof nyata yang berstatus "supported". Sisanya
 * tetap ditampilkan sebagai slot dengan alasan jujur, supaya tidak ada nilai 0
 * palsu yang menyamar sebagai "tidak ada reputasi".
 *
 * Catatan naming: dimension ini bernama `contract_history` / "Contract History",
 * bukan `protocol_history` di Spec 00/02. Implementasi punya bukti contract
 * (counterparty `is_contract`), bukan identitas protocol — proof
 * `protocol_history` sejati menunggu mapping contract→protocol terverifikasi.
 */

export type DimensionId =
  | "economic_history"
  | "counterparty_history"
  | "contract_history"
  | "community_trust"
  | "risk_signals";

export type DimensionStatus = "supported" | "unsupported";

export interface DimensionState {
  id: DimensionId;
  label: string;
  status: DimensionStatus;
  /** Proof yang mengisi dimension ini (kosong kalau unsupported). */
  proofTypes: ProofType[];
  /** Alasan kalau unsupported — wallet-scoped, bukan janji fase. */
  reason: string | null;
}

interface DimensionDefinition {
  id: DimensionId;
  label: string;
  proofTypes: ProofType[];
  reason: string | null;
}

// Urutan mengikuti Spec 03 §Dimensions.
const DEFINITIONS: DimensionDefinition[] = [
  {
    id: "economic_history",
    label: "Economic History",
    proofTypes: ["wallet_age", "transaction_history", "economic_history"],
    reason: null,
  },
  {
    id: "counterparty_history",
    label: "Counterparty History",
    proofTypes: ["unique_counterparty", "repeat_counterparty"],
    reason: "No counterparty relationship evidence exists for this wallet yet.",
  },
  {
    id: "contract_history",
    label: "Contract History",
    proofTypes: ["contract_history"],
    reason: "No contract counterparty evidence exists for this wallet yet.",
  },
  {
    id: "community_trust",
    label: "Community Trust",
    proofTypes: ["role_attestation"],
    reason: "No structured attestation evidence exists for this wallet yet.",
  },
  {
    id: "risk_signals",
    label: "Risk Signals",
    proofTypes: [],
    reason: "No risk signal could be evaluated for this wallet yet.",
  },
];

/**
 * Dimension yang punya proof nyata menjadi "supported"; sisanya slot jujur.
 *
 * `riskEvaluable` (Spec 05) menandai apakah Risk Engine sudah bisa menilai
 * minimal satu signal; bila ya, dimension Risk Signals dianggap supported
 * karena evidence-nya bukan Proof on-chain melainkan risk signal terdedikasi.
 */
export function getDimensions(
  proofs: Proof[],
  riskEvaluable = false,
): DimensionState[] {
  const present = new Set(proofs.map((proof) => proof.type));

  return DEFINITIONS.map((definition) => {
    if (definition.id === "risk_signals") {
      return {
        ...definition,
        status: riskEvaluable ? "supported" : "unsupported",
      };
    }
    const hasProof = definition.proofTypes.some((type) => present.has(type));
    return {
      ...definition,
      status: hasProof ? "supported" : "unsupported",
    };
  });
}
