# CE Shield — Product Redesign Handoff

**For:** Claude Design product redesign
**Repo:** `~/il-ce-tracker` · Live at [ceshield.com](https://www.ceshield.com)
**Stack:** Next.js 16 (App Router) · React 19 · Tailwind v4 · Supabase (Postgres + Auth + Storage) · Vercel
**Prepared:** 2026-08-08, from a full audit of the codebase (all routes, all components, data model, tokens)

---

## 1. What CE Shield is

**Career intelligence + CE-compliance for rehabilitation clinicians (PTs and OTs).**

The product answers a question the profession never made easy: *which credential is actually worth my time and money?* It does three jobs, layered:

1. **The credential matrix** — 143 rehab credentials scored 0–100 across five career-path lenses, backed by ~7,000 curated citations. Users pick a lens, tune six weight sliders (always sum to 100), and rankings re-sort live. **This is the core product surface and it is deliberately ungated** — visitors reach the tool before ever being asked to sign up.
2. **State CE-compliance tracking** — per-state rule sets (total hours, mandatory categories, format caps), course logging with certificate upload + OCR autofill, renewal countdown, audit-ready exports (HTML report + certificates ZIP).
3. **The Living Rehab CV** — clinicians claim credentials from the matrix (earned / in progress / planned), add bio/specialties/experience, and opt into a public shareable CV at `/clinicians/<handle>`. This is the wedge toward the endgame: a two-sided marketplace where patients discover credentialed clinicians.

### Brand thesis
"Honest by construction." Independent scoring — no money from certification programs, ever. The design language is built to signal *editorial rigor*: paper-warm background, a journal-style display serif, tabular numerals everywhere, published methodology with limitations and COI stated in public. The product should feel like a peer-reviewed journal crossed with a well-made instrument, **not** a SaaS template.

### Hard constraints the redesign must not violate
- **No display ads, ever.** Stated publicly; conflicts with the independent-scoring moat.
- **Credential scores are never sponsored.** Referral/affiliate links may appear on CE *course* listings only — never on any credential-score surface. (Coded as a contract in `CourseRecommendations.jsx`; sponsored links carry `rel="sponsored"` + a visible "Referral link" label + section-level disclosure.)
- **Free for students, always** — promised on landing, auth form, and /about.
- **Public CV privacy promise:** publishes name, headline, bio, specialties, license type & number, state, credentials. **Renewal date and email are never shown.** (Enforced via SQL views, not client filtering.)
- Free during beta. Future monetization (stated on /about): premium tracking tier, B2B clinic/team plans, disclosed course referrals.

### Users
- **Primary:** licensed PTs/OTs (IL verified; WI/NC in draft/beta) making credential decisions and tracking CE for license renewal.
- **Secondary:** PT/OT students (free forever), clinic owners (future B2B), and eventually patients browsing public clinician CVs.

---

## 2. Information architecture

Two surfaces, one brand:

### A. Public marketing + SEO surface (no auth, `PublicNav` shell)
| Route | Purpose | Notes |
|---|---|---|
| `/` | Landing | Hand-rolled nav + dark footer (not PublicNav) |
| `/matrix` | **The full scoring tool, ungated** | Primary conversion surface; identical widget to `/explore` |
| `/credentials` | Library index — search + facet filters | Polished sticky toolbar, `/` keyboard shortcut |
| `/credentials/[slug]` | 143 SSG evidence dossiers | The SEO backbone; JSON-LD; per-lens tabs |
| `/career-paths` | The five lenses, tabbed | Build-time top-4 picks per lens |
| `/methodology` | Long-form scoring doc | Sticky scroll-spy TOC; COI + limitations |
| `/about` | Company / independence / business model | Narrow 780px editorial column |
| `/states`, `/states/[slug]` | CE-rule directory + per-(state × license) pages | `/states` is orphaned from primary nav |
| `/clinicians/[handle]` | Opt-in public clinician CV | force-dynamic, reads anon SQL views |
| `/sign-in`, `/update-password` | Auth | Own gradient shell, square-cornered cards |
| `/not-found`, `/error` | Fallbacks | 404 is well-designed recovery; /error is unbranded |

### B. Authenticated app (`(app)` route group, `AppShell` + `SideNav`)
| Route | Purpose |
|---|---|
| `/explore` | Post-login landing = matrix + renewal banner (no personal dashboard) |
| `/compliance` | Hours vs. requirements, mandatory categories, format caps, exports |
| `/courses` | CE course log table + CRUD + certificate upload/OCR |
| `/profile` | Living CV editor + licensing config + public-handle controls |

**Nav structures:**
- `PublicNav`: Matrix · Credentials · Career Paths · Methodology · About + "Sign in" CTA. Secondary links hide ≤640px.
- `SideNav` (240px sticky rail, desktop): Explore / Compliance / Courses / Profile, then an "About CE Shield" section (Career paths / Methodology / About), a compliance-health pill (Complete / On pace / Behind), and a user footer with sign-out. **Mobile collapses to an icon-only top bar that drops the info links, health pill, and sign-out entirely.**
- `LogoLink` is auth-aware: `/` signed out, `/explore` signed in.

**The strategic IA fact:** "Get Started" and "Explore the matrix" route to `/matrix`, not `/sign-in` — see the tool first, convert second. The account only adds the *personal* layer.

---

## 3. Design language today (the tokens)

### Color
| Token | Hex | Role |
|---|---|---|
| `paper.bg` | `#FAFAF6` | Page background — warm off-white ("paper, not template") |
| `paper.card` | `#FFFFFF` | Cards/panels (pure white for contrast) |
| `paper.rule` | `#E8E6DF` | Hairline dividers |
| `gray-bg` | `#f9fafb` | Recessed panels |
| `brand.blue` | `#3b82f6` | Primary actions, links, focus, active nav |
| `brand.blue-strong` | `#2563eb` | Hover/pressed primary |
| `brand.purple` | `#8b5cf6` | Secondary accent (page-level eyebrows, provenance) |
| `brand.light-blue` | `#e0f2fe` | Soft blue fills (active nav, info pills) |
| `brand.evidence` | `#2F6B4D` | Sage — "clinical, considered"; strong-evidence surfaces |
| `brand.evidence-soft` | `#E8EFEA` | Sage fill |
| Ochre (constants only) | `#A87B3F` / dark `#8A6332` | Business lens, moderate tier, "behind" states |
| `ink.dark` / `ink.gray` | `#111827` / `#6b7280` | Body text / muted |
| `slate.dark/medium/light` | `#1e293b` / `#475569` / `#f1f5f9` | Headings / secondary copy / subtle borders |
| Tier scale | strong `#22c55e` · good `#3b82f6` · moderate `#fbbf24` · limited `#94a3b8` | Score-tier semantics (see §5 for the *other* tier palette) |

### Typography — three families, strict roles
- **Inter** — body, 15px base, `tnum + ss01` ON globally (all numerals tabular — the single biggest "we care about data" tell). Scale: 2xs 11px → 5xl 48px.
- **Fraunces** (variable, `opsz 36, SOFT 30`) — `.font-display` for page titles, hero copy, big stat numbers. Journal headline, not SaaS.
- **JetBrains Mono** (`tnum, zero, ss02`) — `.font-mono` for ranks (`01`, `003` zero-padded), weight notation (`×25%`), DOIs, hour counts, eyebrows on public pages.

### The signature motif (repeated app-wide — keep or consciously evolve)
**Uppercase eyebrow** (0.7rem / 600 / tracking .14em / `#6b7280`) + **hairline section-rule** that fades out to the right (`linear-gradient(to right, #E8E6DF 80%, transparent)`) + **serif title**. This repetition is what makes the product feel like one product.

### Surface & motion
- Radius: 4 / 6 / 8 / 12 (cards) / 16 / full (pills). *(Reality is messier — see §7.)*
- Shadows: `card` (whisper), `elev` (hover), `floating` (modals), `focus` (3px blue ring at 25%).
- Motion: `fade-in` 150ms, `slide-up` 200ms (8px), card-hover 150ms, score-bar fills 200ms, skeleton shimmer 1.6s. No springs, no bounces.
- Texture: `.bg-dot-grid` — 1px ink dots on a 22px grid, ~7% opacity, on public-page heroes.
- Gradient text (`135deg #3b82f6→#1e40af→#1e3a8a`) clipped to ≤1 word per hero headline.
- Gradient hairline (2px, blue→purple) as top edge on featured cards.

### Logo (exact construction)
Three overlapping flat-topped shield paths (SVG viewBox `0 0 60 40`), offset 10 units each, back-to-front: light-blue `#e0f2fe` → blue `#3b82f6` @ 0.85 → purple `#8b5cf6` @ 0.85 — the translucent stack reads as a blue→purple gradient. Wordmark: `CE` in Inter **200** (tracked +0.03em) + `Shield` in Inter **700**, no space — weight contrast alone splits the word. **No serif in the wordmark** (tried, rejected as too aggressive). Tagline: "TRACK EDUCATION. PROTECT YOUR LICENSE." uppercase, tracked 1.5px, `#6b7280`.

---

## 4. The domain model (what you're designing for)

### Scoring: no global score exists
A credential only has a score *within a lens*. Five lenses, each with exactly 6 dimensions (0–100), its own default weights summing to 100, an accent color, and an evidence frame:

| Lens | Accent | Frame | Certs scored |
|---|---|---|---|
| Clinical | `#3b82f6` blue | clinical-intervention | 124 |
| Business | `#A87B3F` ochre | mixed | 124 |
| Academic Clinical | `#2F6B4D` sage | clinical-intervention | 124 |
| Research | `#8b5cf6` violet | career-outcome | **13** |
| HealthTech & Industry | `#475569` slate | career-outcome | **22** |

⚠️ Research and HealthTech genuinely have far fewer credentials — those lens views will look sparse. That's real data, not a bug; design for it.

Example dimensions (Clinical): Clinical outcomes 35 · Certification investment 20 · Caseload applicability 15 · Billing & reimbursement 15 · Employer demand 10 · Patient experience 5. Every dimension has a label + one-sentence description (slider labels / tooltips).

**Composite:** weighted sum, 1 decimal. **Tiers:** strong ≥70 (sage) · good 50–69 (blue) · moderate 30–49 (ochre) · limited <30 (slate). **Weight redistribution invariant:** moving one slider proportionally rebalances the other five so the total is always exactly 100 — sliders are not independent controls.

### Evidence
- 143 credentials · ~7,000 citations (3,163 RCT/SR/MA) · per-credential citation + justification JSON lazy-loaded on detail view.
- Evidence types ranked: meta-analysis 6 → systematic review 5 → RCT/guideline 4 → cohort 3 → … → narrative 1. Per-cert `evidence_mix` + `year_dist` (drives the citation sparkline).
- Provenance labels: `LIBRARIAN-REVIEWED` (purple pill, 109 certs) vs workflow-generated (34) vs `LEGACY` (amber pill, "deeper review pending").
- **Honesty mechanic surfaced in UI:** scores mostly reflect evidence for the underlying *intervention*, not the credential itself — stated in methodology and detail footnotes.

### State CE rules
Declarative per-(state, license) rule files. IL-PT (40h/2yr) and IL-OT (24h/2yr) **verified**; WI-PT, WI-OT, NC-PT, NC-OT are **drafts** → amber "Beta state — CE rules are unverified" banner linking the statute. This trust mechanic is designed-in, not an edge case. Rules model: total hours, cycle years, mandatory category minimums (ethics, sexual harassment, cultural competency, implicit bias, dementia…), per-format caps (self-study 30, teaching 20, …), first-renewal exemption.

### Supabase (user data)
- `user_profiles` — name, license type/number, renewal date, state, headline, bio, years_experience, specialties (22-item curated list), handle (3–30 chars `[a-z0-9-]`), is_public, avatar_url. RLS: own-rows only.
- `courses` — title, provider, date, hours, category (6 values matching mandatory keys), format (8 values matching cap keys), has_test, certificate storage pointer (SHA-256'd upload, private bucket, 5-min signed URLs).
- `user_credentials` — cert_name + status (`earned`/`in_progress`/`planned`) + date + notes. **Self-attested; no verification layer yet** (verification is roadmap).
- Public reads go through `public_clinicians` / `public_clinician_credentials` SQL views (excludes email + renewal date). Avatars are a public bucket.
- Preferences (default lens) live in localStorage, not the DB.
- OCR: `parse-certificate` edge function (Google Vision) autofills course fields from an uploaded certificate image.

### Counts to design with
143 credentials · 5 lenses · 30 dimension definitions · 15 disciplines · 12 credential types · 3 states × 2 licenses (2 verified) · 22 specialties · **0 catalog courses** (recommendations UI exists but renders nothing — catalog is empty) · 143 SSG dossier pages.

---

## 5. Everything dynamic (design for change, loading, and emptiness)

**Recomputes live on every slider drag / lens switch:** all composite scores → ranks renumber 1..N; tier chips recolor mid-interaction; tier-filter counts tick; the credential *set* swaps per lens (124 vs 22 vs 13); URL rewrites itself (`?lens=&w=` — shareable deep links); "Custom weights" label appears when weights deviate.

**Recomputes on data/date:** days-until-renewal (red <90 days; amber banner on /explore only within 0–90 days); compliance % (progress bar flips blue→green at 100%); per-category mandatory completion; per-format cap status (ok / amber ≥80% / red "Over limit" ≥100%); sidebar health chip (Complete ≥100% / On pace ≥50% / Behind).

**Lazy/async states needed:** citation lists + justification prose (skeleton shimmer rows; failure currently renders as an empty list); signed certificate URLs (expire in 5 min); OCR scan overlay ("Scanning certificate…"); avatar upload spinner.

**Derived-display facts:** "best lens" badge on CV credentials = argmax across lenses at *default* weights (unaffected by user's custom weights); evidence summaries auto-paragraphize (~300 chars, never mid-sentence → 1–4 paragraphs); sparkline pads missing years with zeros.

---

## 6. Page-by-page anatomy (condensed — key sections + voice)

### `/` Landing
Fixed blur nav → 90vh dot-grid hero (purple pill eyebrow, serif H1, "Explore the matrix" primary CTA, trust line "Free during beta · free for students, always") + desktop-only hardcoded "Top 5 · balanced lens" preview card → animated count-up stat strip (Fraunces numerals) → 4 feature cards with mono numbered eyebrows (`01 · INTELLIGENCE`) and stroke SVG marks → closing CTA band → dark slate footer ("Independent. No sponsor relationships.").
Voice: *"Stop guessing which credential moves your career forward."* · *"One product for the whole career arc."*

### `/matrix` and `/explore` (near-duplicates)
Eyebrow + H1 → dismissible "How to read this" 3-step panel → **CertificationsMatrix**: header + count chip → 5 lens pills (+ save-default-lens microcopy) → collapsible weight panel (6 slider cards that fill with blue as you drag; total pill green at 100) → search → discipline chips (dark-ink active) → tier chips with live counts (blue active) → master–detail split: scrolling ranked list (rank `01`, 2-line-clamped name, evidence pills, tier-colored left rail + score chip) | sticky detail pane (score header reacting live to weights, evidence summary + sparkline, per-dimension bars + justification prose, cross-lens comparison cards, zebra-striped citation list). Mobile: two-screen push flow with back button. `/matrix` appends a "Create a free account" conversion card; `/explore` prepends an amber renewal banner (only within 90 days).
Voice: *"Find the certification worth your next investment"* · *"Pick a lens and tune the weights — the rankings update live."*

### `/credentials` (index)
Sticky toolbar: search with `/`-shortcut chip, DISCIPLINE + LENS facet chips with live counts, "N of M" + Clear all → numbered result rows (mono `003` index, name, type · disciplines, citation count, colored lens dots, chevron).

### `/credentials/[slug]` (143 dossiers — the SEO surface)
2-col hero: identity + evidence narrative | sticky score panel (one row per lens: label, tinted bar, huge mono `{score}/100` — each row deep-links to the matrix) → per-lens breakdown tabs (6 dimension rows: `{label} ×{weight}%`, bar, justification prose) → citation library (typed pills, DOI/PMID, external links) → footer rail. Nav CTA overridden to "Open in matrix →".
Voice: *"Each lens scores different dimensions — not apples-to-apples."*

### `/career-paths`
Hero row + 4-stat mono rail → sticky icon pill tabs (5 paths, each in its accent color, synced to `?path=`) → per-path 3-column panel with colored top stripe: identity + CTAs | dimension weights bars | top-4 picks → "Picking your lens" footnote.
Voice: *"Five paths. Five different questions."* · *"CE Shield refuses to pretend one rubric fits every trajectory."*

### `/methodology`
Sticky scroll-spy TOC (left, Stripe-docs style) + 8 numbered sections: evidence base, dimensions, **two evidence frames** (blue vs sage callout pair), tiers, findings, limitations, COI, authors. The trust engine of the brand. **Zero CTA — dead end.**

### `/about`
Narrow editorial column: "The Rehab Career OS." → 3 hero stats → 4 cards (problem / who built it / *how we make money — and how we don't* / contact) → cross-link pills.
Voice: *"Credential scores are not for sale — full stop."*

### `/states` + `/states/[slug]`
Directory of (state × license) tiles with big mono `{N}h` + "DRAFT — VERIFY BEFORE USE" stamps → per-state page: draft banner, 4-tile stat strip, mandatory categories, caps grid, statutory source card, tracker CTA.

### `/clinicians/[handle]` (public CV)
2-col: sticky identity sidebar (avatar/initials, name, headline, license meta, specialty pills) | About + Credentials grouped by status with best-lens scores, "Pursuing" section, self-reported disclaimer. **No share affordance, no "claim your profile" loop — a viral surface with no viral loop.**

### `/sign-in`, `/update-password`
Centered square-cornered white card on a blue gradient — visually a different product from everything else. Sign-in / sign-up / forgot / check-email states. Update-password is a 4-phase machine (checking → ready/no-session → done).

### App: `/compliance`
PageHeader with days-countdown → up to 3 stacked banners (draft state / first-renewal exemption / IL cultural-competency notice) → 4 stat tiles (Fraunces numerals; first tile gets a gradient top edge) → progress bar card → side-by-side Mandatory requirements (n/n green/red rows) + Category limits (n/limit tiles, amber→red) → exports card (HTML report + certificates ZIP) → footer links.

### App: `/courses`
PageHeader + "Add CE course" → dashed empty state or a date-sorted table (Date · Course · Provider · Category · Hours · Actions; certificate chip; icon-only download/edit/delete) → Add/Edit modal (OCR upload block, 6 fields, self-study test checkbox) + delete confirm.

### App: `/profile`
Two jobs fused on one page: CV sidebar (instant-save avatar, name/headline/years, 22 specialty toggle pills) + Bio + Public-profile card (prefixed `ceshield.com/clinicians/` handle input, live validation, "Make my CV public" with explicit publish disclosure) + Licensing card (state select, PT/OT cards, renewal fields) → single Save bar → CredentialProfile (search-add from 143, status pill selects, best-lens scores).

---

## 7. UX debt & inconsistencies — the redesign target list

### Funnel & IA (highest leverage)
1. **Every public "open the matrix" CTA points at the auth-gated `/explore`** — credential dossier (×3 per page), career-path panels (×5) — while the public `/matrix` exists. `/states/[slug]`'s "See the matrix" points at `/`. The product's biggest funnel leak.
2. **`/matrix` vs `/explore` are near-duplicate pages** — and the signed-in home offers no personal dashboard value (no hours remaining, no next action, no recent activity; the renewal banner only appears within 90 days).
3. **Two filter systems for the same dataset:** `/credentials` has the polished sticky toolbar (counts, `/` shortcut, Clear all); the matrix stacks three unlabeled filter idioms with no result count and no clear-all.
4. Dead ends: `/methodology` and `/about` have zero CTAs; `/states` is orphaned from the primary nav; `/clinicians/[handle]` has no share/claim loop; `/about` promises a contact form that doesn't exist.
5. Auth surfaces are unbranded (square corners, no value prop, no way back) — signing in looks like a different product.
6. Onboarding (`ProfileSetup`) never mentions the matrix — the thing the user came for. Up to **four sequential full-screen spinners** before first paint in the app.
7. Mobile SideNav drops sign-out, the info links, and the compliance health pill. Landing hero card (the only product preview) is desktop-only.

### Visual-system inconsistencies
8. **Two parallel palettes** (`tailwind.config.js` tokens vs `constants.js` inline-hex object, synced by hand) → two visual systems: `ui/*` primitives use Tailwind; the entire dashboard/layout/auth layer is inline-styled with a `cs-*` `!important` mobile shim layer.
9. **Three modal implementations:** `ui/Modal` (portal, focus trap, Esc, a11y — used only by ConfirmDialog) vs legacy `common/Modal` (square, zero a11y — used by the three most-used modals: add course, delete, settings) vs an inline methodology modal (no dialog semantics at all).
10. **Two score-color scales with different thresholds:** `getScoreStyle` tiers at 70/50/30 vs `scoreColor` at 65/40 — the list chip and the cross-lens cards can disagree about the same number.
11. **Two tier palettes:** tailwind `evidence.*` (green `#22c55e` / amber `#fbbf24`) vs the actually-rendered chip palette (sage `#2F6B4D` / ochre `#A87B3F`). The config documents colors the UI doesn't use.
12. **Three "selected chip" treatments in one component** (matrix): lens chips blue-fill, tier chips blue-fill, discipline chips ink-dark-fill; nav uses light-blue fill. License cards use 2px border + fill.
13. **Three numeral treatments for the same stat-tile pattern:** Fraunces (landing, compliance), JetBrains Mono (about, career-paths), plain tabular Inter (states).
14. **Radius chaos:** 0 (auth, legacy modal) / 6 / 8 / 10 / 12 / 999 coexist; count pill at radius 6 sits beside radius-9999 pills in the same header.
15. Casing drift: sentence case on public pages vs Title Case in matrix headings, ProfileSetup, and course modals.
16. Defined-but-unused primitives: `ui/Badge`, `ui/PageSection`, `ui/SectionRule` (its markup copy-pasted inline twice instead), `SettingsModal` (dead code). `PageHeader`'s comment claims a Fraunces H1 but renders Inter.
17. Duplicate eyebrow recipes (`.eyebrow` class vs hand-rolled mono eyebrows vs `PageSection`'s tracking-wider version).

### Interaction & feedback
18. **All error/success feedback in the authenticated app is native `alert()`** — save failures, handle collisions, upload rejections, ZIP results, OCR errors. Only data-load failure has a designed banner. No toast/inline-error system exists.
19. Course table has no search, sort, filter, pagination, or totals row — degrades past ~30 rows. No drill-down from a mandatory category to the courses satisfying it.
20. `/profile` fuses public CV work and private compliance config under one Save button; the avatar saves instantly while everything else waits for Save; no unsaved-changes guard.
21. Add-course modal isn't a `<form>` (Enter doesn't submit); labels aren't associated with inputs in auth/setup/course forms; AuthForm errors lack `role="alert"`; matrix search has no accessible name; discipline/tier chips lack `aria-pressed`; compliance health dot is color-only. (Full a11y inventory in §10 of the component report — `ui/*` primitives are solid; the inline-styled layer is where the gaps live.)
22. Contradiction to resolve at product level: the profile disclosure says license number **is** published on the public CV, while a code comment claims it never leaves the DB. Current behavior: it is published (intentional, for board verification).

---

## 8. Component inventory (what exists to redesign)

**Tailwind primitives (`src/components/ui/`)** — Button (primary/secondary/ghost/danger × sm/md/lg), Badge (10 variants, unused), Card (+Header/Title; bordered/hoverable; none/sm/md/lg padding), Input (label + help + error wiring, `useId` a11y), Modal (5 sizes, full dialog a11y) + ModalFooter, ConfirmDialog, EmptyState (plain/dashed), PageHeader (eyebrow/icon/title/subtitle/actions + closing section-rule), PageSection, SectionRule.

**Product surface (`src/components/dashboard/`)** — CertificationsMatrix (727 lines; lens pills, weight-slider cards, search, chips, master–detail); CertificationListItem (memoized row: zero-padded rank, tier left-rail, evidence pills, score chip); CertificationDetail (592 lines; live score header, sparkline, dimension bars + prose, cross-lens cards, zebra citations with skeletons); CitationSparkline (SVG area, gradient fill, end-dot, aria-hidden); CourseRecommendations (sponsored-link contract); CredentialProfile (search-add, status-pill selects, snapshot stats); MatrixHowToPanel (dismissible 3-step, localStorage).

**Chrome** — AppShell (skip link, loading/error states), SideNav (desktop rail + mobile icon bar + health pill), PublicNav (sticky option, CTA slot), CEShieldLogo (3-shield SVG + weight-contrast wordmark, 4 sizes), LogoLink (auth-aware).

**Auth/forms** — AuthForm (4 states), ProfileSetup (progressive disclosure), AddCourseModal (OCR overlay), DeleteConfirmationModal, SettingsModal (dead).

Score chip spec (the product's core visual): white bg, tier-colored text, 1px tier border + 1px inset tint ring, tabular numerals. Progress bars: 4px rail `#f1f5f9`, radius 999, colored fill, 200ms width transition.

---

## 9. Redesign priorities (recommended focus order)

1. **One design system.** Collapse the dual palette + inline styles into a single token layer; one modal, one confirm, one eyebrow, one card recipe, one selected-chip treatment, one numeral treatment, one score-color scale. The tokens in §3 are good — the problem is enforcement, not taste.
2. **Fix the funnel.** All public matrix CTAs → `/matrix`; merge or differentiate `/matrix` vs `/explore` (make `/explore` an actual personal dashboard: hours remaining, deadline, next action, recent courses, credential-profile nudge); brand the auth surface; put the matrix into onboarding.
3. **A feedback system.** Replace every `alert()` with designed inline errors/toasts; design failure and empty states for citations, OCR, uploads.
4. **Mobile as a first-class citizen.** Real mobile nav (with sign-out), mobile hero/product preview, matrix mobile flow polish.
5. **The viral loop.** Share/copy affordances + "claim your profile" CTA on public CVs; add `/clinicians` index (currently 404s — no directory page exists); sitemap inclusion.
6. **Compliance as the retention engine.** Renewal-email lifecycle is the highest-leverage unbuilt feature (90/60/30-day); design the email + in-app deadline surfaces together. Category → courses drill-down.
7. **Keep the trust furniture.** Draft-state banners, COI statements, LIBRARIAN-REVIEWED provenance, "not apples-to-apples" footnotes, sponsored-link disclosures — these are brand assets. Systematize (one banner recipe, one phrasing) rather than remove.

---

## 10. Where things live (for pulling real content into designs)

| What | Where |
|---|---|
| Tokens | `tailwind.config.js`, `src/utils/constants.js`, `src/index.css` |
| Credential dataset | `src/utils/certificationData.js` (+ `public/citations/`, `public/justifications/`) |
| Lenses/weights/colors | `src/utils/careerPaths.js` |
| Scoring + tiers + chip styles | `src/utils/certScoring.js` |
| State rules | `src/data/stateRules/` |
| Site-wide stats | `src/data/siteStats.json` |
| Copy: methodology | `src/app/methodology/page.jsx` |
| Copy: landing | `src/views/LandingPage.jsx` |
| Logo | `src/components/common/CEShieldLogo.jsx` |
| DB schema | `supabase/migrations/` |
| This handoff + design-system cards | `docs/design-handoff/` |
