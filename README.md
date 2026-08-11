# CE Shield

**Career intelligence + CE-compliance for rehabilitation clinicians.**
Live at **[ceshield.com](https://www.ceshield.com)**.

CE Shield helps physical and occupational therapists answer a question their
profession never made easy: *which credential is actually worth my time and
money?* It scores **143 rehab credentials** across **five career-path lenses**,
backed by **~7,000 curated citations**, then layers on CE-compliance tracking
and a clinician profile ("living rehab CV"). It's built to grow into a two-sided
platform where patients can discover credentialed clinicians.

---

## What it does

- **Evidence-scored credential matrix.** Every credential is scored 0–100 on
  six dimensions *per lens*, with a weighted-sum model the user can re-weight
  live. The five lenses — Clinical, Business, Academic Clinical, Research, and
  HealthTech — each use their own dimensions and evidence frame, because a PhD
  is poor ROI for a clinician and transformative for a researcher, and one
  rubric can't tell the truth about both.
- **Per-credential evidence dossiers.** Each credential has its own statically
  generated page with full citation library, cross-lens scores, and
  per-dimension justifications — 138+ indexable pages forming the SEO surface.
- **State CE-compliance tracker.** Per-state rule sets (mandatory categories,
  caps, first-renewal exemptions), course logging with certificate upload + OCR
  autofill, and a renewal countdown.
- **Living Rehab CV.** Clinicians assemble a credential profile from the matrix
  (earned / in progress / planned), add bio, specialties, and experience, and
  opt into a public shareable CV at `/clinicians/<handle>`.
- **Honest by construction.** Independent scoring (no money from certification
  programs), an explicit two-evidence-frame methodology, and a published
  conflict-of-interest statement.

## Architecture

| Layer | Choice | Notes |
|------|--------|-------|
| Framework | **Next.js 16 (App Router)** | SSG for marketing + credential pages; dynamic SSR for public CVs |
| UI | React 19, Tailwind v4, inline design tokens | shared design system, mobile-responsive |
| Backend | **Supabase** | Postgres + Auth + Storage |
| Security | **Row-Level Security** on all user tables; **SQL views** project only safe columns to anonymous visitors (PII never leaves the DB) | see `supabase/migrations/` |
| Hosting | Vercel | security headers, GA4 |
| Tests | **Vitest** | scoring logic + full-dataset integrity |

### Data model

The credential matrix is a build-time dataset (`src/utils/certificationData.js`)
plus split, lazy-loaded per-credential **citations** (`public/citations/`) and
**justifications** (`public/justifications/`) — keeping ~280KB of prose out of
the client bundle. Site-wide stats are centralized in `src/data/siteStats.json`
so every "143 credentials / 7,000 citations" reference stays in sync.

User data (`user_profiles`, `courses`, `user_credentials`) lives in Supabase
under per-user RLS. Public clinician CVs read through dedicated SQL views
(`public_clinicians`, `public_clinician_credentials`) that expose only
non-sensitive columns — the architecture's load-bearing privacy decision.

## Project layout

```
src/
  app/                 Next App Router routes (marketing, credentials, states,
                       clinicians/[handle], the authenticated (app) group)
  components/          UI, dashboard (matrix, credential detail), layout, auth
  views/               Page bodies for authed routes (Explore, Compliance, …)
  hooks/               useSupabaseData (profile/courses/credentials CRUD), …
  utils/               Scoring engine, career-path config, citation/evidence libs
    __tests__/         Vitest suites
  data/                State rules, centralized site stats
public/
  citations/           Per-credential citation JSON (lazy-loaded)
  justifications/       Per-credential, per-dimension scoring rationale
supabase/
  migrations/          Schema + RLS + public views (timestamped)
  functions/           parse-certificate edge function (Google Vision OCR)
scripts/               Data pipeline: merge/validate new credentials, split
                       citations, site-stats recompute (schema-guarded)
```

## Running locally

```bash
npm install
# .env.local needs:
#   NEXT_PUBLIC_SUPABASE_URL=...
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
#   NEXT_PUBLIC_GA_ID=...            # optional
npm run dev        # http://localhost:3000
npm test           # Vitest: scoring logic + dataset integrity
npm run build      # production build (SSG + dynamic routes)
```

CI (`.github/workflows/ci.yml`) runs the test suite and a production build on
every push and PR to `main`.

## Testing

`npm test` covers the product's core logic and data:

- **Scoring engine** — weighted-sum correctness, tier boundaries, and the
  weight-redistribution invariant (sliders always sum to 100).
- **Career-path config** — every lens has six dimensions and default weights
  summing to 100.
- **Dataset integrity** — all 143 credentials validated: canonical dimension
  keys only, scores in 0–100, unique names, and a matching citation slug for
  each. This catches the exact class of bug that silently corrupts a score if a
  credential ships with a wrong dimension key.
- **Evidence formatting** — long summaries split into paragraphs without ever
  breaking mid-sentence or losing content.

## Notable engineering decisions

- **Per-lens scoring** instead of one universal rubric — the model that makes
  the product honest across career paths.
- **PII-safe public projection via SQL views** — public profiles never expose
  renewal dates or email, even though they share a table with that data.
- **Schema-guarded data pipeline** — new credentials (often researched via
  multi-agent workflows) are validated against the canonical dimension schema
  at merge time; malformed records are rejected with a nonzero exit.
- **Bundle discipline** — citations and justifications are split out and
  lazy-loaded; only scores + metadata ship to the client.

## Status

Actively developed MVP. Roadmap: clinician directory (patient-side discovery),
credential verification layer, and transactional renewal-reminder emails.

## License

Copyright © 2026 Daniel J. Green. All rights reserved. CE Shield is a commercial
product; the source is public for review purposes only.
