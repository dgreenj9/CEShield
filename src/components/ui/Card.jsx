import React from 'react';

// Plum card: a 6px panel with a hairline border and a fill a shade lighter
// than the ground. No shadow; hierarchy comes from type.
const PADDING = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-7' };

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
    'bg-white/[0.03] rounded-md',
    bordered ? 'border border-white/10' : '',
    hoverable ? 'transition-colors duration-300 hover:bg-white/[0.05]' : '',
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
  <h3 className={`font-display text-lg font-normal text-atlas-ink m-0 ${className}`}>{children}</h3>
);
