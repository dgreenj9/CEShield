import React from 'react';

// Plum badge: a pill chip, hairline border, sentence-case text. Tier
// variants carry their tier color and must print the tier word; ochre is
// the only warning voice.
const VARIANTS = {
  neutral: 'border-white/15 text-atlas-ink-body',
  brand: 'border-atlas-accent/45 text-atlas-accent',
  accent: 'border-atlas-accent/45 text-atlas-accent',
  solid: 'border-atlas-accent bg-atlas-accent text-atlas-on-accent',
  success: 'border-[#2E9F8C]/50 text-[#2E9F8C]',
  warning: 'border-atlas-warn/50 text-atlas-warn',
  danger: 'border-atlas-warn/50 text-atlas-warn',
  purple: 'border-atlas-accent-mid/50 text-atlas-accent-mid',
  evidenceStrong: 'border-atlas-accent/45 text-atlas-accent',
  evidenceGood: 'border-atlas-accent-mid/50 text-atlas-accent-mid',
  evidenceModerate: 'border-atlas-warn/50 text-atlas-warn',
  evidenceLimited: 'border-white/15 text-atlas-ink-muted',
};

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        VARIANTS[variant] || VARIANTS.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}
