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

- `/` — landing page
- `/docs` — developer docs (sample + playground proxy to `NEXT_PUBLIC_APP_URL`)
