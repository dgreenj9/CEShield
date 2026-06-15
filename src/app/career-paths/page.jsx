// /career-paths — Server Component. Computes the top picks per path at
// build time, then hands the data to a client-side tabbed UI so users
// can switch between paths without scrolling through all 5.

import Link from 'next/link';
import { colors } from '@/utils/constants';
import PublicNav from '@/components/layout/PublicNav';
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

// Brand-colored accents per path. Sage/ochre/blue/purple — uses the same
// palette as the rest of the site.
const PATH_COLORS = {
  clinical:         { color: colors.primaryBlue,   accent: colors.lightBlue },
  business:         { color: colors.primaryPurple, accent: colors.mutedPurple },
  academicClinical: { color: '#2F6B4D',            accent: '#E8EFEA' },
  research:         { color: '#1D4ED8',            accent: '#EFF6FF' },
  healthTech:       { color: '#7A5A2F',            accent: '#F6F0E5' },
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
  ...PATH_COLORS[key],
}));

const EXAMPLES = Object.fromEntries(
  PATH_ORDER.map((key) => [key, examplesFor(key)]),
);

export default function CareerPathsPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAFAF6',
        backgroundImage: 'radial-gradient(circle, rgba(15, 23, 42, 0.05) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        color: colors.textDark,
      }}
    >
      <PublicNav currentPath="/career-paths" />

      <main className="cs-page-pad" style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 2rem 6rem', lineHeight: 1.65 }}>
        {/* Hero. Title + lead text on the left (capped at a readable measure);
            a small at-a-glance stat strip on the right at wider sizes,
            aligned to the same baseline. Both sit inside the same 1200px
            content boundary as the widget below — no width mismatches. */}
        <header className="cs-hero-row" style={{ marginBottom: '2.25rem' }}>
          <div className="cs-hero-text">
            <div
              className="font-mono"
              style={{
                fontSize: '0.72rem',
                color: colors.primaryPurple,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Rehab Career OS
            </div>
            <h1 className="cs-h1-clamp" style={{
              fontSize: '2.5rem', fontWeight: 600, color: colors.textDark, margin: 0,
              letterSpacing: '-0.02em', lineHeight: 1.1,
            }}>
              Five paths. Five different questions.
            </h1>
            <p style={{ fontSize: '1.08rem', marginTop: '1rem', color: colors.slateMedium, maxWidth: 640 }}>
              A PhD is poor ROI for a clinician but transformative for a researcher.
              An Epic build certification is irrelevant to most therapists but unlocks
              the EHR-vendor career. CE Shield refuses to pretend one rubric fits
              every trajectory &mdash; each path has its own dimensions and its own
              evidence frame.
            </p>
            <p style={{ color: colors.textGray, marginTop: '0.75rem', fontSize: '0.9rem', maxWidth: 640 }}>
              Tap a path below to see its scoring rubric and top picks. Read the{' '}
              <Link href="/methodology" style={{ color: colors.primaryBlue }}>
                methodology
              </Link>{' '}
              for how dimensions and weights were chosen per path.
            </p>
          </div>
          <aside className="cs-hero-stats" aria-label="At a glance">
            {[
              { value: '5',     label: 'Career-path lenses' },
              { value: '6',     label: 'Dimensions per lens' },
              { value: String(siteStats.certCount),   label: 'Credentials scored' },
              { value: siteStats.citationTotal.toLocaleString(), label: 'Curated citations' },
            ].map((s) => (
              <div key={s.label} style={{ padding: '0.65rem 0' }}>
                <div
                  className="font-mono tabular-nums"
                  style={{
                    fontSize: '1.6rem',
                    fontWeight: 600,
                    color: colors.textDark,
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: '0.78rem', color: colors.textGray, marginTop: 4 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </aside>
        </header>

        <PathTabs paths={PATHS_DATA} examples={EXAMPLES} />

        {/* "Picking your lens" footnote — full-width within the boundary,
            same left edge as the widget, no centered island below. */}
        <section style={{
          marginTop: '2.5rem',
          padding: '1.75rem',
          background: colors.grayLight,
          borderRadius: 16,
          border: `1px solid ${colors.slateLight}`,
        }}>
          <div
            className="font-mono"
            style={{
              fontSize: '0.68rem',
              color: colors.textGray,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 600,
              marginBottom: 10,
            }}
          >
            Picking your lens
          </div>
          <ol style={{ marginTop: 0, paddingLeft: '1.25rem', color: colors.slateMedium, lineHeight: 1.7, maxWidth: 760 }}>
            <li>Pick the path that matches where you actually want your career to go &mdash; not where credentialism says you should.</li>
            <li>
              Open the{' '}
              <Link href="/matrix" style={{ color: colors.primaryBlue }}>matrix</Link>{' '}
              and select that lens. The matrix re-ranks to show only credentials
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
