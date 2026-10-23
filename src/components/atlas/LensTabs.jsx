import React from 'react';
import { PATHS, PATH_ORDER } from '../../utils/careerPaths';

// The lens control, shared by the field (/matrix) and the Explore dashboard.
// A pill segmented control: the active lens takes the peach tint and
// aria-pressed, so state is never carried by color alone. `size="sm"` adds
// the inset padding and hairline the Explore panel header expects;
// `trailing` renders after the control (a count, a button).
export const lensShortLabel = (key) => PATHS[key].label.replace(' & Industry', '');

export default function LensTabs({ active, onSelect, size = 'md', trailing = null, label = 'Career lens', full = false }) {
  const framed = size === 'sm';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px 16px',
        padding: framed ? '12px 14px' : 0,
        borderBottom: framed ? '1px solid #ffffff1a' : 'none',
      }}
    >
      <div className="mx-seg" role="group" aria-label={label}>
        {PATH_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={active === key}
            title={PATHS[key].description}
            onClick={() => onSelect(key)}
          >
            {full ? PATHS[key].label : lensShortLabel(key)}
          </button>
        ))}
      </div>
      {trailing}
    </div>
  );
}
