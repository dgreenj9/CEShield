// /states/<state>-<license>-ce-requirements — per-state SSG landing page.
// One static HTML page per (state, license) combo, generated at build time.
// This is the SEO payoff of the Next.js migration: each page has its own
// crawlable URL with state-specific keywords in title, h1, and body.
//
// Atlas: echoes the Compliance Ledger's language — big tabular numerals,
// ruled mandatory-category rows, bordered format-cap tiles, source footer.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import PublicNav from '@/components/layout/PublicNav';
import {
  allStateLicenseEntries,
  parseStateLicenseSlug,
  getRulesFor,
} from '@/data/stateRules';
import { A, FIG, INS, tabularNums } from '@/components/atlas/theme';

// ─── SSG plumbing ─────────────────────────────────────────────────────────

export const dynamicParams = false;

export async function generateStaticParams() {
  return allStateLicenseEntries().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }) {
  // Next 16: params is a Promise in app routes. Await it.
  const { slug } = await params;
  const parsed = parseStateLicenseSlug(slug);
  if (!parsed) return {};
  const r = getRulesFor(parsed.state, parsed.licenseType);
  if (!r) return {};
  const title = `${r.jurisdictionName} ${parsed.licenseType} CE requirements (${r.totalHours} hours / ${r.cycleYears} years)`;
  // States without mandatory categories (e.g. WI OT) get a clean sentence
  // instead of "including mandatory  hours" with an empty list.
  const mandatoryKeys = Object.keys(r.mandatory || {}).filter(
    (k) => (r.mandatory?.[k] || 0) > 0,
  );
  const humanize = (k) =>
    k.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
  const mandatoryClause = mandatoryKeys.length > 0
    ? `, including mandatory ${mandatoryKeys.map(humanize).join(', ')} hours`
    : '';
  const description =
    `Continuing-education requirements for ${r.jurisdictionName} ` +
    `${parsed.licenseType === 'PT' ? 'physical therapists' : 'occupational therapists'}: ` +
    `${r.totalHours} hours every ${r.cycleYears} years${mandatoryClause}. ` +
    `Track everything in one place with CE Shield.`;
  return {
    title,
    description,
    alternates: { canonical: `/states/${slug}` },
    openGraph: { title, description, url: `/states/${slug}` },
  };
}

// ─── Render ───────────────────────────────────────────────────────────────

const humanCategory = (key) =>
  key.replace(/([A-Z])/g, ' $1').trim().replace(/^./, (s) => s.toUpperCase());

const headLabel = {
  fontFamily: FIG, fontSize: 12.5, fontWeight: 700, color: A.inkMuted,
  letterSpacing: '0.02em', borderTop: `2px solid ${A.ink}`, paddingTop: 10, marginBottom: 14,
};

export default async function Page({ params }) {
  const { slug } = await params;
  const parsed = parseStateLicenseSlug(slug);
  if (!parsed) notFound();
  const r = getRulesFor(parsed.state, parsed.licenseType);
  if (!r) notFound();

  const licenseLong =
    parsed.licenseType === 'PT' ? 'Physical Therapists' : 'Occupational Therapists';
  const otherLicense = parsed.licenseType === 'PT' ? 'OT' : 'PT';
  const otherEntry = allStateLicenseEntries().find(
    (e) => e.state === parsed.state && e.licenseType === otherLicense,
  );

  // Breadcrumb structured data; "<" escaped to prevent </script> breakout.
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'CE requirements by state', item: 'https://ceshield.com/states' },
      { '@type': 'ListItem', position: 2, name: `${r.jurisdictionName} ${parsed.licenseType}`, item: `https://ceshield.com/states/${slug}` },
    ],
  }).replace(/</g, '\\u003c');

  const mandatoryEntries = Object.entries(r.mandatory || {}).filter(([, v]) => v > 0);

  return (
    <div className="atlas-ground" style={{ minHeight: '100vh', color: A.ink }}>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <PublicNav />

      <main className="cs-page-pad" style={{ maxWidth: 860, margin: '0 auto', padding: '3rem 2rem 6rem', lineHeight: 1.65 }}>
        <Link
          href="/states"
          style={{
            display: 'inline-block', fontFamily: FIG, color: A.accent, textDecoration: 'none',
            fontWeight: 700, fontSize: 13, marginBottom: '1.25rem',
          }}
        >
          ← All states
        </Link>
        <header style={{ marginBottom: '2rem' }}>
          <div style={{ fontFamily: FIG, fontSize: 12.5, color: A.inkMuted, fontWeight: 600, letterSpacing: '0.02em', marginBottom: 8 }}>
            {r.jurisdictionName} · {parsed.licenseType} · {r.totalHours}h / {r.cycleYears}yr
          </div>
          <h1
            className="cs-h1-clamp"
            style={{ fontFamily: INS, fontSize: 40, fontWeight: 600, margin: 0, letterSpacing: '-0.025em', lineHeight: 1.05 }}
          >
            {r.jurisdictionName} {parsed.licenseType} CE requirements
          </h1>
          <p style={{ color: A.inkBody, marginTop: '0.75rem', fontSize: 16.5, maxWidth: '40em' }}>
            {r.totalHours} hours of continuing education every {r.cycleYears}{' '}
            years for {licenseLong.toLowerCase()} licensed in {r.jurisdictionName}.
            Below: the full breakdown, the mandatory categories most CE platforms
            miss, and a free tracker to keep you renewal-ready.
          </p>

          {r.verified === false && (
            <div
              role="alert"
              style={{
                marginTop: '1.25rem', padding: '0.85rem 1.4rem',
                border: `1px dashed ${A.ink}`, background: A.notice,
                display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap',
                fontSize: 14,
              }}
            >
              <span style={{ fontFamily: FIG, fontSize: 12, letterSpacing: '0.02em', fontWeight: 700, color: A.warn, whiteSpace: 'nowrap' }}>
                Draft state
              </span>
              <span style={{ color: A.inkBody }}>
                These values are a first draft based on{' '}
                <a href={r.boardUrl} target="_blank" rel="noopener noreferrer" style={{ color: A.accent, fontWeight: 700 }}>
                  {r.citation}
                </a>
                . Verify with your licensing board before relying on totals.
              </span>
            </div>
          )}
        </header>

        {/* Stat band */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            border: `1px solid ${A.ink}`,
            background: A.paper,
            marginBottom: '2.5rem',
          }}
        >
          {[
            { label: 'total CE hours', value: r.totalHours },
            { label: 'cycle length', value: `${r.cycleYears} yrs` },
            { label: 'mandatory categories', value: mandatoryEntries.length },
            { label: 'first renewal exempt', value: r.firstRenewalExempt ? 'Yes' : 'No' },
          ].map((s, i, arr) => (
            <div
              key={s.label}
              style={{
                padding: '1.2rem 1.4rem',
                borderRight: i < arr.length - 1 ? `1px solid ${A.ruleMinor}` : 'none',
              }}
            >
              <div style={{ fontFamily: FIG, fontSize: 30, fontWeight: 800, lineHeight: 1, ...tabularNums }}>
                {s.value}
              </div>
              <div style={{ fontFamily: FIG, fontSize: 11.5, letterSpacing: '0.02em', color: A.inkMuted, fontWeight: 600, marginTop: 5 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Mandatory categories */}
        {mandatoryEntries.length > 0 && (
          <section style={{ marginBottom: '2.5rem' }}>
            <div style={headLabel}>Mandatory categories</div>
            <div style={{ border: `1px solid ${A.ink}`, background: A.paper }}>
              {mandatoryEntries.map(([key, val], i, arr) => (
                <div
                  key={key}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    padding: '0.8rem 1.4rem',
                    borderBottom: i < arr.length - 1 ? `1px solid ${A.ruleFaintest}` : 'none',
                  }}
                >
                  <span style={{ fontSize: 14.5, color: A.ink }}>{humanCategory(key)}</span>
                  <span style={{ fontFamily: FIG, fontWeight: 700, fontSize: 14.5, color: A.ink, ...tabularNums }}>
                    {val} {val === 1 ? 'hour' : 'hours'}
                  </span>
                </div>
              ))}
            </div>
            {r.notes?.length > 0 && (
              <ul
                style={{
                  marginTop: '1rem', paddingLeft: '1.25rem',
                  color: A.inkMuted, fontSize: 13.5, lineHeight: 1.6,
                }}
              >
                {r.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            )}
          </section>
        )}

        {/* Format caps */}
        {Object.keys(r.limits || {}).length > 0 && (
          <section style={{ marginBottom: '2.5rem' }}>
            <div style={headLabel}>Format caps</div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 10,
              }}
            >
              {Object.entries(r.limits).map(([key, val]) => (
                <div key={key} style={{ border: `1px solid ${A.ruleFaint}`, background: A.paper, padding: '10px 12px' }}>
                  <div style={{ fontFamily: FIG, fontSize: 17, fontWeight: 800, ...tabularNums }}>
                    {val}
                    <span style={{ fontSize: 12, color: A.inkMuted, fontWeight: 600 }}> h cap</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: A.inkMuted, marginTop: 3, textTransform: 'capitalize' }}>
                    {humanCategory(key)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section
          style={{
            marginTop: '3rem', padding: '1.25rem 1.75rem',
            border: `1px solid ${A.ink}`, background: A.band,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '1.5rem', flexWrap: 'wrap',
          }}
        >
          <div style={{ maxWidth: '34em' }}>
            <h2 style={{ fontFamily: INS, fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: '-0.025em', color: A.ink }}>
              Track {r.jurisdictionName} {parsed.licenseType} CE with CE Shield
            </h2>
            <p style={{ color: A.inkBody, lineHeight: 1.55, margin: '0.4rem 0 0', fontSize: 14 }}>
              Hours, mandatory categories, and certificate uploads in one ledger,
              plus an evidence-scored credential field. Free during beta.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              href="/sign-in"
              style={{
                textDecoration: 'none', fontWeight: 600, fontSize: 14.5,
                background: A.accent, color: A.onAccent, padding: '12px 20px', whiteSpace: 'nowrap',
              }}
            >
              Start tracking →
            </Link>
            <Link
              href="/matrix"
              style={{
                textDecoration: 'none', fontWeight: 600, fontSize: 14.5,
                border: `1px solid ${A.ink}`, color: A.ink, padding: '11px 20px', whiteSpace: 'nowrap',
              }}
            >
              See the field
            </Link>
          </div>
        </section>

        {/* Source footer + cross-links */}
        <p style={{ fontFamily: FIG, fontSize: 11.5, color: A.inkMuted, margin: '1.5rem 0 0', letterSpacing: '0.02em' }}>
          Source: {r.citation}
          {r.lastReviewed ? ` · last reviewed ${r.lastReviewed}` : ''} ·{' '}
          <a href={r.boardUrl} target="_blank" rel="noopener noreferrer" style={{ color: A.accent, fontWeight: 700, textDecoration: 'none' }}>
            Read the rule ↗
          </a>
        </p>
        <p style={{ fontFamily: FIG, fontSize: 12.5, color: A.inkMuted, margin: '0.75rem 0 0' }}>
          {otherEntry && (
            <Link
              href={`/states/${otherEntry.slug}`}
              style={{ color: A.accent, fontWeight: 700, textDecoration: 'none', marginRight: '1.25rem' }}
            >
              {r.jurisdictionName} {otherLicense} requirements →
            </Link>
          )}
          <Link href="/states" style={{ color: A.accent, fontWeight: 700, textDecoration: 'none' }}>
            All states
          </Link>
        </p>
      </main>
    </div>
  );
}
