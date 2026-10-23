import { describe, expect, it } from 'vitest';
import { buildReviewQueue, createEvaluationDraft, validateEvaluationDraft } from '../educationReview';
import { COURSE_DIMENSIONS, courseScore } from '../educationCatalog';

const course = { id: 'pain-a', providerId: 'provider-a', title: 'Pain education', url: 'https://example.org/course/pain', reviewStatus: 'verified', subjects: ['pain'], contactHours: 0, priceUsd: 0 };
const completeDraft = () => ({ ...createEvaluationDraft(course, 'pain'), evaluation: {
  subject: 'pain', reviewer: 'Test reviewer', reviewedOn: '2026-10-23', reviewBasis: 'public-materials', limitations: 'Public syllabus only. No course access or observation of instruction.',
  dimensions: Object.fromEntries(Object.keys(COURSE_DIMENSIONS).map(key => [key, { score: 70, rationale: 'Fixture judgment for validation only.', sources: ['https://example.org/course/pain'] }])),
} });

describe('editorial work queue', () => {
  it('prioritizes checked facts and shares subsequent slots across providers', () => {
    const bigProvider = Array.from({ length: 20 }, (_, i) => ({ ...course, id: `a${i}`, title: `A course ${i}`, reviewStatus: 'discovered' }));
    const other = { ...course, id: 'b', providerId: 'provider-b', title: 'Z course', reviewStatus: 'discovered' };
    const queue = buildReviewQueue([...bigProvider, other, course], { limit: 3 });
    expect(queue.map(c => c.courseId)).toEqual([course.id, 'a0', 'b']);
    expect(queue[0].factsToCheck).not.toContain('Contact hours');
    expect(queue[0].factsToCheck).not.toContain('Price and currency');
  });
  it('filters by subject/provider and excludes published evaluations', () => {
    const ranked = { ...course, reviewStatus: 'ranked', evaluation: completeDraft().evaluation };
    expect(buildReviewQueue([ranked])).toEqual([]);
    expect(buildReviewQueue([course], { subject: 'language' })).toEqual([]);
    expect(buildReviewQueue([course], { provider: 'other' })).toEqual([]);
  });
});

describe('evaluation publication validation', () => {
  it('creates an unscored draft and rejects missing evidence', () => {
    const draft = createEvaluationDraft(course, 'pain');
    expect(courseScore({ ...course, reviewStatus: 'ranked', evaluation: draft.evaluation })).toBeNull();
    expect(validateEvaluationDraft(draft, course, '2026-10-23').length).toBeGreaterThan(0);
  });
  it('accepts a complete disclosed review but rejects mismatched course identity', () => {
    const draft = completeDraft();
    expect(validateEvaluationDraft(draft, course, '2026-10-23')).toEqual([]);
    expect(validateEvaluationDraft({ ...draft, courseUrl: 'https://example.org/other' }, course, '2026-10-23')).toContain('Course URL does not match.');
    expect(validateEvaluationDraft({ ...draft, providerId: 'other' }, course, '2026-10-23')).toContain('Course identity does not match.');
  });
  it('requires checked facts and refuses impossible dates, unrelated subjects, and unsafe source URLs', () => {
    const draft = completeDraft();
    expect(validateEvaluationDraft(draft, { ...course, reviewStatus: 'discovered' })).toHaveLength(1);
    draft.evaluation.reviewedOn = '2026-02-30';
    draft.evaluation.subject = 'language';
    draft.evaluation.dimensions.value.sources = ['javascript:alert(1)'];
    const errors = validateEvaluationDraft(draft, course, '2026-10-23');
    expect(errors).toContain('Use a valid review date no later than today.');
    expect(errors).toContain('Choose a reviewed subject assigned to this course.');
    expect(errors).toContain('Time & cost value: invalid source URL.');
  });
});
