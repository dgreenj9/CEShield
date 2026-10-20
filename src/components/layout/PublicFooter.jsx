// Shared colophon for every public page. One ink rule, three quiet
// columns: the mark, the section index, and the independence line (a
// load-bearing brand claim, kept verbatim). Server-component compatible.

import Link from 'next/link';

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
        <span>CE Shield © {new Date().getFullYear()}</span>
        <nav aria-label="Footer" className="atlas-footer-links">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className="atlas-footer-link">{label}</Link>
          ))}
        </nav>
        <span>Scores are never sponsored</span>
      </div>
    </footer>
  );
}
