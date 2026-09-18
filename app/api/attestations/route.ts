import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyMessage } from "viem";
import { THRESHOLDS } from "@/config/thresholds";
import { normalizeAddress } from "@/lib/chain/address";
import { getSession } from "@/lib/auth/session";
import { authError } from "@/lib/auth/http";
import { db } from "@/lib/db/client";
import { attestations, wallets } from "@/lib/db/schema";
import { isAttestationRole, ATTESTATION_ROLES } from "@/lib/attestations/roles";
import { buildAttestationMessage } from "@/lib/attestations/payload";

const bodySchema = z.object({
  subject: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  role: z.string().min(1).max(32),
  relationship: z
    .string()
    .trim()
    .min(1)
    .max(THRESHOLDS.attestation.maxRelationshipLength),
  durationMonths: z
    .number()
    .int()
    .min(0)
    .max(THRESHOLDS.attestation.maxDurationMonths)
    .nullable()
    .optional(),
  issuedAt: z.string().datetime(),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
});

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/**
 * POST /api/attestations — butuh sesi SIWE (Spec 07).
 * Attester diambil dari sesi, BUKAN dari body. Attestation ditandatangani
 * sehingga bisa diverifikasi ulang di luar server.
 */
export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse(
      "invalid_request",
      "Body must contain a valid structured attestation.",
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
      "Sign in with the attesting wallet first.",
      401,
    );
  }

  const attester = normalizeAddress(session.walletAddress);
  const subject = normalizeAddress(parsed.data.subject);

  if (attester === subject) {
    return errorResponse(
      "self_attestation",
      "A wallet cannot attest to itself.",
      400,
    );
  }

  if (!isAttestationRole(parsed.data.role)) {
    return errorResponse(
      "invalid_role",
      `Role must be one of: ${ATTESTATION_ROLES.join(", ")}.`,
      400,
    );
  }

  const durationMonths = parsed.data.durationMonths ?? null;
  const message = buildAttestationMessage({
    attester,
    subject,
    role: parsed.data.role,
    relationship: parsed.data.relationship,
    durationMonths,
    issuedAt: parsed.data.issuedAt,
  });

  const valid = await verifyMessage({
    address: attester,
    message,
    signature: parsed.data.signature as `0x${string}`,
  }).catch(() => false);
  if (!valid) {
    return errorResponse(
      "invalid_signature",
      "Signature does not match the attestation payload.",
      401,
    );
  }

  await db.insert(wallets).values({ address: subject }).onConflictDoNothing();
  await db.insert(wallets).values({ address: attester }).onConflictDoNothing();

  try {
    const [row] = await db
      .insert(attestations)
      .values({
        subjectAddress: subject,
        attesterAddress: attester,
        role: parsed.data.role,
        relationship: parsed.data.relationship,
        durationMonths,
        message,
        signature: parsed.data.signature,
      })
      .returning();

    return NextResponse.json(
      {
        id: row.id,
        subject: row.subjectAddress,
        attester: row.attesterAddress,
        role: row.role,
        relationship: row.relationship,
        durationMonths: row.durationMonths,
        createdAt: row.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (e) {
    // drizzle v1 membungkus error DB: pg code ada di e.cause.code.
    const code = (e as { cause?: { code?: string } })?.cause?.code;
    if (code === "23505") {
      return errorResponse(
        "duplicate_attestation",
        "This wallet already attested to that role for this subject.",
        409,
      );
    }
    return errorResponse(
      "server_error",
      "Attestation could not be stored.",
      500,
    );
  }
}
