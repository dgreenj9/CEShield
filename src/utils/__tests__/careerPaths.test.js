import { describe, it, expect } from 'vitest';
import {
  PATHS,
  PATH_ORDER,
  PATH_DIMENSIONS,
  LENS_COLORS,
  scoreColor,
  getPathDefaultWeights,
} from '../careerPaths';

describe('career-path config integrity', () => {
  it('every path in PATH_ORDER has dimensions, default weights, and a color', () => {
    for (const key of PATH_ORDER) {
      expect(PATHS[key], `PATHS.${key}`).toBeDefined();
      expect(PATH_DIMENSIONS[key], `PATH_DIMENSIONS.${key}`).toBeDefined();
      expect(LENS_COLORS[key], `LENS_COLORS.${key}`).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('each path has exactly six dimensions, and default weights cover them all', () => {
    for (const key of PATH_ORDER) {
      const dims = Object.keys(PATH_DIMENSIONS[key]);
      const weights = getPathDefaultWeights(key);
      expect(dims).toHaveLength(6);
      expect(Object.keys(weights).sort()).toEqual(dims.sort());
    }
  });

  it('default weights for every path sum to exactly 100', () => {
    for (const key of PATH_ORDER) {
      const sum = Object.values(getPathDefaultWeights(key)).reduce((s, v) => s + v, 0);
      expect(sum, `${key} weights`).toBe(100);
    }
  });

  it('getPathDefaultWeights returns null for an unknown path', () => {
    expect(getPathDefaultWeights('nonsense')).toBeNull();
  });
});

describe('scoreColor', () => {
  it('uses sage / ochre / slate at the documented thresholds', () => {
    expect(scoreColor(65)).toBe('#2F6B4D'); // strong → sage
    expect(scoreColor(64)).toBe('#8A6332'); // mid → darkened ochre (WCG AA)
    expect(scoreColor(40)).toBe('#8A6332');
    expect(scoreColor(39)).toBe('#94a3b8'); // low → slate
  });
});
