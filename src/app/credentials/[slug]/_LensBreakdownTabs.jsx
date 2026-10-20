'use client';

// Tabbed per-lens score breakdown for a credential. Replaces 5 stacked
// breakdown sections (one per path the cert is scored on) with a single
// section + tab selector. Inactive panels stay in the DOM with `hidden`
// so SEO still sees every lens's text content.

import React, { useEffect, useState } from 'react';
import useTablistKeyboard from '@/hooks/useTablistKeyboard';
import { A, FIG, tabularNums, hairHead, display, VIZ } from '@/components/atlas/theme';

export default function LensBreakdownTabs({ lenses, initialActive }) {
  const [active, setActive] = useState(initialActive || lenses[0]?.key);
  const { tabProps } = useTablistKeyboard(
    lenses.map((l) => l.key),
    active,
    setActive,
  );

  // If the page is opened with #lens-<key> in the URL, jump to that tab.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#lens-', '');
    if (hash && lenses.some((l) => l.key === hash)) setActive(hash);
  }, [lenses]);

  if (!lenses || lenses.length === 0) return null;

  return (
    <section style={{ marginTop: '4.5rem' }}>
      <div style={{ ...hairHead, marginBottom: 14 }}>Score anatomy · every lens</div>
      <h2 style={{ ...display('clamp(1.6rem, 2.6vw, 2.2rem)'), marginBottom: 22 }}>
        Six dimensions per lens, <em style={{ fontStyle: 'normal', color: A.accentMid }}>each with its reasoning.</em>
      </h2>

      <div
        role="tablist"
        aria-label="Score breakdown lens"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginBottom: '1.75rem',
        }}
      >
        {lenses.map((l) => {
          const isActive = l.key === active;
          return (
            <button
              key={l.key}
              type="button"
              className="plum-chip"
              role="tab"
              aria-selected={isActive}
              aria-controls={`lens-panel-${l.key}`}
              id={`lens-tab-${l.key}`}
              {...tabProps(l.key)}
              onClick={() => setActive(l.key)}
            >
              {l.label.replace(' & Industry', '')}
              <span style={{ fontWeight: 500, color: isActive ? A.accent : A.inkMuted, ...tabularNums }}>
                {l.totalScore}
              </span>
            </button>
          );
        })}
      </div>

      {lenses.map((l) => (
        <div
          key={l.key}
          id={`lens-panel-${l.key}`}
          role="tabpanel"
          aria-labelledby={`lens-tab-${l.key}`}
          hidden={l.key !== active}
        >
          <div className="plum-dossier-dims">
            {l.dims.map((d, i) => (
              <div key={d.key} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
                  <div style={{ fontWeight: 450, fontSize: 14.5, color: A.ink, letterSpacing: '-0.01em' }}>
                    {d.label}{' '}
                    <span style={{ fontFamily: FIG, color: A.inkMuted, fontWeight: 400, fontSize: 11.5, letterSpacing: 0, ...tabularNums }}>
                      weight {d.weight}
                    </span>
                  </div>
                  <div style={{ fontFamily: FIG, fontSize: 16, fontWeight: 400, letterSpacing: '-0.02em', color: A.ink, ...tabularNums }}>
                    {d.value}
                    <span style={{ color: A.inkMuted, fontWeight: 400, fontSize: 11, marginLeft: 2, letterSpacing: 0 }}>/100</span>
                  </div>
                </div>
                <div aria-hidden="true" style={{ height: 8, background: VIZ.track, borderRadius: 2, overflow: 'hidden' }}>
                  <div
                    className="plum-grow"
                    style={{
                      height: '100%',
                      width: `${d.value}%`,
                      background: VIZ.c2,
                      borderRadius: '0 4px 4px 0',
                      animationDelay: `${i * 40}ms`,
                    }}
                  />
                </div>
                {d.justification && (
                  <p style={{ fontSize: 13.5, color: A.inkBody, marginTop: 10, marginBottom: 0, lineHeight: 1.65 }}>
                    {d.justification}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
