# atares — Deal Pipeline

M&A deal pipeline for **atares**, implemented from the Claude Design handoff
(`Deal Pipeline.html`). A Vite + React single-page app backed by Supabase.

## Features

- **Pipeline** — Kanban board across five stages (Sourcing → NDA Signed → LOI →
  Due Diligence → Closing). Drag cards between stages, open a deal for detail,
  advance a deal to the next stage, and create new deals. Every change persists
  to Supabase. Search filters deals by name/sector. Three card styles and three
  board densities are available (configured in `src/lib/constants.js`).
- **Targets** — research table of sourced companies with status filters and
  search. "Promote" turns a qualified target into a new pipeline deal.
- **Mandates** — client-engagement cards (buy-side / sell-side) with progress,
  lead and fee.
- **Reports** — live analytics: total / probability-weighted value, averages,
  value-by-stage, deal-count funnel, and value-by-sector.

## Architecture

| Layer | What |
| --- | --- |
| `src/App.jsx` | App shell, view routing, state, and persisted mutations |
| `src/components/` | Presentational components and the four views |
| `src/lib/constants.js` | Presentation config — stages, sector colors, leads, formatting helpers |
| `src/lib/supabase.js` | Supabase client |
| `src/lib/api.js` | Data access (fetch / insert / update) |

The mutable business records — **deals, targets, mandates** — live in Supabase.
Stages, sectors and leads are presentation reference data and stay in the
frontend (they carry ordering, colors and avatar hues).

### Data model (Supabase, schema `public`)

- `deals` — `id, name, sector, size, stage, lead, days, prob, priority, next, due, note`
- `targets` — `id, name, sector, revenue, margin, hq, fit, owner, status, contact`
- `mandates` — `id, client, type, focus, range, deals, lead, status, progress, since, fee`

Row-level security is enabled on all three tables with policies that grant the
public `anon` key full read/write — appropriate for this no-auth demo, since the
publishable key is meant to ship to the browser.

## Running locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
npm run preview  # serve the production build
```

Supabase credentials are read from `.env` (`VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`) and fall back to the project's public values in
`src/lib/supabase.js`, so the app runs out of the box. The anon/publishable key
is safe to commit — table access is governed by row-level security.
