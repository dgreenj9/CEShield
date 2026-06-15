'use client';

// Client boundary for the public matrix route. CertificationsMatrix (and its
// MatrixHowToPanel sibling) lean on client hooks — useState, useSearchParams,
// localStorage-backed usePreference — but aren't themselves marked 'use client'
// (they inherit the boundary from ExplorePage on the authed side). This wrapper
// provides that boundary so the server-rendered /matrix page can mount them.

import MatrixHowToPanel from '@/components/dashboard/MatrixHowToPanel';
import CertificationsMatrix from '@/components/dashboard/CertificationsMatrix';

export default function MatrixWidget() {
  return (
    <>
      <MatrixHowToPanel />
      <CertificationsMatrix />
    </>
  );
}
