'use client';

// Authenticated app layout. Wraps all in-app routes (/explore, /compliance,
// /courses, /profile) with:
//   - Supabase auth check (client-side; redirects unauthenticated visitors)
//   - Profile-setup gate (if user is signed in but profile is incomplete,
//     show ProfileSetup instead of the requested page)
//   - UserDataProvider (single Supabase fetch shared across all in-app pages)
//   - AppShell (sidebar nav + content column)
//
// The (app) route group is a folder convention — it doesn't add a URL
// segment, so /explore, /compliance, /courses, /profile are the actual paths.

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { clearLocalCaches } from '@/hooks/useSupabaseData';
import { UserDataProvider } from '@/contexts/UserDataContext';
import AppShell from '@/components/layout/AppShell';
import ProfileSetup from '@/components/auth/ProfileSetup';
import ErrorBoundary from '@/components/common/ErrorBoundary';

const Fallback = () => (
  <div
    role="status"
    aria-live="polite"
    aria-label="Loading"
    className="min-h-screen flex items-center justify-center bg-paper-bg"
  >
    <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#235E6B' }} aria-hidden="true" />
    <span className="sr-only">Loading…</span>
  </div>
);

export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [setupChecked, setSetupChecked] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  // 1) Auth check. Bounce visitors to /sign-in.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user) {
          // Preserve the full destination (path + query) so deep links like
          // /explore?lens=research&cert=x survive the sign-in round-trip.
          const dest =
            (pathname || '/explore') +
            (typeof window !== 'undefined' ? window.location.search : '');
          router.replace(`/sign-in?next=${encodeURIComponent(dest)}`);
          return;
        }
        setAuthUser(user);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Auth check failed:', error);
        router.replace('/sign-in');
        return;
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();
    return () => { cancelled = true; };
    // pathname intentionally not a dep — only check auth on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Profile completeness check.
  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('name, license_type, state')
        .eq('id', authUser.id)
        .maybeSingle();
      if (cancelled) return;
      const isComplete =
        !error && data && data.name && data.license_type && data.state;
      setNeedsSetup(!isComplete);
      setSetupChecked(true);
    })();
    return () => { cancelled = true; };
  }, [authUser]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    // Clear any client-side cached PII (legacy keys included) so nothing
    // about this account survives on a shared machine.
    clearLocalCaches();
    router.replace('/');
  }, [router]);

  if (!authChecked || !authUser) return <Fallback />;
  if (!setupChecked) return <Fallback />;

  if (needsSetup) {
    return (
      <ErrorBoundary>
        <ProfileSetup
          authUser={authUser}
          onSignOut={handleSignOut}
          onComplete={() => {
            setNeedsSetup(false);
            router.replace('/explore');
          }}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <UserDataProvider authUser={authUser}>
        <AppShell onSignOut={handleSignOut}>{children}</AppShell>
      </UserDataProvider>
    </ErrorBoundary>
  );
}
