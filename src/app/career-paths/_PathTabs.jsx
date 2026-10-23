'use client';

// Client tabs for /career-paths. Receives every lens's ranked field
// (computed at build time on the server) and renders a segmented tab control
// plus the active lens as three panels: identity and links, the rubric with
// its default weight shares, and the top picks; then a strip of the whole
// field under that lens.
//
// Inactive panels stay in the DOM with `hidden` so crawlers still read all
// five lenses' text. ?path=<key> selects a lens and is kept in the URL.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { A, tierLabel } from '@/components/atlas/theme';
import { PATH_DIMENSIONS } from '@/utils/careerPaths';
import useTablistKeyboard from '@/hooks/useTablistKeyboard';
import { Swarm, Tip } from '../matrix/_charts';

const dimLabel = (pathKey, dim) =>
  PATH_DIMENSIONS[pathKey]?.[dim]?.label
  || dim.replace(/([A-Z])/g, ' $1').trim().replace(/^./, (s) => s.toUpperCase());

const short = (label) => label.replace(' & Industry', '');
const TOP = 5;

export default function PathTabs({ paths, field }) {
  const router = useRouter();
  const [active, setActive] = useState(paths[0].key);
  const [tip, setTip] = useState(null);

  const selectPath = (key) => {
    setActive(key);
    setTip(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('path', key);
      window.history.replaceState(window.history.state, '', url.pathname + url.search);
    }
  };
  const { tabProps } = useTablistKeyboard(paths.map((p) => p.key), active, selectPath);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const param = new URL(window.location.href).searchParams.get('path');
    if (param && paths.some((p) => p.key === param)) setActive(param);
  }, [paths]);

  return (
    <div>
      <div className="mx-seg" role="tablist" aria-label="Career paths" id="path-tabs" style={{ marginBottom: 18 }}>
        {paths.map((p) => (
          <button
            key={p.key}
            type="button"
            role="tab"
            aria-selected={p.key === active}
            aria-controls={`panel-${p.key}`}
            id={`tab-${p.key}`}
            {...tabProps(p.key)}
            onClick={() => selectPath(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {paths.map((p) => {
        const isActive = p.key === active;
        const rows = field[p.key] || [];
        const picks = rows.slice(0, TOP);
        const sum = Object.values(p.defaultWeights).reduce((a, b) => a + b, 0) || 1;
        return (
          <section
            key={p.key}
            id={`panel-${p.key}`}
            role="tabpanel"
            aria-labelledby={`tab-${p.key}`}
            hidden={!isActive}
          >
            <div className="mx-grid">
              {/* Identity */}
              <div className="mx-panel mx-s4" style={{ display: 'flex', flexDirection: 'column' }}>
                <h2 className="mx-ph">Lens</h2>
                <p style={{ fontSize: 'clamp(24px, 2.2vw, 32px)', fontWeight: 380, letterSpacing: '-0.04em', lineHeight: 1.1, margin: '12px 0 0', color: A.ink }}>
                  {p.label}
                </p>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: A.inkBody, margin: '12px 0 0' }}>{p.description}</p>
                <p className="mx-sub mx-num" style={{ marginTop: 12 }}>
                  {rows.length} credentials scored in this lens.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 'auto', paddingTop: 20 }}>
                  <Link href={`/matrix?lens=${p.key}`} className="atlas-btn atlas-btn-primary" style={{ fontSize: 13.5, padding: '10px 18px', borderRadius: 22 }}>
                    Rank the field · {short(p.label)} →
                  </Link>
                  <Link href="/credentials" className="mx-btn" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', fontSize: 13 }}>
                    Browse all dossiers
                  </Link>
                </div>
              </div>

              {/* Rubric */}
              <div className="mx-panel mx-s4">
                <h2 className="mx-ph">Six dimensions</h2>
                <p className="mx-sub">Share of the composite at default weights.</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'grid', gap: 12 }}>
                  {Object.entries(p.defaultWeights).map(([dim, weight]) => {
                    const share = Math.round((weight / sum) * 100);
                    return (
                      <li key={dim} title={PATH_DIMENSIONS[p.key]?.[dim]?.description}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, color: A.inkBody }}>
                          <span>{dimLabel(p.key, dim)}</span>
                          <span className="mx-num" style={{ color: A.inkMuted }}>{share}%</span>
                        </div>
                        <div className="mx-share" style={{ height: 4, marginTop: 6 }} aria-hidden="true">
                          <i style={{ width: `${share}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Top picks */}
              <div className="mx-panel mx-s4">
                <div className="mx-top">
                  <div>
                    <h2 className="mx-ph">Top {Math.min(TOP, rows.length)}</h2>
                    <p className="mx-sub">Composite at default weights</p>
                  </div>
                </div>
                {picks.length > 0 ? (
                  <ol className="mx-rank">
                    {picks.map((c) => (
                      <li key={c.name}>
                        <Link href={c.slug ? `/credentials/${c.slug}` : '/credentials'} style={{ gridTemplateColumns: '22px minmax(0,1fr) auto' }}>
                          <span className="mx-r">{c.rank}</span>
                          <span className="mx-nm">{c.name}<small>{c.type} · {c.disciplines.slice(0, 3).join(', ')}</small></span>
                          <span className="mx-sc">{c.v.toFixed(1)}<span className="mx-sr">, {tierLabel(c.v)}</span></span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mx-sub" style={{ marginTop: 14 }}>No credentials scored on this path yet.</p>
                )}
              </div>

              {/* The whole field under this lens */}
              <div className="mx-panel mx-s12">
                <div className="mx-top">
                  <div>
                    <h2 className="mx-ph">The field under this lens</h2>
                    <p className="mx-sub">Every credential scored in {short(p.label)}, by composite. Select a dot to open it in the field.</p>
                  </div>
                  <span className="mx-count">{rows.length} scored</span>
                </div>
                {isActive && rows.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Swarm
                      rows={rows}
                      selectedName={null}
                      setTip={setTip}
                      lensLabel={short(p.label)}
                      onSelect={(name) => router.push(`/matrix?lens=${p.key}&cert=${encodeURIComponent(name)}`)}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}
      <Tip tip={tip} />
    </div>
  );
}
