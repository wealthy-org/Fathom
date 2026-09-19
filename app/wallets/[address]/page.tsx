import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { normalizeAddress } from "@/lib/chain/address";
import { getWalletProfile, type WalletProfile } from "@/lib/wallet/profile";
import type { Proof, ProofType } from "@/lib/score/proofs";
import type { DimensionState } from "@/lib/score/dimensions";
import type { RiskState, RiskSignal, RiskSignalType } from "@/lib/score/risk";
import { WalletShell } from "@/components/wallet-shell";
import { CopyAddress } from "@/components/copy-address";
import { AliasEditor } from "@/components/alias-editor";
import { AttestationForm } from "@/components/attestation-form";
import { DisputeForm } from "@/components/dispute-form";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
});

const PROOF_LABELS: Record<ProofType, string> = {
  wallet_age: "Wallet age",
  transaction_history: "Transaction history",
  unique_counterparty: "Unique counterparties",
  repeat_counterparty: "Repeat counterparties",
  economic_history: "Economic history",
  protocol_history: "Protocol history",
  role_attestation: "Role attestation",
};

const RISK_LABELS: Record<RiskSignalType, string> = {
  fresh_wallet: "Fresh wallet",
  abnormal_transaction_pattern: "Abnormal transaction pattern",
  circular_relationship_graph: "Circular relationship graph",
  concentrated_counterparty_graph: "Concentrated counterparty graph",
  suspicious_vouch_clustering: "Suspicious vouch clustering",
  flagged_counterparty_exposure: "Flagged counterparty exposure",
};

/** Ringkas evidence risk signal untuk tampilan — hanya field primitif. */
function formatRiskEvidence(evidence: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(evidence)) {
    if (Array.isArray(value)) {
      parts.push(`${key}: ${value.length} item${value.length === 1 ? "" : "s"}`);
    } else if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") {
      parts.push(`${key}: ${value}`);
    }
  }
  return parts.join(" · ");
}

const WEI_PER_ETH = BigInt(10) ** BigInt(18);

/** Format nilai wei ke native unit untuk tampilan (AGENTS §9: hanya di boundary presentasi). */
function formatNative(wei: string): string {
  try {
    const value = BigInt(wei);
    const whole = value / WEI_PER_ETH;
    const fraction = value % WEI_PER_ETH;
    if (fraction === BigInt(0)) return `${whole} ETH`;
    const padded = fraction.toString().padStart(18, "0").replace(/0+$/, "");
    return `${whole}.${padded} ETH`;
  } catch {
    return `${wei} wei`;
  }
}

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
    case "economic_history": {
      const { nativeSentWei, nativeReceivedWei } = proof.value as {
        nativeSentWei: string;
        nativeReceivedWei: string;
      };
      return `Sent ${formatNative(nativeSentWei)} · Received ${formatNative(nativeReceivedWei)}`;
    }
    case "protocol_history": {
      const { contractCounterparties } = proof.value as {
        contractCounterparties: number;
      };
      return `${contractCounterparties} contract counterparties`;
    }
    case "role_attestation": {
      const { role, relationship, durationMonths, attester } = proof.value as {
        role: string;
        relationship: string;
        durationMonths: number | null;
        attester: string;
      };
      const duration =
        durationMonths === null ? "" : ` · ${durationMonths} months`;
      return `${role} · ${relationship}${duration} · by ${shortAddress(attester)}`;
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
    <div className="shine-border rounded-2xl border border-ink/10 bg-ink/[0.03] p-5">
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
    <li className="shine-border rounded-2xl border border-ink/10 bg-ink/[0.03] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-display text-base">{dimension.label}</span>
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
            dimension.status === "supported" ? "text-accent-ink" : "text-slate400"
          }`}
        >
          {dimension.status}
        </span>
      </div>
      {dimension.status === "supported" ? (
        <p className="mt-2 text-sm text-slate400">
          {dimension.proofTypes.length > 0
            ? `Backed by proofs: ${dimension.proofTypes.join(", ")}.`
            : "Backed by dedicated risk signals."}
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
    <section id="attestations" className="mt-10">
      <h2 className="font-display text-lg">Attestations</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate400">
        Structured, signed claims from other wallets. Attestations are
        supporting evidence — they never replace on-chain behavior, and they do
        not create reputation on their own.
      </p>

      {attestations.length === 0 ? (
        <div className="shine-border mt-5 rounded-2xl border border-ink/10 bg-ink/[0.03] p-6 text-sm text-slate400">
          No attestations for this wallet yet.
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {attestations.map((attestation) => (
            <li
              key={attestation.id}
              className="shine-border rounded-2xl border border-ink/10 bg-ink/[0.03] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-display text-base">
                  {attestation.role}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-ink">
                  signed
                </span>
              </div>
              <p className="mt-2 text-sm text-ink">
                {attestation.relationship}
                {attestation.durationMonths !== null &&
                  ` · ${attestation.durationMonths} months`}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] text-slate400">
                <span>
                  attester:{" "}
                  <Link
                    href={`/wallets/${attestation.attester}`}
                    className="text-accent-ink hover:underline"
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

function DisputesSection({
  address,
  disputes,
}: {
  address: string;
  disputes: WalletProfile["disputes"];
}) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-lg">Disputes</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate400">
        Signed reports filed against this wallet. A dispute is a claim, not
        proof of wrongdoing — it never changes reputation or risk here. No
        resolution process exists yet, so every dispute stays open.
      </p>

      {disputes.length === 0 ? (
        <div className="shine-border mt-5 rounded-2xl border border-ink/10 bg-ink/[0.03] p-6 text-sm text-slate400">
          No disputes filed against this wallet.
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {disputes.map((dispute) => (
            <li
              key={dispute.id}
              className="shine-border rounded-2xl border border-ink/10 bg-ink/[0.03] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-display text-base">{dispute.reason}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate400">
                  {dispute.status}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink">
                {dispute.evidence}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] text-slate400">
                <span>
                  reporter:{" "}
                  <Link
                    href={`/wallets/${dispute.reporter}`}
                    className="text-accent-ink hover:underline"
                  >
                    {shortAddress(dispute.reporter)}
                  </Link>
                </span>
                <span>at: {formatDate(dispute.openedAt)}</span>
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-slate400">
                  Verify signature
                </summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all font-mono text-[10px] text-slate400">
                  {dispute.message}
                  {"\n"}
                  {dispute.signature}
                </pre>
              </details>
            </li>
          ))}
        </ul>
      )}

      <DisputeForm target={address} />
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
      <div className="shine-border mt-4 rounded-2xl border border-ink/10 bg-ink/[0.03] p-6 text-sm text-slate400">
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
        <div className="shine-border mt-4 rounded-2xl border border-ink/10 bg-ink/[0.03] p-6 text-sm text-slate400">
          No counterparty relationships indexed for this wallet yet.
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field
              label="Unique counterparties"
              value={`${prefix}${graph.uniqueCounterparties}`}
            />
            <Field
              label="Repeat counterparties"
              value={`${prefix}${graph.repeatCounterparties}`}
              note="Repeat = 2 or more direct interactions."
            />
            <Field
              label="Longest relationship"
              value={
                graph.longestRelationshipDays === null
                  ? "Not available"
                  : `${prefix}${graph.longestRelationshipDays} days`
              }
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

function RiskSection({
  states,
  signals,
}: {
  states: RiskState[];
  signals: RiskSignal[];
}) {
  const detected = new Set(signals.map((signal) => signal.type));

  return (
    <section id="risk" className="mt-10">
      <h2 className="font-display text-lg">Risk Signals</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate400">
        Risk is not proof of wrongdoing — every signal is backed by evidence you
        can inspect, and a signal never labels a wallet malicious. These are kept
        separate from reputation.
      </p>

      {signals.length === 0 && (
        <div className="shine-border mt-5 rounded-2xl border border-ink/10 bg-ink/[0.03] p-6 text-sm text-slate400">
          No supported risk signal is present for this wallet.
        </div>
      )}

      <ul className="mt-5 space-y-3">
        {states.map((state) => {
          const isDetected = detected.has(state.id);
          const statusLabel = isDetected
            ? state.severity ?? "detected"
            : state.status.replace("_", " ");
          return (
            <li
              key={state.id}
              className="shine-border rounded-2xl border border-ink/10 bg-ink/[0.03] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-display text-base">
                  {RISK_LABELS[state.id]}
                </span>
                <span
                  className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
                    isDetected
                      ? "text-accent-ink"
                      : state.status === "not_evaluable"
                        ? "text-ink/40"
                        : "text-slate400"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
              {state.evidence ? (
                <p className="mt-2 font-mono text-sm text-ink">
                  {formatRiskEvidence(state.evidence)}
                </p>
              ) : (
                <p className="mt-2 text-sm text-slate400">
                  {state.reason}
                  {state.suppliedBy && ` Will be supplied by ${state.suppliedBy}.`}
                </p>
              )}
              {state.evidence_reference && (
                <a
                  href={state.evidence_reference}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block break-all font-mono text-[11px] text-accent-ink hover:underline"
                >
                  {state.evidence_reference}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}): Promise<Metadata> {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return {};

  const address = normalizeAddress(parsed.data.address);
  const profile = await getWalletProfile(address);
  const title = `Fathom — ${shortAddress(address)}`;

  const metrics: string[] = [];
  if (profile.walletAgeDays !== null) metrics.push(`${profile.walletAgeDays}d old`);
  if (profile.txCount !== null) metrics.push(`${profile.txCount} transactions`);
  metrics.push(
    `${profile.trustGraph.uniqueCounterparties} unique counterparties`,
  );

  return {
    title,
    description: `Reputation evidence for ${title}. ${metrics.join(", ")}. Evidence before score.`,
    openGraph: {
      title,
      description: "Evidence-backed wallet reputation from Fathom.",
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: "Evidence-backed wallet reputation from Fathom.",
    },
  };
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
    <WalletShell>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate400">
        Wallet profile
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <h1 className="font-display text-3xl font-medium sm:text-4xl">
          {shortAddress(address)}
        </h1>
        <CopyAddress address={address} />
        {profile.alias && (
          <span className="rounded-full border border-ink/15 px-3 py-1 text-sm text-ink">
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

        <RiskSection
          states={profile.riskStates}
          signals={profile.riskSignals}
        />

        <UnavailableSection
          title="Vouches"
          note="Economic backing (stake) is not implemented yet. It requires anti-farming rules that the spec has not defined (Spec 08)."
        />

        <AttestationsSection
          address={address}
          attestations={profile.attestations}
        />

        <DisputesSection address={address} disputes={profile.disputes} />

        <section className="mt-10">
          <h2 className="font-display text-lg">Recent Proofs</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate400">
            Each proof records what is asserted, its source, and how to inspect
            it. Proofs are evidence — they never contain a reputation score.
            Fathom shows only what indexed data supports.
          </p>

          {profile.proofs.length === 0 ? (
            <div className="shine-border mt-5 rounded-2xl border border-ink/10 bg-ink/[0.03] p-6 text-sm text-slate400">
              No proof can be produced for this wallet yet.
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {profile.proofs.map((proof, index) => (
                <li
                  key={`${proof.type}-${index}`}
                  className="shine-border rounded-2xl border border-ink/10 bg-ink/[0.03] p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-display text-base">
                      {PROOF_LABELS[proof.type]}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate400">
                      {proof.type}
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-sm text-ink">
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
                    className="mt-2 inline-block break-all font-mono text-[11px] text-accent-ink hover:underline"
                  >
                    {proof.evidence_reference}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-display text-lg">Why This Evidence?</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate400">
            This profile is built from evidence, not from a single number. Each
            layer points at the one above it, so every claim can be traced back
            to raw on-chain data:
          </p>
          <div className="shine-border mt-5 rounded-2xl border border-ink/10 bg-ink/[0.03] p-6">
            <p className="font-mono text-sm text-ink">
              Wallet → Onchain History → Proofs → Evidence → Trust Decision
            </p>
            <p className="mt-3 text-sm text-slate400">
              Each proof above names its source, verification method, and the
              explorer evidence it was derived from. A reputation score may
              eventually act as a compression layer over this evidence, but it is
              intentionally deferred until the scoring inputs are concrete. The
              trust decision stays yours.
            </p>
          </div>
        </section>
    </WalletShell>
  );
}
