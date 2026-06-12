'use client';

// Client-side tabbed interface for /career-paths. Receives all 5 paths'
// precomputed data as props (top picks computed at build time on the server
// component) and renders a sticky tab bar + the active path's content as
// a 3-column dashboard widget on wide screens.
//
// Layout intent:
//   ── tabs (full width) ──
//   ┌────────────┬──────────────┬───────────────┐
//   │ identity   │ dimensions   │ top picks     │
//   │ + CTAs     │              │               │
//   └────────────┴──────────────┴───────────────┘
//
// Each column has a single job. Identity left, rubric middle, results
// right — the eye reads what / how / winners.
//
// Inactive panels stay in the DOM with `hidden` so Googlebot still sees
// all 5 paths' text for SEO.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  GraduationCap,
  Stethoscope,
  FlaskConical,
  Cpu,
} from 'lucide-react';
import { colors } from '@/utils/constants';
import useTablistKeyboard from '@/hooks/useTablistKeyboard';

const ICONS = {
  clinical: Stethoscope,
  business: Briefcase,
  academicClinical: GraduationCap,
  research: FlaskConical,
  healthTech: Cpu,
};

const dimLabel = (dim) =>
  dim.replace(/([A-Z])/g, ' $1').trim().replace(/^./, (s) => s.toUpperCase());

const Eyebrow = ({ children }) => (
  <div
    className="font-mono"
    style={{
      fontSize: '0.68rem',
      color: colors.textGray,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      fontWeight: 600,
      marginBottom: 14,
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
    <div>
      {/* Tab bar — full width, sticky on scroll so it stays in view as the
          user reads the panel below. */}
      <div
        id="path-tabs"
        role="tablist"
        aria-label="Career paths"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          background: '#FAFAF6',
          paddingTop: '0.5rem',
          paddingBottom: '0.75rem',
          marginBottom: '1.25rem',
          borderBottom: `1px solid ${colors.slateLight}`,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {paths.map((p) => {
            const Icon = ICONS[p.key];
            const isActive = p.key === active;
            return (
              <button
                key={p.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${p.key}`}
                id={`tab-${p.key}`}
                {...tabProps(p.key)}
                onClick={() => selectPath(p.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0.55rem 1rem',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  border: `1px solid ${isActive ? p.color : colors.slateLight}`,
                  borderRadius: 9999,
                  background: isActive ? p.color : 'white',
                  color: isActive ? 'white' : colors.slateMedium,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {Icon && <Icon size={14} aria-hidden="true" />}
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Panels — one card per path, 3-column grid inside on wide screens. */}
      {paths.map((p) => {
        const isActive = p.key === active;
        const Icon = ICONS[p.key];
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
            style={{
              border: `1px solid ${colors.slateLight}`,
              borderRadius: 16,
              background: 'white',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Brand-color accent stripe at the top — anchors the panel's
                identity to the active tab. */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: p.color,
              }}
            />

            <div className="cs-path-panel-grid">
              {/* LEFT — identity + CTAs */}
              <div className="cs-path-identity">
                <div
                  style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: p.accent, color: p.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  {Icon && <Icon size={22} aria-hidden="true" />}
                </div>
                <h2 style={{
                  fontSize: '1.4rem',
                  fontWeight: 600,
                  margin: 0,
                  color: colors.textDark,
                  letterSpacing: '-0.015em',
                  lineHeight: 1.2,
                }}>
                  {p.label}
                </h2>
                <p style={{
                  color: colors.slateMedium,
                  lineHeight: 1.6,
                  marginTop: 12,
                  marginBottom: 20,
                  fontSize: '0.92rem',
                }}>
                  {p.description}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link
                    href={`/explore?lens=${p.key}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      padding: '0.65rem 1rem',
                      background: p.color,
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: 8,
                      fontSize: '0.9rem',
                      fontWeight: 500,
                    }}
                  >
                    <span>Open matrix · {p.label}</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                  <Link
                    href="/credentials"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 6,
                      padding: '0.65rem 1rem',
                      background: 'white',
                      border: `1px solid ${colors.slateLight}`,
                      color: colors.slateMedium,
                      textDecoration: 'none',
                      borderRadius: 8,
                      fontSize: '0.88rem',
                      fontWeight: 500,
                    }}
                  >
                    <span>Browse all credentials</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {/* MIDDLE — scoring dimensions with weight bars */}
              <div className="cs-path-dims">
                <Eyebrow>Scoring dimensions · default weights</Eyebrow>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {Object.entries(p.defaultWeights).map(([dim, weight]) => (
                    <li key={dim}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                        <span style={{ fontSize: '0.88rem', color: colors.textDark, fontWeight: 500 }}>
                          {dimLabel(dim)}
                        </span>
                        <span className="font-mono tabular-nums" style={{ color: colors.textGray, fontSize: '0.78rem', fontWeight: 600 }}>
                          {weight}%
                        </span>
                      </div>
                      <div style={{ height: 4, background: colors.slateLight, borderRadius: 999, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${(weight / maxWeight) * 100}%`,
                            background: p.color,
                            opacity: 0.85,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* RIGHT — top picks under these defaults */}
              <div className="cs-path-picks">
                <Eyebrow>Top picks · default weights</Eyebrow>
                {list.length > 0 ? (
                  <ol style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    border: `1px solid ${colors.slateLight}`,
                    borderRadius: 10,
                    overflow: 'hidden',
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
                          borderBottom: i < list.length - 1 ? `1px solid ${colors.slateLight}` : 'none',
                          background: 'white',
                        }}
                      >
                        <span
                          className="font-mono"
                          style={{ fontSize: '0.72rem', color: colors.textGray, fontWeight: 500 }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <Link
                          href={cert.slug ? `/credentials/${cert.slug}` : '/credentials'}
                          style={{ color: colors.textDark, textDecoration: 'none', minWidth: 0 }}
                        >
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cert.name}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: colors.textGray, marginTop: 2 }}>
                            {cert.discipline} · {cert.type}
                          </div>
                        </Link>
                        <span
                          className="font-mono tabular-nums"
                          style={{
                            minWidth: 38, textAlign: 'right',
                            fontWeight: 700, color: p.color, fontSize: '1.05rem',
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
                      background: colors.grayLight,
                      border: `1px dashed ${colors.slateLight}`,
                      borderRadius: 10,
                      color: colors.textGray,
                      fontSize: '0.85rem',
                      textAlign: 'center',
                    }}
                  >
                    Cert library for this path is being built — check back soon.
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
