import React from 'react';

// Standardized header for secondary pages. The h1 uses Instrument Sans
// (the Atlas display face); labels inside the view are Figtree.
export default function PageHeader({ icon: Icon, title, subtitle, actions, badge, eyebrow, className = '' }) {
  return (
    <header className={`mb-6 ${className}`}>
      {eyebrow ? <div className="mb-1.5"><span className="eyebrow">{eyebrow}</span></div> : null}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            {Icon ? <Icon size={20} aria-hidden="true" className="text-atlas-accent flex-shrink-0" /> : null}
            <h1 className="font-display text-4xl text-atlas-ink m-0 leading-tight">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle ? (
            <p className="text-sm text-atlas-ink-muted m-0 leading-relaxed max-w-2xl">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2 flex-shrink-0">{actions}</div> : null}
      </div>
      <hr className="section-rule mt-5" />
    </header>
  );
}
