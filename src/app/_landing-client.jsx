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
  // Send "Get Started" / "Explore the matrix" to the public matrix, not the
  // sign-in wall — visitors should reach the tool first, then convert. The
  // matrix page carries its own create-account CTA for the personal features.
  return <LandingPage onGetStarted={() => router.push('/matrix')} />;
}
