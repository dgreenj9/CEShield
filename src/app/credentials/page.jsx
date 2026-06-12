// /credentials — index of every credential dossier, grouped by discipline.
// Free, indexable, no auth — the SEO entry point for the per-credential
// library. Each row links to /credentials/<slug>.

import Link from 'next/link';
import { colors } from '@/utils/constants';
import PublicNav from '@/components/layout/PublicNav';
import { certifications as certData } from '@/utils/certificationData';
import citationsMeta from '@/data/citations_meta.json';
import { PATH_ORDER } from '@/utils/careerPaths';
import CredentialsBrowser from './_CredentialsBrowser';
import siteStats from '@/data/siteStats.json';

export const metadata = {
  title: `Credential library — ${siteStats.certCount} rehab certifications, scored and cited`,
  description:
    `Every credential CE Shield scores: PT, OT, SLP, AT, and informatics certifications, residencies, and degrees — each one with a published evidence dossier across five career-path lenses and ${siteStats.citationTotal.toLocaleString()} curated citations.`,
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
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAFAF6',
        backgroundImage: 'radial-gradient(circle, rgba(15, 23, 42, 0.05) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        color: colors.textDark,
      }}
    >
      <PublicNav sticky currentPath="/credentials" />

      <main className="cs-page-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>
        <header style={{ marginBottom: '1.5rem' }}>
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
            Credential library
          </div>
          <h1 className="cs-h1-clamp" style={{
            fontSize: 'clamp(1.8rem, 4.5vw, 2.6rem)',
            fontWeight: 600,
            margin: 0,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}>
            {ROWS.length} credentials, five lenses each.
          </h1>
          <p style={{ color: colors.slateMedium, marginTop: '1rem', fontSize: '1.05rem', maxWidth: 640 }}>
            Every rehab credential we score, with an evidence dossier published for each.
            Search by name, filter by discipline or lens, and pick one to see how it ranks
            across {totalCitations.toLocaleString()} curated citations.
          </p>
        </header>

        <CredentialsBrowser rows={ROWS} />

        <div
          style={{
            marginTop: '2.5rem',
            paddingTop: '1.5rem',
            borderTop: `1px solid ${colors.slateLight}`,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem 1.5rem',
            fontSize: '0.88rem',
          }}
        >
          <Link href="/methodology" style={{ color: colors.primaryBlue, textDecoration: 'none' }}>
            How scoring works →
          </Link>
          <Link href="/career-paths" style={{ color: colors.primaryBlue, textDecoration: 'none' }}>
            Explore the five career paths →
          </Link>
        </div>
      </main>
    </div>
  );
}
