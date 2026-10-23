import { Suspense } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/layout/PublicNav';
import Catalog from './_Catalog';
import curated from '@/data/education/courses.json';
import discovered from '@/data/education/discoveredCourses.json';
import registry from '@/data/education/providers.json';
import coverage from '@/data/education/coverage.json';
import unavailable from '@/data/education/unavailableCourses.json';
import { mergeCourseListings } from '@/utils/educationCatalog';
import { A, INS, eyebrow } from '@/components/atlas/theme';

export const metadata = {
  title: 'CE course catalog for rehabilitation clinicians',
  description: 'Find rehabilitation education across providers, subjects, and professions. Compare course facts, follow original sources, and see which listings have been reviewed.',
  alternates: { canonical: '/learn' },
};

export default function LearnPage() {
  const providers = new Map(registry.providers.map(p => [p.id, p]));
  const courses = mergeCourseListings(discovered, curated, unavailable).map(course => ({
    ...course,
    providerName: providers.get(course.providerId)?.name || course.providerId,
    audienceBasis: course.disciplines?.length ? 'course' : 'provider',
    disciplines: course.disciplines?.length ? course.disciplines : providers.get(course.providerId)?.disciplines || [],
  }));
  // Only public display fields cross the client boundary; crawl configuration and errors stay off the UI.
  const publicProviders = registry.providers.map(({ id, name, disciplines, catalogUrl, browseUrl }) => ({
    id, name, disciplines, catalogUrl: browseUrl || catalogUrl,
    closedCount: unavailable.filter(c => c.providerId === id && c.availability === 'closed').length,
    coverage: (() => {
      const record = coverage.find(c => c.providerId === id);
      return record ? { status: record.status, attemptedAt: record.attemptedAt, discoveredCount: record.discoveredCount } : null;
    })(),
  }));
  return (
    <div className="atlas-ground" style={{ minHeight: '100vh', color: A.ink }}>
      <PublicNav currentPath="/learn" />
      <main className="cs-page-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 2rem 5rem' }}>
        <header style={{ marginBottom: 28 }}>
          <div style={eyebrow()}>Continuing education · PT / OT / SLP / rehab</div>
          <h1 style={{ fontFamily: INS, fontSize: 'clamp(30px, 5vw, 48px)', letterSpacing: '-0.035em', lineHeight: 1.1, margin: '10px 0 12px' }}>Find your next course.</h1>
          <p style={{ maxWidth: 780, color: A.inkBody, fontSize: 16, lineHeight: 1.6, margin: 0 }}>Education across providers and subjects. Each listing links to its original source. Course facts, independent evaluation, and CE acceptance are reviewed separately.</p>
          <p style={{ margin: '12px 0 0' }}><Link href="/credentials" style={{ color: A.accent, fontSize: 14, fontWeight: 700 }}>Explore ranked credentials and certification pathways →</Link></p>
        </header>
        <Suspense fallback={<p role="status">Loading the course catalog…</p>}>
          <Catalog courses={courses} providers={publicProviders} directories={registry.directories} />
        </Suspense>
      </main>
    </div>
  );
}
