import React from 'react';

// Atlas card: a paper panel drawn with a 1px ink rule. Zero radius, zero
// shadow — structure comes from the rule, hierarchy from type.
const PADDING = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' };

export default function Card({
  as: Tag = 'div',
  padding = 'md',
  hoverable = false,
  bordered = true,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'bg-atlas-paper rounded-none',
    bordered ? 'border border-atlas-ink' : '',
    hoverable ? 'transition-colors hover:bg-atlas-band' : '',
    PADDING[padding] || PADDING.md,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}

export const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-3 flex items-center justify-between gap-3 ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`font-display text-base font-semibold text-atlas-ink m-0 ${className}`}>{children}</h3>
);
