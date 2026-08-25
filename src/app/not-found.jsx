// Branded 404. Renders for any unmatched route and for notFound() calls
// (e.g., /credentials/<bad-slug>). Recovers the visit instead of dead-
// ending it — most bad-slug traffic is misspelled credential names.

import Link from 'next/link';
import PublicNav from '@/components/layout/PublicNav';
import { A, FIG, INS, tabularNums } from '@/components/atlas/theme';

export const metadata = { title: 'Page not found' };

const secondaryLink = {
  display: 'inline-block',
  padding: '11px 20px',
  border: `1px solid ${A.ink}`,
  color: A.ink,
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: 14.5,
};

export default function NotFound() {
  return (
    <div className="atlas-ground" style={{ minHeight: '100vh', color: A.ink, display: 'flex', flexDirection: 'column' }}>
      <PublicNav />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 560, textAlign: 'center' }}>
          <div style={{ fontFamily: INS, fontSize: 96, fontWeight: 600, color: A.ruleMinor, letterSpacing: '-0.045em', lineHeight: 1, ...tabularNums }}>
            404
          </div>
          <h1 style={{ fontFamily: INS, fontSize: 29, fontWeight: 600, margin: '1rem 0 0.5rem', letterSpacing: '-0.03em' }}>
            That page isn&rsquo;t in the field.
          </h1>
          <p style={{ color: A.inkBody, lineHeight: 1.6, margin: 0, fontSize: 15.5 }}>
            If you were looking for a credential, the name in the URL may be
            misspelled. The full library is searchable.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <Link
              href="/matrix"
              style={{
                display: 'inline-block', padding: '12px 20px', background: A.accent,
                color: A.onAccent, textDecoration: 'none', fontWeight: 600, fontSize: 14.5,
              }}
            >
              Search the field →
            </Link>
            <Link href="/credentials" style={secondaryLink}>Dossiers</Link>
            <Link href="/states" style={secondaryLink}>State CE rules</Link>
          </div>
        </div>
      </main>

      <footer style={{ borderTop: `1px solid ${A.ink}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '1.25rem 2rem', fontFamily: FIG, fontSize: 12.5, letterSpacing: '0.02em', color: A.inkMuted, fontWeight: 600 }}>
          CE Shield · Scores are never sponsored
        </div>
      </footer>
    </div>
  );
}
