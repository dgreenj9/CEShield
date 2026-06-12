import React, { forwardRef, useId } from 'react';

const baseClasses =
  'w-full rounded-md border border-slate-light bg-white text-sm text-ink-dark ' +
  'px-3 py-2 placeholder:text-ink-gray ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent ' +
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
        <label htmlFor={id} className="text-sm font-medium text-slate-dark">
          {label}
          {required ? <span aria-hidden="true" className="text-red-600 ml-0.5">*</span> : null}
        </label>
      ) : null}
      <input
        id={id}
        ref={ref}
        type={type}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={`${baseClasses} ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
        {...rest}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-red-600">{error}</p>
      ) : helperText ? (
        <p id={`${id}-help`} className="text-xs text-ink-gray">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;
