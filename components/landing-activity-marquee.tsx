import { WalletAvatar } from "@/components/wallet-avatar";

/**
 * Strip aktivitas statis di bawah navbar landing — cuplikan visual murni.
 * Tanpa fetch /api/activity, tanpa polling, tanpa wallet logic.
 * Live inspection happens in the external app (APP_URL).
 */

const STATIC_ITEMS = [
  { actor: "0x71c4b43c9c1e4a3f8d2a7b6c5e4f3a2b1c4a3f", action: "vouched", detail: "2.5 ETH", at: "2 min ago" },
  { actor: "0x4e21d88a3b5c6f7aa1e2d3c4b5a69788796f7aa", action: "attested as", detail: "Auditor", at: "18 min ago" },
  { actor: "0xa6d9e296e6833d211278faf255c76ed193c9ac19", action: "score updated", detail: "+24 this week", at: "47 min ago" },
  { actor: "0x9b771c2d4e5f6a7b8c9d0e1f2a3b4c5d6e1c2d", action: "claimed wallet", detail: "", at: "1 hr ago" },
  { actor: "0x33ef88b1a2b3c4d5e6f7a8b9c0d1e2f3a88b1", action: "opened dispute", detail: "", at: "2 hr ago" },
  { actor: "0x12ab9f041c2d3e4f5a6b7c8d9e0f1a2b3c9f04", action: "vouched", detail: "1.0 ETH", at: "3 hr ago" },
];

function StaticCard({
  item,
}: {
  item: (typeof STATIC_ITEMS)[number];
}) {
  return (
    <div className="relative w-60 shrink-0 overflow-hidden rounded-2xl border border-ink/10 bg-white p-5 sm:w-64">
      <span className="relative flex items-center gap-2.5">
        <WalletAvatar address={item.actor} size={36} />
        <span className="truncate font-mono text-sm font-medium text-ink">
          {`${item.actor.slice(0, 6)}…${item.actor.slice(-4)}`}
        </span>
      </span>
      <span className="relative mt-3 block">
        <p className="truncate text-sm text-slate400">
          {item.action}{" "}
          {item.detail && (
            <span className="font-semibold text-ink">{item.detail}</span>
          )}
        </p>
        <span className="mt-1 block font-mono text-[11px] text-faint font-mono">
          {item.at}
        </span>
      </span>
    </div>
  );
}

export function LandingActivityMarquee({
  viewAll = true,
  bleed = false,
}: {
  viewAll?: boolean;
  bleed?: boolean;
}) {
  const loop = [...STATIC_ITEMS, ...STATIC_ITEMS];
  const half = STATIC_ITEMS.length;

  return (
    <section
      aria-label="Sample network activity"
      className={`border-y border-ink/10 bg-transparent pt-6 text-ink ${
        bleed ? "relative -mt-24 left-1/2 w-screen -translate-x-1/2" : ""
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-end gap-4 px-5 lg:px-8" />
      <div className={`marquee-paused overflow-hidden ${viewAll ? "mt-4" : ""}`}>
        <div className="animate-marquee flex w-max gap-4 px-5 motion-reduce:animate-none motion-reduce:overflow-x-auto lg:px-8">
          {loop.map((item, index) => (
            <span
              key={`${item.actor}-${item.action}-${index}`}
              aria-hidden={index >= half || undefined}
              className="contents"
            >
              <StaticCard item={item} />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
