import React, { forwardRef } from 'react';

// Atlas buttons: rectangular (zero radius), no shadows. Primary = petrol
// fill; secondary = 1px ink border on transparent; ghost = quiet text;
// danger = ochre fill (Atlas has no red — ochre is the single warning voice).
const VARIANTS = {
  primary:
    'bg-atlas-accent text-atlas-on-accent hover:bg-atlas-accent-hover active:bg-atlas-accent-hover',
  secondary:
    'bg-transparent text-atlas-ink border border-atlas-ink hover:bg-atlas-band',
  ghost:
    'bg-transparent text-atlas-ink-muted hover:bg-atlas-band',
  danger:
    'bg-atlas-warn text-atlas-on-accent hover:opacity-90',
};

const SIZES = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-5 py-2.5',
};

const baseClasses =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-none ' +
  'transition-colors duration-150 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-atlas-accent focus-visible:ring-offset-2 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', children, ...rest },
  ref,
) {
  const classes = [
    baseClasses,
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    className,
  ].join(' ');
  return (
    <button ref={ref} className={classes} {...rest}>
      {children}
    </button>
  );
});

export default Button;
