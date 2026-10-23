'use client';

// The field: the live scoring engine as a dashboard.
//
// Lens control, discipline and tier filters, search, six live weight sliders
// per lens, a beeswarm of composites, a ranked list that reorders with FLIP
// motion and shows rank change against the lens defaults, the selected
// credential's dossier (dimension bars, cross-lens composites, evidence depth,
// its loaded sources), and an evidence-depth vs. score scatter.
//
// Every number comes from utils/certScoring (rankCertifications,
// computeScore) on the real credential data. Sliders hold raw values; the
// composite uses their shares renormalized to 100.
//
// Deep links: ?lens=<pathKey> picks the lens, ?cert=<name> selects a
// credential. Both are read on mount and kept in the URL as they change.

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { certifications } from '@/utils/certificationData';
import { PATHS, PATH_ORDER, PATH_DIMENSIONS, getPathDefaultWeights } from '@/utils/careerPaths';
import { computeScore, certScoresForPath, rankCertifications, filterRankedCerts } from '@/utils/certScoring';
import { EVIDENCE_LABELS, loadCitations, citationUrl, getTotalCitationsCount } from '@/utils/citationsLibrary';
import { splitEvidence } from '@/utils/formatEvidence';
import { A, MX, tierColor, tierLabel } from '@/components/atlas/theme';
import LensTabs, { lensShortLabel } from '@/components/atlas/LensTabs';
import CredentialLinks from '@/components/education/CredentialLinks';
import { normalizeWeights, sharesOf, sameWeights, LIBRARY, disciplinesOf, TOP_DISCIPLINES, TIERS } from './_field';
import { Swarm, Scatter, Tip } from './_charts';

const TOP_N = 12;
const SLIDER_MAX = 50;

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const TierTag = ({ score }) => (
  <span className="mx-tag">
    <i style={{ background: tierColor(score) }} aria-hidden="true" />
    {tierLabel(score)}
  </span>
);

// ── Ranked list with FLIP reordering ───────────────────────────────────────
function RankList({ rows, selectedName, onSelect }) {
  const els = useRef(new Map());
  const last = useRef(new Map());
  const key = rows.map((r) => r.name).join('|');

  useLayoutEffect(() => {
    const still = reducedMotion();
    const next = new Map();
    rows.forEach((r) => {
      const el = els.current.get(r.name);
      if (!el) return;
      const top = el.offsetTop;
      next.set(r.name, top);
      if (still) return;
      const prev = last.current.get(r.name);
      if (prev == null) {
        if (last.current.size) {
          el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.7,.2,1)' });
        }
        return;
      }
      const dy = prev - top;
      if (Math.abs(dy) > 1) {
        el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.2,.7,.2,1)' });
      }
    });
    last.current = next;
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ol className="mx-rank">
      {rows.map((r) => {
        const delta = r.rank0 - r.rank;
        return (
          <li key={r.name} ref={(el) => { if (el) els.current.set(r.name, el); else els.current.delete(r.name); }}>
            <button type="button" aria-current={r.name === selectedName} onClick={() => onSelect(r.name, { scroll: true })}>
              <span className="mx-r">{r.rank}</span>
              <span className="mx-nm">{r.name}<small>{r.type} · {r.disciplines.slice(0, 3).join(', ')}</small></span>
              <span className="mx-sc">{r.v.toFixed(1)}</span>
              <span
                className={`mx-dl${delta > 0 ? ' up' : delta < 0 ? ' dn' : ''}`}
                aria-label={delta === 0 ? 'rank unchanged' : delta > 0 ? `up ${delta}` : `down ${-delta}`}
              >
                {delta > 0 ? `↑${delta}` : delta < 0 ? `↓${-delta}` : '·'}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function RankTable({ rows, lensLabel }) {
  return (
    <div className="mx-tablewrap">
      <table className="mx-table">
        <caption className="mx-sr">Ranked credentials, {lensLabel} lens, at the current weights</caption>
        <thead>
          <tr><th>Rank</th><th>Credential</th><th>Type</th><th>Composite</th><th>Tier</th><th>Change</th><th>Citations</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const d = r.rank0 - r.rank;
            return (
              <tr key={r.name}>
                <td>{r.rank}</td>
                <td className="mx-n">{r.slug ? <Link href={`/credentials/${r.slug}`}>{r.name}</Link> : r.name}</td>
                <td>{r.type}</td>
                <td>{r.v.toFixed(1)}</td>
                <td>{tierLabel(r.v)}</td>
                <td>{d > 0 ? `+${d}` : d}</td>
                <td>{r.count.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Dossier ────────────────────────────────────────────────────────────────
function Dossier({ row, path, weights, total, setTip }) {
  const [citations, setCitations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!row) return undefined;
    let cancelled = false;
    setLoading(true);
    setCitations([]);
    loadCitations(row.name).then((list) => {
      if (!cancelled) { setCitations(list || []); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [row?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!row) {
    return (
      <>
        <h2>Dossier</h2>
        <p className="mx-sub">No credential matches these filters.</p>
      </>
    );
  }

  const dims = PATH_DIMENSIONS[path] || {};
  const shares = sharesOf(weights);
  const lib = LIBRARY[row.name] || { count: 0, mix: {}, strongShare: 0 };
  const cross = PATH_ORDER.map((key) => {
    const subs = certScoresForPath(row.cert, key);
    return { key, v: subs ? computeScore(subs, getPathDefaultWeights(key)) : null };
  });
  const visible = citations.filter((c) => !c.path || c.path === path);
  const summary = splitEvidence(row.cert.evidence)[0];
  const evTop = Object.entries(lib.mix || {}).filter(([k]) => k !== 'unknown').sort((a, b) => b[1] - a[1]).slice(0, 3);
  const custom = Math.abs(row.v - row.v0) > 0.05;

  return (
    <>
      <div className="mx-top">
        <h2>Dossier</h2>
        <span className="mx-count">Rank {row.rank} of {total} · {lensShortLabel(path)}</span>
      </div>
      <h3 className="mx-name">{row.name}</h3>
      <div className="mx-tags">
        <span className="mx-tag">{row.type}</span>
        {row.disciplines.slice(0, 5).map((d) => <span key={d} className="mx-tag">{d}</span>)}
        {lib.source === 'librarian' && <span className="mx-tag mx-tag-accent">Librarian-reviewed</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px 14px', flexWrap: 'wrap', marginTop: 18 }}>
        <span className="mx-kpi" style={{ marginTop: 0 }}>{row.v.toFixed(1)}</span>
        <span className="mx-lbl">composite of 100{custom ? ` at your weights · ${row.v0.toFixed(1)} at lens defaults` : ' at lens defaults'}</span>
        <TierTag score={row.v} />
      </div>

      <CredentialLinks slug={row.slug} />

      <div className="mx-dgrid">
        <div>
          <h4 className="mx-h5">{lensShortLabel(path)} lens · six dimensions</h4>
          <div role="list" aria-label="Dimension scores">
            {Object.keys(dims).map((k) => {
              const v = row.subs[k] || 0;
              return (
                <div
                  key={k}
                  role="listitem"
                  style={{ marginBottom: 9 }}
                  onPointerMove={(e) => setTip({ title: dims[k].label, lines: [`${v} of 100 · weight ${shares[k] ?? 0}%`, dims[k].description], x: e.clientX, y: e.clientY })}
                  onPointerLeave={() => setTip(null)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: A.inkBody, marginBottom: 4 }}>
                    <span>{dims[k].label} <span style={{ color: A.inkMuted }}>· {shares[k] ?? 0}%</span></span>
                    <span className="mx-num" style={{ color: A.ink }}>{v}</span>
                  </div>
                  <div style={{ height: 10, background: '#ffffff0a', borderRadius: 2 }}>
                    <span style={{ display: 'block', height: '100%', width: `${Math.max(2, v)}%`, background: MX.c2, borderRadius: '0 4px 4px 0', transition: 'width .5s cubic-bezier(.2,.7,.2,1)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <h4 className="mx-h5">Composite across lenses</h4>
          <div role="list" aria-label="Composite in each lens at its default weights" style={{ position: 'relative' }}>
            {cross.map((c) => (
              <div key={c.key} role="listitem" style={{ display: 'grid', gridTemplateColumns: '92px 1fr', alignItems: 'center', height: 30 }}>
                <span style={{ fontSize: 11.5, color: c.key === path ? A.ink : A.inkMuted }}>{lensShortLabel(c.key)}</span>
                <span style={{ position: 'relative', height: 30, borderLeft: '1px solid #ffffff12' }}>
                  <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 15, height: 1, background: '#ffffff12' }} />
                  <span aria-hidden="true" style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: '#ffffff0d' }} />
                  <span aria-hidden="true" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 1, background: '#ffffff0d' }} />
                  {c.v == null ? (
                    <span style={{ position: 'absolute', left: 6, top: 8, fontSize: 10.5, color: A.inkMuted }}>not scored</span>
                  ) : (
                    <span
                      onPointerMove={(e) => setTip({ title: `${PATHS[c.key].label} lens`, lines: [`Composite ${c.v.toFixed(1)} at default weights · ${tierLabel(c.v)}`], x: e.clientX, y: e.clientY })}
                      onPointerLeave={() => setTip(null)}
                      style={{
                        position: 'absolute', top: 15, left: `${c.v}%`, transform: 'translate(-50%, -50%)',
                        width: c.key === path ? 13 : 10, height: c.key === path ? 13 : 10, borderRadius: '50%',
                        background: c.key === path ? A.accent : MX.c2, boxShadow: `0 0 0 2px ${MX.ring}`,
                        transition: 'left .5s cubic-bezier(.2,.7,.2,1)',
                      }}
                    />
                  )}
                  <span className="mx-sr">{c.v == null ? 'not scored' : `composite ${c.v.toFixed(1)}, ${tierLabel(c.v)}`}</span>
                </span>
              </div>
            ))}
            <div aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: '92px 1fr', fontSize: 10, color: A.inkMuted, marginTop: 4 }}>
              <span />
              <span style={{ display: 'flex', justifyContent: 'space-between' }} className="mx-num"><span>0</span><span>50</span><span>100</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-ev">
        <div>
          <span className="mx-lbl">Citations in the library</span>
          <div className="mx-kpi">{lib.count.toLocaleString()}</div>
        </div>
        <div>
          <span className="mx-lbl">Trials, reviews, and meta-analyses</span>
          <div className="mx-kpi">{lib.strongShare}%</div>
          <div className="mx-meter" role="img" aria-label={`${lib.strongShare} percent of citations are trials, reviews, or meta-analyses`}><i style={{ width: `${lib.strongShare}%` }} /></div>
        </div>
      </div>

      {summary && (
        <div style={{ marginTop: 20 }}>
          <h4 className="mx-h5">Evidence summary</h4>
          <p style={{ fontSize: 13.5, lineHeight: 1.65, color: A.inkBody, margin: 0 }}>{summary}</p>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <h4 className="mx-h5">
          Sources · {loading ? lib.count : (visible.length || lib.count)} {visible.length && visible.length !== lib.count ? `for this lens of ${lib.count} on file` : 'on file'}
        </h4>
        {loading && (
          <div role="status" aria-label="Loading sources" style={{ borderTop: `1px solid ${MX.line}` }}>
            {[0.92, 0.74, 0.86].map((w) => (
              <div key={w} style={{ padding: '10px 2px', borderBottom: `1px solid ${MX.line}` }}>
                <div className="skeleton" style={{ height: 10, width: `${w * 100}%`, borderRadius: 2 }} />
                <div className="skeleton" style={{ height: 8, width: `${w * 55}%`, marginTop: 8, borderRadius: 2 }} />
              </div>
            ))}
          </div>
        )}
        {!loading && visible.length > 0 && (
          <ol className="mx-sources">
            {visible.slice(0, 40).map((c, i) => (
              <li key={`${c.title}-${i}`}>
                <span className="mx-num" style={{ fontSize: 11, color: A.inkMuted }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 12.5, lineHeight: 1.4, color: A.ink }}>{c.title}</span>
                  <span style={{ display: 'block', fontSize: 11, color: A.inkMuted, marginTop: 2 }}>
                    {[c.journal, c.year || 'n.d.', EVIDENCE_LABELS[c.evidence_type] || 'Other'].filter(Boolean).join(' · ')}
                  </span>
                </span>
                {citationUrl(c) ? (
                  <a href={citationUrl(c)} target="_blank" rel="noopener noreferrer" aria-label={`Open source: ${c.title}`}>
                    {c.doi ? 'DOI' : 'Source'} ↗
                  </a>
                ) : <span />}
              </li>
            ))}
          </ol>
        )}
        {!loading && visible.length === 0 && (
          <p style={{ fontSize: 12.5, color: A.inkBody, margin: 0, lineHeight: 1.6 }}>
            {lib.count
              ? `${lib.count} curated sources on file${lib.lastReviewed ? `, last reviewed ${lib.lastReviewed}` : ''}: ${evTop.map(([k, n]) => `${n} ${(EVIDENCE_LABELS[k] || k).toLowerCase()}`).join(', ')}.`
              : 'No citations on file for this credential yet.'}
          </p>
        )}
      </div>

      {row.slug && (
        <Link href={`/credentials/${row.slug}`} className="mx-out" style={{ marginTop: 18 }}>
          Open the full dossier{visible.length > 40 ? ` · all ${visible.length} sources` : ''} →
        </Link>
      )}
    </>
  );
}

// ── The field ──────────────────────────────────────────────────────────────
export default function AtlasMatrix() {
  const searchParams = useSearchParams();
  const initialLens = (() => {
    const q = searchParams?.get('lens');
    return q && PATHS[q] ? q : 'clinical';
  })();

  const [path, setPath] = useState(initialLens);
  const [weights, setWeights] = useState(() => getPathDefaultWeights(initialLens));
  const [tier, setTier] = useState('all');
  const [discs, setDiscs] = useState(() => new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedName, setSelectedName] = useState(() => searchParams?.get('cert') || null);
  const [showAll, setShowAll] = useState(false);
  const [asTable, setAsTable] = useState(false);
  const [tip, setTip] = useState(null);
  const dossierRef = useRef(null);

  const defaults = useMemo(() => getPathDefaultWeights(path), [path]);
  const isDefault = sameWeights(weights, defaults);
  const shares = sharesOf(weights);
  const lensLabel = lensShortLabel(path);

  // Rank the whole lens at the current and the default weights.
  const ranked = useMemo(() => rankCertifications(certifications, normalizeWeights(weights), path), [weights, path]);
  const rank0 = useMemo(() => {
    const m = new Map();
    rankCertifications(certifications, defaults, path).forEach((c) => m.set(c.name, c));
    return m;
  }, [defaults, path]);

  const toRow = useCallback((c) => {
    const lib = LIBRARY[c.name] || { count: 0 };
    const d0 = rank0.get(c.name);
    return {
      name: c.name,
      type: c.type,
      disciplines: disciplinesOf(c),
      v: c.computedScore,
      v0: d0 ? d0.computedScore : c.computedScore,
      rank: c.rank,
      rank0: d0 ? d0.rank : c.rank,
      subs: c.subScores,
      count: lib.count,
      slug: lib.slug,
      cert: c,
    };
  }, [rank0]);

  const byDisc = useMemo(
    () => (discs.size ? ranked.filter((c) => disciplinesOf(c).some((d) => discs.has(d))) : ranked),
    [ranked, discs],
  );
  const tierCounts = useMemo(() => {
    const out = { all: byDisc.length };
    TIERS.forEach((t) => { out[t.key] = byDisc.filter((c) => c.computedScore >= t.lo && c.computedScore < t.hi).length; });
    return out;
  }, [byDisc]);
  const rows = useMemo(
    () => filterRankedCerts(byDisc, { tier, discipline: 'All', type: 'All', searchTerm }).map(toRow),
    [byDisc, tier, searchTerm, toRow],
  );

  const selected = useMemo(
    () => (selectedName && rows.find((r) => r.name === selectedName)) || rows[0] || null,
    [selectedName, rows],
  );

  const syncUrl = (lens, cert) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('lens', lens);
    if (cert) url.searchParams.set('cert', cert); else url.searchParams.delete('cert');
    window.history.replaceState(window.history.state, '', url.pathname + url.search);
  };

  const select = (name, { scroll = false } = {}) => {
    setSelectedName(name);
    syncUrl(path, name);
    if (!scroll || typeof window === 'undefined' || !dossierRef.current) return;
    if (!window.matchMedia('(max-width: 980px)').matches) return;
    requestAnimationFrame(() => dossierRef.current?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' }));
  };

  const selectLens = (key) => {
    setTip(null);
    setPath(key);
    setWeights(getPathDefaultWeights(key));
    const keep = selected && certScoresForPath(selected.cert, key) ? selected.name : null;
    setSelectedName(keep);
    syncUrl(key, keep);
  };

  const toggleDisc = (d) => {
    setDiscs((prev) => {
      const next = new Set(prev);
      if (d === null) return new Set();
      if (next.has(d)) next.delete(d); else next.add(d);
      return next;
    });
  };

  const clearFilters = () => { setSearchTerm(''); setTier('all'); setDiscs(new Set()); };
  const listRows = showAll ? rows : rows.slice(0, TOP_N);
  const lensTotal = ranked.length;

  return (
    <>
      {/* Controls: lens, search, discipline, evidence tier */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 22px', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <LensTabs active={path} onSelect={selectLens} full />
        <div className="mx-search">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search the field"
            aria-label="Search credentials"
          />
          {searchTerm && (
            <button type="button" className="mx-clear" onClick={() => setSearchTerm('')} aria-label="Clear search">
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
        <div className="mx-chips" role="group" aria-label="Filter by discipline">
          <span className="mx-lab" aria-hidden="true">Discipline</span>
          <button type="button" className="mx-chip" aria-pressed={discs.size === 0} onClick={() => toggleDisc(null)}>All</button>
          {TOP_DISCIPLINES.map((d) => (
            <button key={d} type="button" className="mx-chip" aria-pressed={discs.has(d)} onClick={() => toggleDisc(d)}>{d}</button>
          ))}
        </div>
        <div className="mx-chips" role="group" aria-label="Filter by evidence tier">
          <span className="mx-lab" aria-hidden="true">Evidence tier</span>
          <button type="button" className="mx-chip" aria-pressed={tier === 'all'} onClick={() => setTier('all')}>
            All <span className="mx-n">{tierCounts.all}</span>
          </button>
          {[...TIERS].reverse().map((t) => (
            <button key={t.key} type="button" className="mx-chip" aria-pressed={tier === t.key} onClick={() => setTier(t.key)}>
              <i style={{ background: tierColor(t.lo) }} aria-hidden="true" />
              {t.label} <span className="mx-n">{tierCounts[t.key]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-grid">
        {/* Beeswarm */}
        <section className="mx-panel mx-s8" aria-labelledby="mx-swarm-h" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="mx-top">
            <div>
              <h2 id="mx-swarm-h">Every credential, by composite score</h2>
              <p className="mx-sub">{PATHS[path].label} lens · {isDefault ? 'default weights' : 'your weights'} · higher is better</p>
            </div>
            <span className="mx-count">{rows.length} of {lensTotal} scored · {certifications.length} in all</span>
          </div>
          {rows.length > 0 ? (
            <>
              <Swarm rows={rows} selectedName={selected?.name} onSelect={select} setTip={setTip} lensLabel={lensLabel} />
              <p className="mx-note">Hover or use the arrow keys for details. The ringed dot is the open dossier.</p>
            </>
          ) : (
            <div style={{ flex: 1, display: 'grid', placeItems: 'center', minHeight: 240, textAlign: 'center' }}>
              <div>
                <p style={{ margin: 0, color: A.ink, fontSize: 14 }}>Nothing in the field matches.</p>
                <p className="mx-sub" style={{ marginTop: 6 }}>
                  {searchTerm ? `No credential name, discipline, or summary contains “${searchTerm}” under these filters.` : 'No credential meets every filter at once.'}
                </p>
                <button type="button" className="mx-btn" style={{ marginTop: 14 }} onClick={clearFilters}>Clear filters</button>
              </div>
            </div>
          )}
        </section>

        {/* Weights */}
        <section className="mx-panel mx-s4" aria-labelledby="mx-w-h">
          <div className="mx-top">
            <div>
              <h2 id="mx-w-h">Lens weights</h2>
              <p className="mx-sub">Shares renormalize to 100%.</p>
            </div>
            <span className="mx-count">{isDefault ? 'Lens defaults' : 'Custom'}</span>
          </div>
          <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
            {Object.keys(defaults).map((k) => {
              const id = `w-${k}`;
              const dim = PATH_DIMENSIONS[path][k];
              const v = weights[k] || 0;
              return (
                <div key={`${path}-${k}`} className="mx-w">
                  <label htmlFor={id} title={dim.description}>{dim.label}<span>{shares[k] ?? 0}%</span></label>
                  <input
                    id={id}
                    className="mx-range"
                    type="range"
                    min="0"
                    max={SLIDER_MAX}
                    step="1"
                    value={v}
                    aria-valuetext={`${shares[k] ?? 0} percent of the composite`}
                    style={{ '--fill': `${(v / SLIDER_MAX) * 100}%` }}
                    onChange={(e) => setWeights((w) => ({ ...w, [k]: parseInt(e.target.value, 10) }))}
                  />
                  <div className="mx-share" aria-hidden="true"><i style={{ width: `${shares[k] ?? 0}%` }} /></div>
                </div>
              );
            })}
          </div>
          <button type="button" className="mx-btn" style={{ marginTop: 16 }} disabled={isDefault} onClick={() => setWeights(getPathDefaultWeights(path))}>
            Reset to lens defaults
          </button>
        </section>

        {/* Ranked */}
        <section className="mx-panel mx-s5" aria-labelledby="mx-rank-h">
          <div className="mx-top">
            <div>
              <h2 id="mx-rank-h">{showAll ? `All ${rows.length}` : `Top ${Math.min(TOP_N, rows.length)}`}</h2>
              <p className="mx-sub">Change vs. the lens&rsquo;s default weights</p>
            </div>
            <button type="button" className="mx-toggle" aria-pressed={asTable} onClick={() => setAsTable((t) => !t)}>
              {asTable ? 'View as list' : 'View as table'}
            </button>
          </div>
          {rows.length === 0 ? (
            <p className="mx-sub" style={{ marginTop: 14 }}>
              Nothing to rank under these filters.{' '}
              <button type="button" className="mx-toggle" onClick={clearFilters}>Clear filters</button>
            </p>
          ) : (
            <div className={showAll ? 'mx-rank-scroll' : undefined}>
              {asTable
                ? <RankTable rows={listRows} lensLabel={PATHS[path].label} />
                : <RankList rows={listRows} selectedName={selected?.name} onSelect={select} />}
            </div>
          )}
          {rows.length > TOP_N && (
            <button type="button" className="mx-toggle" style={{ marginTop: 12 }} aria-expanded={showAll} onClick={() => setShowAll((s) => !s)}>
              {showAll ? `Show the top ${TOP_N}` : `Show all ${rows.length}`}
            </button>
          )}
        </section>

        {/* Dossier */}
        <section ref={dossierRef} className="mx-panel mx-s7 mx-dossier" aria-labelledby="mx-dossier-h" style={{ scrollMarginTop: 'calc(var(--atlas-nav-h, 72px) + 12px)' }}>
          <span id="mx-dossier-h" className="mx-sr" aria-live="polite">Dossier{selected ? `: ${selected.name}` : ''}</span>
          <Dossier row={selected} path={path} weights={weights} total={lensTotal} setTip={setTip} />
        </section>

        {/* Evidence depth vs score */}
        <section className="mx-panel mx-s12" aria-labelledby="mx-sc-h">
          <div className="mx-top">
            <div>
              <h2 id="mx-sc-h">Evidence depth vs. score</h2>
              <p className="mx-sub">Citations on a log scale. Depth of literature and value are different questions.</p>
            </div>
            <span className="mx-count">{rows.length} credentials · {lensLabel} lens</span>
          </div>
          {rows.length > 0 && <Scatter rows={rows} selectedName={selected?.name} onSelect={select} setTip={setTip} lensLabel={lensLabel} />}
        </section>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px 20px', marginTop: 16, fontSize: 11.5, color: A.inkMuted }}>
        <span className="mx-num">Source: CE Shield evidence library · {getTotalCitationsCount().toLocaleString()} citations. Weights you set here are not saved.</span>
        <Link href="/methodology" className="mx-out" style={{ minHeight: 0, fontSize: 11.5 }}>How scoring works →</Link>
      </div>

      <Tip tip={tip} />
    </>
  );
}
