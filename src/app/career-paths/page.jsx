// /career-paths — Server Component. Computes the top picks per path at
// build time, then hands the data to a client-side tabbed UI so users
// can switch between paths without scrolling through all 5.
// Atlas: one petrol accent for every path — color is reserved for
// encoding evidence tiers, never path identity.

import Link from 'next/link';
import PublicNav from '@/components/layout/PublicNav';
import { A, INS, eyebrow, tabularNums } from '@/components/atlas/theme';
import { certifications as certData } from '@/utils/certificationData';
import { computeScore, certScoresForPath } from '@/utils/certScoring';
import { PATHS, PATH_ORDER, getPathDefaultWeights } from '@/utils/careerPaths';
import citationsMeta from '@/data/citations_meta.json';
import PathTabs from './_PathTabs';
import siteStats from '@/data/siteStats.json';

export const metadata = {
  title: 'Five career paths',
  description:
    'Clinical, business, academic clinical, research, and healthtech & industry — five career trajectories for PTs and OTs, each with its own scoring rubric and evidence frame.',
  alternates: { canonical: '/career-paths' },
  openGraph: { title: 'Five career paths · CE Shield', url: '/career-paths' },
};

// Top picks per path, computed at build time. Score = each path's default
// weights applied to that cert's pathScores block.
const examplesFor = (pathKey, n = 4) => {
  const weights = getPathDefaultWeights(pathKey);
  return certData
    .map((c) => {
      const subs = certScoresForPath(c, pathKey);
      if (!subs) return null;
      return {
        name: c.name,
        type: c.type,
        discipline: c.discipline,
        slug: citationsMeta[c.name]?.slug || null,
        score: Math.round(computeScore(subs, weights)),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
};

const PATHS_DATA = PATH_ORDER.map((key) => ({
  key,
  label: PATHS[key].label,
  description: PATHS[key].description,
  defaultWeights: PATHS[key].defaultWeights,
}));

const EXAMPLES = Object.fromEntries(
  PATH_ORDER.map((key) => [key, examplesFor(key)]),
);

export default function CareerPathsPage() {
  return (
    <div className="atlas-ground" style={{ minHeight: '100vh', color: A.ink }}>
      <PublicNav currentPath="/career-paths" />

      <main className="cs-page-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 2rem 6rem', lineHeight: 1.65 }}>
        {/* Hero. Title + lead on the left; an at-a-glance stat strip on the
            right at wider sizes. */}
        <header className="cs-hero-row" style={{ marginBottom: '2.25rem' }}>
          <div className="cs-hero-text">
            <div style={{ ...eyebrow(), marginBottom: 12 }}>The five lenses</div>
            <h1 className="cs-h1-clamp" style={{
              fontFamily: INS, fontSize: '2.75rem', fontWeight: 600, color: A.ink, margin: 0,
              letterSpacing: '-0.03em', lineHeight: 1.02,
            }}>
              Five paths. Five different questions.
            </h1>
            <p style={{ fontSize: '1.08rem', marginTop: '1rem', color: A.inkBody, maxWidth: 640 }}>
              A PhD is poor ROI for a clinician but transformative for a researcher.
              An Epic build certification is irrelevant to most therapists but unlocks
              the EHR-vendor career. CE Shield refuses to pretend one rubric fits
              every trajectory: each path has its own dimensions and its own
              evidence frame.
            </p>
            <p style={{ color: A.inkMuted, marginTop: '0.75rem', fontSize: '0.9rem', maxWidth: 640 }}>
              Tap a path below to see its scoring rubric and top picks. Read the{' '}
              <Link href="/methodology" style={{ color: A.accent, textDecoration: 'underline', textUnderlineOffset: 2 }}>
                methodology
              </Link>{' '}
              for how dimensions and weights were chosen per path.
            </p>
          </div>
          <aside className="cs-hero-stats" aria-label="At a glance">
            {[
              { value: '5', label: 'Career-path lenses' },
              { value: '6', label: 'Dimensions per lens' },
              { value: String(siteStats.certCount), label: 'Credentials scored' },
              { value: siteStats.citationTotal.toLocaleString(), label: 'Curated citations' },
            ].map((s) => (
              <div key={s.label} style={{ padding: '0.65rem 0' }}>
                <div
                  style={{
                    fontFamily: INS,
                    fontSize: '1.7rem',
                    fontWeight: 600,
                    color: A.ink,
                    lineHeight: 1,
                    letterSpacing: '-0.03em',
                    ...tabularNums,
                  }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: '0.8rem', color: A.inkMuted, marginTop: 4, fontWeight: 600 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </aside>
        </header>

        <PathTabs paths={PATHS_DATA} examples={EXAMPLES} />

        {/* "Picking your lens" footnote — full-width within the boundary. */}
        <section style={{
          marginTop: '2.5rem',
          padding: '1.75rem',
          background: A.band,
          border: `1px solid ${A.ink}`,
        }}>
          <div style={{ ...eyebrow(12.5), marginBottom: 10 }}>Picking your lens</div>
          <ol style={{ marginTop: 0, paddingLeft: '1.25rem', color: A.inkBody, lineHeight: 1.7, maxWidth: 760 }}>
            <li>Pick the path that matches where you actually want your career to go, not where credentialism says you should.</li>
            <li>
              Open{' '}
              <Link href="/matrix" style={{ color: A.accent, textDecoration: 'underline', textUnderlineOffset: 2 }}>the field</Link>{' '}
              and select that lens. The table re-ranks to show only credentials
              scored on that path.
            </li>
            <li>Adjust the weight sliders to emphasize the dimensions you care about most. Rankings update live.</li>
            <li>Cross-check the evidence library on any cert before committing dollars and hours.</li>
            <li>Track the CE hours those courses earn in the compliance tracker so you stay licensed while you specialize.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
