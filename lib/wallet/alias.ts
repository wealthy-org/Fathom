/**
 * Aturan alias (Spec 06). Alias bersifat kosmetik, tidak unik, dan tidak diverifikasi.
 * Satu-satunya tempat validasi alias — jangan duplikasi di route/UI.
 */

export const MAX_ALIAS_LENGTH = 32;

// Alias berbentuk alamat wallet lain ditolak — mencegah penyamaran.
const ADDRESS_LIKE_RE = /^0x[0-9a-fA-F]{40}$/;
// Karakter kontrol (termasuk newline/tab) tidak diizinkan.
const CONTROL_CHAR_RE = /[\u0000-\u001F\u007F]/;

export type AliasValidationError =
  | "alias_too_long"
  | "alias_address_like"
  | "alias_control_char";

export class AliasError extends Error {
  constructor(
    public readonly code: AliasValidationError,
    message: string,
  ) {
    super(message);
    this.name = "AliasError";
  }
}

/** Normalisasi alias: kosong/null = hapus alias. Lempar error kalau tidak valid. */
export function normalizeAlias(input: string | null): string | null {
  if (input === null) return null;
  const trimmed = input.trim();
  if (trimmed === "") return null;
  if (CONTROL_CHAR_RE.test(trimmed)) {
    throw new AliasError("alias_control_char", "Alias contains control characters.");
  }
  // Dicek sebelum panjang: alamat selalu 42 char, jadi kalau tidak, akan tertutup alias_too_long.
  if (ADDRESS_LIKE_RE.test(trimmed)) {
    throw new AliasError(
      "alias_address_like",
      "Alias cannot look like a wallet address.",
    );
  }
  if (trimmed.length > MAX_ALIAS_LENGTH) {
    throw new AliasError(
      "alias_too_long",
      `Alias must be at most ${MAX_ALIAS_LENGTH} characters.`,
    );
  }
  return trimmed;
}
