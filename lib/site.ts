/** Canonical URL for the Fathom app (external to landing). */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "/activity";

export const APP_LINK_PROPS = APP_URL.startsWith("http")
  ? { target: "_blank", rel: "noreferrer" }
  : {};

/**
 * Base URL for API calls to the external app (docs sample + playground).
 * Same source as APP_URL; falls back to the canonical deployment when
 * the env var is unset (e.g. local dev without .env).
 */
export const APP_API_BASE = APP_URL.startsWith("http")
  ? APP_URL
  : "https://fathom-xi-bice.vercel.app";
