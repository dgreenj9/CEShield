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
import {
  A, FIG, tierColor, tierTextColor, tierLabel, tabularNums,
  LINE, LINE2, LINE_FAINT, VIZ, panel, kicker, capLabel, hairHead, display, kpi,
} from '@/components/atlas/theme';
import LensBreakdownTabs from './_LensBreakdownTabs';
import CredentialLinks from '@/components/education/CredentialLinks';
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

// Section head: a peach eyebrow over a hairline, then an optional light
// display title with a lilac second clause.
const Section = ({ eyebrow: eyebrowText, title, em, children }) => (
  <section style={{ marginTop: '4rem' }}>
    <div style={{ ...hairHead, marginBottom: title ? 14 : 20 }}>{eyebrowText}</div>
    {title && (
      <h2 style={{ ...display('clamp(1.6rem, 2.6vw, 2.2rem)'), marginBottom: 22 }}>
        {title}{em && <> <em style={{ fontStyle: 'normal', color: A.accentMid }}>{em}</em></>}
      </h2>
    )}
    {children}
  </section>
);

// How many citations print before the rest fold into "Show all". The folded
// rows stay in the HTML (a <details> element), so crawlers still read them.
const CITE_VISIBLE = 12;

function CitationRow({ c, idx, last }) {
  const link = citationUrl(c);
  // 'Other' tags say nothing; only typed evidence earns a tag.
  const evidenceLabel = c.evidence_type && c.evidence_type !== 'unknown' ? EVIDENCE_LABELS[c.evidence_type] : null;
  const tag = {
    fontFamily: FIG,
    fontSize: 10.5,
    fontWeight: 500,
    padding: '2px 9px',
    borderRadius: 20,
    border: `1px solid ${LINE2}`,
    color: A.inkBody,
    whiteSpace: 'nowrap',
  };
  return (
    <li
      className="plum-cite-row"
      style={{
        padding: '1rem 1.25rem',
        borderBottom: last ? 'none' : `1px solid ${LINE_FAINT}`,
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
      }}
    >
      <span style={{ flexShrink: 0, fontFamily: FIG, fontSize: 11, color: A.inkMuted, marginTop: 3, minWidth: 26, ...tabularNums }}>
        {String(idx + 1).padStart(2, '0')}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 450, fontSize: 14.5, color: A.ink, lineHeight: 1.45, letterSpacing: '-0.005em' }}>
          {c.title}
        </div>
        <div style={{ fontFamily: FIG, fontSize: 12, color: A.inkMuted, marginTop: 4, ...tabularNums }}>
          {[c.authors, c.journal].filter(Boolean).join(' · ')}
          {c.year ? ` · ${c.year}` : ''}
        </div>
        {c.what_it_says && (
          <div style={{ fontSize: 13.5, color: A.inkBody, marginTop: 6, lineHeight: 1.6 }}>
            {c.what_it_says}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, alignItems: 'center' }}>
          {evidenceLabel && (
            <span style={{ ...tag, borderColor: 'rgba(226,196,143,0.45)', color: A.accent }}>{evidenceLabel}</span>
          )}
          {c.source_type && c.source_type !== 'peer-reviewed' && (
            <span style={{ ...tag, color: A.inkMuted }}>{c.source_type.replace(/-/g, ' ')}</span>
          )}
          {c.doi && (
            <span style={{ fontFamily: FIG, fontSize: 11.5, color: A.inkMuted, overflowWrap: 'anywhere' }}>doi:{c.doi}</span>
          )}
          {!c.doi && c.pmid && (
            <span style={{ fontFamily: FIG, fontSize: 11.5, color: A.inkMuted, ...tabularNums }}>PMID {c.pmid}</span>
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
          style={{ flexShrink: 0, fontFamily: FIG, fontSize: 12, fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap', marginTop: 2 }}
        >
          DOI ↗
        </a>
      )}
    </li>
  );
}

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
    fontWeight: 450,
    padding: '4px 11px',
    borderRadius: 20,
    border: `1px solid ${LINE2}`,
    color: A.inkMuted,
  };

  const shownCites = citations.slice(0, CITE_VISIBLE);
  const foldedCites = citations.slice(CITE_VISIBLE);

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

      <main id="main" className="atlas-wrap" style={{ maxWidth: 1280, margin: '0 auto', padding: '4rem 2rem 6rem', lineHeight: 1.6 }}>
        {/* Hero — 2 columns on wide screens. Identity + evidence summary on
            the left, the cross-lens comparison panel on the right. The lens
            rows ARE the primary CTAs (each deep-links into /matrix with that
            lens + cert preselected). */}
        <header className="cs-cert-hero plum-rise" style={{ marginBottom: '1rem' }}>
          <div className="cs-cert-hero-text">
            <Link href="/credentials" className="atlas-ink-link" style={{ ...kicker(10.5, A.inkMuted), textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 32 }}>
              <ArrowLeft size={12} aria-hidden="true" /> All dossiers
            </Link>
            <div style={{ ...kicker(), marginTop: 18, marginBottom: 16 }}>
              {cert.type} · {(cert.disciplines || [cert.discipline]).join(' · ')}
            </div>
            <h1 style={display('clamp(2.1rem, 5vw, 3.75rem)', 360)}>
              {cert.name}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 34px', marginTop: 26, fontSize: 12, color: A.inkMuted }}>
              {meta.count > 0 && (
                <div>Citations<b style={{ display: 'block', fontWeight: 500, color: A.inkBody, fontSize: 14, marginTop: 3, ...tabularNums }}>{meta.count.toLocaleString()}</b></div>
              )}
              <div>Lenses scored<b style={{ display: 'block', fontWeight: 500, color: A.inkBody, fontSize: 14, marginTop: 3, ...tabularNums }}>{availablePaths.length}</b></div>
              <div>Best lens<b style={{ display: 'block', fontWeight: 500, color: A.inkBody, fontSize: 14, marginTop: 3 }}>{PATHS[bestPath]?.label}</b></div>
            </div>

            <CredentialLinks slug={slug} />

            {cert.evidence && splitEvidence(cert.evidence).map((para, i) => (
              <p
                key={i}
                style={{
                  fontSize: 16,
                  color: A.inkBody,
                  lineHeight: 1.75,
                  marginTop: i === 0 ? '2rem' : '0.85rem',
                  marginBottom: 0,
                  maxWidth: 620,
                }}
              >
                {para}
              </p>
            ))}
          </div>

          {/* Right column: composite across lenses. A 0 to 100 dot plot on
              hairline grids; the best lens carries the peach dot. Each row is
              a deep-link into /matrix with that lens preselected. */}
          <aside className="cs-cert-scores" aria-label="Career-path scores" style={{ ...panel, alignSelf: 'start', padding: '20px 20px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontFamily: FIG, fontSize: 12, fontWeight: 600, color: A.inkBody, letterSpacing: '0.02em' }}>
                Composite across lenses
              </span>
              <span style={{ fontFamily: FIG, fontSize: 11.5, fontWeight: 500, color: tierTextColor(bestScore) }}>
                Best: {tierLabel(bestScore)}
              </span>
            </div>
            <div style={{ fontSize: 11, color: A.inkMuted, marginTop: 3 }}>Default weights · 0 to 100</div>
            <div style={{ marginTop: 14 }}>
              {lensScores.map(({ pathKey, label, score }) => {
                const isBest = pathKey === bestPath;
                return (
                  <Link
                    key={pathKey}
                    href={fieldHref(pathKey)}
                    className="atlas-row"
                    aria-label={`${label}: ${score} of 100, ${tierLabel(score)}. Open in the field`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '6px 14px',
                      alignItems: 'center',
                      padding: '10px 8px',
                      margin: '0 -8px',
                      borderRadius: 4,
                      borderTop: `1px solid ${LINE_FAINT}`,
                      textDecoration: 'none',
                      color: 'inherit',
                      minHeight: 44,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: isBest ? 500 : 400, color: isBest ? A.ink : A.inkBody, display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                        {label.replace(' & Industry', '')}
                        <span style={{ fontSize: 11, fontWeight: 500, color: tierTextColor(score) }}>{tierLabel(score)}</span>
                      </div>
                      <div aria-hidden="true" style={{ position: 'relative', height: 14, marginTop: 6 }}>
                        <span style={{ position: 'absolute', left: 0, right: 0, top: 7, height: 1, background: LINE }} />
                        {[0, 50, 100].map((t) => (
                          <span key={t} style={{ position: 'absolute', left: `${t}%`, top: 3, width: 1, height: 9, background: LINE }} />
                        ))}
                        <span
                          style={{
                            position: 'absolute',
                            left: `calc(${score}% - ${isBest ? 6 : 5}px)`,
                            top: isBest ? 1 : 2,
                            width: isBest ? 12 : 10,
                            height: isBest ? 12 : 10,
                            borderRadius: '50%',
                            background: isBest ? A.accent : VIZ.c2,
                            boxShadow: `0 0 0 2px ${A.paper}`,
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ ...kpi(24), color: A.ink, whiteSpace: 'nowrap' }}>
                      {score}
                      <span style={{ fontSize: 11, color: A.inkMuted, fontWeight: 400, letterSpacing: 0, marginLeft: 2 }}>/100</span>
                    </div>
                  </Link>
                );
              })}
            </div>
            <p style={{ fontFamily: FIG, fontSize: 11.5, color: A.inkMuted, margin: '4px 0 0', paddingTop: 12, borderTop: `1px solid ${LINE_FAINT}`, lineHeight: 1.55 }}>
              Each lens scores different dimensions, deliberately.{' '}
              <Link href="/methodology" className="atlas-link" style={{ fontWeight: 500, textDecoration: 'none' }}>
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
            eyebrow={`Sources · ${citations.length} on file`}
            title="The citation library"
            em="behind every score."
          >
            <EvidenceProfile meta={meta} />
            {Object.keys(sourceCounts).length > 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14, alignItems: 'center' }}>
                <span style={{ ...capLabel(), marginRight: 6 }}>Source types</span>
                {Object.entries(sourceCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, n]) => (
                    <span key={type} style={{ ...pill, ...tabularNums }}>
                      {n} {type.replace(/_/g, ' ')}
                    </span>
                  ))}
              </div>
            )}
            <div style={{ ...panel, overflow: 'hidden' }}>
              <ol style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
                {shownCites.map((c, idx) => (
                  <CitationRow key={idx} c={c} idx={idx} last={idx === shownCites.length - 1 && !foldedCites.length} />
                ))}
              </ol>
              {foldedCites.length > 0 && (
                <details className="plum-more">
                  <summary
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      minHeight: 52,
                      padding: '0 1.25rem',
                      borderTop: `1px solid ${LINE}`,
                      fontSize: 13,
                      color: A.inkBody,
                    }}
                  >
                    <span>
                      <span className="plum-more-closed">Show all {citations.length.toLocaleString()} citations</span>
                      <span className="plum-more-open">Showing all {citations.length.toLocaleString()} citations</span>
                    </span>
                    <span style={{ color: A.accent, fontSize: 12, fontWeight: 500, ...tabularNums }}>
                      <span className="plum-more-closed">+{foldedCites.length.toLocaleString()} more</span>
                      <span className="plum-more-open">Collapse</span>
                    </span>
                  </summary>
                  <ol start={CITE_VISIBLE + 1} style={{ paddingLeft: 0, listStyle: 'none', margin: 0, borderTop: `1px solid ${LINE_FAINT}` }}>
                    {foldedCites.map((c, i) => (
                      <CitationRow key={i} c={c} idx={CITE_VISIBLE + i} last={i === foldedCites.length - 1} />
                    ))}
                  </ol>
                </details>
              )}
            </div>
          </Section>
        )}

        {/* Footer rail. Sits flush with the citation library above and keeps
            the left-anchored rhythm of the whole page. */}
        <div
          style={{
            marginTop: '4rem',
            paddingTop: '1.5rem',
            borderTop: `1px solid ${LINE}`,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem 1.5rem',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 14,
          }}
        >
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontWeight: 500 }}>
            <Link href="/credentials" className="atlas-link" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44 }}>
              <ArrowLeft size={14} aria-hidden="true" /> All credentials
            </Link>
            <Link href="/methodology" className="atlas-link" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 44 }}>
              Methodology
            </Link>
          </div>
          <Link href={fieldHref(bestPath)} className="atlas-btn atlas-btn-primary" style={{ padding: '12px 22px' }}>
            Open in the field <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
