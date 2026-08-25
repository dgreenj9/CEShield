'use client';

// The Atlas Matrix instrument ("Table 1 — the credential field, ranked").
//
// One bordered panel: lens tab strip + calibration drawer + filter row +
// two-pane body (ranked list on the left, the selected credential's plate on
// the right) + source footer. All numbers come from the real scoring
// utilities, so the React output matches the design prototype exactly.
//
// Deep links: ?lens=<pathKey> picks the lens, ?cert=<name> selects a
// credential — both read once on mount.

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { certifications } from '@/utils/certificationData';
import { PATHS, PATH_ORDER, PATH_DIMENSIONS, getPathDefaultWeights } from '@/utils/careerPaths';
import {
  computeScore, certScoresForPath, rankCertifications, filterRankedCerts,
  tierCountsFor, redistributeWeights,
} from '@/utils/certScoring';
import {
  EVIDENCE_LABELS, getEvidenceMix, getLibraryMetaForCertification,
  loadCitations, citationUrl, getTotalCitationsCount,
} from '@/utils/citationsLibrary';
import { splitEvidence } from '@/utils/formatEvidence';
import { A, FIG, INS, tierColor, tierLabel, eyebrow, ruledHead, tabularNums } from '@/components/atlas/theme';
import LensTabs, { lensShortLabel } from '@/components/atlas/LensTabs';

const DISCIPLINES = ['All', 'PT', 'OT', 'SLP', 'AT'];

const chipStyle = (on) => ({
  fontFamily: FIG,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.01em',
  padding: '5px 11px',
  background: on ? A.ink : 'transparent',
  color: on ? A.onAccent : A.inkMuted,
  border: `1px solid ${on ? A.ink : A.ruleMinor}`,
  cursor: 'pointer',
  transition: 'all 0.12s ease',
  whiteSpace: 'nowrap',
});

export default function AtlasMatrix() {
  const searchParams = useSearchParams();
  const initialLens = (() => {
    const q = searchParams?.get('lens');
    return q && PATHS[q] ? q : 'clinical';
  })();

  const [path, setPath] = useState(initialLens);
  const [weights, setWeights] = useState(() => getPathDefaultWeights(initialLens));
  const [showCal, setShowCal] = useState(false);
  const [tier, setTier] = useState('all');
  const [discipline, setDiscipline] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedName, setSelectedName] = useState(() => searchParams?.get('cert') || null);
  const [citations, setCitations] = useState([]);
  const [citationsLoading, setCitationsLoading] = useState(true);

  const ranked = useMemo(
    () => rankCertifications(certifications, weights, path),
    [weights, path],
  );
  const filtered = useMemo(
    () => filterRankedCerts(ranked, { tier, discipline, type: 'All', searchTerm }),
    [ranked, tier, discipline, searchTerm],
  );
  const tierCounts = useMemo(() => tierCountsFor(ranked, discipline), [ranked, discipline]);

  // Selection falls back to the top-ranked row whenever filters exclude the
  // current selection.
  const selected = useMemo(
    () => (selectedName && filtered.find((c) => c.name === selectedName)) || filtered[0] || null,
    [selectedName, filtered],
  );

  useEffect(() => {
    if (!selected) return undefined;
    let cancelled = false;
    setCitationsLoading(true);
    setCitations([]);
    loadCitations(selected.name).then((list) => {
      if (!cancelled) {
        setCitations(list || []);
        setCitationsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [selected?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectLens = (key) => {
    setPath(key);
    setWeights(getPathDefaultWeights(key));
  };

  const dims = PATH_DIMENSIONS[path] || {};
  const weightsTotal = Object.values(weights).reduce((a, b) => a + b, 0);

  // ── Detail plate values ────────────────────────────────────────────────
  let det = null;
  if (selected) {
    const subs = certScoresForPath(selected, path) || {};
    const score = Math.round(computeScore(subs, weights) * 10) / 10;
    const mix = getEvidenceMix(selected.name);
    const meta = getLibraryMetaForCertification(selected.name);
    const cross = PATH_ORDER.map((key) => {
      const ps = certScoresForPath(selected, key);
      if (!ps) return null;
      const cScore = Math.round(computeScore(ps, getPathDefaultWeights(key)));
      return { key, label: lensShortLabel(key), score: cScore, on: key === path, color: tierColor(cScore) };
    }).filter(Boolean);
    const visible = citations.filter((c) => !c.path || c.path === path);
    const evTop = Object.entries(mix)
      .filter(([k]) => k !== 'unknown')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    det = { subs, score, mix, meta, cross, visible, evTop };
  }

  return (
    <>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1
          className="cs-h1-clamp"
          style={{ fontFamily: INS, fontWeight: 600, fontSize: 40, lineHeight: 1.02, letterSpacing: '-0.025em', margin: 0 }}
        >
          Rank by evidence. Calibrate by career.
        </h1>
        <div style={{ ...eyebrow(), marginTop: 10, ...tabularNums }}>
          {filtered.length} of {certifications.length} credentials shown
        </div>
      </header>

      <div style={{ border: `1px solid ${A.ink}`, background: A.paper }}>
        {/* Lens tab strip + calibration toggle */}
        <LensTabs
          active={path}
          onSelect={selectLens}
          trailing={(
            <button
              type="button"
              aria-expanded={showCal}
              onClick={() => setShowCal((v) => !v)}
              style={{
                fontFamily: FIG,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.01em',
                padding: '13px 18px',
                marginLeft: 'auto',
                background: showCal ? A.ink : 'transparent',
                color: showCal ? A.onAccent : A.ink,
                border: 'none',
                borderLeft: `1px solid ${A.ink}`,
                cursor: 'pointer',
              }}
            >
              Calibration {showCal ? '−' : '+'}
            </button>
          )}
        />

        {/* Calibration drawer */}
        {showCal && (
          <div style={{ borderBottom: `1px solid ${A.ink}`, padding: '1.25rem 1.5rem', background: A.band }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span style={eyebrow()}>Calibration · Σ = {weightsTotal}</span>
              <button
                type="button"
                onClick={() => setWeights(getPathDefaultWeights(path))}
                style={{
                  fontFamily: FIG, fontSize: 12.5, fontWeight: 600, background: 'transparent',
                  border: `1px solid ${A.ink}`, padding: '5px 12px', cursor: 'pointer', color: A.ink,
                }}
              >
                Reset defaults
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.9rem 2rem' }}>
              {Object.keys(dims).map((key) => (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{dims[key].label}</span>
                    <span style={{ fontFamily: FIG, fontSize: 13, fontWeight: 700, color: A.accent, ...tabularNums }}>
                      ×{weights[key] || 0}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={weights[key] || 0}
                    onChange={(e) => setWeights(redistributeWeights(weights, key, parseInt(e.target.value, 10)))}
                    aria-label={`${dims[key].label} weight`}
                    style={{ width: '100%' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter row */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.8rem 1.5rem', borderBottom: `1px solid ${A.ink}`, flexWrap: 'wrap' }}>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search the field…"
            aria-label="Search credentials"
            style={{
              flex: 1, minWidth: 220, fontFamily: FIG, fontSize: 'max(16px, 15px)', padding: '8px 2px',
              border: 'none', borderBottom: `2px solid ${A.ruleMinor}`, background: 'transparent', color: A.ink,
            }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} role="group" aria-label="Filter by evidence tier">
            {[
              ['all', `All ${tierCounts.all}`],
              ['strong', `Strong ${tierCounts.strong}`],
              ['good', `Good ${tierCounts.good}`],
              ['moderate', `Moderate ${tierCounts.moderate}`],
              ['limited', `Limited ${tierCounts.limited}`],
            ].map(([value, label]) => (
              <button key={value} type="button" aria-pressed={tier === value} onClick={() => setTier(value)} style={chipStyle(tier === value)}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} role="group" aria-label="Filter by discipline">
            {DISCIPLINES.map((d) => (
              <button key={d} type="button" aria-pressed={discipline === d} onClick={() => setDiscipline(d)} style={chipStyle(discipline === d)}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Two-pane body */}
        <div className="atlas-two-pane">
          <div style={{ borderRight: `1px solid ${A.ink}`, maxHeight: 720, overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: A.inkMuted, fontSize: 14 }}>
                Nothing in the field matches.{' '}
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); setTier('all'); setDiscipline('All'); }}
                  style={{ background: 'none', border: 'none', color: A.accent, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, textDecoration: 'underline' }}
                >
                  Clear filters
                </button>
              </div>
            )}
            {filtered.map((cert) => {
              const on = selected && selected.name === cert.name;
              return (
                <button
                  key={cert.name}
                  type="button"
                  aria-pressed={!!on}
                  onClick={() => setSelectedName(cert.name)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '0.7rem 1.1rem',
                    background: on ? A.band : 'transparent', border: 'none', borderBottom: `1px solid ${A.ruleFaint}`,
                    borderLeft: `3px solid ${on ? A.accent : 'transparent'}`, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background 0.12s ease', textAlign: 'left',
                  }}
                >
                  <span style={{ fontFamily: FIG, fontSize: 11, color: A.inkMuted, width: 26, textAlign: 'right', flexShrink: 0, ...tabularNums }}>
                    {String(cert.rank).padStart(3, '0')}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: on ? 700 : 600, fontSize: 14.5, letterSpacing: '-0.01em', color: A.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cert.name}
                    </span>
                    <span style={{ display: 'block', fontFamily: FIG, fontSize: 11, color: A.inkMuted, marginTop: 2 }}>
                      {cert.type} · {(cert.disciplines || [cert.discipline]).join('·')}
                    </span>
                  </span>
                  <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: '50%', background: tierColor(cert.computedScore), flexShrink: 0 }} />
                  <span style={{ fontFamily: FIG, fontSize: 16, fontWeight: 700, width: 46, textAlign: 'right', flexShrink: 0, color: A.ink, ...tabularNums }}>
                    {cert.computedScore.toFixed(1)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* The plate */}
          <div style={{ padding: '1.75rem 1.75rem 2rem', minHeight: 600 }}>
            {selected && det && (
              <>
                <div style={{ ...eyebrow(12), marginBottom: 10 }}>
                  {selected.type} · {(selected.disciplines || [selected.discipline]).join(' · ')}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem' }}>
                  <h2 style={{ fontFamily: INS, fontWeight: 600, fontSize: 27, lineHeight: 1.08, letterSpacing: '-0.02em', margin: 0, textWrap: 'balance' }}>
                    {selected.name}
                  </h2>
                  <span style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontFamily: FIG, fontSize: 44, fontWeight: 800, lineHeight: 1, color: tierColor(det.score), letterSpacing: '-0.02em', ...tabularNums }}>
                      {det.score.toFixed(1)}
                    </span>
                    <span style={{ display: 'block', fontFamily: FIG, fontSize: 11.5, letterSpacing: '0.02em', color: A.inkMuted, marginTop: 2 }}>
                      of 100 · {tierLabel(det.score)}
                    </span>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                  {det.evTop.map(([k, n]) => (
                    <span key={k} style={{ fontFamily: FIG, fontSize: 11.5, fontWeight: 700, padding: '3px 10px', border: `1px solid ${A.ruleMinor}`, color: A.inkBody }}>
                      {n} {EVIDENCE_LABELS[k] || k}
                    </span>
                  ))}
                  {det.meta.source === 'librarian' && (
                    <span style={{ fontFamily: FIG, fontSize: 11.5, fontWeight: 700, padding: '3px 10px', background: A.accent, color: A.onAccent }}>
                      Librarian-reviewed
                    </span>
                  )}
                </div>

                {/* Fig. A — score anatomy */}
                <div style={{ marginTop: '1.6rem' }}>
                  <div style={{ ...ruledHead, marginBottom: 12 }}>
                    Score anatomy · {lensShortLabel(path)} lens
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem 2rem' }}>
                    {Object.keys(dims).map((key) => (
                      <div key={key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>
                            {dims[key].label}{' '}
                            <span style={{ fontFamily: FIG, fontSize: 11, color: A.inkMuted, fontWeight: 500 }}>×{weights[key] || 0}</span>
                          </span>
                          <span style={{ fontFamily: FIG, fontSize: 13, fontWeight: 700, ...tabularNums }}>{det.subs[key] || 0}</span>
                        </div>
                        <div style={{ height: 4, background: A.ruleFaint }}>
                          <span style={{ display: 'block', height: '100%', width: `${det.subs[key] || 0}%`, background: A.accent }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fig. B — cross-lens comparison */}
                {det.cross.length > 1 && (
                  <div style={{ marginTop: '1.6rem' }}>
                    <div style={{ ...ruledHead, marginBottom: 12 }}>The same credential, every lens</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {det.cross.map((cp) => (
                        <div key={cp.key} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 44px', gap: 12, alignItems: 'center' }}>
                          <span style={{ fontFamily: FIG, fontSize: 12, fontWeight: cp.on ? 800 : 600, color: cp.on ? A.accent : A.inkMuted, letterSpacing: '0.02em' }}>
                            {cp.label}
                          </span>
                          <span style={{ height: 5, background: A.ruleFaint }}>
                            <span style={{ display: 'block', height: '100%', width: `${cp.score}%`, background: cp.color }} />
                          </span>
                          <span style={{ fontFamily: FIG, fontSize: 13.5, fontWeight: 700, textAlign: 'right', color: A.ink, ...tabularNums }}>
                            {cp.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes — evidence summary */}
                <div style={{ marginTop: '1.6rem' }}>
                  <div style={{ ...ruledHead, marginBottom: 10 }}>Evidence summary</div>
                  {splitEvidence(selected.evidence).slice(0, 1).map((text) => (
                    <p key={text.slice(0, 24)} style={{ fontSize: 14, color: A.inkBody, lineHeight: 1.65, margin: '0 0 0.7rem' }}>
                      {text}
                    </p>
                  ))}
                </div>

                {/* Sources — citation list */}
                <div style={{ marginTop: '1.4rem' }}>
                  <div style={{ ...ruledHead, marginBottom: 10 }}>
                    Sources · {citationsLoading ? det.meta.count : (det.visible.length || det.meta.count)} on file
                  </div>
                  {citationsLoading && (
                    <p style={{ fontFamily: FIG, fontSize: 12.5, color: A.inkMuted, margin: 0 }}>Loading citations.</p>
                  )}
                  {!citationsLoading && det.visible.length > 0 && (
                    <div style={{ maxHeight: 260, overflowY: 'auto', border: `1px dashed ${A.ink}` }}>
                      {det.visible.slice(0, 30).map((c, idx, arr) => (
                        <div
                          key={`${c.title}-${idx}`}
                          style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '0.7rem 0.9rem', borderBottom: idx < arr.length - 1 ? `1px solid ${A.ruleFaint}` : 'none' }}
                        >
                          <span style={{ fontFamily: FIG, fontSize: 11, color: A.inkMuted, minWidth: 24, ...tabularNums }}>
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, lineHeight: 1.4 }}>{c.title}</span>
                            <span style={{ display: 'block', fontFamily: FIG, fontSize: 11.5, color: A.inkMuted, marginTop: 2 }}>
                              {[c.authors, c.journal].filter(Boolean).join(' · ')} · {c.year || 'n.d.'} · {EVIDENCE_LABELS[c.evidence_type] || 'Other'}
                            </span>
                          </span>
                          {citationUrl(c) && (
                            <a
                              href={citationUrl(c)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontFamily: FIG, fontSize: 11.5, fontWeight: 700, color: A.accent, textDecoration: 'none', whiteSpace: 'nowrap' }}
                            >
                              DOI ↗
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {!citationsLoading && det.visible.length === 0 && (
                    <p style={{ fontFamily: FIG, fontSize: 12.5, color: A.inkBody, margin: 0, lineHeight: 1.6 }}>
                      {det.meta.count
                        ? `${det.meta.count} curated sources on file${det.meta.last_reviewed ? `, last reviewed ${det.meta.last_reviewed}` : ''}: ${det.evTop.map(([k, n]) => `${n} ${(EVIDENCE_LABELS[k] || k).toLowerCase()}`).join(', ')}.`
                        : 'No citations on file for this credential yet.'}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Source footer */}
        <div
          style={{
            borderTop: `1px solid ${A.ink}`, padding: '10px 1.5rem', display: 'flex', justifyContent: 'space-between',
            gap: '1rem', flexWrap: 'wrap', fontFamily: FIG, fontSize: 12, letterSpacing: '0.02em', color: A.inkMuted,
          }}
        >
          <span>Source: CE Shield evidence library · {getTotalCitationsCount().toLocaleString()} citations</span>
          <Link href="/methodology" style={{ color: A.accent, fontWeight: 700, textDecoration: 'none' }}>
            Survey methodology →
          </Link>
        </div>
      </div>
    </>
  );
}
