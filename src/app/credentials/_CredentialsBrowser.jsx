'use client';

// Search + filter UI for the credential index. Receives the precomputed
// rows from the server page; client filters in-memory and re-renders the
// list. Initial render (server) shows all rows, so SEO sees the full
// library even though the post-hydration UI is interactive.
//
// Filters: free-text search across name/type/disciplines, plus chip
// toggles for discipline and lens. Multi-select within each facet (OR);
// across facets the filters AND together.

import React, { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, X, ArrowRight } from 'lucide-react';
import { PATHS, PATH_ORDER } from '@/utils/careerPaths';
import { A } from '@/components/atlas/theme';

const DISCIPLINES = ['PT', 'OT', 'SLP', 'AT', 'RN', 'RT', 'EP', 'Audiology'];

const certDisciplineList = (cert) =>
  (cert.disciplines && cert.disciplines.length
    ? cert.disciplines
    : (cert.discipline || '').split('/'))
    .map((d) => d.trim())
    .filter(Boolean);

// Pill filter chip with its count inline.
function Chip({ active, children, onClick, count }) {
  return (
    <button type="button" className="mx-chip" onClick={onClick} aria-pressed={active}>
      {children}
      {typeof count === 'number' && <span className="mx-n">{count}</span>}
    </button>
  );
}

export default function CredentialsBrowser({ rows }) {
  const [query, setQuery] = useState('');
  const [activeDisciplines, setActiveDisciplines] = useState(new Set());
  const [activeLenses, setActiveLenses] = useState(new Set());
  const inputRef = useRef(null);

  // Keyboard shortcut: "/" focuses search, mirroring docs sites + GitHub.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        setQuery('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggle = (set, value) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  // Compute counts per facet so chips can show how many results each
  // option would yield. Counts ignore the facet's own selection (so a
  // user can see what they'd get by adding another chip).
  const disciplineCounts = useMemo(() => {
    const counts = {};
    for (const r of rows) {
      const ds = certDisciplineList(r.cert);
      for (const d of DISCIPLINES) {
        if (ds.some((cd) => cd.toUpperCase().includes(d.toUpperCase()))) {
          counts[d] = (counts[d] || 0) + 1;
        }
      }
    }
    return counts;
  }, [rows]);

  const lensCounts = useMemo(() => {
    const counts = {};
    for (const r of rows) {
      for (const l of r.lenses) counts[l] = (counts[l] || 0) + 1;
    }
    return counts;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (q) {
        const ds = certDisciplineList(r.cert);
        const haystack = [
          r.cert.name,
          r.cert.type,
          ds.join(' '),
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (activeDisciplines.size > 0) {
        const ds = certDisciplineList(r.cert).map((d) => d.toUpperCase());
        const any = [...activeDisciplines].some((d) =>
          ds.some((cd) => cd.includes(d.toUpperCase())),
        );
        if (!any) return false;
      }
      if (activeLenses.size > 0) {
        if (!r.lenses.some((l) => activeLenses.has(l))) return false;
      }
      return true;
    });
  }, [rows, query, activeDisciplines, activeLenses]);

  const hasFilter = query || activeDisciplines.size > 0 || activeLenses.size > 0;

  const clearAll = () => {
    setQuery('');
    setActiveDisciplines(new Set());
    setActiveLenses(new Set());
  };

  return (
    <>
      {/* Toolbar: search + chip filters. Sticky on wide screens so it stays
          in reach over a long list; a blurred plum glass so rows read
          through it as they pass. */}
      <div className="atlas-filter-sticky mx-toolbar" style={{ zIndex: 4, marginBottom: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 20px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="mx-search" style={{ maxWidth: 440 }}>
            <Search size={15} aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search credentials, types, or disciplines"
              aria-label="Search credentials"
              aria-keyshortcuts="/"
            />
            {query && (
              <button type="button" className="mx-clear" onClick={() => setQuery('')} aria-label="Clear search">
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12.5, color: A.inkMuted }}>
            <span className="mx-num" role="status">
              <strong style={{ color: A.ink, fontWeight: 500 }}>{filtered.length}</strong> of {rows.length} credentials
            </span>
            {hasFilter && (
              <button type="button" className="mx-toggle" onClick={clearAll}>Clear all</button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
          <div className="mx-chips" role="group" aria-label="Filter by discipline">
            <span className="mx-lab" aria-hidden="true">Discipline</span>
            {DISCIPLINES.map((d) => (
              <Chip key={d} active={activeDisciplines.has(d)} count={disciplineCounts[d] || 0} onClick={() => setActiveDisciplines(toggle(activeDisciplines, d))}>
                {d}
              </Chip>
            ))}
          </div>
          <div className="mx-chips" role="group" aria-label="Filter by lens">
            <span className="mx-lab" aria-hidden="true">Lens</span>
            {PATH_ORDER.map((p) => (
              <Chip key={p} active={activeLenses.has(p)} count={lensCounts[p] || 0} onClick={() => setActiveLenses(toggle(activeLenses, p))}>
                {PATHS[p].label.replace(' & Industry', '')}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {/* Results: one panel, hairline rows. The five dots after each name
          mark the lenses it is scored in, in lens order. */}
      {filtered.length > 0 ? (
        <div className="mx-panel" style={{ padding: '6px 0' }}>
          <p className="mx-sub" style={{ margin: 0, padding: '10px 26px 8px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="mx-lenses" aria-hidden="true"><i className="on" /></span> scored in a lens
            <span className="mx-lenses" aria-hidden="true" style={{ marginLeft: 8 }}><i /></span> not scored
            <span style={{ marginLeft: 8 }}>· dots in lens order: {PATH_ORDER.map((p) => PATHS[p].label.replace(' & Industry', '')).join(', ')}</span>
          </p>
          <ol className="mx-lib">
            {filtered.map((row, idx) => (
              <li key={row.slug}>
                <Link href={`/credentials/${row.slug}`}>
                  <span className="mx-num" style={{ fontSize: 11, color: A.inkMuted, textAlign: 'right' }}>{idx + 1}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14, color: A.ink, lineHeight: 1.35 }}>{row.cert.name}</span>
                    <span style={{ display: 'block', fontSize: 11.5, color: A.inkMuted, marginTop: 3 }}>
                      {row.cert.type} · {certDisciplineList(row.cert).join(', ')}
                    </span>
                  </span>
                  <span
                    className="mx-lenses"
                    title={`Scored in: ${row.lenses.map((p) => PATHS[p]?.label).filter(Boolean).join(', ')}`}
                  >
                    {PATH_ORDER.map((p) => <i key={p} className={row.lenses.includes(p) ? 'on' : undefined} aria-hidden="true" />)}
                    <span className="mx-sr">Scored in {row.lenses.length} lens{row.lenses.length === 1 ? '' : 'es'}: {row.lenses.map((p) => PATHS[p]?.label).join(', ')}.</span>
                  </span>
                  <span className="mx-cites mx-num" style={{ fontSize: 12, color: A.inkBody, minWidth: '6.5em', textAlign: 'right' }}>
                    {row.count ? `${row.count.toLocaleString()} citations` : ''}
                  </span>
                  <ArrowRight size={14} aria-hidden="true" className="mx-go" />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="mx-panel" style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
          <p style={{ color: A.ink, margin: '0 0 6px', fontSize: 14 }}>Nothing in the library matches.</p>
          <p className="mx-sub" style={{ margin: 0 }}>
            Remove a chip, or{' '}
            <button type="button" className="mx-toggle" onClick={clearAll}>clear all filters</button>.
          </p>
        </div>
      )}
    </>
  );
}
