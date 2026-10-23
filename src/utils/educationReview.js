import { COURSE_DIMENSIONS, SUBJECTS, canonicalCourseUrl, courseScore } from './educationCatalog.js';

export function buildReviewQueue(courses, { limit = 50, subject = '', provider = '' } = {}) {
  const eligible = courses.filter(c => courseScore(c) === null && (!subject || c.subjects?.includes(subject)) && (!provider || c.providerId === provider));
  const selected = [];
  // Checked facts come first. Round-robin providers within each stage so a
  // large vendor cannot occupy the whole queue simply through catalog size.
  for (const status of ['verified', 'discovered']) {
    const groups = new Map();
    for (const course of eligible.filter(c => c.reviewStatus === status).sort((a, b) => a.title.localeCompare(b.title))) {
      if (!groups.has(course.providerId)) groups.set(course.providerId, []);
      groups.get(course.providerId).push(course);
    }
    while (groups.size && selected.length < limit) {
      for (const [id, entries] of groups) {
        if (selected.length >= limit) break;
        const course = entries.shift();
        selected.push({
          courseId: course.id, providerId: course.providerId, title: course.title,
          url: course.url, sourceUrl: course.sourceUrl, subjects: course.subjects || [],
          nextStep: status === 'verified' ? 'Evaluate course' : 'Check course facts',
          factsToCheck: [
            !course.subjects?.length && 'Subject',
            !course.disciplines?.length && 'Course audience',
            course.contactHours == null && 'Contact hours',
            !course.format && 'Delivery format',
            course.priceUsd == null && !course.price && 'Price and currency',
            'Current availability',
          ].filter(Boolean),
        });
        if (!entries.length) groups.delete(id);
      }
    }
  }
  return selected;
}

export function createEvaluationDraft(course, subject = '') {
  return {
    courseId: course.id, providerId: course.providerId, courseUrl: course.url,
    evaluation: {
      subject, reviewer: '', reviewedOn: '', reviewBasis: '', limitations: '',
      dimensions: Object.fromEntries(Object.keys(COURSE_DIMENSIONS).map(key => [key, { score: null, rationale: '', sources: [] }])),
    },
  };
}

export function validateEvaluationDraft(draft, course, today = new Date().toISOString().slice(0, 10)) {
  const errors = [];
  if (!course || !['verified', 'ranked'].includes(course.reviewStatus)) return ['Check and curate the course facts before publishing an evaluation.'];
  if (draft.courseId !== course.id || draft.providerId !== course.providerId) errors.push('Course identity does not match.');
  try {
    if (canonicalCourseUrl(draft.courseUrl) !== canonicalCourseUrl(course.url)) errors.push('Course URL does not match.');
  } catch { errors.push('A valid course URL is required.'); }
  const review = draft.evaluation || {};
  if (!SUBJECTS[review.subject] || !course.subjects?.includes(review.subject)) errors.push('Choose a reviewed subject assigned to this course.');
  if (typeof review.reviewer !== 'string' || !review.reviewer.trim()) errors.push('Name the reviewer.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(review.reviewedOn || '') || !Number.isFinite(Date.parse(review.reviewedOn)) || new Date(review.reviewedOn).toISOString().slice(0, 10) !== review.reviewedOn || review.reviewedOn > today) errors.push('Use a valid review date no later than today.');
  if (!['public-materials', 'course-access'].includes(review.reviewBasis)) errors.push('Specify whether the review used public materials or course access.');
  if (typeof review.limitations !== 'string' || !review.limitations.trim()) errors.push('Describe review limitations and what was accessed.');
  for (const [key, dimension] of Object.entries(COURSE_DIMENSIONS)) {
    const item = review.dimensions?.[key];
    if (!Number.isFinite(item?.score) || item.score < 0 || item.score > 100) errors.push(`${dimension.label}: enter a score from 0 to 100.`);
    if (typeof item?.rationale !== 'string' || !item.rationale.trim()) errors.push(`${dimension.label}: explain the judgment.`);
    if (!Array.isArray(item?.sources) || !item.sources.length) errors.push(`${dimension.label}: provide supporting source URLs.`);
    else for (const source of item.sources) {
      try { canonicalCourseUrl(source); } catch { errors.push(`${dimension.label}: invalid source URL.`); }
    }
  }
  return errors;
}
