// Atlas design tokens — JS mirror of the `atlas` palette in
// tailwind.config.js, for the inline-styled Atlas surfaces.
//
// Art direction in one paragraph: the product presents itself as a published
// survey, not an app. Structure is drawn with 1px ink rules, never shadows or
// rounded cards — border-radius is 0 everywhere on Atlas surfaces. One accent
// (petrol) carries every interactive and "strong evidence" signal; ochre is
// the single warning/median voice.

export const A = {
  paper: '#FAFAF5',
  band: '#F2F1E9',
  notice: '#F6F3E7',
  ink: '#1B1A17',
  inkBody: '#45433C',
  inkMuted: '#56544C',
  ruleMinor: '#D5D3C6',
  ruleFaint: '#E4E2D6',
  ruleFaintest: '#EEECDF',
  accent: '#235E6B',
  accentHover: '#17434E',
  accentMid: '#4E7E8B',
  accentTint: '#D9E4E6',
  warn: '#C77B2E',
  dim: '#B9B4A6',
  onAccent: '#FAFAF5',
};

// Font stacks. Instrument Sans = display (headings, big numerals, score
// chips); Figtree = body, UI, labels, all tabular numerals.
export const INS = "'Instrument Sans', ui-sans-serif, system-ui, sans-serif";
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
