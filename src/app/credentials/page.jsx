// /credentials — index of every credential dossier, grouped by discipline.
// Free, indexable, no auth — the SEO entry point for the per-credential
// library. Each row links to /credentials/<slug>.

import Link from 'next/link';
import PublicNav from '@/components/layout/PublicNav';
import PublicFooter from '@/components/layout/PublicFooter';
import { certifications as certData } from '@/utils/certificationData';
import citationsMeta from '@/data/citations_meta.json';
import { PATH_ORDER } from '@/utils/careerPaths';
import { A, INS, eyebrow, tabularNums } from '@/components/atlas/theme';
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
    <div className="atlas-ground" style={{ minHeight: '100vh', color: A.ink }}>
      <PublicNav currentPath="/credentials" />

      <main id="main" className="atlas-wrap" style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 2rem 5rem' }}>
        <header style={{ marginBottom: '1.5rem' }}>
          <h1
            className="cs-h1-clamp"
            style={{
              fontFamily: INS,
              fontWeight: 600,
              fontSize: 40,
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
              margin: 0,
            }}
          >
            {ROWS.length} credentials, one dossier each.
          </h1>
          <div style={{ ...eyebrow(), marginTop: 10, ...tabularNums }}>
            The dossier library · {totalCitations.toLocaleString()} curated citations
          </div>
          <p style={{ color: A.inkBody, marginTop: '1rem', fontSize: 16, lineHeight: 1.6, maxWidth: '40em' }}>
            Each dossier holds a credential&rsquo;s score in every lens it is
            scored on, the reasoning per dimension, and its sources.
          </p>
        </header>

        <CredentialsBrowser rows={ROWS} />

        <div
          style={{
            marginTop: '2.5rem',
            paddingTop: '1.25rem',
            borderTop: `1px solid ${A.ink}`,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem 1.5rem',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <Link href="/methodology" className="atlas-link" style={{ textDecoration: 'none', padding: '10px 0' }}>
            How scoring works →
          </Link>
          <Link href="/career-paths" className="atlas-link" style={{ textDecoration: 'none', padding: '10px 0' }}>
            The five lenses →
          </Link>
          <Link href="/matrix" className="atlas-link" style={{ textDecoration: 'none', padding: '10px 0' }}>
            Rank the whole field →
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
