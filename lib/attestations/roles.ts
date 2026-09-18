/**
 * Kategori role attestation (Spec 07) — daftar verbatim dari spec.
 * Jangan menambah kategori tanpa spec.
 */
export const ATTESTATION_ROLES = [
  "Builder",
  "Trader",
  "Researcher",
  "Community Mod",
  "OTC Counterparty",
  "Contributor",
  "Auditor",
  "Market Maker",
] as const;

export type AttestationRole = (typeof ATTESTATION_ROLES)[number];

export function isAttestationRole(value: string): value is AttestationRole {
  return (ATTESTATION_ROLES as readonly string[]).includes(value);
}
