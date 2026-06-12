// Branded 404. Renders for any unmatched route and for notFound() calls
// (e.g., /credentials/<bad-slug>). Recovers the visit instead of dead-
// ending it — most bad-slug traffic is misspelled credential names.

import Link from 'next/link';
import { Compass, Shield, FileText } from 'lucide-react';
import { colors } from '@/utils/constants';
import LogoLink from '@/components/common/LogoLink';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAFAF6',
        backgroundImage: 'radial-gradient(circle, rgba(15, 23, 42, 0.05) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        color: colors.textDark,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <nav className="cs-public-nav" style={{
        padding: '1rem 2rem',
        borderBottom: `1px solid ${colors.slateLight}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'white',
      }}>
        <LogoLink size="medium" />
      </nav>

      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
      }}>
        <div style={{ maxWidth: 520, textAlign: 'center' }}>
          <div
            className="font-mono tabular-nums"
            style={{
              fontSize: '3.5rem',
              fontWeight: 600,
              color: colors.slateLight,
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            404
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '1rem 0 0.5rem', letterSpacing: '-0.015em' }}>
            That page doesn&rsquo;t exist.
          </h1>
          <p style={{ color: colors.slateMedium, lineHeight: 1.6, margin: 0 }}>
            If you were looking for a credential, the name in the URL may be
            misspelled — the full library is searchable.
          </p>
          <div style={{
            marginTop: '2rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            justifyContent: 'center',
          }}>
            <Link
              href="/credentials"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '0.65rem 1.25rem', background: colors.primaryBlue,
                color: 'white', textDecoration: 'none', borderRadius: 8,
                fontWeight: 500, fontSize: '0.92rem',
              }}
            >
              <Shield size={15} aria-hidden="true" /> Search credentials
            </Link>
            <Link
              href="/career-paths"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '0.65rem 1.25rem', background: 'white',
                border: `1px solid ${colors.slateLight}`, color: colors.slateMedium,
                textDecoration: 'none', borderRadius: 8, fontWeight: 500, fontSize: '0.92rem',
              }}
            >
              <Compass size={15} aria-hidden="true" /> Career paths
            </Link>
            <Link
              href="/states"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '0.65rem 1.25rem', background: 'white',
                border: `1px solid ${colors.slateLight}`, color: colors.slateMedium,
                textDecoration: 'none', borderRadius: 8, fontWeight: 500, fontSize: '0.92rem',
              }}
            >
              <FileText size={15} aria-hidden="true" /> State CE rules
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
