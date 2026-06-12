import { describe, it, expect } from 'vitest';
import {
  computeScore,
  scoreTier,
  redistributeWeights,
  certScoresForPath,
  rankCertifications,
} from '../certScoring';

describe('computeScore', () => {
  it('computes a weighted sum where weights are percentages', () => {
    // 80*0.5 + 60*0.5 = 70
    expect(computeScore({ a: 80, b: 60 }, { a: 50, b: 50 })).toBe(70);
  });

  it('treats missing sub-scores as zero', () => {
    // a=100 weighted 50%, b absent → 50
    expect(computeScore({ a: 100 }, { a: 50, b: 50 })).toBe(50);
  });

  it('returns 0 for null inputs rather than throwing', () => {
    expect(computeScore(null, { a: 100 })).toBe(0);
    expect(computeScore({ a: 100 }, null)).toBe(0);
  });

  it('rounds to one decimal place', () => {
    // 33*0.333... type fractions resolve to a single decimal
    expect(computeScore({ a: 33 }, { a: 33 })).toBeCloseTo(10.9, 1);
  });
});

describe('scoreTier', () => {
  it('maps scores to the right tier at each boundary', () => {
    expect(scoreTier(70)).toBe('strong');
    expect(scoreTier(69.9)).toBe('good');
    expect(scoreTier(50)).toBe('good');
    expect(scoreTier(49)).toBe('moderate');
    expect(scoreTier(30)).toBe('moderate');
    expect(scoreTier(29)).toBe('limited');
    expect(scoreTier(0)).toBe('limited');
  });
});

describe('redistributeWeights', () => {
  const base = { a: 25, b: 25, c: 25, d: 25 };

  it('always keeps the total at exactly 100 (the core matrix invariant)', () => {
    for (const next of [0, 1, 37, 60, 99, 100]) {
      const result = redistributeWeights(base, 'a', next);
      const sum = Object.values(result).reduce((s, v) => s + v, 0);
      expect(sum).toBe(100);
    }
  });

  it('sets the changed key to the requested value', () => {
    expect(redistributeWeights(base, 'a', 40).a).toBe(40);
  });

  it('clamps out-of-range values into [0, 100]', () => {
    expect(redistributeWeights(base, 'a', 150).a).toBe(100);
    expect(redistributeWeights(base, 'a', -20).a).toBe(0);
  });

  it('handles redistribution when the other weights are all zero', () => {
    const result = redistributeWeights({ a: 100, b: 0, c: 0 }, 'a', 40);
    expect(Object.values(result).reduce((s, v) => s + v, 0)).toBe(100);
  });
});

describe('certScoresForPath + rankCertifications', () => {
  const certs = [
    { name: 'Alpha', pathScores: { clinical: { x: 90 }, business: { x: 20 } } },
    { name: 'Beta', pathScores: { clinical: { x: 40 } } },
    { name: 'Gamma', pathScores: { business: { x: 80 } } }, // no clinical block
  ];

  it('returns null when the cert has no block for the path', () => {
    expect(certScoresForPath(certs[2], 'clinical')).toBeNull();
    expect(certScoresForPath(certs[0], 'clinical')).toEqual({ x: 90 });
  });

  it('excludes certs without a scoring block for the active lens', () => {
    const ranked = rankCertifications(certs, { x: 100 }, 'clinical');
    expect(ranked.map((c) => c.name)).toEqual(['Alpha', 'Beta']);
    expect(ranked.find((c) => c.name === 'Gamma')).toBeUndefined();
  });

  it('ranks highest weighted score first', () => {
    const ranked = rankCertifications(certs, { x: 100 }, 'clinical');
    expect(ranked[0].name).toBe('Alpha');
    expect(ranked[0].computedScore).toBeGreaterThan(ranked[1].computedScore);
    expect(ranked[0].rank).toBe(1);
  });
});
