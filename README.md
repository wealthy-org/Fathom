# Fathom — Landing

**Proof of Reputation for pseudonymous wallets.**

Marketing landing page for Fathom. Static, no wallet logic, no database.
All "Launch App" buttons link out to the external app (`NEXT_PUBLIC_APP_URL`).
Live docs sample + playground fetch from that remote app.

## Stack

- Next.js 16 (App Router) + TypeScript (strict)
- Tailwind CSS v4
- d3 (trust-graph visualization) + gsap

## Quick start

```bash
npm install
cp .env.example .env   # set NEXT_PUBLIC_APP_URL
npm run dev
```

Open http://localhost:3000.

### Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | External app URL opened by "Launch App" buttons; docs sample + playground fetch from here. |
| `NEXT_PUBLIC_SITE_URL` | Absolute site URL for metadata (og:image unfurls). Empty = relative (dev). |

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server. |
| `npm run build` | Production build. |
| `npm run lint` | ESLint. |
| `npm run typecheck` | `tsc --noEmit`. |

## Routes

- `/` — landing page (hero, trust graph, activity marquee, explain, integrate, FAQ)
- `/docs` — developer docs for `GET /api/reputation/{address}`:
  live sample response, request playground (cURL/JS/Python snippets +
  real preview card), endpoint reference, 17 response fields, error shapes,
  limits, build recipes, changelog. Sample + playground call the external
  app (`APP_API_BASE` in `lib/site.ts`, sourced from `NEXT_PUBLIC_APP_URL`).

## Project structure

```text
app/            / page, /docs page, layout (next/font), providers
components/     landing-*.tsx sections, docs-*.tsx docs page,
                layout/Navbar.tsx + Logo.tsx, trust-graph-visualization.tsx
lib/site.ts     APP_URL / APP_API_BASE — single source for the external app URL
lib/chain/      address regex + trust-graph types (viz only, no RPC here)
lib/score/      score/tier shared types (docs field reference)
```
