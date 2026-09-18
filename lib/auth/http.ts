import { NextResponse } from "next/server";

/** Error API terstruktur — tanpa raw exception / stack trace ke client. */
export function authError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}
