// Shared nav bar for all public (unauthenticated) pages — Atlas chrome.
//
// Sticky blurred paper bar over a 1px ink rule. The current section is
// marked with a 2px petrol bottom border, not a fill. Server-component
// compatible (no hooks).

import Link from 'next/link';
import AtlasLogo from '@/components/atlas/AtlasLogo';
import { A, FIG } from '@/components/atlas/theme';

const SECONDARY_LINKS = [
  { href: '/matrix', label: 'The field' },
  { href: '/credentials', label: 'Dossiers' },
  { href: '/learn', label: 'CE catalog' },
  { href: '/career-paths', label: 'Lenses' },
  { href: '/methodology', label: 'Method' },
];

export default function PublicNav({
  sticky = true,
  // Optional custom CTA node (e.g. the landing page's "Explore the field →").
  // Defaults to a Sign in button.
  cta = null,
  // Mark the link matching the current page (pass its href).
  currentPath = null,
  maxWidth = 1280,
}) {
  return (
    <nav
      aria-label="Primary"
      style={{
        ...(sticky ? { position: 'sticky', top: 0, zIndex: 100 } : {}),
        background: 'rgba(250,250,245,0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${A.ink}`,
      }}
    >
      <div
        style={{
          maxWidth,
          margin: '0 auto',
          padding: '0.85rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
        }}
      >
        <Link href="/" style={{ textDecoration: 'none' }} aria-label="CE Shield home">
          <AtlasLogo />
        </Link>
        <div className="atlas-nav-links" style={{ gap: '1.6rem', fontFamily: FIG, fontSize: 14.5, fontWeight: 500 }}>
          {SECONDARY_LINKS.map((l) => {
            const on = l.href === currentPath;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={on ? 'page' : undefined}
                style={{
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  color: on ? A.ink : A.inkMuted,
                  fontWeight: on ? 700 : 500,
                  borderBottom: on ? `2px solid ${A.accent}` : '2px solid transparent',
                  paddingBottom: 2,
                }}
              >
                {l.label}
              </Link>
            );
          })}
          {cta || (
            <Link
              href="/sign-in"
              style={{
                textDecoration: 'none',
                fontWeight: 600,
                background: A.accent,
                color: A.onAccent,
                padding: '0.5rem 1rem',
                whiteSpace: 'nowrap',
              }}
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
