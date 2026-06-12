import React from 'react';

const VARIANTS = {
  neutral: 'bg-slate-light text-slate-dark',
  brand: 'bg-brand-light-blue text-brand-blue',
  purple: 'bg-brand-muted-purple text-brand-purple',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  evidenceStrong: 'bg-green-50 text-green-700',
  evidenceGood: 'bg-brand-light-blue text-brand-blue',
  evidenceModerate: 'bg-amber-50 text-amber-700',
  evidenceLimited: 'bg-slate-light text-slate-medium',
};

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        VARIANTS[variant] || VARIANTS.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}
