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
