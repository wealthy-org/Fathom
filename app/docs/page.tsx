import { Navbar } from "@/components/layout/Navbar";
import { DocsExperience } from "@/components/docs-experience";

/** Wallet contoh publik — seed data nyata, sama dengan landing/footer. */
const EXAMPLE_WALLET = "0xa6d9e296e6833d211278faf255c76ed193c9ac19";

/** API app eksternal — docs landing fetch sample dari sini, bukan DB lokal. */
const REMOTE_APP = "https://fathom-xi-bice.vercel.app";

/**
 * Developer experience docs. Sample hero JSON = data sungguhan
 * EXAMPLE_WALLET via API app eksternal — bukan mock, bukan DB lokal.
 * Jika fetch gagal, fallback statis ber-null (tetap jujur: null = unknown).
 */

const FALLBACK_SAMPLE = `{
  "address": "${EXAMPLE_WALLET}",
  "walletAgeDays": null,
  "uniqueCounterparties": null,
  "repeatCounterparties": null,
  "attestations": 0,
  "activeDisputes": 0,
  "riskSignals": [],
  "riskLevel": null,
  "proofs": [],
  "claim": null,
  "vouches": null,
  "vouchesCount": null,
  "dimensions": [],
  "score": null,
  "tier": null,
  "formulaVersion": "1.1.0-provisional",
  "completeness": "unavailable"
}`;

async function loadSample(): Promise<string> {
  try {
    const res = await fetch(`${REMOTE_APP}/api/reputation/${EXAMPLE_WALLET}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error("bad status");
    const payload = (await res.json()) as Record<string, unknown>;
    // Array besar dipangkas untuk tampilan — nilai di dalamnya tetap nyata.
    const trimmed = {
      ...payload,
      proofs: Array.isArray(payload.proofs) ? payload.proofs.slice(0, 2) : [],
      dimensions: Array.isArray(payload.dimensions)
        ? payload.dimensions.slice(0, 5)
        : [],
      vouches:
        payload.vouches === null || payload.vouches === undefined
          ? payload.vouches ?? null
          : Array.isArray(payload.vouches)
            ? payload.vouches.slice(0, 2)
            : payload.vouches,
      riskSignals: Array.isArray(payload.riskSignals)
        ? payload.riskSignals.slice(0, 2)
        : [],
    };
    return JSON.stringify(trimmed, null, 2);
  } catch {
    return FALLBACK_SAMPLE;
  }
}

export default async function DocsPage() {
  const sample = await loadSample();
  return (
    <div className="relative min-h-screen">
      <Navbar />

      <div className="mx-auto w-full max-w-[1440px] [padding-left:max(1.25rem,env(safe-area-inset-left))] [padding-right:max(1.25rem,env(safe-area-inset-right))] lg:[padding-left:max(2rem,env(safe-area-inset-left))] lg:[padding-right:max(2rem,env(safe-area-inset-right))]">
        <main
          id="main-content"
          className="relative z-10 mx-auto max-w-5xl pb-24 pt-10"
        >
          <div className="mt-14">
            <DocsExperience sampleCode={sample} />
          </div>
        </main>
      </div>
    </div>
  );
}
