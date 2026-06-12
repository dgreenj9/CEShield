import { describe, it, expect } from 'vitest';
import { splitEvidence } from '../formatEvidence';

describe('splitEvidence', () => {
  it('returns a short summary unchanged as a single paragraph', () => {
    const short = 'A concise one-line evidence summary under the threshold.';
    expect(splitEvidence(short)).toEqual([short]);
  });

  it('returns an empty array for empty input', () => {
    expect(splitEvidence('')).toEqual([]);
    expect(splitEvidence(null)).toEqual([]);
  });

  it('breaks a long summary into multiple paragraphs', () => {
    const long = [
      'This credential covers a broad domain with substantial published evidence behind it.',
      'The clinical literature is strong, with randomized trials and systematic reviews supporting the core intervention across multiple populations and settings.',
      'Evidence about the credential itself is thinner, with few studies directly comparing certified to non-certified clinicians on patient outcomes.',
      'It is concentrated in specific practice settings rather than general outpatient work, which shapes both its caseload applicability and its business profile.',
    ].join(' ');
    const paras = splitEvidence(long);
    expect(paras.length).toBeGreaterThan(1);
  });

  it('never splits in the middle of a sentence (every paragraph ends with terminal punctuation)', () => {
    const long = Array.from({ length: 6 }, (_, i) =>
      `Sentence number ${i + 1} carries enough length to push the running paragraph toward the wrap threshold.`,
    ).join(' ');
    for (const para of splitEvidence(long)) {
      expect(para.trim()).toMatch(/[.!?]$/);
    }
  });

  it('reconstructs to the original text (no content lost or duplicated)', () => {
    const long = 'First sentence here. Second sentence here. Third sentence here. ' +
      'Fourth sentence with more words to grow length. Fifth sentence to ensure multiple paragraphs form here.';
    const joined = splitEvidence(long).join(' ').replace(/\s+/g, ' ').trim();
    expect(joined).toBe(long.replace(/\s+/g, ' ').trim());
  });
});
