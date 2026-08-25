# Atlas — the CE Shield design system

The product presents itself as a **published survey**, not a SaaS app.
Structure is drawn with 1px ink rules, never with shadows or rounded cards.
One accent carries every interactive and "strong evidence" signal; ochre is
the single warning voice. Copy is terse and sentence-case.

This is the source of truth for every surface. Tokens live in
`tailwind.config.js` (`atlas.*`) and `src/components/atlas/theme.js` (JS
mirror for inline-styled components).

## Tokens

| Token | Hex | Use |
|---|---|---|
| `paper` | `#FAFAF5` | Page + panel background |
| `band` | `#F2F1E9` | Alternating section bands, active row fill, drawers |
| `notice` | `#F6F3E7` | Dashed notice strips |
| `ink` | `#1B1A17` | Primary text, structural 1px rules, nav border |
| `ink-body` | `#45433C` | Body copy |
| `ink-muted` | `#56544C` | Labels, secondary meta |
| `rule-minor` | `#D5D3C6` | Secondary dividers |
| `rule-faint` | `#E4E2D6` | List-item dividers, meter tracks |
| `rule-faintest` | `#EEECDF` | Densest table rows |
| `accent` (petrol) | `#235E6B` | All CTAs, active states, links, Strong tier |
| `accent-hover` | `#17434E` | Button hover |
| `accent-mid` | `#4E7E8B` | Good tier |
| `accent-tint` | `#D9E4E6` | `::selection` |
| `warn` (ochre) | `#C77B2E` | Moderate tier, due/overdue, warnings, median |
| `dim` | `#B9B4A6` | Limited tier |
| `on-accent` | `#FAFAF5` | Text on petrol/ochre fills |

**Evidence tiers** (the only place color encodes data): ≥70 Strong petrol ·
50–69 Good mid-petrol · 30–49 Moderate ochre · <30 Limited stone. Always
pair the color with its word — never color alone. Helpers: `tierColor()`,
`tierLabel()` in `atlas/theme.js`.

**No red, no green, no blue, no purple anywhere.** Success = petrol ✓;
error/destructive = ochre.

## Type

Two faces, no serif, no monospace:

- **Instrument Sans 600** (`font-display` / `INS`) — h1/h2/h3, big numerals.
  Tight tracking: −0.045em at hero size, −0.025em at 36–40px, −0.02em small.
- **Figtree** (`font-sans` / `FIG`) — body, UI, labels, all numerals.
  Numeric cells get `.tabular-nums` per element (never globally).

**Register (critical, 2026-08-25 direction):** no uppercase tracked
"eyebrow" labels — they read as template/AI design. Labels are sentence
case, tracking ≤ 0.02em, Figtree 600, `ink-muted`, 11.5–13px. Use
`eyebrow()` / `ruledHead` from `atlas/theme.js`. No em dashes in UI copy —
use `·`, commas, or a new sentence. Acronyms (PT, OT, RCT, DOI, ZIP) keep
their caps.

## Geometry

- `border-radius: 0` everywhere. No `box-shadow` anywhere (dots in the
  beeswarm may carry a petrol halo ring — the one exception).
- Rule hierarchy: `1px solid ink` for structure and panel borders; `2px
  solid ink` under a section-head label (`ruledHead`); `rule-minor` /
  `rule-faint` / `rule-faintest` descending for internal rows.
- Dashed `1px ink` border = notices and empty states (on `notice` bg).
- Content widths: 1200px (landing), 1280px (public pages), 1360px (app),
  `margin: 0 auto; padding: 0 2rem`. Section rhythm ~6rem on marketing
  bands, `2.5rem 2rem 5rem` on app main.
- The ground: `.atlas-ground` (paper + faint 26px drafting grid, heavier
  every 130px) on page wrappers. Opaque panels sit on top of it.

## Components

Shared primitives are already Atlas-styled — use them instead of bespoke
markup: `ui/Button` (primary petrol / secondary ink-border / ghost /
danger-ochre), `ui/Card`, `ui/Badge`, `ui/Input`, `ui/Modal`,
`ui/EmptyState`, `ui/PageHeader`, `atlas/LensTabs`, `atlas/AtlasLogo`,
`components/layout/PublicNav` (public chrome), `AppShell` (signed-in
chrome). Buttons: rectangular; primary = petrol fill; tertiary = text link
with `border-bottom: 2px solid` accent.

- Tabs / chip filters: rectangular buttons, active = petrol (tabs) or ink
  (filter chips) fill with `on-accent` text; `aria-pressed`; active tabs
  prefixed `● `.
- Meters: 4–8px `rule-faint` track, petrol fill, text value always beside.
- Tables: rows separated by faint rules; numeric columns right-aligned
  tabular; a `2px ink` underline below a table's header row.
- Sticky nav: `rgba(250,250,245,0.95)` + `backdrop-filter: blur(8px)`,
  `border-bottom: 1px solid ink`; current section marked with a 2px petrol
  bottom border (public) or petrol fill (app).

## Motion & interaction

- Transitions `0.12–0.3s ease` on color/background/opacity only. No lifts.
- Hover: petrol → `accent-hover`; text links ink → petrol; rows → `band`.
- Honor `prefers-reduced-motion` (render final state).
- Focus: global 2px petrol `focus-visible` outline; inputs take petrol
  border on focus.

## Voice

Terse, declarative, confident. Sentence case everywhere including buttons
and table heads. Numbers are the product — surface real computed values,
never placeholders. Independence claims ("Scores are never sponsored",
"$0") are brand assets; keep them.
