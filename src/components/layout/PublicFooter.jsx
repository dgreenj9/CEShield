// Shared colophon for every public page. A hairline rule, then three quiet
// columns: the mark with the independence line (a load-bearing brand claim,
// kept verbatim), the section index, and the year. Server-component
// compatible.

import Link from 'next/link';
import AtlasLogo from '@/components/atlas/AtlasLogo';

const LINKS = [
  ['/matrix', 'The field'],
  ['/credentials', 'Dossiers'],
  ['/career-paths', 'Lenses'],
  ['/methodology', 'Method'],
  ['/states', 'States'],
  ['/about', 'About'],
];

export default function PublicFooter({ maxWidth = 1280 }) {
  return (
    <footer className="atlas-footer">
      <div className="atlas-footer-inner" style={{ maxWidth }}>
        <div className="atlas-footer-mark">
          <Link href="/" aria-label="CE Shield home" className="atlas-footer-home">
            <AtlasLogo fontSize={15} width={23} height={16} />
          </Link>
          <span>Scores are never sponsored</span>
        </div>
        <nav aria-label="Footer" className="atlas-footer-links">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className="atlas-footer-link">{label}</Link>
          ))}
        </nav>
        <span className="atlas-footer-year">CE Shield © {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
