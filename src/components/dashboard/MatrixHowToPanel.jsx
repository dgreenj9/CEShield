import React, { useState } from 'react';
import { X, Compass, Sliders, ListChecks } from 'lucide-react';
import { colors } from '../../utils/constants';

const STORAGE_KEY = 'ceshield.dismissedMatrixHowTo';

export default function MatrixHowToPanel() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (_) {}
    setDismissed(true);
  };

  const steps = [
    {
      icon: Compass,
      title: 'Pick a career-path lens',
      body:
        'The chips at the top swap the rubric across five lenses: Clinical, Business, Academic Clinical, Research, and HealthTech. Each lens uses its own dimensions and default weights.',
    },
    {
      icon: Sliders,
      title: 'Or tune the weights yourself',
      body:
        'Open "Adjust scoring weights" to dial each dimension up or down. Rankings re-rank live.',
    },
    {
      icon: ListChecks,
      title: 'Read the score, then the evidence',
      body:
        'Each cert has a 0–100 score (Strong / Good / Moderate / Limited). Expand a card for citations and breakdown.',
    },
  ];

  return (
    <section
      aria-label="How to use the certifications matrix"
      style={{
        position: 'relative',
        padding: '1.25rem 1.5rem 1.5rem',
        background: 'white',
        border: `1px solid ${colors.slateLight}`,
        borderRadius: 12,
        marginBottom: '1.25rem',
      }}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss explainer"
        title="Hide this panel"
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          padding: 6,
          background: 'transparent',
          border: 'none',
          color: colors.textGray,
          cursor: 'pointer',
          borderRadius: 6,
        }}
      >
        <X size={16} aria-hidden="true" />
      </button>
      <div className="flex items-center gap-3 mb-3">
        <span className="eyebrow">How to read this</span>
        <hr className="section-rule flex-1 m-0" />
      </div>
      <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, marginBottom: '1rem', color: colors.textDark, letterSpacing: '-0.01em' }}>
        Three steps to a good decision
      </h2>
      <ol
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '1rem',
          listStyle: 'none',
          padding: 0,
          margin: 0,
        }}
      >
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <li
              key={s.title}
              style={{
                position: 'relative',
                paddingLeft: '1rem',
                borderLeft: `2px solid ${colors.slateLight}`,
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="font-mono"
                  style={{
                    fontSize: '0.7rem',
                    color: colors.primaryBlue,
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Icon size={13} aria-hidden="true" style={{ color: colors.primaryBlue }} />
              </div>
              <div style={{ fontWeight: 600, color: colors.textDark, fontSize: '0.95rem', letterSpacing: '-0.005em' }}>
                {s.title}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: colors.slateMedium, lineHeight: 1.5 }}>
                {s.body}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
