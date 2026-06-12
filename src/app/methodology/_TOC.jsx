'use client';

// Sticky left-side TOC for the methodology doc. Adds scroll-spy: the
// section currently in the viewport gets highlighted in the TOC so users
// always know where they are in a long doc. Plain anchor links — the
// browser does smooth scrolling via CSS scroll-behavior set globally.

import React, { useEffect, useState } from 'react';
import { colors } from '@/utils/constants';

export default function TOC({ sections }) {
  const [activeId, setActiveId] = useState(sections[0]?.id);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean);
    if (!targets.length) return;

    // Use a slim band at the top of the viewport so the "active" section
    // is whichever one's heading is currently in view near the top.
    const obs = new IntersectionObserver(
      (entries) => {
        // Find the topmost entry that's intersecting.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
          return;
        }
        // None intersecting — pick the last section above the viewport.
        const above = entries
          .filter((e) => e.boundingClientRect.top < 0)
          .sort((a, b) => b.boundingClientRect.top - a.boundingClientRect.top);
        if (above[0]) setActiveId(above[0].target.id);
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      },
    );
    for (const t of targets) obs.observe(t);
    return () => obs.disconnect();
  }, [sections]);

  return (
    <aside className="cs-doc-toc" aria-label="On this page">
      <div
        className="font-mono"
        style={{
          fontSize: '0.66rem',
          color: colors.textGray,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontWeight: 600,
          marginBottom: 14,
        }}
      >
        On this page
      </div>
      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {sections.map((s, idx) => {
          const isActive = s.id === activeId;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={isActive ? 'true' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 10,
                  padding: '6px 0 6px 12px',
                  marginLeft: -12,
                  fontSize: '0.85rem',
                  color: isActive ? colors.textDark : colors.slateMedium,
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: 'none',
                  borderLeft: `2px solid ${isActive ? colors.primaryBlue : 'transparent'}`,
                  lineHeight: 1.35,
                  transition: 'color 0.15s ease, border-color 0.15s ease',
                }}
              >
                <span
                  className="font-mono tabular-nums"
                  style={{
                    fontSize: '0.7rem',
                    color: isActive ? colors.primaryBlue : colors.textGray,
                    minWidth: 18,
                  }}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span style={{ minWidth: 0 }}>{s.title}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
