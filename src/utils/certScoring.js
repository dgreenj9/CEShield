// Scoring + filtering for the certifications matrix. Per-path model:
// a certification has zero or more `pathScores` blocks; ranking only
// considers certs that have a block for the active lens.

import { PATHS, PATH_DIMENSIONS } from './careerPaths';

export const computeScore = (subScores, weights) => {
  if (!subScores || !weights) return 0;
  let total = 0;
  for (const key of Object.keys(weights)) {
    total += (subScores[key] || 0) * (weights[key] / 100);
  }
  return Math.round(total * 10) / 10;
};

export const scoreTier = (score) => {
  if (score >= 70) return 'strong';
  if (score >= 50) return 'good';
  if (score >= 30) return 'moderate';
  return 'limited';
};

// Tier chip styling on the plum ground: tier color text on a faint tint with
// a hairline border in the same hue. Mirrors tierColor() in atlas/theme.js;
// pair the chip with its tier word wherever it renders.
const chip = (color, rgb) => ({
  gradient: { background: `rgba(${rgb},0.10)`, color, border: `1px solid rgba(${rgb},0.45)`, borderRadius: 999, fontVariantNumeric: 'tabular-nums' },
  border: color,
});
const STYLE_BY_TIER = {
  strong:   chip('#E2C48F', '226,196,143'),
  good:     chip('#9CD1C6', '156,209,198'),
  moderate: chip('#E08E6D', '224,142,109'),
  limited:  chip('#8EA5A0', '142,165,160'),
};
export const getScoreStyle  = (score) => STYLE_BY_TIER[scoreTier(score)].gradient;
export const getBorderColor = (score) => STYLE_BY_TIER[scoreTier(score)].border;

// Weight redistribution: when one slider moves, distribute the remainder
// across the other dimensions proportionally so the total stays at 100.
export const redistributeWeights = (weights, changedKey, newValue) => {
  const clamped = Math.max(0, Math.min(100, newValue));
  const otherKeys = Object.keys(weights).filter((k) => k !== changedKey);
  const remaining = 100 - clamped;
  const currentOtherTotal = otherKeys.reduce((s, k) => s + weights[k], 0);

  const next = { ...weights, [changedKey]: clamped };
  if (currentOtherTotal === 0) {
    const share = remaining / otherKeys.length;
    otherKeys.forEach((k) => { next[k] = Math.round(share); });
  } else {
    let distributed = 0;
    otherKeys.forEach((k, idx) => {
      if (idx === otherKeys.length - 1) {
        next[k] = remaining - distributed;
      } else {
        const share = Math.round((weights[k] / currentOtherTotal) * remaining);
        next[k] = share;
        distributed += share;
      }
    });
  }
  const sum = Object.values(next).reduce((s, v) => s + v, 0);
  if (sum !== 100 && otherKeys.length > 0) {
    next[otherKeys[0]] += 100 - sum;
  }
  return next;
};

// Pull the cert's score block for the given path. Returns null if the cert
// isn't applicable to this path — the caller then filters it out.
export const certScoresForPath = (cert, pathKey) =>
  cert?.pathScores?.[pathKey] || null;

// Rank a list of certs under a specific path lens. Certs without a scoring
// block for that path are excluded entirely.
export const rankCertifications = (certifications, weights, pathKey) => {
  const scored = certifications
    .map((cert) => {
      const subScores = certScoresForPath(cert, pathKey);
      if (!subScores) return null;
      return { ...cert, subScores, computedScore: computeScore(subScores, weights) };
    })
    .filter(Boolean);
  scored.sort((a, b) => b.computedScore - a.computedScore);
  return scored.map((cert, i) => ({ ...cert, rank: i + 1 }));
};

export const filterRankedCerts = (ranked, { tier, discipline, type, searchTerm }) => {
  let out = ranked;
  if (tier === 'strong') out = out.filter((c) => c.computedScore >= 70);
  else if (tier === 'good') out = out.filter((c) => c.computedScore >= 50 && c.computedScore < 70);
  else if (tier === 'moderate') out = out.filter((c) => c.computedScore >= 30 && c.computedScore < 50);
  else if (tier === 'limited') out = out.filter((c) => c.computedScore < 30);

  if (discipline && discipline !== 'All') {
    out = out.filter((c) => c.disciplines && c.disciplines.includes(discipline));
  }
  if (type && type !== 'All') {
    out = out.filter((c) => c.type === type);
  }
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    out = out.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.discipline || '').toLowerCase().includes(term) ||
        (c.evidence || '').toLowerCase().includes(term),
    );
  }
  return out;
};

export const tierCountsFor = (ranked, discipline) => {
  const scoped =
    discipline && discipline !== 'All'
      ? ranked.filter((c) => c.disciplines && c.disciplines.includes(discipline))
      : ranked;
  return {
    all: scoped.length,
    strong: scoped.filter((c) => c.computedScore >= 70).length,
    good: scoped.filter((c) => c.computedScore >= 50 && c.computedScore < 70).length,
    moderate: scoped.filter((c) => c.computedScore >= 30 && c.computedScore < 50).length,
    limited: scoped.filter((c) => c.computedScore < 30).length,
  };
};

// Lookup helpers used by UI components.
export const dimensionLabel = (pathKey, dimKey) =>
  PATH_DIMENSIONS[pathKey]?.[dimKey]?.label || dimKey;

export const dimensionDescription = (pathKey, dimKey) =>
  PATH_DIMENSIONS[pathKey]?.[dimKey]?.description || '';

export const pathLabel = (pathKey) => PATHS[pathKey]?.label || pathKey;
