import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { authError } from "@/lib/auth/http";

export async function POST() {
  try {
    const session = await getSession();
    session.destroy();
    return NextResponse.json({ ok: true });
  } catch {
    return authError("server_misconfigured", "Session is not configured.", 500);
  }
}
