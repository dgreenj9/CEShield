import Link from 'next/link';
import links from '@/data/education/credentialLinks.json';
import { inferSubjects } from '@/utils/educationCatalog';
import { A, FIG } from '@/components/atlas/theme';

const LABELS = { program: 'Program details', directory: 'Browse training', resource: 'Official information' };

export default function CredentialLinks({ slug }) {
  const entry = links[slug];
  if (!entry) return null;
  const subject = inferSubjects(entry.credentialName)[0];
  return (
    <section aria-label="Training and provider links" style={{ borderTop: `1px solid ${A.ruleMinor}`, marginTop: 20, paddingTop: 14, fontFamily: FIG }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 10px' }}>Training & provider links</h3>
      {entry.links.map(link => (
        <div key={link.url} style={{ marginBottom: 12 }}>
          <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: A.accent, fontSize: 14, fontWeight: 700 }}>
            {link.provider} · {LABELS[link.kind]} ↗<span className="sr-only"> (opens in a new tab)</span>
          </a>
          {link.note && <p style={{ fontSize: 12, color: A.inkMuted, margin: '4px 0', lineHeight: 1.5 }}>{link.note}</p>}
        </div>
      ))}
      <div style={{ fontSize: 12, color: A.inkMuted, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span>Sources reviewed {entry.links[0].reviewedOn}. Confirm availability with the provider.</span>
        <Link href={subject ? `/learn?subject=${subject}` : '/learn'} style={{ color: A.accent }}>Browse CE courses →</Link>
      </div>
    </section>
  );
}
