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
import { colors } from '@/utils/constants';
import { PATHS, LENS_COLORS } from '@/utils/careerPaths';

const DISCIPLINES = ['PT', 'OT', 'SLP', 'AT', 'RN', 'RT', 'EP', 'Audiology'];

const certDisciplineList = (cert) =>
  (cert.disciplines && cert.disciplines.length
    ? cert.disciplines
    : (cert.discipline || '').split('/'))
    .map((d) => d.trim())
    .filter(Boolean);

function Chip({ active, color, children, onClick, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '0.4rem 0.85rem',
        fontSize: '0.82rem',
        fontWeight: 500,
        border: `1px solid ${active ? color : colors.slateLight}`,
        borderRadius: 9999,
        background: active ? color : 'white',
        color: active ? 'white' : colors.slateMedium,
        cursor: 'pointer',
        transition: 'all 0.12s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
      {typeof count === 'number' && (
        <span
          className="font-mono tabular-nums"
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            padding: '1px 6px',
            borderRadius: 4,
            background: active ? 'rgba(255,255,255,0.2)' : colors.grayLight,
            color: active ? 'white' : colors.textGray,
          }}
        >
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
          the user scrolls a long results list. */}
      <div
        style={{
          position: 'sticky',
          top: 65,           // height of the page nav + a small gap
          zIndex: 4,
          background: '#FAFAF6',
          paddingTop: 12,
          paddingBottom: 14,
          marginBottom: 18,
          borderBottom: `1px solid ${colors.slateLight}`,
        }}
      >
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.textGray,
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
              padding: '0.75rem 2.6rem 0.75rem 2.5rem',
              border: `1px solid ${colors.slateLight}`,
              borderRadius: 10,
              background: 'white',
              fontSize: '0.95rem',
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
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 6,
                color: colors.textGray,
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
              right: query ? 38 : 14,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.7rem',
              color: colors.textGray,
              fontFamily: 'JetBrains Mono, monospace',
              padding: '2px 6px',
              borderRadius: 4,
              border: `1px solid ${colors.slateLight}`,
              background: colors.grayLight,
              pointerEvents: 'none',
              transition: 'right 0.12s ease',
            }}
          >
            /
          </span>
        </div>

        {/* Filter rows — discipline above, lens below. Compact labels on
            the left, chips wrap to the right. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span
              className="font-mono"
              style={{
                fontSize: '0.66rem',
                color: colors.textGray,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
                minWidth: 78,
              }}
            >
              Discipline
            </span>
            {DISCIPLINES.map((d) => (
              <Chip
                key={d}
                active={activeDisciplines.has(d)}
                color={colors.primaryBlue}
                count={disciplineCounts[d] || 0}
                onClick={() => setActiveDisciplines(toggle(activeDisciplines, d))}
              >
                {d}
              </Chip>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span
              className="font-mono"
              style={{
                fontSize: '0.66rem',
                color: colors.textGray,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
                minWidth: 78,
              }}
            >
              Lens
            </span>
            {Object.keys(PATHS).map((p) => (
              <Chip
                key={p}
                active={activeLenses.has(p)}
                color={LENS_COLORS[p]}
                count={lensCounts[p] || 0}
                onClick={() => setActiveLenses(toggle(activeLenses, p))}
              >
                {PATHS[p].label}
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
            fontSize: '0.82rem',
            color: colors.textGray,
          }}
        >
          <span>
            <span className="font-mono tabular-nums" style={{ fontWeight: 600, color: colors.textDark }}>
              {filtered.length}
            </span>{' '}
            of{' '}
            <span className="font-mono tabular-nums">{rows.length}</span> credentials
          </span>
          {hasFilter && (
            <button
              type="button"
              onClick={clearAll}
              style={{
                background: 'transparent',
                border: 'none',
                color: colors.primaryBlue,
                cursor: 'pointer',
                fontSize: '0.82rem',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Results list */}
      {filtered.length > 0 ? (
        <ol style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          background: 'white',
          border: `1px solid ${colors.slateLight}`,
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          {filtered.map((row, idx) => (
            <li
              key={row.slug}
              style={{
                borderBottom: idx < filtered.length - 1 ? `1px solid ${colors.slateLight}` : 'none',
              }}
            >
              <Link
                href={`/credentials/${row.slug}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '0.95rem 1.25rem',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <span
                  className="font-mono tabular-nums"
                  style={{ fontSize: '0.78rem', color: colors.textGray, minWidth: 28 }}
                >
                  {String(idx + 1).padStart(3, '0')}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: colors.textDark, letterSpacing: '-0.005em' }}>
                    {row.cert.name}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: '0.74rem', color: colors.textGray }}>
                      {row.cert.type} · {certDisciplineList(row.cert).join(' · ')}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: colors.textGray, marginLeft: 6 }}>
                      <span className="font-mono tabular-nums">{row.count}</span> citations
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} aria-label={`Scored on ${row.lenses.length} lens${row.lenses.length === 1 ? '' : 'es'}`}>
                  {row.lenses.map((p) => (
                    <span
                      key={p}
                      title={PATHS[p]?.label}
                      style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: LENS_COLORS[p],
                      }}
                    />
                  ))}
                </div>
                <ArrowRight size={16} aria-hidden="true" style={{ color: colors.textGray, flexShrink: 0 }} />
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div
          style={{
            padding: '2.5rem 1.5rem',
            background: 'white',
            border: `1px dashed ${colors.slateLight}`,
            borderRadius: 12,
            textAlign: 'center',
            color: colors.textGray,
          }}
        >
          <div style={{ fontWeight: 600, color: colors.textDark, marginBottom: 6 }}>
            No credentials match these filters.
          </div>
          <div style={{ fontSize: '0.88rem' }}>
            Try removing a chip, or{' '}
            <button
              type="button"
              onClick={clearAll}
              style={{
                background: 'transparent',
                border: 'none',
                color: colors.primaryBlue,
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
                font: 'inherit',
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
