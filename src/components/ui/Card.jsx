import React from 'react';

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
    'bg-white rounded-lg',
    bordered ? 'border border-slate-light' : '',
    hoverable ? 'transition-shadow hover:shadow-elev' : 'shadow-card',
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
  <h3 className={`text-base font-semibold text-ink-dark m-0 ${className}`}>{children}</h3>
);
