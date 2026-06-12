# Decision: Next.js migration

**Status:** Proposed, awaiting go/no-go
**Date:** 2026-06-05
**Stakeholders:** Daniel (project owner)

## Context

CE Shield runs on Create React App (CRA) today. The original code review
flagged CRA as unmaintained and recommended moving to Next.js (App Router) so
the multi-state SEO landing pages could be statically generated and indexed by
Google. That recommendation has been on the roadmap since the first review
pass; this document forces a decision.

## What works today on CRA

- Master-detail matrix with lazy-loaded per-cert JSON (≤100KB initial bundle for marketing visitors)
- Custom pathname router with `useSearchParam` for deep links (`/explore?cert=…`)
- Lazy-loaded routes via `React.lazy` + Suspense
- Per-cert citation files served as static JSON from `/public/citations/`
- OCR via Supabase Edge Function (`parse-certificate`)
- All 7 public + in-app routes work, all build cleanly, no known critical bugs

## What CRA can't do (that we want)

1. **Static generation (SSG) of dynamic per-state pages.** When the multi-state
   engine reaches 50 states × 5 professions, we want 250 evergreen SEO landing
   pages (`/states/illinois-pt-ce-requirements`, etc.) indexed by Google. CRA
   builds a single SPA; Google indexes it, but the content is hydrated
   client-side and ranks worse than SSG'd HTML.
2. **Per-route metadata.** Each state page needs its own `<title>`, `<meta description>`, OG image. CRA has one shared `<head>`.
3. **Server Components.** Could push the matrix data loading server-side and
   shrink the client bundle further.
4. **Image optimization.** When we get designed OG images / hero illustrations,
   `next/image` handles responsive sizing, format conversion, lazy loading.
5. **No more CRA maintenance debt.** CRA is unmaintained; React 19 peer deps
   already cause friction. This will only get worse.

## Cost of migrating

**Time:** roughly 1 week of focused work, broken into:

- **5a — Foundation (1-2 days):** Set up Next 14 App Router project,
  port Tailwind config + design tokens, port public marketing routes
  (`/`, `/methodology`, `/about`, `/career-paths`) as server components,
  port the favicon/manifest/OG, smoke-test SEO with Google Rich Results test.

- **5b — App routes (2-3 days):** Port `/explore`, `/compliance`, `/courses`, `/profile`. The router migration is mostly mechanical:
  - `useSearchParam` → `useSearchParams` from `next/navigation`
  - `usePath` → `usePathname`
  - `Link` (ours) → `next/link`
  - `navigate(path)` → `useRouter().push(path)`
  - Lazy boundaries removed (Next handles automatically)
  Authenticated state via `<UserDataProvider>` carries over unchanged.

- **5c — SSG state pages (1-2 days):** Build the `app/states/[state]-[license]/page.tsx` dynamic route, `generateStaticParams` over `SUPPORTED_STATES` × `SUPPORTED_LICENSE_TYPES`, render a real landing page per combo using the existing `stateRules` data.

**Code that needs rewriting:**
- `src/router.js` (75 lines) — replaced by Next's router
- `src/App.js` (route table) — replaced by `app/` directory layout
- All `<a href="/foo">` for internal links → `<Link href="/foo">`

**Code that ports unchanged:**
- All `components/ui/*` primitives
- All `components/dashboard/*` (Matrix, ListItem, Detail, HowToPanel, Sparkline)
- All `pages/*Page.jsx` (rename to `page.jsx` under `app/` directories)
- `useSupabaseData`, `useCertFilters`, `useCountUp`, `userPreferences`
- All `utils/*`
- All `services/*`
- Tailwind config + global CSS
- `data/citations_meta.json` + `public/citations/*`

**Risk:** Low. The architecture is already React + lazy routes + Tailwind +
context — Next is the natural home for that. Biggest risk is auth: Supabase
client-side auth works fine in Next client components; we just have to mark
auth-touching components with `"use client"`.

## Cost of NOT migrating

The multi-state SEO play (one of the original strategic moves) only pays off
if Google indexes the per-state pages well. Without SSG, the 250 evergreen
landing pages render as a JS shell on first paint and get downranked vs.
competitors with static HTML. We can do `react-snap` or similar for static
prerendering on CRA, but it's a brittle workaround compared to Next's
first-class story.

If the SEO play is *not* a near-term bet, this migration is premature
optimization.

## Alternatives considered

1. **Stay on CRA + `react-snap` for prerendering.** Works for the small static
   surfaces (landing, methodology, about, career-paths) but doesn't scale to
   the per-state dynamic routes. Adds a Puppeteer dependency in the build.
   **Reject:** doesn't unlock the state SEO play, which is the whole point.

2. **Stay on CRA + Next.js marketing site only.** Build a separate Next
   project for marketing + per-state pages; keep CRA for the app. Deploy two
   builds, route `/app/*` to CRA. **Reject:** operational complexity
   (two deploys, two domains or reverse-proxy), divergent design systems
   over time.

3. **Migrate to Vite (not Next).** Modernizes the toolchain but doesn't help
   with SSG. **Reject:** doesn't address the actual reason we're considering
   moving.

4. **Full Next.js App Router migration.** Recommended.

## Recommendation

**Phase the Next.js migration over 1 week.** Phase 5a alone (1-2 days,
marketing routes) ships value: faster first paint on the marketing surfaces
and SEO-ready meta tags. Phase 5b is mechanical. Phase 5c is the SEO payoff.

I will not start without explicit go-ahead because:
- The migration touches every component file (mostly to add `'use client'`)
- Auth flows need careful testing in dev + production builds
- The Vercel deployment pipeline needs to change
- ~1 week of focused work is a real commitment

## Decision required

Tell me:
1. **Go** — start Phase 5a today, finish by end of week
2. **Defer** — keep CRA, revisit when the multi-state engine is built out further
3. **Partial** — Vite migration only (modernize toolchain, defer SSG until later)

If "Go", confirm:
- Target deploy: Vercel (we already use it)
- TypeScript: stay JavaScript-only OR adopt TS for new code (Next defaults to TS; either works)
- Tailwind: keep current config

## Out of scope for this decision

- Component library replacement (we keep `components/ui/*`)
- Design system changes (we keep current tokens)
- Data layer changes (Supabase stays)
- Authentication provider (Supabase stays)
