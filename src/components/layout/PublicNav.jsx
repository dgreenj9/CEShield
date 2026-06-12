// Shared nav bar for all public (unauthenticated) pages.
//
// One consistent pattern: clickable logo on the left (auth-aware — home for
// visitors, dashboard for signed-in users), secondary links + a CTA on the
// right. Secondary links collapse on mobile via .cs-nav-secondary.
//
// Server-component compatible (LogoLink is the only client child).

import Link from 'next/link';
import { colors } from '@/utils/constants';
import LogoLink from '@/components/common/LogoLink';

const SECONDARY_LINKS = [
  { href: '/credentials', label: 'Credentials' },
  { href: '/career-paths', label: 'Career Paths' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/about', label: 'About' },
];

export default function PublicNav({
  sticky = false,
  // Optional custom CTA node (e.g. the credential page's "Open in matrix").
  // Defaults to a Sign in button.
  cta = null,
  // Hide the link matching the current page (pass its href).
  currentPath = null,
}) {
  return (
    <nav
      className="cs-public-nav"
      style={{
        padding: '1rem 2rem',
        borderBottom: `1px solid ${colors.slateLight}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'white',
        ...(sticky ? { position: 'sticky', top: 0, zIndex: 10 } : {}),
      }}
    >
      <LogoLink size="medium" />
      <div className="cs-nav-links" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {SECONDARY_LINKS.filter((l) => l.href !== currentPath).map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="cs-nav-secondary"
            style={{ color: colors.slateMedium, textDecoration: 'none', fontSize: '0.95rem' }}
          >
            {l.label}
          </Link>
        ))}
        {cta || (
          <Link
            href="/sign-in"
            style={{
              padding: '0.5rem 0.9rem',
              background: colors.primaryBlue,
              color: 'white',
              textDecoration: 'none',
              borderRadius: 6,
              fontSize: '0.88rem',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
