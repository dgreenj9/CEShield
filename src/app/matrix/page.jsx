// /matrix: the field, open to logged-out visitors.
//
// The public face of the scoring engine: rank every credential for a chosen
// lens, re-weight the dimensions, and read the evidence behind any one of
// them. It runs entirely on static credential data, so no auth check or
// Supabase call is involved.
//
// Server component (for the metadata export and the indexable header). The
// dashboard is a client component reading useSearchParams for deep links, so
// it sits inside a Suspense boundary; its fallback is a server-rendered table
// of the clinical lens at default weights, which is also what crawlers and
// no-JS visitors read.

import { Suspense } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/layout/PublicNav';
import PublicFooter from '@/components/layout/PublicFooter';
import AtlasMatrix from './_AtlasMatrix';
import siteStats from '@/data/siteStats.json';
import citationsMeta from '@/data/citations_meta.json';
import { certifications } from '@/utils/certificationData';
import { rankCertifications } from '@/utils/certScoring';
import { PATHS, getPathDefaultWeights } from '@/utils/careerPaths';
import { mxEyebrow, mxDisplay, tierLabel } from '@/components/atlas/theme';

export const metadata = {
  title: 'The credential field, ranked',
  description:
    `Rank ${siteStats.certCount} rehab credentials across ${siteStats.lensCount} career-path lenses with ` +
    `adjustable weights and ${siteStats.citationTotal.toLocaleString()} curated citations. ` +
    'Free to explore. No account required.',
  alternates: { canonical: '/matrix' },
  openGraph: { title: 'The credential field, ranked · CE Shield', url: '/matrix' },
};

const FALLBACK_LENS = 'clinical';
const FALLBACK_ROWS = rankCertifications(certifications, getPathDefaultWeights(FALLBACK_LENS), FALLBACK_LENS);

function MatrixFallback() {
  return (
    <section className="mx-panel" aria-labelledby="mx-fallback-h">
      <div className="mx-top">
        <div>
          <h2 id="mx-fallback-h">{PATHS[FALLBACK_LENS].label} lens · default weights</h2>
          <p className="mx-sub">The top 12 of {FALLBACK_ROWS.length} credentials scored in this lens.</p>
        </div>
        <span className="mx-count" role="status">Loading the field</span>
      </div>
      <div className="mx-tablewrap">
        <table className="mx-table">
          <thead>
            <tr><th>Rank</th><th>Credential</th><th>Type</th><th>Composite</th><th>Tier</th><th>Citations</th></tr>
          </thead>
          <tbody>
            {FALLBACK_ROWS.slice(0, 12).map((c) => {
              const meta = citationsMeta[c.name];
              return (
                <tr key={c.name}>
                  <td>{c.rank}</td>
                  <td className="mx-n">{meta?.slug ? <Link href={`/credentials/${meta.slug}`}>{c.name}</Link> : c.name}</td>
                  <td>{c.type}</td>
                  <td>{c.computedScore.toFixed(1)}</td>
                  <td>{tierLabel(c.computedScore)}</td>
                  <td>{(meta?.count || 0).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function MatrixPage() {
  return (
    <div className="mx-stage">
      <PublicNav currentPath="/matrix" />

      <main id="main" className="mx-wrap" style={{ paddingTop: 'clamp(40px, 6vw, 72px)', paddingBottom: 80 }}>
        <header style={{ marginBottom: 30 }}>
          <p style={{ ...mxEyebrow, margin: 0 }}>
            The field · {siteStats.certCount} credentials · {siteStats.citationTotal.toLocaleString()} citations
          </p>
          <h1 className="mx-display" style={{ ...mxDisplay(), marginTop: 16 }}>
            Rank by evidence.<br /><em>Calibrate by career.</em>
          </h1>
          <p className="mx-lede">
            Every credential scored on a lens, ranked by its weighted composite.
            Change the lens, move a weight, or filter by discipline. Select any
            credential to open its dossier.
          </p>
        </header>

        <Suspense fallback={<MatrixFallback />}>
          <AtlasMatrix />
        </Suspense>

        {/* The instrument is fully open; an account adds the personal layer. */}
        <section
          aria-label="Create a free account"
          className="mx-panel"
          style={{ marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px 24px', flexWrap: 'wrap', padding: '18px 22px' }}
        >
          <span style={{ fontSize: 14, color: '#D5C9D9', maxWidth: '38em', lineHeight: 1.6 }}>
            <strong style={{ color: '#F6EEE9', fontWeight: 500 }}>The personal layer.</strong>{' '}
            Log hours against your renewal. Claim credentials. Export the
            binder. Free for students, always.
          </span>
          <Link href="/sign-in" className="atlas-btn atlas-btn-primary" style={{ fontSize: 14, padding: '11px 20px', borderRadius: 22 }}>
            Create a free account →
          </Link>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
