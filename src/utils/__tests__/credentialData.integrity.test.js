// Data-integrity tests over the real 143-credential dataset. These guard the
// "brain" of the product: if a credential's pathScores use the wrong dimension
// keys or out-of-range values, the weighted-sum score silently corrupts. This
// is the same class of bug the merge-script schema guard prevents — here it's
// asserted across the entire shipped dataset.

import { describe, it, expect } from 'vitest';
import { certifications } from '../certificationData';
import citationsMeta from '../../data/citations_meta.json';
import { PATHS, PATH_DIMENSIONS, PATH_ORDER } from '../careerPaths';

describe('certificationData dataset integrity', () => {
  it('has a non-trivial number of credentials', () => {
    expect(certifications.length).toBeGreaterThan(100);
  });

  it('every credential has a name, type, and at least one pathScores block', () => {
    for (const cert of certifications) {
      expect(cert.name, 'name').toBeTruthy();
      expect(cert.type, `${cert.name} type`).toBeTruthy();
      expect(Object.keys(cert.pathScores || {}).length, `${cert.name} pathScores`).toBeGreaterThan(0);
    }
  });

  it('every pathScores block uses only canonical dimension keys with values in 0–100', () => {
    for (const cert of certifications) {
      for (const [lens, dims] of Object.entries(cert.pathScores)) {
        expect(PATHS[lens], `${cert.name}: unknown lens "${lens}"`).toBeDefined();
        const expected = new Set(Object.keys(PATH_DIMENSIONS[lens]));
        for (const [dim, value] of Object.entries(dims)) {
          expect(expected.has(dim), `${cert.name}.${lens}: unexpected dim "${dim}"`).toBe(true);
          expect(typeof value, `${cert.name}.${lens}.${dim} type`).toBe('number');
          expect(value, `${cert.name}.${lens}.${dim} range`).toBeGreaterThanOrEqual(0);
          expect(value, `${cert.name}.${lens}.${dim} range`).toBeLessThanOrEqual(100);
        }
        // No missing dimensions either — a partial block would read as zeros.
        expect(Object.keys(dims).sort()).toEqual([...expected].sort());
      }
    }
  });

  it('credential names are unique', () => {
    const names = certifications.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('every credential has a slug entry in citations_meta', () => {
    for (const cert of certifications) {
      const entry = citationsMeta[cert.name];
      expect(entry, `meta for ${cert.name}`).toBeDefined();
      expect(entry.slug, `slug for ${cert.name}`).toBeTruthy();
    }
  });

  it('PATH_ORDER lenses are the only lenses used anywhere in the dataset', () => {
    const used = new Set();
    for (const cert of certifications) {
      for (const lens of Object.keys(cert.pathScores)) used.add(lens);
    }
    for (const lens of used) expect(PATH_ORDER).toContain(lens);
  });
});
