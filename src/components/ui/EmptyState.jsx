import React from 'react';

// Consistent empty/zero-state across pages. Same vertical rhythm,
// optional icon + CTA. Used by Compliance, Courses, CertificationDetail.
export default function EmptyState({ icon: Icon, title, description, action, variant = 'plain' }) {
  const baseClasses =
    'flex flex-col items-center justify-center text-center py-12 px-6 rounded-md';
  const variantClasses =
    variant === 'dashed'
      ? 'border border-dashed border-white/20 bg-white/[0.02]'
      : 'bg-white/[0.03] border border-white/10';

  return (
    <div className={`${baseClasses} ${variantClasses}`}>
      {Icon ? (
        <Icon
          size={32}
          aria-hidden="true"
          className="text-atlas-ink-muted mb-3"
          style={{ opacity: 0.6 }}
        />
      ) : null}
      {title ? (
        <p className="text-xl font-normal tracking-tight text-atlas-ink m-0 mb-2">{title}</p>
      ) : null}
      {description ? (
        <p className="text-sm text-atlas-ink-muted m-0 max-w-md leading-relaxed">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
