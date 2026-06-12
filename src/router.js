// Thin wrapper around next/navigation + next/link. Pre-migration this was
// a custom pathname router; now that the app is fully on Next App Router,
// these are straight passthroughs that keep existing call sites
// (`import { Link, usePath, useSearchParam, setSearchParam, navigate }
//  from '../router'`) working without churn.

'use client';

import React from 'react';
import NextLink from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

export const usePath = () => usePathname() ?? '/';

export const useSearchParam = (key) => {
  const params = useSearchParams();
  return params?.get(key) ?? null;
};

// Imperative URL mutation. `navigate` and `setSearchParam` are used inside
// effect/handler code, never during render, so a fresh router instance from
// useRouter() (memoized by Next) is the right backing store.
const buildHrefWithParam = (key, value) => {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  if (value === null || value === undefined || value === '') {
    url.searchParams.delete(key);
  } else {
    url.searchParams.set(key, String(value));
  }
  return url.pathname + url.search;
};

// Exposed as a plain function for backward compat. Internally still uses
// the browser History API directly; Next's useRouter().push is the
// React-friendly path but isn't accessible from non-component callers.
// IMPORTANT: history.state carries Next App Router's internal bookkeeping.
// Passing a fresh `{}` would wipe it and break back/forward restoration —
// always thread the existing state through.
const applyHistory = (href, replace) => {
  const current = window.location.pathname + window.location.search;
  if (href === current) return; // no-op writes cause render churn
  const state = window.history.state;
  if (replace) {
    window.history.replaceState(state, '', href);
  } else {
    window.history.pushState(state, '', href);
  }
  // Nudge Next's router to re-read the URL (it listens to popstate to sync
  // useSearchParams/usePathname).
  window.dispatchEvent(new PopStateEvent('popstate', { state }));
};

export const navigate = (to, opts = {}) => {
  if (typeof to !== 'string' || typeof window === 'undefined') return;
  applyHistory(to, !!opts.replace);
};

export const setSearchParam = (key, value, opts = {}) => {
  const href = buildHrefWithParam(key, value);
  if (!href) return;
  applyHistory(href, !!opts.replace);
};

// Batched multi-key version — collapses N updates into a single history
// entry + popstate. Use when changes touch several params at once (e.g.,
// switching lens swaps both `lens` and `w`).
export const setSearchParams = (updates, opts = {}) => {
  if (typeof window === 'undefined' || !updates) return;
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === '') {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, String(value));
    }
  }
  applyHistory(url.pathname + url.search, !!opts.replace);
};

// Re-export Next's Link under the name the old code uses. Accept both
// `to` and `href` props for back-compat with the prior custom Link API.
export const Link = ({ to, href, children, ...rest }) => (
  <NextLink href={to ?? href ?? '#'} {...rest}>
    {children}
  </NextLink>
);

// Optional: expose useRouter for callers that want the canonical Next router.
export { useRouter };
