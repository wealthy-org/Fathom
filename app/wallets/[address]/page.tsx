import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { normalizeAddress } from "@/lib/chain/address";
import { getWalletProfile, type WalletProfile } from "@/lib/wallet/profile";
import type { Proof, ProofType } from "@/lib/score/proofs";
import type { DimensionState } from "@/lib/score/dimensions";
import { CopyAddress } from "@/components/copy-address";
import { AliasEditor } from "@/components/alias-editor";
import { AttestationForm } from "@/components/attestation-form";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
});

const PROOF_LABELS: Record<ProofType, string> = {
  wallet_age: "Wallet age",
  transaction_history: "Transaction history",
  unique_counterparty: "Unique counterparties",
  repeat_counterparty: "Repeat counterparties",
};

function formatProofValue(proof: Proof): string {
  switch (proof.type) {
    case "wallet_age": {
      const { ageDays } = proof.value as { ageDays: number };
      return `${ageDays} days since first transaction`;
    }
    case "transaction_history": {
      const { txCount } = proof.value as { txCount: number };
      return `${txCount} direct transactions`;
    }
    case "unique_counterparty": {
      const { uniqueCounterparties } = proof.value as { uniqueCounterparties: number };
      return `${uniqueCounterparties} unique counterparties`;
    }
    case "repeat_counterparty": {
      const { repeatCounterparties, minInteractions } = proof.value as {
        repeatCounterparties: number;
        minInteractions: number;
      };
      return `${repeatCounterparties} counterparties with ${minInteractions}+ interactions`;
    }
  }
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "Not available";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function Field({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="shine-border rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate400">
        {label}
      </div>
      <div className="mt-2 font-display text-2xl">{value}</div>
      {note && <div className="mt-1 text-xs text-slate400">{note}</div>}
    </div>
  );
}

function DimensionRow({ dimension }: { dimension: DimensionState }) {
  return (
    <li className="shine-border rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-display text-base">{dimension.label}</span>
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
            dimension.status === "supported" ? "text-accent" : "text-slate400"
          }`}
        >
          {dimension.status}
        </span>
      </div>
      {dimension.status === "supported" ? (
        <p className="mt-2 text-sm text-slate400">
          Backed by proofs: {dimension.proofTypes.join(", ")}.
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate400">
          {dimension.reason} Will be supplied by {dimension.suppliedBy}.
        </p>
      )}
    </li>
  );
}

function AttestationsSection({
  address,
  attestations,
}: {
  address: string;
  attestations: WalletProfile["attestations"];
}) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-lg">Attestations</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate400">
        Structured, signed claims from other wallets. Attestations are
        supporting evidence — they never replace on-chain behavior, and they do
        not create reputation on their own.
      </p>

      {attestations.length === 0 ? (
        <div className="shine-border mt-5 rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-sm text-slate400">
          No attestations for this wallet yet.
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {attestations.map((attestation) => (
            <li
              key={attestation.id}
              className="shine-border rounded-2xl border border-white/5 bg-white/[0.02] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-display text-base">
                  {attestation.role}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
                  signed
                </span>
              </div>
              <p className="mt-2 text-sm text-white">
                {attestation.relationship}
                {attestation.durationMonths !== null &&
                  ` · ${attestation.durationMonths} months`}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] text-slate400">
                <span>
                  attester:{" "}
                  <Link
                    href={`/wallets/${attestation.attester}`}
                    className="text-accent hover:underline"
                  >
                    {shortAddress(attestation.attester)}
                  </Link>
                </span>
                <span>at: {formatDate(attestation.createdAt)}</span>
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-slate400">
                  Verify signature
                </summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all font-mono text-[10px] text-slate400">
                  {attestation.message}
                  {"\n"}
                  {attestation.signature}
                </pre>
              </details>
            </li>
          ))}
        </ul>
      )}

      <AttestationForm subject={address} />
    </section>
  );
}

function UnavailableSection({
  title,
  note,
}: {
  title: string;
  note: string;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-lg">{title}</h2>
      <div className="shine-border mt-4 rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-sm text-slate400">
        {note}
      </div>
    </section>
  );
}

function TrustGraphSection({
  graph,
}: {
  graph: WalletProfile["trustGraph"];
}) {
  const prefix = graph.complete ? "" : "At least ";
  return (
    <section className="mt-10">
      <h2 className="font-display text-lg">Trust Graph Summary</h2>
      {graph.relationships.length === 0 ? (
        <div className="shine-border mt-4 rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-sm text-slate400">
          No counterparty relationships indexed for this wallet yet.
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Unique counterparties"
              value={`${prefix}${graph.uniqueCounterparties}`}
            />
            <Field
              label="Repeat counterparties"
              value={`${prefix}${graph.repeatCounterparties}`}
              note="Repeat = 2 or more direct interactions."
            />
          </div>
          {!graph.complete && (
            <p className="mt-3 text-xs text-slate400">
              Transaction walk hit the indexed query limit, so these counts are
              lower bounds — not exact totals.
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default async function WalletProfilePage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) {
    notFound();
  }

  const address = normalizeAddress(parsed.data.address);
  const profile = await getWalletProfile(address);

  return (
    <div className="relative min-h-screen">
      <div className="bg-stars" />
      <div className="bg-grid" />

      <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo-no-bg.png"
              alt="Fathom"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <span className="font-display text-lg font-semibold tracking-tight">
              Fathom
            </span>
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-white transition hover:border-white/40"
          >
            Search another wallet
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-5 pb-24 pt-12 sm:px-6 lg:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate400">
          Wallet profile
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <h1 className="font-display text-3xl font-medium sm:text-4xl">
            {shortAddress(address)}
          </h1>
          <CopyAddress address={address} />
          {profile.alias && (
            <span className="rounded-full border border-white/15 px-3 py-1 text-sm text-white">
              {profile.alias}
              <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate400">
                unverified
              </span>
            </span>
          )}
        </div>
        <p className="mt-3 break-all font-mono text-xs text-slate400">
          {address}
        </p>
        <p className="mt-3 text-xs text-slate400">
          {profile.claimedAt
            ? `Ownership proven · ${formatDate(profile.claimedAt)}`
            : "Unclaimed — owner has not signed in yet."}
        </p>
        <AliasEditor address={address} initialAlias={profile.alias} />

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field
            label="Wallet age"
            value={
              profile.walletAgeDays === null
                ? "Not available"
                : `${profile.walletAgeDays} days`
            }
            note={
              profile.walletAgeDays === null
                ? "No reliable historical source yet."
                : undefined
            }
          />
          <Field
            label="Transactions"
            value={
              profile.txCount === null ? "Not available" : String(profile.txCount)
            }
            note={
              profile.txCount === null
                ? "Exceeds the indexed query limit."
                : undefined
            }
          />
          <Field label="First on-chain tx" value={formatDate(profile.firstTxAt)} />
          <Field label="Last on-chain tx" value={formatDate(profile.lastTxAt)} />
          <Field label="First seen on Fathom" value={formatDate(profile.firstSeenAt)} />
        </section>

        <section className="mt-10">
          <h2 className="font-display text-lg">Reputation Dimensions</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate400">
            Reputation is presented as dimensions. A dimension appears only when
            its underlying evidence has been indexed — empty slots are labeled,
            never shown as zero.
          </p>
          <ul className="mt-5 space-y-3">
            {profile.dimensions.map((dimension) => (
              <DimensionRow key={dimension.id} dimension={dimension} />
            ))}
          </ul>
        </section>

        <TrustGraphSection graph={profile.trustGraph} />

        <UnavailableSection
          title="Vouches"
          note="Economic backing (stake) is not implemented yet. It requires anti-farming rules that the spec has not defined (Spec 08)."
        />

        <AttestationsSection
          address={address}
          attestations={profile.attestations}
        />

        <section className="mt-10">
          <h2 className="font-display text-lg">Recent Proofs</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate400">
            Each proof records what is asserted, its source, and how to inspect
            it. Proofs are evidence — they never contain a reputation score.
            Fathom shows only what indexed data supports.
          </p>

          {profile.proofs.length === 0 ? (
            <div className="shine-border mt-5 rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-sm text-slate400">
              No proof can be produced for this wallet yet.
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {profile.proofs.map((proof) => (
                <li
                  key={proof.type}
                  className="shine-border rounded-2xl border border-white/5 bg-white/[0.02] p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-display text-base">
                      {PROOF_LABELS[proof.type]}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate400">
                      {proof.type}
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-sm text-white">
                    {formatProofValue(proof)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] text-slate400">
                    <span>source: {proof.source}</span>
                    <span>method: {proof.verification_method}</span>
                    <span>confidence: {proof.confidence}</span>
                  </div>
                  <a
                    href={proof.evidence_reference}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block break-all font-mono text-[11px] text-accent hover:underline"
                  >
                    {proof.evidence_reference}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-display text-lg">Why Score?</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate400">
            No global reputation score is produced yet. The scoring formula is
            intentionally not locked early (PRD §13). Until then, the profile
            exposes the path a score will have to justify:
          </p>
          <div className="shine-border mt-5 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <p className="font-mono text-sm text-white">
              Score → Why? → Dimension → Proof → Evidence
            </p>
            <p className="mt-3 text-sm text-slate400">
              Today this path resolves directly to the proofs above: each proof
              names its dimension, source, verification method, and the raw
              explorer evidence it was derived from.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
