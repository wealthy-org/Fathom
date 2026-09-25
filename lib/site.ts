/** Canonical URL for the Fathom app (external to landing). */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "/activity";

export const APP_LINK_PROPS = APP_URL.startsWith("http")
  ? { target: "_blank", rel: "noreferrer" }
  : {};
