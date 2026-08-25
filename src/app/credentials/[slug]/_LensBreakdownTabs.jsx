'use client';

// Tabbed per-lens score breakdown for a credential. Replaces 5 stacked
// breakdown sections (one per path the cert is scored on) with a single
// section + tab selector. Inactive panels stay in the DOM with `hidden`
// so SEO still sees every lens's text content.

import React, { useEffect, useState } from 'react';
import useTablistKeyboard from '@/hooks/useTablistKeyboard';
import { A, FIG, ruledHead, tabularNums } from '@/components/atlas/theme';

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
    <section style={{ marginTop: '2.5rem' }}>
      <div style={{ ...ruledHead, marginBottom: 16 }}>Score anatomy · every lens</div>

      <div
        role="tablist"
        aria-label="Score breakdown lens"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginBottom: '1.25rem',
        }}
      >
        {lenses.map((l) => {
          const isActive = l.key === active;
          return (
            <button
              key={l.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`lens-panel-${l.key}`}
              id={`lens-tab-${l.key}`}
              {...tabProps(l.key)}
              onClick={() => setActive(l.key)}
              style={{
                padding: '7px 14px',
                fontFamily: FIG,
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: '0.01em',
                border: `1px solid ${isActive ? A.accent : A.ruleMinor}`,
                background: isActive ? A.accent : 'transparent',
                color: isActive ? A.onAccent : A.inkMuted,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {(isActive ? '● ' : '') + l.label.replace(' & Industry', '')}
              <span style={{ fontWeight: 700, opacity: isActive ? 0.85 : 1, ...tabularNums }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem 2rem' }}>
            {l.dims.map((d) => (
              <div key={d.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: A.ink }}>
                    {d.label}{' '}
                    <span style={{ fontFamily: FIG, color: A.inkMuted, fontWeight: 500, fontSize: 11.5, ...tabularNums }}>
                      ×{d.weight}
                    </span>
                  </div>
                  <div style={{ fontFamily: FIG, fontSize: 13.5, fontWeight: 700, color: A.ink, ...tabularNums }}>
                    {d.value}
                    <span style={{ color: A.inkMuted, fontWeight: 500, fontSize: 11, marginLeft: 2 }}>/100</span>
                  </div>
                </div>
                <div style={{ height: 4, background: A.ruleFaint }}>
                  <div style={{ height: '100%', width: `${d.value}%`, background: A.accent }} />
                </div>
                {d.justification && (
                  <p style={{ fontSize: 13.5, color: A.inkBody, marginTop: 6, marginBottom: 0, lineHeight: 1.55 }}>
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
