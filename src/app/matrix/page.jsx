// /matrix — the Atlas Matrix instrument ("Table 1"), open to logged-out
// visitors.
//
// This is the public face of the scoring engine: rank all credentials for a
// chosen lens, recalibrate the weights, and read the evidence behind any one
// of them. It's anonymous-friendly by construction — the instrument runs
// entirely on static credential data, so no auth check or Supabase call is
// involved. The scoring is the credibility moat; we want it seen, indexed,
// and used before anyone is asked to sign up.
//
// Server component (for the metadata export). The instrument is a client
// component reading useSearchParams for deep links, so it sits inside a
// Suspense boundary to satisfy static rendering.

import { Suspense } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import PublicNav from '@/components/layout/PublicNav';
import AtlasMatrix from './_AtlasMatrix';
import siteStats from '@/data/siteStats.json';

export const metadata = {
  title: 'The credential field, ranked',
  description:
    `Rank ${siteStats.certCount} rehab credentials across five career-path lenses with ` +
    `adjustable weights and ${siteStats.citationTotal.toLocaleString()} curated citations. ` +
    `Free to explore. No account required.`,
  alternates: { canonical: '/matrix' },
  openGraph: { title: 'The credential field, ranked · CE Shield', url: '/matrix' },
};

function MatrixFallback() {
  return (
    <div
      role="status"
      aria-label="Loading the field"
      style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}
    >
      <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#235E6B' }} aria-hidden="true" />
      <span className="sr-only">Loading the field…</span>
    </div>
  );
}

export default function MatrixPage() {
  return (
    <div className="atlas-ground" style={{ minHeight: '100vh', color: '#1B1A17' }}>
      <PublicNav currentPath="/matrix" />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 2rem 5rem' }}>
        <Suspense fallback={<MatrixFallback />}>
          <AtlasMatrix />
        </Suspense>

        {/* Conversion band. The instrument itself is fully open; an account
            adds the personal layer — the ledger, claims, exports. */}
        <section
          aria-label="Create a free account"
          style={{
            marginTop: '2rem',
            border: '1px solid #1B1A17',
            padding: '1rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            flexWrap: 'wrap',
            background: '#F2F1E9',
          }}
        >
          <span style={{ fontSize: 14, color: '#45433C', maxWidth: '38em' }}>
            <strong style={{ color: '#1B1A17' }}>The personal layer.</strong>{' '}
            Log hours against your renewal. Claim credentials. Export the
            binder. Free for students, always.
          </span>
          <Link
            href="/sign-in"
            style={{
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14.5,
              background: '#235E6B',
              color: '#FAFAF5',
              padding: '12px 20px',
              whiteSpace: 'nowrap',
            }}
          >
            Create a free account →
          </Link>
        </section>
      </main>
    </div>
  );
}
