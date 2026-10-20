// Atlas tokens, plum edition (2026-10-20). The product now shares the stage of
// its portfolio presentation: a dark plum ground lit by one warm light, ink
// stepped by tone, peach as the single interactive and "strong" voice, lilac
// as its quieter second, ochre as the only warning. One typeface (Figtree),
// light display weights, hairline rules.

export const A = {
  paper: '#292331',
  band: '#302838',
  notice: '#3A3043',
  ink: '#F6EEE9',
  inkBody: '#D5C9D9',
  inkMuted: '#A998AE',
  ruleMinor: '#4A4055',
  ruleFaint: '#3D3447',
  ruleFaintest: '#352D3E',
  accent: '#F0C3A8',
  accentHover: '#FDE3D3',
  accentMid: '#C7B6DC',
  accentTint: '#43384C',
  warn: '#E0A85A',
  dim: '#7D6E83',
  onAccent: '#2A2230',
};

// Font stacks. Instrument Sans = display (headings, big numerals, score
// chips); Figtree = body, UI, labels, all tabular numerals.
export const INS = "'Figtree', ui-sans-serif, system-ui, sans-serif";
export const FIG = "'Figtree', ui-sans-serif, system-ui, sans-serif";

// Evidence-tier scale — the only place color encodes data.
// ≥70 STRONG petrol · 50–69 GOOD mid-petrol · 30–49 MODERATE ochre · <30 LIMITED stone.
export const tierColor = (score) =>
  score >= 70 ? A.accent : score >= 50 ? A.accentMid : score >= 30 ? A.warn : A.dim;

export const tierLabel = (score) =>
  score >= 70 ? 'Strong' : score >= 50 ? 'Good' : score >= 30 ? 'Moderate' : 'Limited';

// Quiet label style. Sentence case, near-normal tracking — the heavy
// uppercase-tracked "eyebrow" treatment read as template/AI design and was
// deliberately retired (2026-08-25). Hierarchy comes from size, weight, and
// the ink rules, not from letterspacing.
export const eyebrow = (size = 12.5, tracking = '0.02em') => ({
  fontFamily: FIG,
  fontSize: size,
  letterSpacing: tracking,
  color: A.inkMuted,
  fontWeight: 600,
});

// Section-head label with the 2px ink top rule (the "Notes column" motif).
export const ruledHead = {
  fontFamily: FIG,
  fontSize: 12.5,
  letterSpacing: '0.02em',
  fontWeight: 600,
  color: A.inkMuted,
  borderTop: `2px solid ${A.ink}`,
  paddingTop: 10,
};

export const tabularNums = { fontVariantNumeric: 'tabular-nums' };

// pages additions ──────────────────────────────────────────────────────────
// Plum language for the dossiers, method, states, about, CV, auth and the
// signed-in app. Hairlines are light at 10 to 17%, panels carry a 6px radius
// and a faint lighter fill, display type is light with tight tracking, and
// eyebrows are small uppercase peach with wide tracking.

export const LINE = 'rgba(255,255,255,0.10)';
export const LINE2 = 'rgba(255,255,255,0.17)';
export const LINE_FAINT = 'rgba(255,255,255,0.06)';
export const PANEL_FILL = 'rgba(255,255,255,0.03)';
export const RADIUS = 6;
export const EASE = 'cubic-bezier(.2,.7,.2,1)';

// Validated dark chart palette (dataviz validator, 3 slots on #2b2434).
// Categorical only: tier color stays tierColor() and always prints its word.
export const VIZ = {
  c1: '#cf6f4f',
  c2: '#8f78e6',
  c3: '#2fa894',
  track: 'rgba(255,255,255,0.07)',
  grid: 'rgba(255,255,255,0.08)',
};

export const panel = {
  background: PANEL_FILL,
  border: `1px solid ${LINE}`,
  borderRadius: RADIUS,
};

// Small uppercase peach eyebrow with wide tracking.
export const kicker = (size = 10.5, color = A.accent) => ({
  fontFamily: FIG,
  fontSize: size,
  fontWeight: 600,
  letterSpacing: '0.17em',
  textTransform: 'uppercase',
  color,
});

// Quieter uppercase label for table heads and panel captions.
export const capLabel = (size = 10.5) => ({
  fontFamily: FIG,
  fontSize: size,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: A.inkMuted,
});

// Section head: peach eyebrow over a hairline (replaces ruledHead's 2px ink).
export const hairHead = {
  ...kicker(),
  borderTop: `1px solid ${LINE}`,
  paddingTop: 16,
};

// Display type: light weight, tight negative tracking. Pair with an <em>
// second clause styled by `lilacEm`.
export const display = (size, weight = 370) => ({
  fontFamily: FIG,
  fontSize: size,
  fontWeight: weight,
  letterSpacing: '-0.04em',
  lineHeight: 1.04,
  textWrap: 'balance',
  color: A.ink,
  margin: 0,
});

export const lilacEm = { fontStyle: 'normal', color: A.accentMid };

// Panel title (portfolio .panel h3) and big numeral (portfolio .kpi).
export const panelTitle = { fontFamily: FIG, fontSize: 12, fontWeight: 600, letterSpacing: '0.02em', color: A.inkBody };
export const kpi = (size = 30) => ({
  fontFamily: FIG,
  fontSize: size,
  fontWeight: 380,
  letterSpacing: '-0.04em',
  lineHeight: 1.1,
  fontVariantNumeric: 'tabular-nums',
  color: A.ink,
});

// Tier color for TEXT. The Limited tier's stone (#7D6E83) is a mark color and
// falls under AA for small text on the plum ground, so tier words use muted
// ink there instead. Marks (dots, bars) keep tierColor().
export const tierTextColor = (score) => (score < 30 ? A.inkMuted : tierColor(score));
