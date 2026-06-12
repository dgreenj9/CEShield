'use client';

// Thin client-side wrapper around the existing LandingPage view.
// The view itself uses useState/useEffect/useMemo + useCountUp — all client
// hooks — so the whole thing has to be marked 'use client'. Next still
// SSGs the HTML; only the hydration JS ships for interactive bits.

import React from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '@/views/LandingPage';

export default function LandingPageClient() {
  const router = useRouter();
  // Marketing CTAs jump into the app. /explore is still served by the CRA
  // build during the migration — Next will navigate there at the URL level.
  return <LandingPage onGetStarted={() => router.push('/explore')} />;
}
