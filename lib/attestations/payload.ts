import type { AttestationRole } from "@/lib/attestations/roles";

/**
 * Payload kanonik attestation (Spec 07). Client menandatangani string ini dan
 * server membangun ulang string yang sama dari field + alamat sesi — jadi tidak
 * ada string dari client yang dipercaya apa adanya.
 *
 * Format deterministik: urutan baris tetap, tanpa field opsional yang kosong.
 */
export interface AttestationInput {
  attester: string;
  subject: string;
  role: AttestationRole;
  relationship: string;
  durationMonths: number | null;
  issuedAt: string;
}

export function buildAttestationMessage(input: AttestationInput): string {
  const lines = [
    "Fathom Attestation",
    `Attester: ${input.attester.toLowerCase()}`,
    `Subject: ${input.subject.toLowerCase()}`,
    `Role: ${input.role}`,
    `Relationship: ${input.relationship}`,
  ];
  if (input.durationMonths !== null) {
    lines.push(`Duration (months): ${input.durationMonths}`);
  }
  lines.push(`Issued At: ${input.issuedAt}`);
  return lines.join("\n");
}
