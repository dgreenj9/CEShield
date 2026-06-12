import React, { useEffect, useState } from 'react';
import { BookOpen, ExternalLink, ArrowLeft, Loader2, Share2 } from 'lucide-react';
import { colors } from '../../utils/constants';
import {
  loadCitations,
  getEvidenceMix,
  getLibraryMetaForCertification,
  EVIDENCE_LABELS,
  citationUrl,
} from '../../utils/citationsLibrary';
import CitationSparkline from './CitationSparkline';
import { loadJustifications } from '../../utils/justificationsLibrary';
import { splitEvidence } from '../../utils/formatEvidence';
import {
  getScoreStyle,
  computeScore,
  certScoresForPath,
} from '../../utils/certScoring';
import {
  PATHS,
  PATH_ORDER,
  PATH_DIMENSIONS,
  getPathDefaultWeights,
  scoreColor,
} from '../../utils/careerPaths';
import {
  certifications as certData,
} from '../../utils/certificationData';
import {
  Stethoscope as IconClinical,
  Briefcase as IconBusiness,
  GraduationCap as IconAcademic,
  FlaskConical as IconResearch,
  Cpu as IconHealthTech,
} from 'lucide-react';

const PATH_ICONS = {
  clinical: IconClinical,
  business: IconBusiness,
  academicClinical: IconAcademic,
  research: IconResearch,
  healthTech: IconHealthTech,
};

// Sage / ochre / slate from the brand palette — canonical mapping lives in
// careerPaths.js.
const roiColor = scoreColor;

// Compute a cert's score on EVERY path it has scores for (using each path's
// default weights). The active-lens score in the header uses the user's
// custom weights; the cross-path strip shows defaults so paths stay
// comparable.
const computeAllPathScores = (cert) => {
  const out = {};
  for (const key of PATH_ORDER) {
    const subs = certScoresForPath(cert, key);
    if (!subs) continue;
    out[key] = Math.round(computeScore(subs, getPathDefaultWeights(key)));
  }
  return out;
};

// Uses the global editorial section motif (eyebrow + hairline rule).
// Same visual rhythm as the top-of-page PageHeader divider.
const Section = ({ title, action, children }) => (
  <section style={{ marginTop: '1.75rem' }}>
    <div className="flex items-center gap-3 mb-3">
      <span className="eyebrow flex-shrink-0">{title}</span>
      <hr className="section-rule flex-1 m-0" />
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
    {children}
  </section>
);

export default function CertificationDetail({ certName, weights, path, onBack }) {
  const cert = certData.find((c) => c.name === certName);

  // Citations are lazy-loaded per cert from /citations/<slug>.json.
  const [citations, setCitations] = useState([]);
  const [citationsLoading, setCitationsLoading] = useState(true);
  // Justifications lazy-load the same way (split out of the client bundle).
  const [justifications, setJustifications] = useState({});

  useEffect(() => {
    let cancelled = false;
    if (!certName) return;
    setCitationsLoading(true);
    setJustifications({});
    loadCitations(certName).then((list) => {
      if (cancelled) return;
      setCitations(list);
      setCitationsLoading(false);
    });
    loadJustifications(certName).then((just) => {
      if (cancelled) return;
      setJustifications(just);
    });
    return () => { cancelled = true; };
  }, [certName]);

  if (!cert) return null;

  const evidenceMix = getEvidenceMix(cert.name);
  const meta = getLibraryMetaForCertification(cert.name);

  // Sub-scores for the ACTIVE lens. If this cert isn't scored for the
  // active path, fall back to the first available block so we still render
  // something meaningful (shouldn't happen — list excludes such certs —
  // but defensive).
  const activeSubs =
    certScoresForPath(cert, path)
    || cert.pathScores?.clinical
    || {};
  const dimsForPath = PATH_DIMENSIONS[path] || PATH_DIMENSIONS.clinical;
  const computedScore = Math.round(computeScore(activeSubs, weights) * 10) / 10;
  const allPathScores = computeAllPathScores(cert);

  // Filter citations to the active lens. Citations with a `path` field are
  // path-scoped (e.g., research-frame or healthTech-frame sources for
  // cross-mapped clinical certs). Citations without a path tag are
  // path-agnostic (clinical-intervention evidence) and always show.
  const visibleCitations = citations.filter(
    (c) => !c.path || c.path === path,
  );
  const visibleEvidence = ['meta_analysis', 'systematic_review', 'rct', 'guideline', 'cohort']
    .filter((k) => (evidenceMix[k] || 0) > 0);

  // Justification lookup. Keys in the migrated data are namespaced:
  //   'clinical.clinicalOutcomes', 'business.cashPayViability', etc.
  // Fall back to the unnamespaced key for back-compat. Sourced from the
  // lazy-loaded per-cert file (empty object until the fetch resolves —
  // the bars/scores render immediately, prose fills in).
  const justificationFor = (dimKey) =>
    justifications[`${path}.${dimKey}`]
    || justifications[dimKey]
    || null;

  return (
    <div
      className="cs-detail-card"
      style={{
        background: 'white',
        border: `1px solid ${colors.slateLight}`,
        borderRadius: 12,
        padding: '1.5rem',
      }}
    >
      {/* Header */}
      <header>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: 'none',
              color: colors.primaryBlue,
              cursor: 'pointer',
              fontSize: '0.85rem',
              padding: 0,
              marginBottom: '0.75rem',
            }}
          >
            <ArrowLeft size={14} aria-hidden="true" /> Back to list
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: colors.textDark,
                margin: 0,
                lineHeight: 1.2,
                letterSpacing: '-0.015em',
              }}
            >
              {cert.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: colors.lightBlue,
                  color: colors.primaryBlue,
                  fontWeight: 500,
                }}
              >
                {cert.type}
              </span>
              <span style={{ fontSize: '0.78rem', color: colors.textGray }}>
                {(cert.disciplines || [cert.discipline]).join(' · ')}
              </span>
              {meta.slug && (
                <a
                  href={`/credentials/${meta.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open the public credential page (shareable, no sign-in required)"
                  style={{
                    fontSize: '0.72rem',
                    color: colors.primaryBlue,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    border: `1px solid ${colors.lightBlue}`,
                    borderRadius: 999,
                  }}
                >
                  <Share2 size={11} aria-hidden="true" />
                  Public page
                </a>
              )}
            </div>
          </div>
          <div className="text-center" style={{ minWidth: 84 }}>
            <div
              className="tabular-nums"
              style={{
                ...getScoreStyle(computedScore),
                padding: '0.5rem 0.875rem',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '1.5rem',
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {computedScore}
            </div>
            <div className="eyebrow mt-1.5" style={{ fontSize: '0.62rem' }}>
              of 100
            </div>
          </div>
        </div>

        {/* Evidence badges */}
        {(visibleEvidence.length > 0 || meta.source) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: '0.75rem' }}>
            {visibleEvidence.map((k) => (
              <span
                key={k}
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: colors.lightBlue,
                  color: colors.primaryBlue,
                }}
              >
                {evidenceMix[k]} {EVIDENCE_LABELS[k]}
              </span>
            ))}
            {meta.source === 'librarian' && (
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: colors.mutedPurple,
                  color: colors.primaryPurple,
                  letterSpacing: '0.02em',
                }}
              >
                LIBRARIAN-REVIEWED
              </span>
            )}
            {meta.source === 'legacy' && (
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: '#fef3c7',
                  color: '#92400e',
                  letterSpacing: '0.02em',
                }}
              >
                LEGACY CITATIONS
              </span>
            )}
          </div>
        )}
      </header>

      {/* Evidence summary + citation-trend sparkline */}
      {cert.evidence && (
        <Section title="Evidence summary">
          {splitEvidence(cert.evidence).map((para, i) => (
            <p
              key={i}
              style={{
                margin: 0,
                marginTop: i === 0 ? 0 : '0.75rem',
                color: colors.slateMedium,
                lineHeight: 1.6,
                fontSize: '0.95rem',
              }}
            >
              {para}
            </p>
          ))}
          {/* Compact area chart of citation count by year. Only renders if the
              cert has multiple years of citations. */}
          {meta.year_dist && Object.keys(meta.year_dist).length > 1 && (
            <div className="mt-3 flex items-center gap-3 pt-3" style={{ borderTop: `1px solid ${colors.slateLight}` }}>
              <div style={{ flex: 1 }}>
                <div className="font-mono" style={{ fontSize: '0.65rem', color: colors.textGray, letterSpacing: '0.06em' }}>
                  {(() => {
                    const years = Object.keys(meta.year_dist).map(Number);
                    const min = Math.min(...years);
                    const max = Math.max(...years);
                    return `${min} → ${max}`;
                  })()}
                </div>
                <div style={{ fontSize: '0.78rem', color: colors.textGray, marginTop: 2 }}>
                  Citation activity by year
                </div>
              </div>
              <CitationSparkline yearDist={meta.year_dist} width={160} height={40} />
            </div>
          )}
        </Section>
      )}

      {/* Score breakdown — uses dimensions of the active lens. */}
      <Section title={`Score breakdown · ${PATHS[path]?.label || path}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.keys(dimsForPath).map((key) => {
            const subVal = activeSubs[key] || 0;
            const weight = weights[key] || 0;
            const justification = justificationFor(key);
            const dim = dimsForPath[key];
            return (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: colors.textDark, letterSpacing: '-0.005em' }}>
                    {dim?.label || key}
                    <span className="font-mono" style={{ color: colors.textGray, fontWeight: 500, fontSize: '0.7rem', marginLeft: 8 }}>
                      ×{weight}%
                    </span>
                  </div>
                  <div className="font-mono tabular-nums" style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.textDark, letterSpacing: '-0.01em' }}>
                    {subVal}<span style={{ color: colors.textGray, fontWeight: 400, fontSize: '0.7rem', marginLeft: 1 }}>/100</span>
                  </div>
                </div>
                <div style={{ height: 4, background: colors.slateLight, borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${subVal}%`,
                      background: colors.primaryBlue,
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
                {justification && (
                  <p style={{ fontSize: '0.8rem', color: colors.textGray, marginTop: 4, lineHeight: 1.45 }}>
                    {justification}
                  </p>
                )}
                {!justification && dim?.description && (
                  <p style={{ fontSize: '0.78rem', color: colors.textGray, marginTop: 4, fontStyle: 'italic' }}>
                    {dim.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Cross-path scores. Shows how this cert scores under each path's
          DEFAULT weights — lets users see relative ROI across paths
          regardless of their current lens. Only paths the cert has scores
          for are shown. */}
      {Object.keys(allPathScores).length > 1 && (
        <Section title="Cross-path comparison">
          <div className="cs-lens-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {Object.entries(allPathScores).map(([pKey, score]) => {
              const Icon = PATH_ICONS[pKey];
              const color = roiColor(score);
              const isActive = pKey === path;
              return (
                <div
                  key={pKey}
                  style={{
                    padding: '0.75rem',
                    border: `1px solid ${isActive ? color : colors.slateLight}`,
                    borderRadius: 10,
                    background: isActive ? colors.grayLight : 'white',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    {Icon && <Icon size={14} aria-hidden="true" style={{ color: colors.slateMedium }} />}
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: colors.textDark }}>
                      {PATHS[pKey]?.label || pKey}
                    </span>
                  </div>
                  <div className="font-mono tabular-nums" style={{ fontSize: '1.35rem', fontWeight: 700, color, letterSpacing: '-0.02em' }}>
                    {score}
                  </div>
                  <div style={{ height: 4, background: colors.slateLight, borderRadius: 999, overflow: 'hidden', marginTop: 6 }}>
                    <div style={{ height: '100%', width: `${score}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: '0.7rem', color: colors.textGray, fontStyle: 'italic', marginTop: 8 }}>
            Each path uses its own default weights and dimensions. Scores
            aren&rsquo;t apples-to-apples across paths — they answer different
            questions for different careers.
          </p>
        </Section>
      )}

      {/* Cert investment justification — pulled from active path's efficiency dim if present */}
      {(justificationFor('efficiency')) && (
        <Section title="Certification investment">
          <p style={{ margin: 0, color: colors.slateMedium, lineHeight: 1.6, fontSize: '0.9rem' }}>
            {justificationFor('efficiency')}
          </p>
        </Section>
      )}

      {/* Citations */}
      {citationsLoading && (
        <Section
          title={`Citations (${meta.count})`}
          action={
            <span className="flex items-center gap-1.5 text-xs text-ink-gray">
              <Loader2 size={12} className="animate-spin" aria-hidden="true" />
              Loading…
            </span>
          }
        >
          <div
            aria-busy="true"
            aria-live="polite"
            style={{
              border: `1px solid ${colors.slateLight}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {[...Array(Math.min(3, Math.max(2, meta.count || 3)))].map((_, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.75rem',
                  borderBottom: idx < 2 ? `1px solid ${colors.slateLight}` : 'none',
                  background: idx % 2 === 0 ? 'white' : colors.grayLight,
                }}
              >
                <div className="skeleton" style={{ height: 12, width: `${70 + (idx * 7) % 20}%`, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 10, width: `${50 + (idx * 13) % 25}%`, marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <div className="skeleton" style={{ height: 14, width: 70, borderRadius: 999 }} />
                  <div className="skeleton" style={{ height: 14, width: 110, borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {!citationsLoading && visibleCitations.length > 0 && (
        <Section
          title={`Citations (${visibleCitations.length})`}
          action={
            meta.source === 'legacy' ? (
              <span style={{ fontSize: '0.7rem', color: '#92400e' }}>
                Short list — deeper review pending
              </span>
            ) : null
          }
        >
          <div
            style={{
              maxHeight: 360,
              overflowY: 'auto',
              border: `1px solid ${colors.slateLight}`,
              borderRadius: 8,
            }}
          >
            {visibleCitations.map((citation, idx) => {
              const link = citationUrl(citation);
              const evidenceLabel = EVIDENCE_LABELS[citation.evidence_type] || citation.type;
              return (
                <div
                  key={citation.id || `${cert.name}-${idx}`}
                  style={{
                    padding: '0.75rem',
                    borderBottom: idx < visibleCitations.length - 1 ? `1px solid ${colors.slateLight}` : 'none',
                    background: idx % 2 === 0 ? 'white' : colors.grayLight,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.88rem', color: colors.textDark, lineHeight: 1.4 }}>
                        {citation.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: colors.textGray, marginTop: 2 }}>
                        {[citation.authors, citation.journal].filter(Boolean).join(' · ')}
                        {citation.year && (
                          <span className="font-mono" style={{ marginLeft: 6, fontSize: '0.72rem' }}>
                            {citation.year}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1" style={{ marginTop: 4 }}>
                        {evidenceLabel && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '1px 6px',
                              borderRadius: 999,
                              background: colors.lightBlue,
                              color: colors.primaryBlue,
                            }}
                          >
                            {evidenceLabel}
                          </span>
                        )}
                        {citation.doi && (
                          <span className="font-mono" style={{ fontSize: '0.66rem', color: colors.textGray }}>
                            doi:{citation.doi}
                          </span>
                        )}
                        {!citation.doi && (citation.pmid || citation.pubmedId) && (
                          <span className="font-mono" style={{ fontSize: '0.66rem', color: colors.textGray }}>
                            PMID {citation.pmid || citation.pubmedId}
                          </span>
                        )}
                      </div>
                    </div>
                    {link && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open citation: ${citation.title}`}
                        title="Open citation"
                        style={{ flexShrink: 0, color: colors.primaryBlue, padding: 4 }}
                      >
                        <ExternalLink size={14} aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {!citationsLoading && visibleCitations.length === 0 && (
        <Section title="Citations">
          <div
            style={{
              padding: '1rem',
              background: colors.grayLight,
              border: `1px dashed ${colors.slateLight}`,
              borderRadius: 8,
              color: colors.textGray,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <BookOpen size={16} aria-hidden="true" />
            No citations on file for this cert yet.
          </div>
        </Section>
      )}
    </div>
  );
}
