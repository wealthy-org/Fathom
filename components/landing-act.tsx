import { APP_URL, APP_LINK_PROPS } from "@/lib/site";

/**
 * Section 08 — Act. Dark full-width CTA driving to the external app.
 */
export function LandingAct() {
  return (
    <section id="act" className="px-5 pb-24 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[2.5rem] bg-coal px-6 py-16 sm:px-12 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-medium tracking-tight text-white sm:text-5xl">
            Know the wallet before you trust it.
          </h2>
          <p className="mt-4 text-base leading-7 text-white/60">
            Open the app to check a wallet before the transfer, the trade, or
            the collaboration. One address is all it takes.
          </p>
          <div className="mx-auto mt-9 flex max-w-xl flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={APP_URL}
              {...APP_LINK_PROPS}
              className="btn-brutal min-touch h-12 px-6 text-sm [&.btn-brutal]:bg-accent [&.btn-brutal:hover]:bg-accent-ink"
            >
              Launch App
            </a>
            <a
              href="#why"
              className="btn-brutal-light min-touch h-12 border-white/15 bg-white/5 px-6 text-sm text-white hover:border-white/30"
            >
              Why Fathom
            </a>
          </div>
          {/* <div className="mt-4 flex flex-wrap justify-center gap-2">
            {["No signup", "Public data only"].map((pill) => (
              <span
                key={pill}
                className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/60"
              >
                {pill}
              </span>
            ))}
          </div> */}
        </div>
      </div>
    </section>
  );
}
