// /credentials — index of every credential dossier, grouped by discipline.
// Free, indexable, no auth — the SEO entry point for the per-credential
// library. Each row links to /credentials/<slug>.

import Link from 'next/link';
import PublicNav from '@/components/layout/PublicNav';
import PublicFooter from '@/components/layout/PublicFooter';
import { certifications as certData } from '@/utils/certificationData';
import citationsMeta from '@/data/citations_meta.json';
import { PATH_ORDER } from '@/utils/careerPaths';
import { mxEyebrow, mxDisplay } from '@/components/atlas/theme';
import CredentialsBrowser from './_CredentialsBrowser';
import siteStats from '@/data/siteStats.json';

export const metadata = {
  title: `Credential library · ${siteStats.certCount} rehab certifications, scored and cited`,
  description:
    `Every credential CE Shield scores: PT, OT, SLP, AT, and informatics certifications, residencies, and degrees. Each has a published evidence dossier across five career lenses and ${siteStats.citationTotal.toLocaleString()} curated citations.`,
  alternates: { canonical: '/credentials' },
};

// Precompute the row list at build time: minimal per-row data the client
// browser needs to filter and render. Sort alphabetically.
const ROWS = [...certData]
  .map((c) => ({
    slug: citationsMeta[c.name]?.slug,
    count: citationsMeta[c.name]?.count || 0,
    lenses: PATH_ORDER.filter((p) => c.pathScores?.[p]),
    cert: {
      name: c.name,
      type: c.type,
      discipline: c.discipline,
      disciplines: c.disciplines,
    },
  }))
  .filter((r) => r.slug)
  .sort((a, b) => a.cert.name.localeCompare(b.cert.name));

export default function CredentialsIndexPage() {
  const totalCitations = Object.values(citationsMeta).reduce(
    (sum, e) => sum + (e?.count || 0), 0,
  );

  return (
    <div className="mx-stage">
      <PublicNav currentPath="/credentials" />

      <main id="main" className="mx-wrap" style={{ paddingTop: 'clamp(40px, 6vw, 72px)', paddingBottom: 80 }}>
        <header style={{ marginBottom: 30 }}>
          <p style={{ ...mxEyebrow, margin: 0 }} className="mx-num">
            The dossier library · {totalCitations.toLocaleString()} curated citations
          </p>
          <h1 className="mx-display" style={{ ...mxDisplay(), marginTop: 16 }}>
            {ROWS.length} credentials.<br /><em>One dossier each.</em>
          </h1>
          <p className="mx-lede">
            Each dossier holds a credential&rsquo;s score in every lens it is
            scored on, the reasoning per dimension, and its sources.
          </p>
        </header>

        <CredentialsBrowser rows={ROWS} />

        <nav aria-label="Related" style={{ marginTop: 28, display: 'flex', flexWrap: 'wrap', gap: '8px 28px' }}>
          <Link href="/methodology" className="mx-out">How scoring works →</Link>
          <Link href="/career-paths" className="mx-out">The five lenses →</Link>
          <Link href="/matrix" className="mx-out">Rank the whole field →</Link>
        </nav>
      </main>
      <PublicFooter />
    </div>
  );
}
