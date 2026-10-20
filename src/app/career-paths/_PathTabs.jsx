'use client';

// Client-side tabbed interface for /career-paths. Receives all 5 paths'
// precomputed data as props (top picks computed at build time on the server
// component) and renders a sticky tab strip + the active path's content as
// a 3-column instrument panel on wide screens.
//
// Layout intent:
//   ── tab strip (full width, joined rectangles, petrol active) ──
//   ┌────────────┬──────────────┬───────────────┐
//   │ identity   │ dimensions   │ top picks     │
//   │ + CTAs     │              │               │
//   └────────────┴──────────────┴───────────────┘
//
// Inactive panels stay in the DOM with `hidden` so Googlebot still sees
// all 5 paths' text for SEO.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { A, FIG, INS, tabularNums } from '@/components/atlas/theme';
import { PATH_DIMENSIONS } from '@/utils/careerPaths';
import useTablistKeyboard from '@/hooks/useTablistKeyboard';

// Dimension names come from the lens config, so this page, the field and
// the dossiers all say "Billing & reimbursement", not "Reimbursement".
const dimLabel = (pathKey, dim) =>
  PATH_DIMENSIONS[pathKey]?.[dim]?.label
  || dim.replace(/([A-Z])/g, ' $1').trim().replace(/^./, (s) => s.toUpperCase());

const PanelLabel = ({ children }) => (
  <div
    style={{
      fontFamily: FIG,
      fontSize: '0.8rem',
      color: A.inkMuted,
      letterSpacing: '0.02em',
      fontWeight: 600,
      marginBottom: 14,
      borderTop: `2px solid ${A.ink}`,
      paddingTop: 10,
    }}
  >
    {children}
  </div>
);

export default function PathTabs({ paths, examples }) {
  const [active, setActive] = useState(paths[0].key);
  const { tabProps } = useTablistKeyboard(
    paths.map((p) => p.key),
    active,
    (key) => selectPath(key),
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const param = new URL(window.location.href).searchParams.get('path');
    if (param && paths.some((p) => p.key === param)) setActive(param);
  }, [paths]);

  const selectPath = (key) => {
    setActive(key);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('path', key);
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  };

  return (
    <div style={{ border: `1px solid ${A.ink}`, background: A.paper }}>
      {/* Tab strip — joined rectangles, sticky so it stays in view as the
          user reads the panel below. Active = petrol fill + ● prefix. */}
      <div
        id="path-tabs"
        role="tablist"
        aria-label="Career paths"
        className="atlas-pathtabs"
        style={{
          zIndex: 5,
          background: A.paper,
          borderBottom: `1px solid ${A.ink}`,
        }}
      >
        {paths.map((p) => {
          const isActive = p.key === active;
          return (
            <button
              key={p.key}
              type="button"
              role="tab"
              className="atlas-tab"
              aria-selected={isActive}
              aria-controls={`panel-${p.key}`}
              id={`tab-${p.key}`}
              {...tabProps(p.key)}
              onClick={() => selectPath(p.key)}
              style={{
                fontFamily: FIG,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.01em',
                padding: '13px 18px',
                background: isActive ? A.accent : 'transparent',
                color: isActive ? A.onAccent : A.inkMuted,
                border: 'none',
                borderRight: `1px solid ${A.ruleMinor}`,
                cursor: 'pointer',
                transition: 'background 0.15s ease, color 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {(isActive ? '● ' : '') + p.label.replace(' & Industry', '')}
            </button>
          );
        })}
      </div>

      {/* Panels — one per path, 3-column grid inside on wide screens. */}
      {paths.map((p) => {
        const isActive = p.key === active;
        const list = examples[p.key] || [];
        const maxWeight = Math.max(...Object.values(p.defaultWeights));

        return (
          <section
            key={p.key}
            id={`panel-${p.key}`}
            role="tabpanel"
            aria-labelledby={`tab-${p.key}`}
            hidden={!isActive}
            className="cs-path-panel"
          >
            <div className="cs-path-panel-grid" style={{ padding: '1.5rem 1.75rem' }}>
              {/* LEFT — identity + CTAs */}
              <div className="cs-path-identity">
                <h2 style={{
                  fontFamily: INS,
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  margin: 0,
                  color: A.ink,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.15,
                }}>
                  {p.label}
                </h2>
                <p style={{
                  color: A.inkBody,
                  lineHeight: 1.6,
                  marginTop: 12,
                  marginBottom: 20,
                  fontSize: '0.92rem',
                }}>
                  {p.description}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link
                    href={`/matrix?lens=${p.key}`}
                    className="atlas-btn atlas-btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      padding: '0.65rem 1rem',
                      background: A.accent,
                      color: A.onAccent,
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                    }}
                  >
                    <span>Rank the field · {p.label.replace(' & Industry', '')}</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                  <Link
                    href="/credentials"
                    className="atlas-btn atlas-btn-secondary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 6,
                      padding: '0.65rem 1rem',
                      background: 'transparent',
                      border: `1px solid ${A.ink}`,
                      color: A.ink,
                      textDecoration: 'none',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                    }}
                  >
                    <span>Browse all credentials</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {/* MIDDLE — scoring dimensions with weight bars */}
              <div className="cs-path-dims">
                <PanelLabel>Scoring dimensions · default weights</PanelLabel>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {Object.entries(p.defaultWeights).map(([dim, weight]) => (
                    <li key={dim}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                        <span style={{ fontSize: '0.88rem', color: A.ink, fontWeight: 600 }}>
                          {dimLabel(p.key, dim)}
                        </span>
                        <span style={{ color: A.accent, fontSize: '0.8rem', fontWeight: 700, ...tabularNums }}>
                          ×{weight}
                        </span>
                      </div>
                      <div style={{ height: 4, background: A.ruleFaint }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${(weight / maxWeight) * 100}%`,
                            background: A.accent,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* RIGHT — top picks under these defaults */}
              <div className="cs-path-picks">
                <PanelLabel>Top picks · default weights</PanelLabel>
                {list.length > 0 ? (
                  <ol style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    border: `1px solid ${A.ink}`,
                  }}>
                    {list.map((cert, i) => (
                      <li
                        key={cert.name}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '24px 1fr auto',
                          gap: 12,
                          alignItems: 'center',
                          padding: '0.7rem 0.85rem',
                          borderBottom: i < list.length - 1 ? `1px solid ${A.ruleFaint}` : 'none',
                        }}
                      >
                        <span style={{ fontSize: '0.74rem', color: A.inkMuted, fontWeight: 600, ...tabularNums }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <Link
                          href={cert.slug ? `/credentials/${cert.slug}` : '/credentials'}
                          style={{ color: A.ink, textDecoration: 'none', minWidth: 0 }}
                        >
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cert.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: A.inkMuted, marginTop: 2 }}>
                            {cert.discipline} · {cert.type}
                          </div>
                        </Link>
                        <span
                          style={{
                            minWidth: 38, textAlign: 'right',
                            fontWeight: 700, color: A.accent, fontSize: '1.05rem',
                            ...tabularNums,
                          }}
                        >
                          {cert.score}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div
                    style={{
                      padding: '1.25rem',
                      background: A.notice,
                      border: `1px dashed ${A.ink}`,
                      color: A.inkMuted,
                      fontSize: '0.85rem',
                      textAlign: 'center',
                    }}
                  >
                    No credentials scored on this path yet.
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
