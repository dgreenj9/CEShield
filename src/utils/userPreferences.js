// Local-only user preferences. Lives in localStorage so we don't need a
// DB migration. Migrate to user_profiles later if/when these become
// cross-device personal data.

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'ceshield.preferences.v1';

// Defaults — explicit so destructuring is safe.
const DEFAULTS = {
  // Which career-path preset to load by default in the matrix. Null = no
  // preference; matrix uses the global default preset.
  careerPath: null,    // 'clinical' | 'business' | 'academic' | null
};

const read = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...(parsed || {}) };
  } catch {
    return { ...DEFAULTS };
  }
};

const write = (next) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    // Notify subscribers in this tab (storage events only fire on OTHER tabs).
    window.dispatchEvent(new CustomEvent('ceshield-prefs-changed', { detail: next }));
  } catch {
    /* localStorage disabled / full — silently ignore */
  }
};

export const getPreference = (key) => read()[key];

export const setPreference = (key, value) => {
  const next = { ...read(), [key]: value };
  write(next);
};

export const subscribePreferences = (handler) => {
  const onChange = () => handler(read());
  window.addEventListener('ceshield-prefs-changed', onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener('ceshield-prefs-changed', onChange);
    window.removeEventListener('storage', onChange);
  };
};

// Hook for React. Returns [value, setValue] like useState.
export const usePreference = (key) => {
  const [value, setValue] = useState(() => getPreference(key));
  useEffect(() => {
    const unsubscribe = subscribePreferences((next) => setValue(next[key]));
    return unsubscribe;
  }, [key]);
  const update = (next) => setPreference(key, next);
  return [value, update];
};
