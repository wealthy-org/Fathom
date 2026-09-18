import { NextResponse } from "next/server";
import { generateNonce } from "siwe";
import { getSession } from "@/lib/auth/session";
import { authError } from "@/lib/auth/http";

export async function GET() {
  try {
    const session = await getSession();
    session.nonce = generateNonce();
    session.authenticated = false;
    await session.save();
    return NextResponse.json({ nonce: session.nonce });
  } catch {
    return authError(
      "server_misconfigured",
      "Session is not configured.",
      500,
    );
  }
}
