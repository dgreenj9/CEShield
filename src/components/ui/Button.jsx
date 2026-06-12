import React, { forwardRef } from 'react';

// Concentric variants — chosen for the cases the app actually has, not all
// possible variants. Add variants when a real usage shows up, not preemptively.
const VARIANTS = {
  primary:
    'bg-brand-blue text-white hover:bg-brand-blue-strong active:bg-brand-blue-strong shadow-sm',
  secondary:
    'bg-white text-brand-blue border border-brand-blue hover:bg-brand-light-blue',
  ghost:
    'bg-transparent text-slate-medium hover:bg-slate-light',
  danger:
    'bg-red-600 text-white hover:bg-red-700 shadow-sm',
};

const SIZES = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-5 py-2.5',
};

const baseClasses =
  'inline-flex items-center justify-center gap-2 font-medium rounded-md ' +
  'transition-colors duration-150 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 ' +
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
