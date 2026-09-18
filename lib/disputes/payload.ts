/**
 * Payload kanonik dispute (Spec 09). Reporter menandatangani string ini dan
 * server membangun ulang string yang sama dari field + alamat sesi — jadi tidak
 * ada string dari client yang dipercaya apa adanya.
 *
 * Format deterministik: urutan baris tetap.
 */
export interface DisputeInput {
  reporter: string;
  target: string;
  reason: string;
  evidence: string;
  issuedAt: string;
}

export function buildDisputeMessage(input: DisputeInput): string {
  return [
    "Fathom Dispute",
    `Reporter: ${input.reporter.toLowerCase()}`,
    `Target: ${input.target.toLowerCase()}`,
    `Reason: ${input.reason}`,
    `Evidence: ${input.evidence}`,
    `Issued At: ${input.issuedAt}`,
  ].join("\n");
}
