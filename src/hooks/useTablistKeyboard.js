'use client';

// Keyboard support for ARIA tabs (per the APG tabs pattern):
//   - Roving tabindex: only the active tab is in the Tab order
//   - ArrowLeft / ArrowRight move + activate the previous/next tab (wrapping)
//   - Home / End jump to first/last
//
// Usage:
//   const { tabProps } = useTablistKeyboard(keys, active, setActive);
//   <button {...tabProps(key)} ...>
//
// tabProps(key) returns { tabIndex, onKeyDown, ref } to spread onto each
// tab button alongside the existing role/aria attributes.

import { useRef, useCallback } from 'react';

export default function useTablistKeyboard(keys, activeKey, onSelect) {
  const refs = useRef({});

  const focusAndSelect = useCallback(
    (key) => {
      onSelect(key);
      // Move DOM focus so subsequent arrow presses continue from the new tab.
      refs.current[key]?.focus();
    },
    [onSelect],
  );

  const onKeyDown = useCallback(
    (e) => {
      const idx = keys.indexOf(activeKey);
      if (idx === -1) return;
      let nextIdx = null;
      if (e.key === 'ArrowRight') nextIdx = (idx + 1) % keys.length;
      else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + keys.length) % keys.length;
      else if (e.key === 'Home') nextIdx = 0;
      else if (e.key === 'End') nextIdx = keys.length - 1;
      if (nextIdx === null) return;
      e.preventDefault();
      focusAndSelect(keys[nextIdx]);
    },
    [keys, activeKey, focusAndSelect],
  );

  const tabProps = useCallback(
    (key) => ({
      tabIndex: key === activeKey ? 0 : -1,
      onKeyDown,
      ref: (el) => { refs.current[key] = el; },
    }),
    [activeKey, onKeyDown],
  );

  return { tabProps };
}
