import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyMessage } from "viem";
import { THRESHOLDS } from "@/config/thresholds";
import { normalizeAddress } from "@/lib/chain/address";
import { getSession } from "@/lib/auth/session";
import { authError } from "@/lib/auth/http";
import { db } from "@/lib/db/client";
import { disputes, wallets } from "@/lib/db/schema";
import { buildDisputeMessage } from "@/lib/disputes/payload";

const bodySchema = z.object({
  target: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  reason: z.string().trim().min(1).max(THRESHOLDS.dispute.maxReasonLength),
  evidence: z.string().trim().min(1).max(THRESHOLDS.dispute.maxEvidenceLength),
  issuedAt: z.string().datetime(),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
});

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/**
 * POST /api/disputes — butuh sesi SIWE (Spec 09).
 * Reporter diambil dari sesi, BUKAN dari body. Report ditandatangani dan
 * disimpan sebagai evidence; TIDAK otomatis berarti wrongdoing, dan status
 * selalu "open" karena belum ada otoritas resolusi (spec tidak mendefinisikan).
 */
export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse(
      "invalid_request",
      "Body must contain a valid structured dispute.",
      400,
    );
  }

  let session;
  try {
    session = await getSession();
  } catch {
    return authError("server_misconfigured", "Session is not configured.", 500);
  }
  if (!session.authenticated || !session.walletAddress) {
    return errorResponse(
      "unauthenticated",
      "Sign in with the reporting wallet first.",
      401,
    );
  }

  const reporter = normalizeAddress(session.walletAddress);
  const target = normalizeAddress(parsed.data.target);

  if (reporter === target) {
    return errorResponse("self_dispute", "A wallet cannot dispute itself.", 400);
  }

  const message = buildDisputeMessage({
    reporter,
    target,
    reason: parsed.data.reason,
    evidence: parsed.data.evidence,
    issuedAt: parsed.data.issuedAt,
  });

  const valid = await verifyMessage({
    address: reporter,
    message,
    signature: parsed.data.signature as `0x${string}`,
  }).catch(() => false);
  if (!valid) {
    return errorResponse(
      "invalid_signature",
      "Signature does not match the dispute payload.",
      401,
    );
  }

  await db.insert(wallets).values({ address: target }).onConflictDoNothing();
  await db.insert(wallets).values({ address: reporter }).onConflictDoNothing();

  try {
    const [row] = await db
      .insert(disputes)
      .values({
        targetAddress: target,
        reporterAddress: reporter,
        reason: parsed.data.reason,
        evidence: parsed.data.evidence,
        message,
        signature: parsed.data.signature,
      })
      .returning();

    return NextResponse.json(
      {
        id: row.id,
        target: row.targetAddress,
        reporter: row.reporterAddress,
        status: row.status,
        openedAt: row.openedAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (e) {
    // drizzle v1 membungkus error DB: pg code ada di e.cause.code.
    const code = (e as { cause?: { code?: string } })?.cause?.code;
    if (code === "23505") {
      return errorResponse(
        "duplicate_dispute",
        "This wallet already filed a dispute against that target.",
        409,
      );
    }
    return errorResponse("server_error", "Dispute could not be stored.", 500);
  }
}
