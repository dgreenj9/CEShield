import { describe, it, expect } from 'vitest';
import { certifications } from '../certificationData';
import meta from '../../data/citations_meta.json';
import links from '../../data/education/credentialLinks.json';
import registry from '../../data/education/providers.json';
import curated from '../../data/education/courses.json';
import discovered from '../../data/education/discoveredCourses.json';
import { canonicalCourseUrl, mergeCourseListings, filterCourses, sortCourses, courseScore, COURSE_DIMENSIONS, SUBJECTS, formatCoursePrice, selectComparisonCourses, inferSubjects } from '../educationCatalog';

describe('vision discovery tags', () => {
  it('finds vision education without matching supervision or revision', () => {
    expect(inferSubjects('Environmental Modifications for Low Vision')).toContain('vision');
    expect(inferSubjects('Visual Perceptual Motor Supports')).toContain('vision');
    expect(inferSubjects('Oculomotor Assessment')).toContain('vision');
    expect(inferSubjects('Clinical Supervision and Documentation Revision')).not.toContain('vision');
  });
});

describe('provider links and catalog integrity', () => {
  it('gives every ranked credential at least one attributed official destination', () => {
    const slugs = certifications.map(c => meta[c.name].slug);
    expect(Object.keys(links).sort()).toEqual(slugs.sort());
    for (const cert of certifications) {
      const record = links[meta[cert.name].slug];
      expect(record.credentialName).toBe(cert.name);
      expect(record.links.length).toBeGreaterThan(0);
      for (const link of record.links) {
        expect(link.provider).toBeTruthy();
        expect(['program', 'directory', 'resource']).toContain(link.kind);
        expect(canonicalCourseUrl(link.url)).toBeTruthy();
        expect(link.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it('keeps discovered listings unscored and relates all entries to registered providers', () => {
    const providerIds = new Set(registry.providers.map(p => p.id));
    expect(providerIds.size).toBe(registry.providers.length);
    const ids = [...curated, ...discovered].map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const course of [...curated, ...discovered]) {
      expect(providerIds.has(course.providerId), course.title).toBe(true);
      expect(course.title).toBeTruthy();
      expect(canonicalCourseUrl(course.url)).toBeTruthy();
      expect(canonicalCourseUrl(course.sourceUrl)).toBeTruthy();
      for (const subject of course.subjects || []) expect(SUBJECTS[subject]).toBeTruthy();
      if (course.reviewStatus === 'discovered') expect(courseScore(course)).toBeNull();
      if (course.reviewStatus === 'ranked') expect(courseScore(course)).not.toBeNull();
    }
  });
});

describe('course identity and discovery', () => {
  const base = { id: 'a', providerId: 'provider-a', title: 'Pain education', url: 'https://example.org/course/pain/' };
  it('replaces a discovered listing with checked facts despite tracking params, without merging vendors', () => {
    const courses = mergeCourseListings([base, { ...base, id: 'b', providerId: 'provider-b' }], [{ ...base, id: 'reviewed', url: base.url + '?utm_source=search#details', contactHours: 2 }]);
    expect(courses).toHaveLength(2);
    expect(courses.find(c => c.providerId === 'provider-a').contactHours).toBe(2);
    expect(courses.find(c => c.providerId === 'provider-b').contactHours).toBeUndefined();
  });
  it('retains session and format query parameters as meaningful identities', () => {
    expect(canonicalCourseUrl('https://example.org/course?session=1')).not.toBe(canonicalCourseUrl('https://example.org/course?session=2'));
    expect(() => canonicalCourseUrl('javascript:alert(1)')).toThrow();
    expect(canonicalCourseUrl('https://example.org/course?oid=13923&cacheminutes=0')).toBe(canonicalCourseUrl('https://example.org/course?oid=13923'));
    expect(canonicalCourseUrl('https://example.org/course?oid=13923')).not.toBe(canonicalCourseUrl('https://example.org/course?oid=13924'));
  });
  it('does not resurrect an explicitly closed offering from older checked facts', () => {
    const unavailable = [{ ...base, url: base.url + '?utm_source=catalog', availability: 'closed' }];
    expect(mergeCourseListings([base], [{ ...base, reviewStatus: 'verified' }], unavailable)).toEqual([]);
    expect(mergeCourseListings([{ ...base, providerId: 'another' }], [], unavailable)).toHaveLength(1);
  });
  it('combines subject, provider, audience and text filters instead of using either/or matching', () => {
    const courses = [
      { ...base, subjects: ['pain'], disciplines: ['PT'], providerName: 'Example Academy', format: 'online' },
      { ...base, id: 'other', subjects: ['pain'], disciplines: ['OT'], providerName: 'Example Academy', format: 'live' },
    ];
    expect(filterCourses(courses, { query: 'academy pain', subject: 'pain', discipline: 'PT', format: 'online' }).map(c => c.id)).toEqual(['a']);
    expect(filterCourses(courses, { query: 'aphasia' })).toEqual([]);
  });
  it('sorts unknown hours after known hours, including free/zero-hour entries', () => {
    const courses = [{ ...base, id: 'unknown' }, { ...base, id: 'two', contactHours: 2 }, { ...base, id: 'zero', contactHours: 0 }];
    expect(sortCourses(courses, 'hours').map(c => c.id)).toEqual(['zero', 'two', 'unknown']);
  });
});

describe('course evaluation safeguards', () => {
  const evaluated = (subject = 'pain', score = 80) => ({
    id: subject, title: subject, providerId: 'example', reviewStatus: 'ranked',
    evaluation: { subject, reviewer: 'Editorial review', reviewedOn: '2026-10-23', reviewBasis: 'public-materials', limitations: 'Published curriculum only; teaching was not observed.', dimensions: Object.fromEntries(Object.keys(COURSE_DIMENSIONS).map(key => [key, { score, rationale: 'Assessment of the published curriculum.', sources: ['https://example.org/curriculum'] }])) },
  });
  it('does not turn a credential score, provider stars, or missing evidence into a course score', () => {
    expect(courseScore({ computedScore: 99, providerRating: 5 })).toBeNull();
    const course = evaluated();
    delete course.evaluation.dimensions.evidenceAlignment;
    expect(courseScore(course)).toBeNull();
    const unsupported = evaluated();
    unsupported.evaluation.dimensions.value.sources = [];
    expect(courseScore(unsupported)).toBeNull();
    const undisclosed = evaluated();
    delete undisclosed.evaluation.reviewBasis;
    expect(courseScore(undisclosed)).toBeNull();
  });
  it('requires complete sourced judgments and correct weights', () => {
    expect(Object.values(COURSE_DIMENSIONS).reduce((sum, d) => sum + d.weight, 0)).toBe(100);
    expect(courseScore(evaluated())).toBe(80);
    const course = evaluated();
    course.evaluation.dimensions.value.score = 101;
    expect(courseScore(course)).toBeNull();
  });
  it('does not rank courses across unrelated subjects', () => {
    const courses = [evaluated('pain', 60), evaluated('language', 100)];
    expect(sortCourses(courses, 'score', 'pain')[0].id).toBe('pain');
    // Without a selected subject, fall back to alphabetical order.
    expect(sortCourses(courses, 'score')[0].id).toBe('language');
  });
});

describe('course price currencies', () => {
  it('distinguishes international prices from legacy US dollar prices', () => {
    expect(formatCoursePrice({ price: { amount: 49.99, currency: 'CAD' } })).toContain('CAD');
    expect(formatCoursePrice({ priceUsd: 49.99 })).toContain('USD');
    expect(formatCoursePrice({ priceUsd: 0 })).toBe('Listed as free');
  });
  it('does not display unknown or invalid prices as free', () => {
    expect(formatCoursePrice({ priceUsd: null })).toBeNull();
    expect(formatCoursePrice({ price: { amount: -1, currency: 'USD' } })).toBeNull();
    expect(formatCoursePrice({ price: { amount: 40, currency: '' } })).toBeNull();
  });
});

describe('shareable course comparisons', () => {
  it('resolves older discovery IDs after a course receives a curated record without duplicating selections', () => {
    const discovered = { id: 'found-a', providerId: 'a', title: 'Pain course', url: 'https://example.org/pain/' };
    const curated = { ...discovered, id: 'reviewed-a', url: 'https://example.org/pain?utm_source=x', contactHours: 2 };
    const merged = mergeCourseListings([discovered], [curated]);
    const selection = selectComparisonCourses(merged, 'found-a,reviewed-a');
    expect(selection).toHaveLength(1);
    expect(selection[0].id).toBe('reviewed-a');
    expect(selection[0].contactHours).toBe(2);
  });
  it('ignores unavailable and unknown IDs, removes duplicates, and limits comparisons to three', () => {
    const courses = ['a', 'b', 'c', 'd'].map(id => ({ id }));
    expect(selectComparisonCourses([...courses, { id: 'closed', availability: 'closed' }], 'missing,closed,a,a,b,c,d').map(c => c.id)).toEqual(['a', 'b', 'c']);
    expect(selectComparisonCourses(courses, '')).toEqual([]);
  });
});
