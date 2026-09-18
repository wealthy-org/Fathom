"use client";

import { useState } from "react";
import { useSignMessage } from "wagmi";
import { useSession } from "@/components/use-session";
import { ATTESTATION_ROLES } from "@/lib/attestations/roles";
import { buildAttestationMessage } from "@/lib/attestations/payload";
import { THRESHOLDS } from "@/config/thresholds";

// ponytail: form attestation muncul hanya saat sesi SIWE aktif dan bukan profil sendiri.
// Server membangun ulang payload kanonik dari field + alamat sesi, jadi signature
// di sini hanya valid untuk isi yang benar-benar dikirim.

export function AttestationForm({ subject }: { subject: string }) {
  const { session } = useSession();
  const { signMessageAsync, isPending } = useSignMessage();
  const [role, setRole] = useState<string>(ATTESTATION_ROLES[0]);
  const [relationship, setRelationship] = useState("");
  const [duration, setDuration] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const attester = session?.walletAddress ?? null;
  if (!session?.authenticated || !attester || attester === subject) return null;

  async function submit() {
    if (!attester) return;
    setError(null);
    setDone(false);
    try {
      const durationMonths =
        duration.trim() === "" ? null : Number.parseInt(duration, 10);
      if (durationMonths !== null && !Number.isFinite(durationMonths)) {
        setError("Duration must be a whole number of months.");
        return;
      }
      const issuedAt = new Date().toISOString();
      const message = buildAttestationMessage({
        attester,
        subject,
        role: role as (typeof ATTESTATION_ROLES)[number],
        relationship,
        durationMonths,
        issuedAt,
      });
      const signature = await signMessageAsync({ message });
      const res = await fetch("/api/attestations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subject,
          role,
          relationship,
          durationMonths,
          issuedAt,
          signature,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "Attestation failed.");
        return;
      }
      setDone(true);
      setRelationship("");
      setDuration("");
    } catch (e) {
      const msg = (e as Error)?.message ?? "";
      setError(
        /reject|denied|cancel/i.test(msg)
          ? "Cancelled. Click once more to try again."
          : "Attestation failed. Please try again.",
      );
    }
  }

  return (
    <div className="shine-border mt-4 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <h3 className="font-display text-base">Attest to this wallet</h3>
      <p className="mt-1 text-xs text-slate400">
        Attestations are pseudonymous supporting evidence. Signing proves you
        made this claim; it does not create reputation.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-accent"
        >
          {ATTESTATION_ROLES.map((r) => (
            <option key={r} value={r} className="bg-surface text-white">
              {r}
            </option>
          ))}
        </select>
        <input
          value={relationship}
          maxLength={THRESHOLDS.attestation.maxRelationshipLength}
          onChange={(e) => setRelationship(e.target.value)}
          placeholder="Relationship (e.g. Worked Together)"
          className="rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-accent sm:col-span-2"
        />
        <input
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="Duration in months (optional)"
          className="rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-accent"
        />
        <button
          type="button"
          disabled={isPending || relationship.trim() === ""}
          onClick={() => void submit()}
          className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black transition hover:scale-105 disabled:opacity-60 sm:col-span-2"
        >
          {isPending ? "Signing…" : "Sign & attest"}
        </button>
      </div>
      {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
      {done && (
        <p className="mt-3 text-xs text-accent">
          Attestation recorded. Refresh to see it in the list below.
        </p>
      )}
    </div>
  );
}
