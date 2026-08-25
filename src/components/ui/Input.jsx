import React, { forwardRef, useId } from 'react';

const baseClasses =
  'w-full rounded-none border border-atlas-rule-minor bg-atlas-paper text-sm text-atlas-ink ' +
  'px-3 py-2 placeholder:text-atlas-ink-muted ' +
  'focus:outline-none focus:border-atlas-accent focus:ring-1 focus:ring-atlas-accent ' +
  'disabled:opacity-60 disabled:cursor-not-allowed';

const Input = forwardRef(function Input(
  {
    label,
    helperText,
    error,
    id: idProp,
    className = '',
    type = 'text',
    required,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const id = idProp || generatedId;
  const describedBy = error ? `${id}-error` : helperText ? `${id}-help` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={id} className="text-sm font-semibold text-atlas-ink">
          {label}
          {required ? <span aria-hidden="true" className="text-atlas-warn ml-0.5">*</span> : null}
        </label>
      ) : null}
      <input
        id={id}
        ref={ref}
        type={type}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={`${baseClasses} ${error ? 'border-atlas-warn focus:ring-atlas-warn' : ''} ${className}`}
        {...rest}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs font-semibold text-atlas-warn">{error}</p>
      ) : helperText ? (
        <p id={`${id}-help`} className="text-xs text-atlas-ink-muted">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;
