import { describe, it, expect } from 'vitest';
import { normalizePlan, resolvePlan, acceptanceFor, ledgerDraft } from '../educationPlanning';
import { filterCourses } from '../educationCatalog';
import { validateEvaluationDraft } from '../educationReview';
import curated from '../../data/education/courses.json';

describe('learning plan persistence and CE boundaries', () => {
  const course = { id: 'checked', aliases: ['discovered'], title: 'Assessment course', providerName: 'Example', url: 'https://example.org/course', contactHours: 2, format: 'online' };
  const selection = { profession: 'OT', jurisdiction: 'IL', date: '2026-11-01' };
  const approval = { status: 'verified', profession: 'OT', jurisdiction: 'IL', format: 'online', validFrom: '2026-01-01', validThrough: '2026-12-31', checkedOn: '2026-01-01', sourceUrl: 'https://example.org/approval' };

  it('normalizes persisted and exported data, rejecting malformed dates and duplicate IDs', () => {
    const plan = normalizePlan({ version: 1, profession: 'OT', jurisdiction: 'IL', exportedOn: 'ignored', items: [
      { courseId: 'checked', targetDate: '2026-02-30', note: 'x'.repeat(1100) },
      { courseId: 'checked' }, { courseId: '' }, null,
      { courseId: 'other', targetDate: '2028-02-29' },
    ] });
    expect(plan.items).toHaveLength(2);
    expect(plan.items[0].targetDate).toBe('');
    expect(plan.items[0].note).toHaveLength(1000);
    expect(plan.items[1].targetDate).toBe('2028-02-29');
    expect(normalizePlan(plan)).toEqual(plan);
    expect(() => normalizePlan({version: 2, items: []})).toThrow();
  });

  it('resolves old discovery IDs and preserves unavailable selections without presenting them as available', () => {
    const rows = resolvePlan({ items: [{courseId:'discovered'}, {courseId:'checked'}, {courseId:'closed'}, {courseId:'missing'}] }, [course, {id:'closed', availability:'closed'}]);
    expect(rows).toHaveLength(3);
    expect(rows[0].course).toEqual(course);
    expect(rows.slice(1).every(x => x.course === null)).toBe(true);
  });

  it('does not infer state acceptance from provider hours or CEU claims', () => {
    expect(acceptanceFor({...course, ceClaims: [{authority:'AOTA', units:0.2}]}, selection).status).toBe('unknown');
    expect(acceptanceFor({...course, ceApprovals:[approval]}, selection).status).toBe('recorded');
    for (const change of [{profession:'PT'}, {jurisdiction:'CA'}, {date:'2027-01-01'}, {date:'2026-02-30'}]) {
      expect(acceptanceFor({...course, ceApprovals:[approval]}, {...selection,...change}).status).toBe('unknown');
    }
    for (const change of [{format:'live'}, {sourceUrl:'javascript:alert(1)'}, {checkedOn:'yesterday'}, {checkedOn:'2999-01-01'}, {validFrom:'2026-02-30'}, {status:'provider-reported'}]) {
      expect(acceptanceFor({...course, ceApprovals:[{...approval,...change}]}, selection).status).toBe('unknown');
    }
  });

  it('hands off suggestions without inventing completion, credited hours, category, or exam completion', () => {
    expect(ledgerDraft(course)).toEqual({title:course.title, provider:'Example', sourceUrl:course.url, suggestedHours:2});
    expect(ledgerDraft({...course, availability:'closed'})).toBeNull();
  });
});

describe('learning classifications and public curriculum reviews', () => {
  it('combines reviewed facets and separately reported levels/formats, excluding unknowns', () => {
    const courses = [
      {id:'reviewed', level:'advanced', clinicalSettings:['school'], populations:['children'], learningGoals:['assessment'], format:'live', providerFacts:{level:'introductory',formats:['online']}},
      {id:'reported', providerFacts:{level:'introductory',formats:['online']}},
      {id:'unknown'},
    ];
    expect(filterCourses(courses,{setting:'school',population:'children',goal:'assessment',level:'advanced'}).map(c=>c.id)).toEqual(['reviewed']);
    expect(filterCourses(courses,{level:'introductory',format:'online'}).map(c=>c.id)).toEqual(['reported']);
    expect(filterCourses(courses,{setting:'school',goal:'treatment'})).toEqual([]);
  });

  it('requires complete source-supported reviews and classification provenance in published data', () => {
    for (const course of curated) {
      if (course.reviewStatus === 'ranked') {
        expect(validateEvaluationDraft({courseId:course.id,providerId:course.providerId,courseUrl:course.url,evaluation:course.evaluation},course), course.id).toEqual([]);
      }
      if (course.learningGoals?.length || course.populations?.length || course.clinicalSettings?.length) {
        expect(course.classificationSourceUrl,course.id).toMatch(/^https:\/\//);
        expect(course.classificationReviewedOn,course.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });
});
