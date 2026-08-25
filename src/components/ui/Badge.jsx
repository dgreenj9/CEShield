import React from 'react';

// Atlas badge: a rectangular chip, 1px border, sentence-case text. Tiers
// stay within the accent family (petrol → mid → ochre → stone); ochre is
// the only warning voice.
const VARIANTS = {
  neutral: 'border-atlas-rule-minor text-atlas-ink-body',
  brand: 'border-atlas-accent text-atlas-accent',
  accent: 'border-atlas-accent text-atlas-accent',
  solid: 'border-atlas-accent bg-atlas-accent text-atlas-on-accent',
  success: 'border-atlas-accent text-atlas-accent',
  warning: 'border-atlas-warn text-atlas-warn',
  danger: 'border-atlas-warn text-atlas-warn',
  purple: 'border-atlas-accent-mid text-atlas-accent-mid',
  evidenceStrong: 'border-atlas-accent text-atlas-accent',
  evidenceGood: 'border-atlas-accent-mid text-atlas-accent-mid',
  evidenceModerate: 'border-atlas-warn text-atlas-warn',
  evidenceLimited: 'border-atlas-dim text-atlas-ink-muted',
};

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-none border px-2 py-0.5 text-xs font-semibold ${
        VARIANTS[variant] || VARIANTS.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}
