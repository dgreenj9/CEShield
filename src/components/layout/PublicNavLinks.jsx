'use client';

// The section links of the public nav. Reads the URL so nested pages
// (a dossier under /credentials, a state under /states) mark their section.

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PublicNavLinks({ links, currentPath = null }) {
  const pathname = usePathname() || '';
  const isCurrent = (href) =>
    currentPath ? currentPath === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <div className="atlas-nav-links">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="atlas-nav-link"
          aria-current={isCurrent(l.href) ? 'page' : undefined}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
