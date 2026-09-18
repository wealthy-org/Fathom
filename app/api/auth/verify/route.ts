import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SiweMessage } from "siwe";
import { sql } from "drizzle-orm";
import { normalizeAddress } from "@/lib/chain/address";
import { getSession } from "@/lib/auth/session";
import { authError } from "@/lib/auth/http";
import { db } from "@/lib/db/client";
import { wallets } from "@/lib/db/schema";

const bodySchema = z.object({
  message: z.string().min(1),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return authError(
      "invalid_request",
      "Body must contain { message, signature }.",
      400,
    );
  }

  let session;
  try {
    session = await getSession();
  } catch {
    return authError(
      "server_misconfigured",
      "Session is not configured.",
      500,
    );
  }
  if (!session.nonce) {
    return authError(
      "missing_nonce",
      "Fetch /api/auth/nonce before verifying.",
      400,
    );
  }

  let siweMessage: SiweMessage;
  try {
    siweMessage = new SiweMessage(parsed.data.message);
  } catch {
    return authError("invalid_message", "Message is not valid SIWE.", 400);
  }

  const result = await siweMessage.verify({
    signature: parsed.data.signature,
    domain: new URL(req.url).host,
    nonce: session.nonce,
    time: new Date().toISOString(),
  });
  if (!result.success) {
    return authError(
      "invalid_signature",
      `Signature verification failed: ${result.error?.type ?? "unknown"}.`,
      401,
    );
  }

  // Nonce sekali pakai — replay attack ditolak.
  session.nonce = undefined;

  const address = normalizeAddress(siweMessage.address);
  // Claim Profile (Spec 06): SIWE yang terverifikasi = bukti ownership.
  // claimed_at diisi sekali (coalesce) — re-verify tidak mengubahnya. Tidak menyentuh reputasi.
  await db
    .insert(wallets)
    .values({ address, claimedAt: new Date() })
    .onConflictDoUpdate({
      target: wallets.address,
      set: { claimedAt: sql`coalesce(${wallets.claimedAt}, now())` },
    });

  session.walletAddress = address;
  session.authenticated = true;
  await session.save();

  return NextResponse.json({ address, authenticated: true });
}
