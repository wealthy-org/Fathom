import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeAddress } from "@/lib/chain/address";
import { getWalletProfile } from "@/lib/wallet/profile";

const paramsSchema = z.object({
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
});

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/**
 * GET /api/wallets/{address} — publik, tanpa sesi.
 * Basic profile saja (Spec 01). Data historis yang tidak tersedia = null, bukan 0 palsu.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) {
    return errorResponse(
      "invalid_address",
      "Address must be a valid EVM address.",
      400,
    );
  }

  try {
    const profile = await getWalletProfile(normalizeAddress(parsed.data.address));
    return NextResponse.json(profile);
  } catch {
    return errorResponse(
      "server_error",
      "Wallet data is temporarily unavailable.",
      500,
    );
  }
}
