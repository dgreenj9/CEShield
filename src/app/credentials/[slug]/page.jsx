// /credentials/<slug> — per-credential SSG landing page.
//
// One static HTML page per cert, built at build-time from:
//   - src/utils/certificationData.js  → scores + justifications
//   - src/data/citations_meta.json    → evidence mix, year_dist, count
//   - public/citations/<slug>.json    → full per-cert citation list
//
// This is the SEO surface that turns 129 credentials into 129 indexable
// pages — each one a publishable evidence dossier that doesn't require an
// account to view. The "Open in matrix" CTA deep-links into /explore with
// the right lens + cert pre-selected.

import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ExternalLink, BookOpen } from 'lucide-react';
import { colors } from '@/utils/constants';
import PublicNav from '@/components/layout/PublicNav';
import { certifications as certData } from '@/utils/certificationData';
import citationsMeta from '@/data/citations_meta.json';
import {
  PATHS,
  PATH_ORDER,
  PATH_DIMENSIONS,
  getPathDefaultWeights,
  scoreColor,
} from '@/utils/careerPaths';
import {
  computeScore,
  certScoresForPath,
} from '@/utils/certScoring';
import { citationUrl, EVIDENCE_LABELS } from '@/utils/citationsLibrary';
import { splitEvidence } from '@/utils/formatEvidence';
import LensBreakdownTabs from './_LensBreakdownTabs';

// ─── Build-time data ──────────────────────────────────────────────────────

// Reverse-index slug → cert name once at module load.
const SLUG_INDEX = (() => {
  const out = new Map();
  for (const [name, entry] of Object.entries(citationsMeta)) {
    if (entry?.slug) out.set(entry.slug, name);
  }
  return out;
})();

const certBySlug = (slug) => {
  const name = SLUG_INDEX.get(slug);
  if (!name) return null;
  return certData.find((c) => c.name === name) || null;
};

const loadCitationsForSlug = (slug) => {
  const filePath = path.join(process.cwd(), 'public', 'citations', `${slug}.json`);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.citations) ? parsed.citations : [];
  } catch {
    return [];
  }
};

// Justifications were split out of certificationData.js (bundle weight) —
// at build time we read them straight from the public file.
const loadJustificationsForSlug = (slug) => {
  const filePath = path.join(process.cwd(), 'public', 'justifications', `${slug}.json`);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw)?.justifications || {};
  } catch {
    return {};
  }
};

// ─── SSG plumbing ─────────────────────────────────────────────────────────

export const dynamicParams = false;

export async function generateStaticParams() {
  return Array.from(SLUG_INDEX.keys()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cert = certBySlug(slug);
  if (!cert) return {};
  const meta = citationsMeta[cert.name] || {};
  const lensList = PATH_ORDER.filter((p) => cert.pathScores?.[p]).map(
    (p) => PATHS[p]?.label || p,
  );
  const title = `${cert.name} — career ROI across ${lensList.length} lenses`;
  const description =
    `Evidence-backed analysis of ${cert.name} (${cert.type}) for ${(cert.disciplines || [cert.discipline]).join(', ')}. ` +
    `Scored across ${lensList.length} career lenses (${lensList.join(', ')}) ` +
    `with ${meta.count || 0} curated citations. ` +
    `See whether this credential is worth the investment for your career path.`;
  return {
    title,
    description,
    alternates: { canonical: `/credentials/${slug}` },
    openGraph: { title, description, url: `/credentials/${slug}` },
  };
}

// ─── UI helpers ───────────────────────────────────────────────────────────

const Section = ({ title, eyebrow, children }) => (
  <section style={{ marginTop: '2.5rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <span
        className="font-mono"
        style={{
          fontSize: '0.7rem',
          color: colors.textGray,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: 500,
          whiteSpace: 'nowrap',
        }}
      >
        {eyebrow || title}
      </span>
      <hr style={{ flex: 1, border: 0, borderTop: `1px solid ${colors.slateLight}`, margin: 0 }} />
    </div>
    {children}
  </section>
);

// ─── Render ───────────────────────────────────────────────────────────────

export default async function Page({ params }) {
  const { slug } = await params;
  const cert = certBySlug(slug);
  if (!cert) notFound();

  const meta = citationsMeta[cert.name] || {};
  const citations = loadCitationsForSlug(slug);
  const justifications = loadJustificationsForSlug(slug);
  const availablePaths = PATH_ORDER.filter((p) => cert.pathScores?.[p]);

  // Cross-lens default-weight scores
  const lensScores = availablePaths.map((p) => {
    const subs = certScoresForPath(cert, p);
    const score = subs ? Math.round(computeScore(subs, getPathDefaultWeights(p))) : 0;
    return { pathKey: p, label: PATHS[p].label, score };
  });

  // Default lens for "Open in matrix" CTA — pick the cert's highest-scoring
  // path so the deep-link drops the user where the cert ranks best.
  const bestPath = [...lensScores].sort((a, b) => b.score - a.score)[0]?.pathKey || 'clinical';

  // Group citations by source_type for a clean "evidence base" summary
  const sourceCounts = citations.reduce((acc, c) => {
    const t = c.source_type || 'other';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  // Structured data for search engines. Two graphs: the credential itself
  // and breadcrumb context. JSON.stringify output is embedded in a script
  // tag — escape "<" to prevent </script> breakout from any data field.
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'EducationalOccupationalCredential',
        name: cert.name,
        description: cert.evidence || undefined,
        credentialCategory: cert.type,
        competencyRequired: (cert.disciplines || [cert.discipline]).join(', '),
        url: `https://ceshield.com/credentials/${slug}`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Credential library', item: 'https://ceshield.com/credentials' },
          { '@type': 'ListItem', position: 2, name: cert.name, item: `https://ceshield.com/credentials/${slug}` },
        ],
      },
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
      <PublicNav
        sticky
        currentPath="/credentials"
        cta={(
          <Link
            href={`/explore?lens=${bestPath}&cert=${slug}`}
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
            Open in matrix →
          </Link>
        )}
      />

      <main className="cs-page-pad" style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 1.5rem 6rem', lineHeight: 1.65 }}>
        {/* Hero — 2 columns on wide screens. Identity + evidence summary on
            the left, cross-lens score panel on the right. The score chips
            ARE the primary CTAs (each one deep-links into /explore with
            that lens + cert preselected), so no redundant bottom CTA card. */}
        <header className="cs-cert-hero" style={{ marginBottom: '1.5rem' }}>
          <div className="cs-cert-hero-text">
            <div
              className="font-mono"
              style={{
                fontSize: '0.72rem',
                color: colors.textGray,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
                marginBottom: 10,
              }}
            >
              Credential · {cert.type}
            </div>
            <h1 style={{
              fontSize: 'clamp(1.6rem, 4.5vw, 2.4rem)',
              fontWeight: 600,
              color: colors.textDark,
              margin: 0,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}>
              {cert.name}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 12 }}>
              {(cert.disciplines || [cert.discipline]).map((d) => (
                <span
                  key={d}
                  style={{
                    fontSize: '0.78rem',
                    padding: '2px 10px',
                    borderRadius: 999,
                    background: colors.lightBlue,
                    color: colors.primaryBlue,
                    fontWeight: 500,
                  }}
                >
                  {d}
                </span>
              ))}
              {meta.count > 0 && (
                <span style={{ fontSize: '0.78rem', color: colors.textGray }}>
                  {meta.count} citations · {availablePaths.length} lens{availablePaths.length === 1 ? '' : 'es'}
                </span>
              )}
            </div>

            {cert.evidence && splitEvidence(cert.evidence).map((para, i) => (
              <p
                key={i}
                style={{
                  fontSize: '1.05rem',
                  color: colors.slateMedium,
                  marginTop: i === 0 ? '1.5rem' : '0.85rem',
                  marginBottom: 0,
                }}
              >
                {para}
              </p>
            ))}
          </div>

          {/* Right column: cross-lens score panel. Each chip is a deep-link
              into /explore with that lens preselected. */}
          <aside className="cs-cert-scores" aria-label="Career-path scores">
            <div
              className="font-mono"
              style={{
                fontSize: '0.68rem',
                color: colors.textGray,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Career-path scores · default weights
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lensScores.map(({ pathKey, label, score }) => {
                const color = scoreColor(score);
                return (
                  <Link
                    key={pathKey}
                    href={`/explore?lens=${pathKey}&cert=${slug}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: 12,
                      alignItems: 'center',
                      padding: '0.7rem 0.9rem',
                      border: `1px solid ${colors.slateLight}`,
                      borderRadius: 10,
                      background: 'white',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: colors.textDark, letterSpacing: '-0.005em' }}>
                        {label}
                      </div>
                      <div style={{ height: 4, background: colors.slateLight, borderRadius: 999, marginTop: 6, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${score}%`, background: color }} />
                      </div>
                    </div>
                    <div
                      className="font-mono tabular-nums"
                      style={{
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        color,
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {score}
                      <span style={{ fontSize: '0.62rem', color: colors.textGray, fontWeight: 400, marginLeft: 2 }}>
                        /100
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
            <p style={{ fontSize: '0.74rem', color: colors.textGray, fontStyle: 'italic', marginTop: 10, lineHeight: 1.5 }}>
              Each lens scores different dimensions — not apples-to-apples.{' '}
              <Link href="/methodology" style={{ color: colors.primaryBlue, textDecoration: 'underline' }}>
                Methodology →
              </Link>
            </p>
          </aside>
        </header>

        {/* Per-lens score breakdown — tabbed so all 5 lenses fit one viewport
            instead of stacking. Inactive panels stay in the DOM (hidden) so
            SEO crawlers see every lens's dimension text. */}
        <LensBreakdownTabs
          lenses={availablePaths.map((pathKey) => {
            const subs = certScoresForPath(cert, pathKey) || {};
            const dims = PATH_DIMENSIONS[pathKey];
            const weights = getPathDefaultWeights(pathKey) || {};
            const totalScore = lensScores.find((l) => l.pathKey === pathKey)?.score || 0;
            return {
              key: pathKey,
              label: PATHS[pathKey].label,
              totalScore,
              dims: Object.keys(dims).map((dimKey) => ({
                key: dimKey,
                label: dims[dimKey]?.label || dimKey,
                value: subs[dimKey] || 0,
                weight: weights[dimKey] || 0,
                justification: justifications[`${pathKey}.${dimKey}`] || null,
              })),
            };
          })}
          initialActive={bestPath}
        />

        {/* Citation library */}
        {citations.length > 0 && (
          <Section
            title={`Citations (${citations.length})`}
            eyebrow={`Evidence base · ${citations.length} sources`}
          >
            {Object.keys(sourceCounts).length > 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {Object.entries(sourceCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, n]) => (
                    <span
                      key={type}
                      style={{
                        fontSize: '0.72rem',
                        padding: '3px 10px',
                        borderRadius: 999,
                        background: colors.grayLight,
                        color: colors.slateMedium,
                        fontWeight: 500,
                      }}
                    >
                      <span className="font-mono tabular-nums">{n}</span>{' '}
                      {type.replace(/_/g, ' ')}
                    </span>
                  ))}
              </div>
            )}
            <ol
              style={{
                paddingLeft: 0,
                listStyle: 'none',
                margin: 0,
                border: `1px solid ${colors.slateLight}`,
                borderRadius: 10,
                background: 'white',
              }}
            >
              {citations.map((c, idx) => {
                const link = citationUrl(c);
                const evidenceLabel = EVIDENCE_LABELS[c.evidence_type];
                return (
                  <li
                    key={idx}
                    style={{
                      padding: '0.9rem 1rem',
                      borderBottom: idx < citations.length - 1 ? `1px solid ${colors.slateLight}` : 'none',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                    }}
                  >
                    <span
                      className="font-mono tabular-nums"
                      style={{
                        flexShrink: 0,
                        fontSize: '0.78rem',
                        color: colors.textGray,
                        marginTop: 2,
                        minWidth: 28,
                      }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.92rem', color: colors.textDark, lineHeight: 1.4 }}>
                        {c.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: colors.textGray, marginTop: 2 }}>
                        {[c.authors, c.journal].filter(Boolean).join(' · ')}
                        {c.year && (
                          <span className="font-mono" style={{ marginLeft: 6, fontSize: '0.74rem' }}>
                            {c.year}
                          </span>
                        )}
                      </div>
                      {c.what_it_says && (
                        <div style={{ fontSize: '0.82rem', color: colors.slateMedium, marginTop: 4, lineHeight: 1.45, fontStyle: 'italic' }}>
                          {c.what_it_says}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, alignItems: 'center' }}>
                        {evidenceLabel && (
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '1px 8px',
                            borderRadius: 999,
                            background: colors.lightBlue,
                            color: colors.primaryBlue,
                          }}>
                            {evidenceLabel}
                          </span>
                        )}
                        {c.source_type && c.source_type !== 'peer-reviewed' && (
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '1px 8px',
                            borderRadius: 999,
                            background: colors.grayLight,
                            color: colors.textGray,
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                            fontWeight: 500,
                          }}>
                            {c.source_type.replace(/-/g, ' ')}
                          </span>
                        )}
                        {c.doi && (
                          <span className="font-mono" style={{ fontSize: '0.7rem', color: colors.textGray }}>
                            doi:{c.doi}
                          </span>
                        )}
                        {!c.doi && c.pmid && (
                          <span className="font-mono" style={{ fontSize: '0.7rem', color: colors.textGray }}>
                            PMID {c.pmid}
                          </span>
                        )}
                      </div>
                    </div>
                    {link && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open: ${c.title}`}
                        style={{ flexShrink: 0, color: colors.primaryBlue, padding: 4, marginTop: 2 }}
                      >
                        <ExternalLink size={14} aria-hidden="true" />
                      </a>
                    )}
                  </li>
                );
              })}
            </ol>
          </Section>
        )}

        {/* Footer rail. Sits flush with the citation library above (no
            stranded bordered card) and keeps the left-anchored rhythm of
            the whole page. The matrix CTA in the nav + the lens chips in
            the hero already do the heavy lifting. */}
        <div
          style={{
            marginTop: '3rem',
            paddingTop: '1.5rem',
            borderTop: `1px solid ${colors.slateLight}`,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem 1.5rem',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.88rem',
          }}
        >
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            <Link href="/credentials" style={{ color: colors.primaryBlue, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={14} aria-hidden="true" /> All credentials
            </Link>
            <Link href="/methodology" style={{ color: colors.primaryBlue, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <BookOpen size={14} aria-hidden="true" /> Methodology
            </Link>
          </div>
          <Link
            href={`/explore?lens=${bestPath}&cert=${slug}`}
            style={{
              padding: '0.75rem 1.5rem',
              background: colors.primaryBlue,
              color: 'white',
              textDecoration: 'none',
              borderRadius: 6,
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            Open in matrix <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </main>
    </div>
  );
}
