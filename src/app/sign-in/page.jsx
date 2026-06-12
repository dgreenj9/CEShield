'use client';

// Public sign-in route. AuthForm handles email/password + reset flow via
// Supabase. On success we honor ?next=<path> (same-origin paths only) so
// deep links survive the auth round-trip; default is /explore.

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';

// Only accept relative paths that start with a single "/" — rejects
// protocol-relative URLs (//evil.com) and absolute URLs, closing the
// open-redirect door.
const safeNext = (raw) => {
  if (!raw || typeof raw !== 'string') return '/explore';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/explore';
  return raw;
};

function SignInInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams?.get('next'));
  return <AuthForm onSuccess={() => router.replace(next)} />;
}

export default function SignInPage() {
  // useSearchParams requires a Suspense boundary during prerender.
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  );
}
