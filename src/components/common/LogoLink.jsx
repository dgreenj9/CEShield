'use client';

// LogoLink — the brand logo as a clickable link with auth-aware destination.
//
//   - Signed-out visitor → `/` (the marketing landing page)
//   - Signed-in user     → `/explore` (the dashboard / matrix)
//
// Sniffing auth state happens client-side via Supabase. SSR renders with
// the default `/` href; after hydration we update if a session is present.
// We don't block render or show a loading state — a one-frame href flip is
// invisible and avoids a flash of nothing during page load.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import CEShieldLogo from './CEShieldLogo';
import { supabase } from '@/services/supabaseClient';

export default function LogoLink({
  size = 'medium',
  showTagline = false,
  className = '',
  signedInHref = '/explore',
  signedOutHref = '/',
  ariaLabel = 'CE Shield home',
}) {
  const [href, setHref] = useState(signedOutHref);

  useEffect(() => {
    let cancelled = false;
    // getSession reads from the local cache synchronously after Supabase
    // has hydrated — fast, no network round-trip on the typical case.
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data?.session) setHref(signedInHref);
    });

    // Reflect auth changes that happen while the page is open (sign-in
    // from another tab, sign-out, token refresh, etc.).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setHref(session ? signedInHref : signedOutHref);
    });

    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe?.();
    };
  }, [signedInHref, signedOutHref]);

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={className}
      style={{ textDecoration: 'none', display: 'inline-flex' }}
    >
      <CEShieldLogo size={size} showTagline={showTagline} />
    </Link>
  );
}
