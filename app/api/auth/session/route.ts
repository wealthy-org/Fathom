import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { authError } from "@/lib/auth/http";

export async function GET() {
  try {
    const session = await getSession();
    return NextResponse.json({
      authenticated: !!session.authenticated && !!session.walletAddress,
      walletAddress: session.walletAddress ?? null,
    });
  } catch {
    return authError("server_misconfigured", "Session is not configured.", 500);
  }
}
