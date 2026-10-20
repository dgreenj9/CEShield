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
import PublicFooter from '@/components/layout/PublicFooter';
import siteStats from '@/data/siteStats.json';
import {
  allStateLicenseEntries,
  parseStateLicenseSlug,
  getRulesFor,
} from '@/data/stateRules';
import { A, FIG, tabularNums, kicker, display, panel, hairHead, kpi, VIZ, LINE_FAINT } from '@/components/atlas/theme';

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
    `${r.totalHours} hours every ${r.cycleYears} years${mandatoryClause}, per ${r.citation}. ` +
    `Tracked free with CE Shield.`;
  return {
    title,
    description,
    alternates: { canonical: `/states/${slug}` },
    openGraph: { title, description, url: `/states/${slug}` },
  };
}

// ─── Render ───────────────────────────────────────────────────────────────

// Sentence case per the voice doc: "Sexual harassment", not "Sexual Harassment".
const humanCategory = (key) =>
  key.replace(/([A-Z])/g, ' $1').trim().toLowerCase().replace(/^./, (s) => s.toUpperCase());

const headLabel = { ...hairHead, marginBottom: 16 };

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
  const mandatoryHours = mandatoryEntries.reduce((a, [, v]) => a + v, 0);

  return (
    <div className="atlas-ground" style={{ minHeight: '100vh', color: A.ink }}>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <PublicNav />

      <main id="main" className="atlas-wrap" style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 2rem 6rem', lineHeight: 1.65 }}>
        <div style={{ maxWidth: 880 }}>
        <Link
          href="/states"
          className="atlas-link"
          style={{
            display: 'inline-block', fontFamily: FIG, textDecoration: 'none',
            fontWeight: 500, fontSize: 13, padding: '10px 0', marginBottom: '1.25rem',
          }}
        >
          ← All states
        </Link>
        <header className="plum-rise" style={{ marginBottom: '2.5rem' }}>
          <div style={{ ...kicker(), marginBottom: 18, ...tabularNums }}>
            {r.jurisdictionName} · {parsed.licenseType} · {r.totalHours}h / {r.cycleYears}yr
          </div>
          <h1 style={display('clamp(2.2rem, 5vw, 3.75rem)', 350)}>
            {r.jurisdictionName} {parsed.licenseType} <em style={{ fontStyle: 'normal', color: A.accentMid }}>CE requirements</em>
          </h1>
          <p style={{ color: A.inkBody, marginTop: '1.5rem', fontSize: 16, lineHeight: 1.75, maxWidth: '38em' }}>
            {r.totalHours} hours of continuing education every {r.cycleYears}{' '}
            years for {licenseLong.toLowerCase()} licensed in {r.jurisdictionName},
            per {r.citation}.
            {mandatoryEntries.length > 0
              ? ` Of those, ${mandatoryHours} go to ${mandatoryEntries.length} mandatory ${mandatoryEntries.length === 1 ? 'category' : 'categories'}.`
              : ' No category is mandatory.'}
          </p>

          {r.verified === false && (
            <div
              role="note"
              style={{
                marginTop: '1.25rem', padding: '0.9rem 1.4rem', borderRadius: 6,
                border: '1px solid rgba(224,168,90,0.35)', background: 'rgba(224,168,90,0.06)',
                display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap',
                fontSize: 14,
              }}
            >
              <span style={{ ...kicker(10.5, A.warn), whiteSpace: 'nowrap' }}>
                Draft state
              </span>
              <span style={{ color: A.inkBody }}>
                These values are a first draft based on{' '}
                <a href={r.boardUrl} target="_blank" rel="noopener noreferrer" className="atlas-link" style={{ fontWeight: 500 }}>
                  {r.citation}
                </a>
                . Verify with your licensing board before relying on totals.
              </span>
            </div>
          )}
        </header>

        {/* Stat band */}
        <div
          style={{ ...panel, marginBottom: '3.5rem' }}
          className="atlas-state-stats"
        >
          {[
            { label: 'total CE hours', value: r.totalHours },
            { label: 'cycle length', value: `${r.cycleYears} yrs` },
            { label: 'mandatory categories', value: mandatoryEntries.length },
            { label: 'first renewal exempt', value: r.firstRenewalExempt ? 'Yes' : 'No' },
          ].map((s, i, arr) => (
            <div
              key={s.label}
              style={{ padding: '1.25rem 1.4rem 1.2rem' }}
            >
              <div style={{ fontFamily: FIG, fontSize: 12, color: A.inkMuted, fontWeight: 400 }}>
                {s.label.charAt(0).toUpperCase() + s.label.slice(1)}
              </div>
              <div style={{ ...kpi(32), marginTop: 10 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Mandatory categories */}
        {mandatoryEntries.length > 0 && (
          <section style={{ marginBottom: '3.5rem' }}>
            <div style={headLabel}>Mandatory categories</div>
            {/* The cycle's hour budget: every mandatory category as a
                segment of the total, the remainder open. */}
            <div style={{ marginBottom: 14 }}>
              <div
                role="img"
                aria-label={`${mandatoryHours} of ${r.totalHours} hours assigned to mandatory categories; ${r.totalHours - mandatoryHours} open.`}
                style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: VIZ.track }}
              >
                {mandatoryEntries.map(([key, val], i) => (
                  <span
                    key={key}
                    title={`${humanCategory(key)} · ${val} h`}
                    style={{ width: `${(val / r.totalHours) * 100}%`, background: VIZ.c2, borderLeft: i ? `2px solid ${A.paper}` : 'none' }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 8, fontSize: 12, fontWeight: 400, color: A.inkMuted, ...tabularNums }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><i aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 2, background: VIZ.c2 }} /> {mandatoryHours} h mandatory</span>
                <span>{r.totalHours - mandatoryHours} h open · {r.totalHours} h total</span>
              </div>
            </div>
            <div style={panel}>
              {mandatoryEntries.map(([key, val], i, arr) => (
                <div
                  key={key}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    padding: '0.85rem 1.4rem',
                    borderBottom: i < arr.length - 1 ? `1px solid ${LINE_FAINT}` : 'none',
                  }}
                >
                  <span style={{ fontSize: 14.5, color: A.inkBody }}>{humanCategory(key)}</span>
                  <span style={{ fontFamily: FIG, fontWeight: 450, fontSize: 14.5, color: A.ink, ...tabularNums }}>
                    {val} {val === 1 ? 'hour' : 'hours'}
                  </span>
                </div>
              ))}
            </div>
            {r.notes?.length > 0 && (
              <ul
                className="cs-bullet-list"
                style={{
                  marginTop: '1rem',
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
          <section style={{ marginBottom: '3.5rem' }}>
            <div style={headLabel}>Format caps</div>
            <p style={{ fontSize: 13.5, color: A.inkMuted, margin: '0 0 12px' }}>
              The most hours each format can count toward the {r.totalHours}.
            </p>
            <dl style={{ margin: 0, ...panel }}>
              {Object.entries(r.limits)
                .sort((a, b) => b[1] - a[1])
                .map(([key, val], i, arr) => (
                  <div
                    key={key}
                    className="atlas-cap-row"
                    style={{ borderBottom: i < arr.length - 1 ? `1px solid ${LINE_FAINT}` : 'none' }}
                  >
                    <dt style={{ fontSize: 14.5, color: A.inkBody }}>{humanCategory(key)}</dt>
                    <dd aria-hidden="true" style={{ margin: 0, height: 6, background: VIZ.track, borderRadius: 3, overflow: 'hidden' }}>
                      <span className="plum-grow" style={{ display: 'block', height: '100%', width: `${Math.min(100, (val / r.totalHours) * 100)}%`, background: VIZ.c2, borderRadius: '0 4px 4px 0' }} />
                    </dd>
                    <dd style={{ margin: 0, textAlign: 'right', fontWeight: 450, fontSize: 14.5, color: A.ink, ...tabularNums }}>
                      ≤{val}<span style={{ fontSize: 12, color: A.inkMuted, fontWeight: 400 }}> h</span>
                    </dd>
                  </div>
                ))}
            </dl>
          </section>
        )}

        {/* CTA */}
        <section
          style={{
            ...panel, marginTop: '3.5rem', padding: '1.75rem 2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '1.5rem', flexWrap: 'wrap',
          }}
        >
          <div style={{ maxWidth: '34em' }}>
            <h2 style={{ ...display('clamp(1.35rem, 2.2vw, 1.6rem)', 400), lineHeight: 1.2 }}>
              Track {r.jurisdictionName} {parsed.licenseType} CE with CE Shield
            </h2>
            <p style={{ color: A.inkBody, lineHeight: 1.65, margin: '0.6rem 0 0', fontSize: 14 }}>
              Hours, mandatory categories, and certificate uploads in the Ledger,
              plus {siteStats.certCount} credentials scored and cited in the field. Free during beta.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/sign-in" className="atlas-btn atlas-btn-primary" style={{ fontSize: 14.5, padding: '12px 20px' }}>
              Start tracking →
            </Link>
            <Link href="/matrix" className="atlas-btn atlas-btn-secondary" style={{ fontSize: 14.5, padding: '12px 20px' }}>
              See the field
            </Link>
          </div>
        </section>

        {/* Source footer + cross-links */}
        <p style={{ fontFamily: FIG, fontSize: 11.5, color: A.inkMuted, margin: '1.5rem 0 0', letterSpacing: '0.02em' }}>
          Source: {r.citation}
          {r.lastReviewed ? ` · last reviewed ${r.lastReviewed}` : ''} ·{' '}
          <a href={r.boardUrl} target="_blank" rel="noopener noreferrer" className="atlas-link atlas-hit" style={{ fontWeight: 500, textDecoration: 'none' }}>
            Read the rule ↗
          </a>
        </p>
        <p style={{ fontFamily: FIG, fontSize: 12.5, color: A.inkMuted, margin: '0.5rem 0 0', display: 'flex', gap: '0 1.5rem', flexWrap: 'wrap' }}>
          {otherEntry && (
            <Link
              href={`/states/${otherEntry.slug}`}
              className="atlas-link"
              style={{ fontWeight: 500, textDecoration: 'none', padding: '10px 0' }}
            >
              {r.jurisdictionName} {otherLicense} requirements →
            </Link>
          )}
          <Link href="/states" className="atlas-link" style={{ fontWeight: 500, textDecoration: 'none', padding: '10px 0' }}>
            All states
          </Link>
        </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
