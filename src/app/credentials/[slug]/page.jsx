// /credentials/<slug> — per-credential SSG dossier page.
//
// One static HTML page per cert, built at build-time from:
//   - src/utils/certificationData.js  → scores + justifications
//   - src/data/citations_meta.json    → evidence mix, year_dist, count
//   - public/citations/<slug>.json    → full per-cert citation list
//
// This is the SEO surface that turns the credential library into indexable
// pages — each one a publishable evidence dossier that doesn't require an
// account to view. The "Open in the field" CTA deep-links into /matrix with
// the right lens + cert pre-selected.

import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import PublicNav from '@/components/layout/PublicNav';
import PublicFooter from '@/components/layout/PublicFooter';
import { certifications as certData } from '@/utils/certificationData';
import citationsMeta from '@/data/citations_meta.json';
import {
  PATHS,
  PATH_ORDER,
  PATH_DIMENSIONS,
  getPathDefaultWeights,
} from '@/utils/careerPaths';
import {
  computeScore,
  certScoresForPath,
} from '@/utils/certScoring';
import { citationUrl, cleanCitation, EVIDENCE_LABELS } from '@/utils/citationsLibrary';
import { splitEvidence } from '@/utils/formatEvidence';
import { A, FIG, INS, eyebrow, ruledHead, tierColor, tierLabel, tabularNums } from '@/components/atlas/theme';
import LensBreakdownTabs from './_LensBreakdownTabs';
import EvidenceProfile from './_EvidenceProfile';

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
    return Array.isArray(parsed?.citations) ? parsed.citations.map(cleanCitation) : [];
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
  const title = `${cert.name} · evidence across ${lensList.length} lenses`;
  const description =
    `Evidence-backed analysis of ${cert.name} (${cert.type}) for ${(cert.disciplines || [cert.discipline]).join(', ')}. ` +
    `Scored across ${lensList.length} career lenses (${lensList.join(', ')}) ` +
    `with ${meta.count || 0} curated citations. ` +
    `Scores, dimension breakdowns, and the full citation list.`;
  return {
    title,
    description,
    alternates: { canonical: `/credentials/${slug}` },
    openGraph: { title, description, url: `/credentials/${slug}` },
  };
}

// ─── UI helpers ───────────────────────────────────────────────────────────

// Section head drawn with the 2px ink top rule ("Notes column" motif).
const Section = ({ title, eyebrow: eyebrowText, children }) => (
  <section style={{ marginTop: '2.5rem' }}>
    <div style={{ ...ruledHead, marginBottom: 16 }}>{eyebrowText || title}</div>
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

  // Default lens for the "Open in the field" CTA — pick the cert's
  // highest-scoring path so the deep-link drops the user where it ranks best.
  const bestPath = [...lensScores].sort((a, b) => b.score - a.score)[0]?.pathKey || 'clinical';
  const bestScore = [...lensScores].sort((a, b) => b.score - a.score)[0]?.score ?? 0;
  // The Atlas matrix selects by credential name, and lives at /matrix.
  const fieldHref = (lens) => `/matrix?lens=${lens}&cert=${encodeURIComponent(cert.name)}`;

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

  const pill = {
    fontFamily: FIG,
    fontSize: 11.5,
    fontWeight: 700,
    padding: '3px 10px',
    border: `1px solid ${A.ruleMinor}`,
    color: A.inkBody,
  };

  return (
    <div className="atlas-ground" style={{ minHeight: '100vh', color: A.ink }}>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <PublicNav
        currentPath="/credentials"
        cta={(
          <Link href={fieldHref(bestPath)} className="atlas-btn atlas-btn-primary atlas-btn-sm" style={{ fontSize: 14 }}>
            Open in the field →
          </Link>
        )}
      />

      <main id="main" className="atlas-wrap" style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 2rem 5rem', lineHeight: 1.6 }}>
        {/* Hero — 2 columns on wide screens. Identity + evidence summary on
            the left, cross-lens score panel on the right. The score rows ARE
            the primary CTAs (each deep-links into /matrix with that lens +
            cert preselected). */}
        <header className="cs-cert-hero" style={{ marginBottom: '1.5rem' }}>
          <div className="cs-cert-hero-text">
            <div style={{ ...eyebrow(12), marginBottom: 10 }}>
              {cert.type} · {(cert.disciplines || [cert.discipline]).join(' · ')}
            </div>
            <h1
              className="cs-h1-clamp"
              style={{
                fontFamily: INS,
                fontSize: 'clamp(1.6rem, 4.5vw, 2.4rem)',
                fontWeight: 600,
                color: A.ink,
                margin: 0,
                letterSpacing: '-0.025em',
                lineHeight: 1.08,
                textWrap: 'balance',
              }}
            >
              {cert.name}
            </h1>
            <div style={{ ...eyebrow(12.5), marginTop: 12, ...tabularNums }}>
              {meta.count > 0 ? `${meta.count} citations · ` : ''}
              {availablePaths.length} lens{availablePaths.length === 1 ? '' : 'es'} scored
            </div>

            {cert.evidence && splitEvidence(cert.evidence).map((para, i) => (
              <p
                key={i}
                style={{
                  fontSize: 15.5,
                  color: A.inkBody,
                  lineHeight: 1.65,
                  marginTop: i === 0 ? '1.5rem' : '0.85rem',
                  marginBottom: 0,
                }}
              >
                {para}
              </p>
            ))}
          </div>

          {/* Right column: cross-lens score panel. Each row is a deep-link
              into /matrix with that lens preselected. */}
          <aside className="cs-cert-scores" aria-label="Career-path scores" style={{ border: `1px solid ${A.ink}`, background: A.paper, alignSelf: 'start' }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${A.ink}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontFamily: FIG, fontSize: 12.5, fontWeight: 700, color: A.inkMuted }}>
                Every lens · default weights
              </span>
              <span style={{ fontFamily: FIG, fontSize: 11.5, fontWeight: 700, color: tierColor(bestScore) }}>
                Best: {tierLabel(bestScore)}
              </span>
            </div>
            <div>
              {lensScores.map(({ pathKey, label, score }, i) => {
                const color = tierColor(score);
                return (
                  <Link
                    key={pathKey}
                    href={fieldHref(pathKey)}
                    className="atlas-row"
                    aria-label={`${label}: ${score} of 100, ${tierLabel(score)}. Open in the field`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: 12,
                      alignItems: 'center',
                      padding: '0.7rem 1rem',
                      borderBottom: i < lensScores.length - 1 ? `1px solid ${A.ruleFaint}` : 'none',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: A.ink, letterSpacing: '-0.005em', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        {label.replace(' & Industry', '')}
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: A.inkMuted }}>{tierLabel(score)}</span>
                      </div>
                      <div style={{ height: 4, background: A.ruleFaint, marginTop: 6 }}>
                        <div style={{ height: '100%', width: `${score}%`, background: color }} />
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: FIG,
                        fontSize: 22,
                        fontWeight: 800,
                        color,
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                        whiteSpace: 'nowrap',
                        ...tabularNums,
                      }}
                    >
                      {score}
                      <span style={{ fontSize: 11, color: A.inkMuted, fontWeight: 600, marginLeft: 2 }}>
                        /100
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
            <p style={{ fontFamily: FIG, fontSize: 11.5, color: A.inkMuted, margin: 0, padding: '10px 16px', borderTop: `1px solid ${A.ruleFaint}`, lineHeight: 1.5 }}>
              Each lens scores different dimensions, deliberately.{' '}
              <Link href="/methodology" className="atlas-link" style={{ fontWeight: 700, textDecoration: 'none' }}>
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
            eyebrow={`Sources · ${citations.length} on file`}
          >
            <EvidenceProfile meta={meta} />
            {Object.keys(sourceCounts).length > 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {Object.entries(sourceCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, n]) => (
                    <span key={type} style={{ ...pill, fontWeight: 600, color: A.inkMuted, ...tabularNums }}>
                      {n} {type.replace(/_/g, ' ')}
                    </span>
                  ))}
              </div>
            )}
            <ol
              style={{
                paddingLeft: 0,
                listStyle: 'none',
                margin: 0,
                border: `1px solid ${A.ink}`,
                background: A.paper,
              }}
            >
              {citations.map((c, idx) => {
                const link = citationUrl(c);
                // 'Other' tags say nothing; only typed evidence earns a tag.
                const evidenceLabel = c.evidence_type && c.evidence_type !== 'unknown' ? EVIDENCE_LABELS[c.evidence_type] : null;
                return (
                  <li
                    key={idx}
                    style={{
                      padding: '0.8rem 1rem',
                      borderBottom: idx < citations.length - 1 ? `1px solid ${A.ruleFaint}` : 'none',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        fontFamily: FIG,
                        fontSize: 11,
                        color: A.inkMuted,
                        marginTop: 2,
                        minWidth: 24,
                        ...tabularNums,
                      }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: A.ink, lineHeight: 1.4 }}>
                        {c.title}
                      </div>
                      <div style={{ fontFamily: FIG, fontSize: 11.5, color: A.inkMuted, marginTop: 2, ...tabularNums }}>
                        {[c.authors, c.journal].filter(Boolean).join(' · ')}
                        {c.year ? ` · ${c.year}` : ''}
                      </div>
                      {c.what_it_says && (
                        <div style={{ fontSize: 13, color: A.inkBody, marginTop: 4, lineHeight: 1.5, fontStyle: 'italic' }}>
                          {c.what_it_says}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, alignItems: 'center' }}>
                        {evidenceLabel && (
                          <span style={{ fontFamily: FIG, fontSize: 10.5, fontWeight: 700, padding: '1px 8px', border: `1px solid ${A.accent}`, color: A.accent }}>
                            {evidenceLabel}
                          </span>
                        )}
                        {c.source_type && c.source_type !== 'peer-reviewed' && (
                          <span style={{ fontFamily: FIG, fontSize: 10.5, fontWeight: 600, padding: '1px 8px', border: `1px solid ${A.ruleMinor}`, color: A.inkMuted }}>
                            {c.source_type.replace(/-/g, ' ')}
                          </span>
                        )}
                        {c.doi && (
                          <span style={{ fontFamily: FIG, fontSize: 11, color: A.inkMuted }}>
                            doi:{c.doi}
                          </span>
                        )}
                        {!c.doi && c.pmid && (
                          <span style={{ fontFamily: FIG, fontSize: 11, color: A.inkMuted }}>
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
                        aria-label={`Open source: ${c.title}`}
                        className="atlas-link atlas-hit"
                        style={{ flexShrink: 0, fontFamily: FIG, fontSize: 11.5, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', marginTop: 2 }}
                      >
                        DOI ↗
                      </a>
                    )}
                  </li>
                );
              })}
            </ol>
          </Section>
        )}

        {/* Footer rail. Sits flush with the citation library above and keeps
            the left-anchored rhythm of the whole page. */}
        <div
          style={{
            marginTop: '3rem',
            paddingTop: '1.25rem',
            borderTop: `1px solid ${A.ink}`,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem 1.5rem',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 14,
          }}
        >
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontWeight: 600 }}>
            <Link href="/credentials" className="atlas-link" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 44 }}>
              <ArrowLeft size={14} aria-hidden="true" /> All credentials
            </Link>
            <Link href="/methodology" className="atlas-link" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 44 }}>
              Methodology
            </Link>
          </div>
          <Link href={fieldHref(bestPath)} className="atlas-btn atlas-btn-primary" style={{ padding: '12px 20px' }}>
            Open in the field <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
