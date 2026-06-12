import React from 'react';

// Consistent empty/zero-state across pages. Same vertical rhythm,
// optional icon + CTA. Used by Compliance, Courses, CertificationDetail.
export default function EmptyState({ icon: Icon, title, description, action, variant = 'plain' }) {
  const baseClasses =
    'flex flex-col items-center justify-center text-center py-10 px-6 rounded-lg';
  const variantClasses =
    variant === 'dashed'
      ? 'border border-dashed border-slate-light bg-gray-bg'
      : 'bg-white border border-slate-light shadow-card';

  return (
    <div className={`${baseClasses} ${variantClasses}`}>
      {Icon ? (
        <Icon
          size={32}
          aria-hidden="true"
          className="text-slate-medium mb-3"
          style={{ opacity: 0.6 }}
        />
      ) : null}
      {title ? (
        <p className="text-base font-medium text-ink-dark m-0 mb-1">{title}</p>
      ) : null}
      {description ? (
        <p className="text-sm text-ink-gray m-0 max-w-md leading-relaxed">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
