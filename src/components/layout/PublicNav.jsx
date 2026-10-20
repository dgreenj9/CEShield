// Shared nav bar for all public (unauthenticated) pages — Atlas chrome.
//
// Sticky blurred paper bar over a 1px ink rule. The current section is
// marked with a 2px petrol bottom border, not a fill. Server-component
// compatible (no hooks): the responsive behavior lives in index.css
// (`.atlas-nav-*`). Below 720px the section links drop to their own
// horizontally scrollable row so the wordmark and the CTA never wrap.

import Link from 'next/link';
import AtlasLogo from '@/components/atlas/AtlasLogo';

const SECONDARY_LINKS = [
  { href: '/matrix', label: 'The field' },
  { href: '/credentials', label: 'Dossiers' },
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
    <>
      <a href="#main" className="skip-to-main">Skip to content</a>
      <nav aria-label="Primary" className={`atlas-nav${sticky ? ' atlas-nav-sticky' : ''}`}>
        <div className="atlas-nav-inner" style={{ maxWidth }}>
          <Link href="/" className="atlas-nav-home" aria-label="CE Shield home">
            <AtlasLogo />
          </Link>
          <div className="atlas-nav-links">
            {SECONDARY_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="atlas-nav-link"
                aria-current={l.href === currentPath ? 'page' : undefined}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="atlas-nav-cta">
            {cta || (
              <Link href="/sign-in" className="atlas-btn atlas-btn-primary atlas-btn-sm">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
