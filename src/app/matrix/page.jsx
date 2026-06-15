// /matrix — the interactive credential matrix, open to logged-out visitors.
//
// This is the public face of the scoring engine: the same CertificationsMatrix
// widget signed-in users get at /explore, minus the personal renewal banner and
// app shell. It's anonymous-friendly by construction — the matrix runs entirely
// on static credential data with localStorage-backed weight preferences, so no
// auth check or Supabase call is involved. The scoring is the credibility moat;
// we want it seen, indexed, and used before anyone is asked to sign up.
//
// Server component (for the metadata export + SSR'd hero/CTA). The matrix itself
// is a client component reading useSearchParams for deep links, so it sits inside
// a Suspense boundary to satisfy static rendering.

import { Suspense } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { colors } from '@/utils/constants';
import PublicNav from '@/components/layout/PublicNav';
import MatrixWidget from './_MatrixWidget';
import siteStats from '@/data/siteStats.json';

export const metadata = {
  title: 'The credential matrix',
  description:
    `Rank ${siteStats.certCount} rehab credentials across five career-path lenses with ` +
    `adjustable weights and ${siteStats.citationTotal.toLocaleString()} curated citations. ` +
    `Free to explore — no account required.`,
  alternates: { canonical: '/matrix' },
  openGraph: { title: 'The credential matrix · CE Shield', url: '/matrix' },
};

function MatrixFallback() {
  return (
    <div
      role="status"
      aria-label="Loading the matrix"
      style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}
    >
      <Loader2 className="w-7 h-7 animate-spin" style={{ color: colors.primaryBlue }} aria-hidden="true" />
      <span className="sr-only">Loading the matrix…</span>
    </div>
  );
}

export default function MatrixPage() {
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
      <PublicNav currentPath="/matrix" />

      <main className="cs-page-pad" style={{ maxWidth: 1200, margin: '0 auto', padding: '2.75rem 2rem 5rem', lineHeight: 1.6 }}>
        <header style={{ marginBottom: '1.75rem', maxWidth: 760 }}>
          <div
            className="font-mono"
            style={{
              fontSize: '0.72rem',
              color: colors.primaryPurple,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 600,
              marginBottom: 10,
            }}
          >
            The credential matrix
          </div>
          <h1 className="cs-h1-clamp" style={{ fontSize: '2rem', lineHeight: 1.15, margin: '0 0 0.75rem', fontWeight: 700 }}>
            Find the certification worth your next investment
          </h1>
          <p style={{ color: colors.slateMedium, margin: 0 }}>
            {siteStats.certCount} credentials across five career-path lenses,{' '}
            {siteStats.citationTotal.toLocaleString()} curated citations, six adjustable
            dimensions per lens. Pick a lens and tune the weights — the rankings update
            live.{' '}
            <Link href="/career-paths" style={{ color: colors.primaryBlue }}>
              Learn about the paths
            </Link>
            .
          </p>
        </header>

        <Suspense fallback={<MatrixFallback />}>
          <MatrixWidget />
        </Suspense>

        {/* Conversion gate. The matrix itself is fully open; an account adds the
            personal layer — CE compliance tracking against renewal deadlines and
            a saved credential profile. */}
        <section
          aria-label="Create a free account"
          style={{
            marginTop: '3rem',
            padding: '2rem',
            background: 'white',
            border: `1px solid ${colors.slateLight}`,
            borderRadius: 12,
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
            Track the hours these credentials earn
          </h2>
          <p style={{ color: colors.slateMedium, maxWidth: 560, margin: '0 auto 1.25rem' }}>
            Create a free account to log CE hours against your license renewal deadline,
            save your weighted view of the matrix, and build your credential profile.
            Students: CE Shield is free for you, always.
          </p>
          <Link
            href="/sign-in"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.6rem',
              background: colors.primaryBlue,
              color: 'white',
              textDecoration: 'none',
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Create a free account
          </Link>
        </section>
      </main>
    </div>
  );
}
