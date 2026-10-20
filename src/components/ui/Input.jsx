import React, { forwardRef, useId } from 'react';

// Plum field: plum fill, hairline border, peach focus ring (.plum-input).
const baseClasses = 'plum-input text-sm disabled:opacity-60 disabled:cursor-not-allowed';

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
        <label htmlFor={id} className="text-sm font-medium text-atlas-ink-body">
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
        className={`${baseClasses} ${className}`}
        style={type === 'date' ? { colorScheme: 'dark' } : undefined}
        {...rest}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-atlas-warn">{error}</p>
      ) : helperText ? (
        <p id={`${id}-help`} className="text-xs text-atlas-ink-muted">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;
