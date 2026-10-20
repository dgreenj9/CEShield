// Shared nav bar for all public (unauthenticated) pages.
//
// A quiet translucent plum bar over a hairline rule, in the register of the
// portfolio stage: blurred ground, light type, the current section marked by
// a short peach rule under the label. Server-component compatible; the link
// row is a tiny client island so the current section is detected from the
// URL (nested routes included), with `currentPath` as an explicit override.
// Below 720px the section links drop to their own horizontally swipeable
// row so the wordmark and the CTA never wrap. Every target is 44px tall.

import Link from 'next/link';
import AtlasLogo from '@/components/atlas/AtlasLogo';
import PublicNavLinks from './PublicNavLinks';

export const SECONDARY_LINKS = [
  { href: '/matrix', label: 'The field' },
  { href: '/credentials', label: 'Dossiers' },
  { href: '/career-paths', label: 'Lenses' },
  { href: '/methodology', label: 'Method' },
  { href: '/states', label: 'States' },
];

export default function PublicNav({
  sticky = true,
  // Optional custom CTA node (e.g. the landing page's "Explore the field").
  // Defaults to a Sign in button.
  cta = null,
  // Mark the link matching the current page (pass its href). Optional: the
  // link row also reads the URL.
  currentPath = null,
  maxWidth = 1280,
}) {
  return (
    <>
      <a href="#main" className="skip-to-main">Skip to content</a>
      <nav aria-label="Primary" className={`atlas-nav${sticky ? ' atlas-nav-sticky' : ''}`}>
        <div className="atlas-nav-inner" style={{ maxWidth }}>
          <Link href="/" className="atlas-nav-home" aria-label="CE Shield home">
            <AtlasLogo fontSize={16.5} />
          </Link>
          <PublicNavLinks links={SECONDARY_LINKS} currentPath={currentPath} />
          <div className="atlas-nav-cta">
            {cta || (
              <Link href="/sign-in" className="atlas-nav-btn">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
