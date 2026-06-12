// /states/<state>-<license>-ce-requirements — per-state SSG landing page.
// One static HTML page per (state, license) combo, generated at build time.
// This is the SEO payoff of the Next.js migration: each page has its own
// crawlable URL with state-specific keywords in title, h1, and body.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Shield, ExternalLink, CheckCircle, AlertCircle,
} from 'lucide-react';
import { colors } from '@/utils/constants';
import PublicNav from '@/components/layout/PublicNav';
import {
  allStateLicenseEntries,
  parseStateLicenseSlug,
  getRulesFor,
} from '@/data/stateRules';

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

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAFAF6',
        backgroundImage: 'radial-gradient(circle, rgba(15, 23, 42, 0.05) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        color: colors.textDark,
      }}
    >
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <PublicNav />

      <main className="cs-page-pad" style={{
        maxWidth: 860, margin: '0 auto', padding: '3rem 2rem 6rem', lineHeight: 1.65,
      }}>
        <Link
          href="/states"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: colors.primaryBlue, textDecoration: 'none', fontWeight: 500,
            fontSize: '0.88rem', marginBottom: '1.25rem',
          }}
        >
          <ArrowLeft size={14} aria-hidden="true" /> All states
        </Link>
        <header style={{ marginBottom: '2rem' }}>
          <div
            className="font-mono"
            style={{
              fontSize: '0.7rem', color: colors.textGray,
              letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6,
            }}
          >
            {r.jurisdictionName} · {parsed.licenseType}
          </div>
          <h1 style={{
            fontSize: 'clamp(1.6rem, 6vw, 2.4rem)', fontWeight: 600, color: colors.textDark, margin: 0,
            letterSpacing: '-0.02em', lineHeight: 1.1,
          }}>
            {r.jurisdictionName} {parsed.licenseType} CE requirements
          </h1>
          <p style={{ color: colors.slateMedium, marginTop: '0.75rem', fontSize: '1.05rem' }}>
            {r.totalHours} hours of continuing education every {r.cycleYears}{' '}
            years for {licenseLong.toLowerCase()} licensed in {r.jurisdictionName}.
            Below: the full breakdown, the mandatory categories most CE platforms
            miss, and a free tracker to keep you renewal-ready.
          </p>

          {r.verified === false && (
            <div
              role="alert"
              style={{
                marginTop: '1.25rem', padding: '0.875rem 1rem',
                background: '#fef3c7', border: '1px solid #fbbf24',
                borderRadius: 8, color: '#92400e', fontSize: '0.875rem',
              }}
            >
              <strong>Draft state.</strong> These values are a first draft based
              on <a href={r.boardUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#92400e', textDecoration: 'underline' }}>{r.citation}</a>.
              Verify with your licensing board before relying on totals.
            </div>
          )}
        </header>

        {/* Stat strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '0.75rem',
            marginBottom: '2rem',
          }}
        >
          {[
            { label: 'Total CE hours', value: r.totalHours },
            { label: 'Cycle length', value: `${r.cycleYears} yrs` },
            { label: 'Mandatory categories', value: Object.keys(r.mandatory || {}).filter((k) => r.mandatory[k] > 0).length },
            { label: 'First-renewal exempt', value: r.firstRenewalExempt ? 'Yes' : 'No' },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                padding: '1rem',
                background: 'white',
                border: `1px solid ${colors.slateLight}`,
                borderRadius: 12,
              }}
            >
              <div
                className="tabular-nums"
                style={{
                  fontSize: '1.85rem', fontWeight: 700, color: colors.primaryBlue,
                  letterSpacing: '-0.025em', lineHeight: 1,
                }}
              >
                {s.value}
              </div>
              <div
                className="eyebrow"
                style={{ marginTop: 6, fontSize: '0.62rem' }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Mandatory categories */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="eyebrow">Mandatory categories</span>
            <hr className="section-rule flex-1 m-0" />
          </div>
          <div style={{
            background: 'white', border: `1px solid ${colors.slateLight}`,
            borderRadius: 12, overflow: 'hidden',
          }}>
            {Object.entries(r.mandatory || {})
              .filter(([, v]) => v > 0)
              .map(([key, val], i, arr) => (
                <div
                  key={key}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.875rem 1.25rem',
                    borderBottom: i < arr.length - 1 ? `1px solid ${colors.slateLight}` : 'none',
                  }}
                >
                  <span style={{ fontSize: '0.95rem', color: colors.textDark }}>
                    {humanCategory(key)}
                  </span>
                  <span className="font-mono tabular-nums" style={{
                    fontWeight: 600, color: colors.textDark,
                  }}>
                    {val} {val === 1 ? 'hour' : 'hours'}
                  </span>
                </div>
              ))}
          </div>
          {r.notes?.length > 0 && (
            <ul style={{
              marginTop: '1rem', paddingLeft: '1.25rem',
              color: colors.textGray, fontSize: '0.88rem', lineHeight: 1.6,
            }}>
              {r.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          )}
        </section>

        {/* Limits */}
        {Object.keys(r.limits || {}).length > 0 && (
          <section style={{ marginBottom: '2.5rem' }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="eyebrow">Category caps</span>
              <hr className="section-rule flex-1 m-0" />
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.5rem',
            }}>
              {Object.entries(r.limits).map(([key, val]) => (
                <div
                  key={key}
                  style={{
                    background: 'white',
                    border: `1px solid ${colors.slateLight}`,
                    borderRadius: 10,
                    padding: '0.75rem 0.875rem',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: colors.textGray }}>
                    {humanCategory(key)}
                  </div>
                  <div className="font-mono tabular-nums" style={{
                    fontWeight: 600, color: colors.textDark, marginTop: 2,
                  }}>
                    cap {val} hr
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Source */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="eyebrow">Source</span>
            <hr className="section-rule flex-1 m-0" />
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '1rem', flexWrap: 'wrap',
            padding: '1rem 1.25rem',
            background: 'white', border: `1px solid ${colors.slateLight}`,
            borderRadius: 12,
          }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: colors.textGray, marginBottom: 4 }}>
                Statutory citation
              </div>
              <div style={{ fontWeight: 500, color: colors.textDark }}>{r.citation}</div>
              {r.lastReviewed && (
                <div style={{ fontSize: '0.78rem', color: colors.textGray, marginTop: 4 }}>
                  Last reviewed {r.lastReviewed}
                </div>
              )}
            </div>
            <a
              href={r.boardUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '0.5rem 0.875rem',
                background: 'white', color: colors.primaryBlue,
                border: `1px solid ${colors.primaryBlue}`,
                borderRadius: 6, textDecoration: 'none', fontSize: '0.9rem',
              }}
            >
              Board page <ExternalLink size={14} aria-hidden="true" />
            </a>
          </div>
        </section>

        {/* CTA */}
        <section
          style={{
            marginTop: '3rem', padding: '1.75rem',
            background: colors.grayLight, borderRadius: 16,
            border: `1px solid ${colors.slateLight}`,
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: colors.textDark }}>
            Track {r.jurisdictionName} {parsed.licenseType} CE hours with CE Shield
          </h2>
          <p style={{
            color: colors.slateMedium, lineHeight: 1.6, marginTop: '0.5rem',
          }}>
            One place for your hours, mandatory categories, and certificate
            uploads &mdash; plus an evidence-backed certifications matrix to
            help you pick credentials that actually move your career forward.
            Free during beta.
          </p>
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link
              href="/sign-in"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '0.625rem 1.25rem',
                background: colors.primaryBlue, color: 'white',
                borderRadius: 6, textDecoration: 'none', fontWeight: 500,
              }}
            >
              Start tracking <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <Link
              href="/"
              style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '0.625rem 1.25rem',
                background: 'white', color: colors.primaryBlue,
                border: `1px solid ${colors.primaryBlue}`,
                borderRadius: 6, textDecoration: 'none', fontWeight: 500,
              }}
            >
              See the matrix
            </Link>
          </div>
        </section>

        {/* Cross-link to sibling license + index */}
        <section style={{
          marginTop: '2.5rem',
          textAlign: 'center', color: colors.textGray, fontSize: '0.9rem',
        }}>
          {otherEntry && (
            <Link
              href={`/states/${otherEntry.slug}`}
              style={{ color: colors.primaryBlue, textDecoration: 'underline', marginRight: '1rem' }}
            >
              {r.jurisdictionName} {otherLicense} requirements &rarr;
            </Link>
          )}
          <Link href="/states" style={{ color: colors.primaryBlue, textDecoration: 'underline' }}>
            All states
          </Link>
        </section>
      </main>
    </div>
  );
}
