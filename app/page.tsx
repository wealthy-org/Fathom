"use client";

import { useEffect } from "react";

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function Kick({ children }: { children: string }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
      {children}
    </span>
  );
}

function Head({ kick, title, sub }: { kick: string; title: React.ReactNode; sub?: string }) {
  return (
    <div className="reveal max-w-2xl">
      <Kick>{kick}</Kick>
      <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">
        {title}
      </h2>
      {sub && <p className="mt-5 text-base leading-7 text-slate400">{sub}</p>}
    </div>
  );
}

const SCORE_COMPONENTS: Array<[string, string, boolean]> = [
  ["On-chain baseline", "Activity signals every wallet already has.", true],
  ["Vouches", "Stake-backed endorsements from other wallets.", false],
  ["Reviews", "Lightweight ratings, no stake required.", true],
  ["Invite activity", "Credit for growing the network responsibly.", false],
  ["Verified role badges", "Community-attested roles and skills.", true],
  ["Dispute status", "Active disputes halve the score until resolved.", false],
];

const HISTORY = [420, 510, 590, 640, 782];
const HISTORY_EVENTS: Array<[string, string]> = [
  ["420", "First vouches received"],
  ["510", "Builder badge verified by community"],
  ["590", "12 new reviews, avg 4.6"],
  ["640", "Dispute opened — score frozen"],
  ["782", "Dispute resolved — score restored + vouch surge"],
];

export default function Home() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("reveal-visible");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const pts = HISTORY.map((v, i) => {
    const x = 20 + (i * 560) / (HISTORY.length - 1);
    const y = 150 - ((v - 350) / (800 - 350)) * 130;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="bg-void font-sans text-white">
      <div className="bg-stars" />
      <div className="bg-grid" />
      <div className="glow-spot animate-blob" style={{ top: -220, left: -220 }} />
      <div className="glow-spot animate-blob" style={{ right: -220, bottom: -200, animationDelay: "-8s" }} />

      {/* 1. NAVBAR */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent/20 bg-accent/5 font-display text-lg font-semibold text-accent shadow-[0_0_20px_-10px_rgba(20,241,149,0.5)]">
              F
            </div>
            <div className="flex items-baseline">
              <span className="font-display text-lg font-semibold tracking-tight">Fathom</span>
            </div>
          </a>
          <div className="hidden items-center gap-1 rounded-full border border-white/5 bg-white/[0.02] p-1 backdrop-blur-md md:flex">
            {[
              ["How It Works", "#how"],
              ["Reputation", "#reputation"],
              ["Use Cases", "#use-cases"],
              ["Docs", "#"],
            ].map(([t, href]) => (
              <a
                key={t}
                href={href}
                className="rounded-full px-4 py-2 text-xs font-medium text-slate400 transition duration-200 hover:bg-white/5 hover:text-white"
              >
                {t}
              </a>
            ))}
          </div>
          <a
            href="#reputation"
            className="group relative overflow-hidden rounded-full bg-white p-[1px] transition duration-300 hover:scale-105"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-accent via-purple to-accent opacity-0 transition duration-300 group-hover:opacity-100" />
            <span className="relative flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black">
              Connect Wallet
            </span>
          </a>
        </div>
      </nav>

      <main className="relative z-10">
        {/* 2. HERO */}
        <section className="relative px-5 pb-24 pt-44 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_.95fr]">
              <div>
                <div className="reveal mb-7 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
                    On-chain trust layer
                  </span>
                </div>
                <h1 className="reveal max-w-4xl font-display text-6xl font-medium leading-[0.95] tracking-tighter sm:text-7xl md:text-8xl">
                  Trust without
                  <span className="block bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
                    identity.
                  </span>
                </h1>
                <p className="reveal mt-7 max-w-xl text-base leading-7 text-slate400 sm:text-lg">
                  Fathom turns on-chain behavior into verifiable credibility,
                  allowing wallets to build reputation without revealing their
                  real-world identity.
                </p>
                <div className="reveal mt-9 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#reputation"
                    className="solana-button group flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition duration-300 hover:scale-105"
                  >
                    Explore Fathom
                    <Arrow className="transition duration-300 group-hover:translate-x-1" />
                  </a>
                  <a
                    href="#how"
                    className="flex items-center justify-center rounded-full border border-white/10 bg-white/[0.02] px-6 py-3.5 text-sm font-medium text-slate400 transition duration-300 hover:border-accent/20 hover:bg-accent/5 hover:text-white"
                  >
                    How It Works
                  </a>
                </div>
              </div>

              {/* hero visual: example wallet profile terminal */}
              <div className="reveal shine-border overflow-hidden rounded-2xl border border-white/10 bg-terminal shadow-[0_30px_100px_-40px_rgba(20,241,149,0.2)]">
                <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full border border-red-400/50 bg-red-500/20" />
                    <span className="h-2.5 w-2.5 rounded-full border border-yellow-400/50 bg-yellow-500/20" />
                    <span className="h-2.5 w-2.5 rounded-full border border-green-400/50 bg-green-500/20" />
                  </div>
                  <div className="font-mono text-[9px] text-slate400">fathom://profile</div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-accent">live</div>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="terminal-line text-slate400">
                    <span className="text-accent">$</span> fathom score 0x71…4a3f
                  </div>
                  <div className="terminal-line mt-1 text-slate400">
                    <span className="text-purple">›</span> fetching vouches, reviews, attestations…
                  </div>
                  <div className="terminal-line mt-1 text-slate400">
                    <span className="text-accent">✓</span> score computed from on-chain signals
                  </div>
                  <div className="mt-5 rounded-xl border border-accent/20 bg-accent/5 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent">
                        Credibility Score
                      </span>
                      <span className="font-mono text-[9px] text-slate400">▲ +142</span>
                    </div>
                    <div className="secret-reveal mt-3 select-none font-display text-5xl font-medium tracking-tight text-white">
                      782
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
                    <span className="font-mono text-[9px] text-slate400">VOUCHES</span>
                    <span className="font-mono text-[10px] text-white">18</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-mono text-[9px] text-slate400">REVIEWS</span>
                    <span className="font-mono text-[10px] text-white">32 · avg 4.6</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-mono text-[9px] text-slate400">BADGES</span>
                    <span className="font-mono text-[10px] text-accent">Builder ✓ · Reviewer ✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS (replaces marquee) */}
        <section className="border-y border-white/5 bg-black/20 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-5 py-8 sm:px-6 lg:px-8">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate400">Wallets scored</span>
              <div className="mt-1 font-display text-2xl font-medium">1,248 <span className="text-sm text-slate400">demo</span></div>
            </div>
            <div className="my-2 hidden h-10 w-px bg-white/10 sm:block" />
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate400">Vouches recorded</span>
              <div className="mt-1 font-display text-2xl font-medium">312 <span className="text-sm text-slate400">demo</span></div>
            </div>
            <div className="my-2 hidden h-10 w-px bg-white/10 sm:block" />
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate400">Score model</span>
              <div className="mt-1 font-display text-2xl font-medium">6 <span className="text-accent">signals</span></div>
            </div>
          </div>
        </section>

        {/* 3. CORE PHILOSOPHY */}
        <section className="px-5 py-28 sm:px-6 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-7xl">
            <Head
              kick="Core philosophy"
              title={<>The wallet is the identity. <span className="text-slate400">The behavior is the reputation.</span></>}
              sub="Fathom builds credibility from what a wallet does on-chain, rather than who controls it in the real world."
            />
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {["No real name required", "No social account required", "No public profile required", "Wallet-based identity"].map((t, i) => (
                <div key={t} className="reveal glass rounded-3xl border border-white/5 p-7">
                  <span className="font-mono text-[9px] text-slate400">0{i + 1}</span>
                  <p className="mt-8 font-display text-lg font-medium leading-7">
                    <span className="mr-2 text-accent">✓</span>{t}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. HOW IT WORKS */}
        <section id="how" className="border-y border-white/5 bg-black/10 px-5 py-28 sm:px-6 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-5xl">
            <div className="reveal text-center">
              <Kick>Protocol flow</Kick>
              <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">
                Trust is built through behavior.
              </h2>
            </div>
            <div className="relative mt-20">
              <div className="process-line absolute bottom-0 left-1/2 top-0 hidden w-px -translate-x-1/2 md:block" />
              {[
                ["Step 01", "Connect", "Connect your wallet and prove ownership through a signed message.", true],
                ["Step 02", "Build", "Build credibility through vouches, reviews, role attestations, and on-chain activity.", false],
                ["Step 03", "Prove", "Use your reputation to establish trust with other wallets, communities, and collaborators.", true],
              ].map(([k, title, body, isAccent], i) => (
                <div key={k as string} className={`reveal group relative grid items-center gap-8 md:grid-cols-2 ${i > 0 ? "mt-20 md:mt-28" : ""}`}>
                  {i % 2 === 1 && <div className="hidden md:block" />}
                  <div className={i % 2 === 0 ? "text-left md:pr-20 md:text-right" : "text-left md:pl-20"}>
                    <span className={`font-mono text-[9px] uppercase tracking-[0.2em] ${isAccent ? "text-accent" : "text-purple"}`}>
                      {k}
                    </span>
                    <h3 className="mt-3 font-display text-2xl font-medium">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate400">{body}</p>
                  </div>
                  <div
                    className={`absolute left-1/2 top-1/2 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-void md:flex ${isAccent ? "border-accent/20 group-hover:shadow-[0_0_30px_-8px_rgba(20,241,149,0.8)]" : "border-purple/20 group-hover:shadow-[0_0_30px_-8px_rgba(153,69,255,0.8)]"}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${isAccent ? "bg-accent" : "bg-purple"}`} />
                  </div>
                  {i % 2 === 0 && <div className="hidden md:block" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. CREDIBILITY SCORE */}
        <section id="reputation" className="px-5 py-28 sm:px-6 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-7xl">
            <Head
              kick="Credibility score"
              title={<>A reputation <span className="text-slate400">you can verify.</span></>}
              sub="Your credibility score is derived from underlying signals rather than being a manually assigned number."
            />
            <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {SCORE_COMPONENTS.map(([t, b, isAccent], i) => (
                <article key={t} className="reveal glass rounded-3xl border border-white/5 p-7 sm:p-9">
                  <div className="flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border font-mono text-xs ${isAccent ? "border-accent/10 bg-accent/5 text-accent" : "border-purple/20 bg-purple/5 text-purple"}`}>
                      0{i + 1}
                    </div>
                    <span className="font-mono text-[9px] text-slate400">0{i + 1}</span>
                  </div>
                  <h3 className="mt-12 font-display text-2xl font-medium">{t}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate400">{b}</p>
                </article>
              ))}
            </div>
            <p className="reveal mt-14 text-center font-display text-2xl font-medium tracking-tight sm:text-3xl">
              Your score is derived from behavior, <span className="text-accent">not popularity.</span>
            </p>
          </div>
        </section>

        {/* 6. VOUCH */}
        <section className="border-y border-white/5 bg-black/10 px-5 py-28 sm:px-6 lg:px-8 lg:py-40">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
            <div className="reveal">
              <Kick>Vouch</Kick>
              <h2 className="mt-4 max-w-xl font-display text-4xl font-medium tracking-tight sm:text-5xl">
                Put something <span className="text-slate400">behind your trust.</span>
              </h2>
              <p className="mt-6 max-w-xl text-sm leading-7 text-slate400">
                A vouch allows one wallet to endorse another wallet while
                staking tokens behind that endorsement.
              </p>
              <div className="mt-10 space-y-7">
                {[
                  ["Vouch", "A wallet expresses trust in another wallet.", true],
                  ["Stake", "The endorsement carries an economic commitment.", false],
                  ["Reputation", "The vouch contributes to the recipient's credibility.", true],
                ].map(([t, b, isAccent]) => (
                  <div key={t as string} className={`border-l-2 pl-5 ${isAccent ? "border-accent" : "border-purple"}`}>
                    <h3 className="font-display text-xl font-medium">{t}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate400">{b}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="reveal shine-border flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-terminal p-8">
              {["Wallet A", "Stake", "Vouch", "Wallet B", "Credibility"].map((t, i, arr) => (
                <div key={t} className="flex w-full max-w-xs flex-col items-center">
                  <div className={`w-full rounded-lg border px-6 py-3.5 text-center font-mono text-[11px] uppercase tracking-[0.2em] ${i === arr.length - 1 ? "border-accent/40 bg-accent/10 text-accent" : "border-white/10 text-slate400"}`}>
                    {t}
                  </div>
                  {i < arr.length - 1 && <div className="py-1 font-mono text-xs text-accent">↓</div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. REVIEWS & ATTESTATION */}
        <section className="px-5 py-28 sm:px-6 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-7xl">
            <Head
              kick="Reviews + attestation"
              title={<>Reputation is built <span className="text-slate400">by other wallets.</span></>}
            />
            <div className="mt-14 grid gap-4 md:grid-cols-2">
              <article className="reveal glass rounded-3xl border border-white/5 p-7 sm:p-9">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent">Reviews</span>
                <p className="mt-6 max-w-lg text-sm leading-7 text-slate400">
                  Wallets can rate and leave short feedback for other wallets
                  without staking tokens — a lightweight way to record everyday
                  trust.
                </p>
                <div className="mt-9 rounded-2xl border border-white/5 bg-[#060910] p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate400">Review submitted</span>
                    <span className="font-mono text-[11px] text-accent">★★★★★</span>
                  </div>
                  <div className="mt-4 font-mono text-[11px] leading-6 text-slate400">
                    “Fast settlement, no drama. Would trade again.”
                  </div>
                </div>
              </article>
              <article className="reveal glass rounded-3xl border border-white/5 p-7 sm:p-9">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-purple">Role / skill badges</span>
                <p className="mt-6 max-w-lg text-sm leading-7 text-slate400">
                  Wallets declare roles — Builder, Reviewer, Community Mod —
                  and other qualified wallets attest to them until the badge is
                  community-verified.
                </p>
                <div className="mt-9 flex flex-wrap gap-2">
                  {["Builder ✓", "Reviewer ✓", "Community Mod"].map((b) => (
                    <span key={b} className="rounded-full border border-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-slate400">
                      {b}
                    </span>
                  ))}
                </div>
              </article>
            </div>
            <p className="reveal mt-14 text-center font-display text-2xl font-medium tracking-tight sm:text-3xl">
              Your reputation is not what you claim.<br />
              <span className="text-accent">It&apos;s what others can verify.</span>
            </p>
          </div>
        </section>

        {/* 8. PRIVACY */}
        <section className="border-y border-white/5 bg-black/10 px-5 py-28 sm:px-6 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-7xl">
            <div className="reveal grid gap-12 lg:grid-cols-2">
              <div>
                <Kick>Privacy</Kick>
                <h2 className="mt-4 max-w-xl font-display text-4xl font-medium tracking-tight sm:text-5xl">
                  Pseudonymous <span className="text-slate400">by design.</span>
                </h2>
                <p className="mt-6 max-w-xl text-sm leading-7 text-slate400">
                  You don&apos;t need to reveal your real-world identity to
                  build a reputation. The protocol exposes proofs and behavior,
                  not private information.
                </p>
              </div>
              <div className="rounded-3xl border border-red-500/20 bg-red-500/[0.02] p-7 sm:p-9">
                <h3 className="font-display text-xl font-medium">Not required — ever</h3>
                <ul className="mt-5 space-y-3 text-sm leading-7 text-slate400">
                  {["Real name", "Profile photo", "Email", "Social accounts", "Phone number"].map((t) => (
                    <li key={t}><span className="mr-3 text-red-400">✕</span><s>{t}</s></li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="reveal mt-10 rounded-3xl border border-accent/20 bg-accent/5 p-7 sm:p-9">
              <h3 className="font-display text-xl font-medium text-accent">Always visible</h3>
              <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[11px] uppercase tracking-[0.15em] text-slate400">
                {["Wallet address", "On-chain behavior", "Vouches", "Reviews", "Community attestations"].map((t) => (
                  <span key={t}><span className="mr-2 text-accent">✓</span>{t}</span>
                ))}
              </div>
            </div>
            <p className="reveal mt-14 text-center font-display text-2xl font-medium tracking-tight sm:text-3xl">
              Prove what you&apos;ve done.<br />
              <span className="text-slate400">Keep who you are private.</span>
            </p>
          </div>
        </section>

        {/* 9. USE CASES */}
        <section id="use-cases" className="px-5 py-28 sm:px-6 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-7xl">
            <Head
              kick="Use cases"
              title={<>Trust, wherever <span className="text-slate400">wallets interact.</span></>}
            />
            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {[
                ["01 / OTC", "Know who you're dealing with.", "Check the credibility of a counterparty before an anonymous wallet-to-wallet transaction.", true],
                ["02 / Communities", "Build reputation before granting access.", "Evaluate wallet history, credibility, and verified roles before allowing access to a community or DAO.", false],
                ["03 / Collaboration", "Find people by reputation, not popularity.", "Discover builders, reviewers, and contributors through verifiable wallet reputation.", true],
              ].map(([k, t, b, isAccent]) => (
                <article key={k as string} className="reveal glass rounded-3xl border border-white/5 p-7 sm:p-9">
                  <span className={`font-mono text-[9px] uppercase tracking-[0.2em] ${isAccent ? "text-accent" : "text-purple"}`}>{k}</span>
                  <h3 className="mt-12 font-display text-2xl font-medium">{t}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate400">{b}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 10. REPUTATION → ACCESS */}
        <section className="border-y border-white/5 bg-black/10 px-5 py-28 sm:px-6 lg:px-8 lg:py-40">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
            <div className="reveal">
              <Kick>Score-gated access</Kick>
              <h2 className="mt-4 max-w-xl font-display text-4xl font-medium tracking-tight sm:text-5xl">
                Reputation <span className="text-slate400">should unlock something.</span>
              </h2>
              <p className="mt-6 max-w-xl text-sm leading-7 text-slate400">
                Fathom allows applications and communities to use credibility as
                an access condition.
              </p>
              <p className="mt-8 font-display text-xl font-medium">
                Turn reputation <span className="text-accent">into permission.</span>
              </p>
            </div>
            <pre className="reveal shine-border overflow-x-auto rounded-2xl border border-white/10 bg-terminal p-6 font-mono text-xs leading-8 text-slate400 sm:p-8">
{`Community Access

Minimum Credibility
500

Wallet
782 ✓

Access Granted`}
            </pre>
          </div>
        </section>

        {/* 11. HISTORY */}
        <section className="px-5 py-28 sm:px-6 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-7xl">
            <Head
              kick="Reputation history"
              title={<>Reputation <span className="text-slate400">isn&apos;t static.</span></>}
              sub="Track how a wallet's credibility changes over time."
            />
            <div className="reveal shine-border mt-14 overflow-hidden rounded-2xl border border-white/10 bg-terminal p-6 sm:p-8">
              <div className="font-mono text-sm tracking-[0.1em] text-slate400">
                420 <span className="text-accent">→</span> 510 <span className="text-accent">→</span> 590 <span className="text-accent">→</span> 640 <span className="text-accent">→</span> <span className="text-accent">782</span>
              </div>
              <svg viewBox="0 0 600 160" className="mt-6 w-full" aria-hidden="true">
                <polyline points={pts} fill="none" stroke="#14f195" strokeWidth="2" />
                {HISTORY.map((v, i) => {
                  const x = 20 + (i * 560) / (HISTORY.length - 1);
                  const y = 150 - ((v - 350) / (800 - 350)) * 130;
                  return <circle key={v} cx={x} cy={y} r="4" fill="#14f195" />;
                })}
              </svg>
              <ul className="mt-8 space-y-3">
                {HISTORY_EVENTS.map(([score, ev]) => (
                  <li key={score} className="flex gap-6 border-b border-white/5 pb-3 font-mono text-[11px]">
                    <span className="w-12 shrink-0 text-accent">{score}</span>
                    <span className="text-slate400">{ev}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 12. SHARE CARD */}
        <section className="border-y border-white/5 bg-black/10 px-5 py-28 sm:px-6 lg:px-8 lg:py-40">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
            <div className="reveal">
              <Kick>Shareable reputation</Kick>
              <h2 className="mt-4 max-w-xl font-display text-4xl font-medium tracking-tight sm:text-5xl">
                Take your reputation <span className="text-slate400">with you.</span>
              </h2>
              <p className="mt-6 max-w-xl text-sm leading-7 text-slate400">
                Generate a shareable reputation card that lets others see your
                credibility without requiring a traditional social profile.
              </p>
              <a
                href="#share-example"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-6 py-3.5 text-sm font-medium text-slate400 transition duration-300 hover:border-accent/20 hover:bg-accent/5 hover:text-white"
              >
                View Example <Arrow />
              </a>
            </div>
            <div id="share-example" className="reveal rounded-2xl border border-accent/40 bg-terminal p-8 shadow-[0_30px_100px_-40px_rgba(20,241,149,0.25)]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-3 font-display text-sm font-semibold">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/20 bg-accent/5 text-accent">F</span>
                  Fathom
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate400">Share card</span>
              </div>
              <div className="mt-8 font-mono text-xs text-slate400">0x71…4a3f</div>
              <div className="mt-2 font-display text-7xl font-medium tracking-tight">782</div>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Builder ✓", "Reviewer ✓"].map((b) => (
                  <span key={b} className="rounded-full border border-accent/30 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-accent">
                    {b}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex gap-8 border-t border-white/5 pt-4 font-mono text-[11px] text-slate400">
                <span>18 vouches</span>
                <span>32 reviews</span>
              </div>
            </div>
          </div>
        </section>

        {/* 13. DIRECTORY */}
        <section className="px-5 py-28 sm:px-6 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-7xl">
            <Head
              kick="Endorsement directory"
              title={<>Discover wallets <span className="text-slate400">worth knowing.</span></>}
              sub="Explore wallets with established credibility and verified roles."
            />
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {["Builders", "Reviewers", "Community Moderators", "More verified roles"].map((c, i) => (
                <div key={c} className="reveal glass rounded-3xl border border-white/5 p-7">
                  <span className="font-mono text-[9px] text-slate400">0{i + 1}</span>
                  <h3 className="mt-8 font-display text-xl font-medium">{c}</h3>
                </div>
              ))}
            </div>
            <p className="reveal mt-8 font-mono text-[11px] uppercase tracking-[0.2em] text-slate400">
              A reputation + discovery layer — <span className="text-white">not a marketplace.</span>
            </p>
          </div>
        </section>

        {/* 14. PRODUCT STATEMENT */}
        <section className="border-t border-white/5 px-5 py-28 text-center sm:px-6 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-7xl">
            <h2 className="reveal mx-auto max-w-5xl font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">
              Trust shouldn&apos;t require knowing someone&apos;s{" "}
              <span className="bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">name.</span>
            </h2>
            <p className="reveal mx-auto mt-8 max-w-xl text-base leading-7 text-slate400">
              Fathom creates a reputation layer for the pseudonymous internet,
              where credibility comes from behavior and community verification.
            </p>
          </div>
        </section>

        {/* 15. FINAL CTA */}
        <section className="relative overflow-hidden border-t border-white/5 px-5 py-28 sm:px-6 lg:px-8 lg:py-40">
          <div className="glow-spot left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: 700, height: 700 }} />
          <div className="reveal relative z-10 mx-auto max-w-4xl text-center">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
                Robinhood Chain testnet
              </span>
            </div>
            <h2 className="font-display text-5xl font-medium leading-[0.95] tracking-tighter sm:text-7xl">
              Build reputation.
              <span className="block bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
                Stay pseudonymous.
              </span>
            </h2>
            <p className="mx-auto mt-7 max-w-md text-base leading-7 text-slate400">
              Start building your on-chain credibility with Fathom.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#reputation"
                className="solana-button group flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition duration-300 hover:scale-105"
              >
                Connect Wallet
                <Arrow className="transition duration-300 group-hover:translate-x-1" />
              </a>
              <a
                href="#reputation"
                className="flex items-center justify-center rounded-full border border-white/10 bg-white/[0.02] px-6 py-3.5 text-sm font-medium text-slate400 transition duration-300 hover:border-accent/20 hover:bg-accent/5 hover:text-white"
              >
                Explore Reputation
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* 16. FOOTER */}
      <footer className="relative z-10 border-t border-white/5 bg-black/20 px-5 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/20 bg-accent/5 font-display font-semibold text-accent">
                  F
                </div>
                <span className="font-display font-semibold">Fathom</span>
              </div>
              <p className="mt-5 max-w-xs text-sm leading-6 text-slate400">
                Privacy-first on-chain trust layer.
              </p>
            </div>
            <div>
              <h4 className="font-mono text-[9px] uppercase tracking-[0.18em] text-white">Product</h4>
              <div className="mt-5 space-y-3 text-sm text-slate400">
                {[
                  ["How It Works", "#how"],
                  ["Reputation", "#reputation"],
                  ["Vouches", "#reputation"],
                  ["Reviews", "#reputation"],
                  ["Badges", "#reputation"],
                  ["Score-Gated Access", "#reputation"],
                ].map(([t, href]) => (
                  <a key={t} href={href} className="block transition hover:text-white">{t}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-mono text-[9px] uppercase tracking-[0.18em] text-white">Resources</h4>
              <div className="mt-5 space-y-3 text-sm text-slate400">
                <a href="#" className="block transition hover:text-white">Documentation</a>
                <a href="#" className="block transition hover:text-white">GitHub</a>
              </div>
            </div>
            <div>
              <h4 className="font-mono text-[9px] uppercase tracking-[0.18em] text-white">Legal</h4>
              <div className="mt-5 space-y-3 text-sm text-slate400">
                <a href="#" className="block transition hover:text-white">Privacy</a>
                <a href="#" className="block transition hover:text-white">Terms</a>
              </div>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-accent/10 bg-accent/5 px-3 py-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-accent">Testnet</span>
              </div>
            </div>
          </div>
          <div className="mt-14 flex flex-col justify-between gap-4 border-t border-white/5 pt-6 text-[10px] text-slate400 sm:flex-row">
            <span>© 2026 Fathom</span>
            <span className="font-mono uppercase tracking-[0.15em]">Trust without identity</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
