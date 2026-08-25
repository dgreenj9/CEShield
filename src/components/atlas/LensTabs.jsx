import React from 'react';
import { PATHS, PATH_ORDER } from '../../utils/careerPaths';
import { A, FIG } from './theme';

// The lens tab strip — shared by the Matrix instrument and the Explore
// dashboard. Active tab = petrol fill + "● " prefix (state is never conveyed
// by color alone). `size` tunes padding/type for the two contexts.
export const lensShortLabel = (key) => PATHS[key].label.replace(' & Industry', '');

export default function LensTabs({ active, onSelect, size = 'md', trailing = null }) {
  const dims = size === 'md'
    ? { fontSize: 13, letterSpacing: '0.01em', padding: '13px 18px' }
    : { fontSize: 12, letterSpacing: '0.01em', padding: '11px 13px' };
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: `1px solid ${A.ink}`, flexWrap: 'wrap' }}>
      {PATH_ORDER.map((key) => {
        const on = active === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            title={PATHS[key].description}
            onClick={() => onSelect(key)}
            style={{
              fontFamily: FIG,
              fontWeight: 700,
              ...dims,
              background: on ? A.accent : 'transparent',
              color: on ? A.onAccent : A.inkMuted,
              border: 'none',
              borderRight: `1px solid ${A.ruleMinor}`,
              cursor: 'pointer',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
          >
            {(on ? '● ' : '') + lensShortLabel(key)}
          </button>
        );
      })}
      {trailing}
    </div>
  );
}
