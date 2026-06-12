'use client';

// Tabbed per-lens score breakdown for a credential. Replaces 5 stacked
// breakdown sections (one per path the cert is scored on) with a single
// section + tab selector. Inactive panels stay in the DOM with `hidden`
// so SEO still sees every lens's text content.

import React, { useEffect, useState } from 'react';
import { colors } from '@/utils/constants';
import useTablistKeyboard from '@/hooks/useTablistKeyboard';

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span
          className="font-mono"
          style={{
            fontSize: '0.7rem',
            color: colors.textGray,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          Score breakdown per lens
        </span>
        <hr style={{ flex: 1, border: 0, borderTop: `1px solid ${colors.slateLight}`, margin: 0 }} />
      </div>

      <div
        role="tablist"
        aria-label="Score breakdown lens"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
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
                padding: '0.45rem 0.9rem',
                fontSize: '0.85rem',
                fontWeight: 500,
                border: `1px solid ${isActive ? colors.primaryBlue : colors.slateLight}`,
                borderRadius: 9999,
                background: isActive ? colors.primaryBlue : 'white',
                color: isActive ? 'white' : colors.slateMedium,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {l.label}
              <span
                className="font-mono tabular-nums"
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: isActive ? 'rgba(255,255,255,0.18)' : colors.grayLight,
                  color: isActive ? 'white' : colors.textGray,
                }}
              >
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {l.dims.map((d) => (
              <div key={d.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: colors.textDark }}>
                    {d.label}
                    <span className="font-mono" style={{ color: colors.textGray, fontWeight: 500, fontSize: '0.72rem', marginLeft: 8 }}>
                      ×{d.weight}%
                    </span>
                  </div>
                  <div className="font-mono tabular-nums" style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.textDark }}>
                    {d.value}
                    <span style={{ color: colors.textGray, fontWeight: 400, fontSize: '0.7rem', marginLeft: 2 }}>/100</span>
                  </div>
                </div>
                <div style={{ height: 4, background: colors.slateLight, borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${d.value}%`, background: colors.primaryBlue }} />
                </div>
                {d.justification && (
                  <p style={{ fontSize: '0.85rem', color: colors.slateMedium, marginTop: 6, lineHeight: 1.5 }}>
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
