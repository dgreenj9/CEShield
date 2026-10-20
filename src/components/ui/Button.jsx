import React, { forwardRef } from 'react';

// Plum buttons: pills, no shadows, calm eased color transitions. Primary =
// peach fill with dark text; secondary = hairline border, peach on hover;
// ghost = quiet text; danger = ochre outline (ochre is the only warning voice).
const VARIANTS = {
  primary:
    'bg-atlas-accent text-atlas-on-accent hover:bg-atlas-accent-hover active:bg-atlas-accent-hover',
  secondary:
    'bg-transparent text-atlas-ink border border-white/15 hover:border-atlas-accent hover:bg-white/5',
  ghost:
    'bg-transparent text-atlas-ink-body hover:text-atlas-ink hover:bg-white/5',
  danger:
    'bg-atlas-warn text-atlas-on-accent hover:opacity-90',
};

const SIZES = {
  sm: 'text-sm px-4 min-h-[36px] pointer-coarse:min-h-[44px]',
  md: 'text-sm px-5 min-h-[44px]',
  lg: 'text-base px-6 min-h-[48px]',
};

const baseClasses =
  'inline-flex items-center justify-center gap-2 font-medium rounded-full whitespace-nowrap ' +
  'transition-colors duration-300 ease-[cubic-bezier(.2,.7,.2,1)] ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-atlas-accent focus-visible:ring-offset-2 focus-visible:ring-offset-atlas-paper ' +
  'disabled:opacity-45 disabled:cursor-not-allowed';

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
