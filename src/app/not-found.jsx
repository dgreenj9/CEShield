// Branded 404. Renders for any unmatched route and for notFound() calls
// (e.g., /credentials/<bad-slug>). Recovers the visit instead of dead-
// ending it — most bad-slug traffic is misspelled credential names.

import Link from 'next/link';
import PublicNav from '@/components/layout/PublicNav';
import PublicFooter from '@/components/layout/PublicFooter';
import { A, tabularNums, kicker, display } from '@/components/atlas/theme';

export const metadata = { title: 'Page not found' };


export default function NotFound() {
  return (
    <div className="atlas-ground" style={{ minHeight: '100vh', color: A.ink, display: 'flex', flexDirection: 'column' }}>
      <PublicNav />

      <main id="main" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
        <div className="plum-rise" style={{ maxWidth: 600, textAlign: 'center' }}>
          <div style={{ ...kicker(), ...tabularNums }}>Error 404</div>
          <h1 style={{ ...display('clamp(2.1rem, 5vw, 3.4rem)', 350), margin: '1.25rem 0 1rem' }}>
            That page isn&rsquo;t <em style={{ fontStyle: 'normal', color: A.accentMid }}>in the field.</em>
          </h1>
          <p style={{ color: A.inkBody, lineHeight: 1.75, margin: '0 auto', fontSize: 15.5, maxWidth: '30em' }}>
            If you were looking for a credential, the name in the URL may be
            misspelled. The full library is searchable.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <Link href="/matrix" className="atlas-btn atlas-btn-primary" style={{ fontSize: 14.5, padding: '12px 20px' }}>
              Search the field →
            </Link>
            <Link href="/credentials" className="atlas-btn atlas-btn-secondary" style={{ fontSize: 14.5, padding: '12px 20px' }}>Dossiers</Link>
            <Link href="/states" className="atlas-btn atlas-btn-secondary" style={{ fontSize: 14.5, padding: '12px 20px' }}>State CE rules</Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
