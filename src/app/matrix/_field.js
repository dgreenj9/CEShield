// Pure helpers for the field dashboard. No React, no DOM: the scoring itself
// stays in utils/certScoring (computeScore, rankCertifications); these only
// shape weights, evidence metadata and chart geometry around it.

import { certifications } from '@/utils/certificationData';
import { getLibraryMetaForCertification, getEvidenceMix } from '@/utils/citationsLibrary';

// Sliders hold raw values; the composite always uses shares that sum to 100,
// so computeScore (which divides by 100) sees a proper weighting.
export const normalizeWeights = (w) => {
  const keys = Object.keys(w || {});
  const sum = keys.reduce((a, k) => a + (w[k] || 0), 0);
  if (!keys.length) return {};
  if (!sum) return Object.fromEntries(keys.map((k) => [k, 100 / keys.length]));
  return Object.fromEntries(keys.map((k) => [k, ((w[k] || 0) / sum) * 100]));
};

export const sharesOf = (w) => {
  const n = normalizeWeights(w);
  return Object.fromEntries(Object.entries(n).map(([k, v]) => [k, Math.round(v)]));
};

export const sameWeights = (a, b) =>
  Object.keys(b || {}).every((k) => (a?.[k] || 0) === b[k]);

// Strong evidence = randomized trials, systematic reviews, meta-analyses.
const STRONG = ['meta_analysis', 'systematic_review', 'rct'];

// Per-credential library facts, computed once.
export const LIBRARY = Object.fromEntries(
  certifications.map((c) => {
    const meta = getLibraryMetaForCertification(c.name);
    const mix = getEvidenceMix(c.name);
    const strong = STRONG.reduce((a, k) => a + (mix[k] || 0), 0);
    return [c.name, {
      count: meta.count || 0,
      slug: meta.slug,
      source: meta.source,
      lastReviewed: meta.last_reviewed,
      mix,
      strong,
      strongShare: meta.count ? Math.round((strong / meta.count) * 100) : 0,
    }];
  }),
);

export const disciplinesOf = (c) =>
  (c.disciplines && c.disciplines.length ? c.disciplines : String(c.discipline || '').split('/'))
    .map((d) => d.trim())
    .filter(Boolean);

// The disciplines worth a chip: the most common across the library.
export const TOP_DISCIPLINES = (() => {
  const counts = {};
  certifications.forEach((c) => disciplinesOf(c).forEach((d) => { counts[d] = (counts[d] || 0) + 1; }));
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 9).map(([d]) => d);
})();

// Tier bands, low to high, with their words. Colors come from theme.tierColor.
export const TIERS = [
  { key: 'limited', label: 'Limited', lo: 0, hi: 30 },
  { key: 'moderate', label: 'Moderate', lo: 30, hi: 50 },
  { key: 'good', label: 'Good', lo: 50, hi: 70 },
  { key: 'strong', label: 'Strong', lo: 70, hi: 101 },
];

// Score domain snapped to tens.
export const domainOf = (vals) => {
  if (!vals.length) return [0, 100];
  const lo = Math.floor(Math.min(...vals) / 10) * 10;
  let hi = Math.min(100, Math.ceil(Math.max(...vals) / 10) * 10);
  if (hi <= lo) hi = lo + 10;
  return [lo, hi];
};

// Greedy beeswarm: place each value at its x, then step outward in y until
// it clears every placed dot. items: [{ id, v }] -> { id: { x, y } }.
export const beeswarm = (items, x0, x1, cy, r, lo, hi, maxOff = Infinity) => {
  const gap = r * 2 + 1.6;
  const placed = [];
  const out = {};
  [...items].sort((a, b) => a.v - b.v).forEach((it) => {
    const x = x0 + ((it.v - lo) / (hi - lo)) * (x1 - x0);
    let off = 0;
    let k = 0;
    for (;;) {
      const y = cy + off;
      const near = placed.some((p) => Math.abs(p.x - x) < gap && Math.abs(p.y - y) < gap);
      if (!near || Math.abs(off) > maxOff) { placed.push({ x, y }); out[it.id] = { x, y }; break; }
      k += 1;
      off = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * gap * 0.92;
    }
  });
  return out;
};

export const shorten = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
