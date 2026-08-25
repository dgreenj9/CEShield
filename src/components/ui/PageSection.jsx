import React from 'react';

// Section with consistent vertical rhythm. Used inside pages where we want
// a small uppercase eyebrow label above a block.
export default function PageSection({ title, action, children, className = '' }) {
  return (
    <section className={`mb-6 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-3 gap-3">
          {title ? (
            <h2 className="text-sm font-semibold text-atlas-ink-muted m-0">
              {title}
            </h2>
          ) : <span />}
          {action ? <div>{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
