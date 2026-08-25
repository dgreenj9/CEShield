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
import { PATHS } from '@/utils/careerPaths';
import { A, FIG, eyebrow, tabularNums } from '@/components/atlas/theme';

const DISCIPLINES = ['PT', 'OT', 'SLP', 'AT', 'RN', 'RT', 'EP', 'Audiology'];

const certDisciplineList = (cert) =>
  (cert.disciplines && cert.disciplines.length
    ? cert.disciplines
    : (cert.discipline || '').split('/'))
    .map((d) => d.trim())
    .filter(Boolean);

// Atlas filter chip: rectangular, ink fill when active, count inline.
function Chip({ active, children, onClick, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 11px',
        fontFamily: FIG,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.01em',
        border: `1px solid ${active ? A.ink : A.ruleMinor}`,
        background: active ? A.ink : 'transparent',
        color: active ? A.onAccent : A.inkMuted,
        cursor: 'pointer',
        transition: 'all 0.12s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
      {typeof count === 'number' && (
        <span style={{ fontWeight: 600, opacity: active ? 0.8 : 1, color: active ? A.onAccent : A.inkMuted, ...tabularNums }}>
          {count}
        </span>
      )}
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
      {/* Toolbar — search + chip filters. Sticky so it stays in reach as
          the user scrolls a long results list. Opaque paper so rows scroll
          away beneath it. */}
      <div
        style={{
          position: 'sticky',
          top: 61, // height of the page nav + a small gap
          zIndex: 4,
          background: A.paper,
          paddingTop: 12,
          paddingBottom: 14,
          marginBottom: 18,
          borderBottom: `1px solid ${A.ink}`,
        }}
      >
        <div style={{ position: 'relative' }}>
          <Search
            size={15}
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 2,
              top: '50%',
              transform: 'translateY(-50%)',
              color: A.inkMuted,
              pointerEvents: 'none',
            }}
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search credentials, types, or disciplines…"
            aria-label="Search credentials"
            style={{
              width: '100%',
              padding: '8px 2.6rem 8px 26px',
              border: 'none',
              borderBottom: `2px solid ${A.ruleMinor}`,
              background: 'transparent',
              fontFamily: FIG,
              fontSize: 'max(16px, 15px)',
              color: A.ink,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              style={{
                position: 'absolute',
                right: 36,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 6,
                color: A.inkMuted,
                display: 'flex',
              }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              fontFamily: FIG,
              fontSize: 11,
              fontWeight: 600,
              color: A.inkMuted,
              padding: '2px 7px',
              border: `1px solid ${A.ruleMinor}`,
              pointerEvents: 'none',
            }}
          >
            /
          </span>
        </div>

        {/* Filter rows — discipline above, lens below. Compact labels on
            the left, chips wrap to the right. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ ...eyebrow(12), minWidth: 78 }}>Discipline</span>
            {DISCIPLINES.map((d) => (
              <Chip
                key={d}
                active={activeDisciplines.has(d)}
                count={disciplineCounts[d] || 0}
                onClick={() => setActiveDisciplines(toggle(activeDisciplines, d))}
              >
                {d}
              </Chip>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ ...eyebrow(12), minWidth: 78 }}>Lens</span>
            {Object.keys(PATHS).map((p) => (
              <Chip
                key={p}
                active={activeLenses.has(p)}
                count={lensCounts[p] || 0}
                onClick={() => setActiveLenses(toggle(activeLenses, p))}
              >
                {PATHS[p].label.replace(' & Industry', '')}
              </Chip>
            ))}
          </div>
        </div>

        {/* Result count + clear */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 12,
            fontFamily: FIG,
            fontSize: 12.5,
            color: A.inkMuted,
          }}
        >
          <span style={tabularNums}>
            <strong style={{ color: A.ink, fontWeight: 700 }}>{filtered.length}</strong>
            {' '}of {rows.length} credentials
          </span>
          {hasFilter && (
            <button
              type="button"
              onClick={clearAll}
              style={{
                background: 'transparent',
                border: 'none',
                color: A.accent,
                cursor: 'pointer',
                fontFamily: FIG,
                fontSize: 12.5,
                fontWeight: 700,
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Results list — a survey table drawn with ink rules. */}
      {filtered.length > 0 ? (
        <ol
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            background: A.paper,
            border: `1px solid ${A.ink}`,
          }}
        >
          {filtered.map((row, idx) => (
            <li
              key={row.slug}
              style={{
                borderBottom: idx < filtered.length - 1 ? `1px solid ${A.ruleFaint}` : 'none',
              }}
            >
              <Link
                href={`/credentials/${row.slug}`}
                className="card-hover"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '0.8rem 1.1rem',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <span
                  style={{ fontFamily: FIG, fontSize: 11, color: A.inkMuted, minWidth: 28, textAlign: 'right', ...tabularNums }}
                >
                  {String(idx + 1).padStart(3, '0')}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: A.ink, letterSpacing: '-0.01em' }}>
                    {row.cert.name}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 3 }}>
                    <span style={{ fontFamily: FIG, fontSize: 11.5, color: A.inkMuted }}>
                      {row.cert.type} · {certDisciplineList(row.cert).join(' · ')}
                    </span>
                    <span style={{ fontFamily: FIG, fontSize: 11.5, color: A.inkMuted, ...tabularNums }}>
                      · {row.count} citations
                    </span>
                  </div>
                </div>
                <span
                  style={{ fontFamily: FIG, fontSize: 11.5, color: A.inkMuted, flexShrink: 0, whiteSpace: 'nowrap', ...tabularNums }}
                  title={row.lenses.map((p) => PATHS[p]?.label).filter(Boolean).join(' · ')}
                >
                  {row.lenses.length} lens{row.lenses.length === 1 ? '' : 'es'}
                </span>
                <ArrowRight size={15} aria-hidden="true" style={{ color: A.accent, flexShrink: 0 }} />
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div
          style={{
            padding: '2.5rem 1.5rem',
            background: A.notice,
            border: `1px dashed ${A.ink}`,
            textAlign: 'center',
            color: A.inkMuted,
          }}
        >
          <div style={{ fontWeight: 600, color: A.ink, marginBottom: 6 }}>
            Nothing in the library matches.
          </div>
          <div style={{ fontSize: 14 }}>
            Try removing a chip, or{' '}
            <button
              type="button"
              onClick={clearAll}
              style={{
                background: 'transparent',
                border: 'none',
                color: A.accent,
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
                font: 'inherit',
                fontWeight: 700,
              }}
            >
              clear all filters
            </button>
            .
          </div>
        </div>
      )}
    </>
  );
}
