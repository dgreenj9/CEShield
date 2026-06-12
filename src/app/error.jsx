'use client';

// Branded error boundary for all routes (Next requires this to be a client
// component). Gives users a reset action instead of Next's unstyled default.

import React from 'react';
import { RefreshCcw, Home } from 'lucide-react';
import { colors } from '@/utils/constants';

export default function Error({ error, reset }) {
  // eslint-disable-next-line no-console
  console.error('Route error:', error);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAFAF6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        color: colors.textDark,
      }}
    >
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, letterSpacing: '-0.015em' }}>
          Something went wrong.
        </h1>
        <p style={{ color: colors.slateMedium, lineHeight: 1.6, marginTop: '0.75rem' }}>
          The error has been logged. Try reloading — if it persists, email{' '}
          <a href="mailto:hello@ceshield.com" style={{ color: colors.primaryBlue }}>
            hello@ceshield.com
          </a>.
        </p>
        <div style={{ marginTop: '1.75rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '0.65rem 1.25rem', background: colors.primaryBlue,
              color: 'white', border: 'none', borderRadius: 8,
              fontWeight: 500, fontSize: '0.92rem', cursor: 'pointer',
            }}
          >
            <RefreshCcw size={15} aria-hidden="true" /> Try again
          </button>
          <a
            href="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '0.65rem 1.25rem', background: 'white',
              border: `1px solid ${colors.slateLight}`, color: colors.slateMedium,
              textDecoration: 'none', borderRadius: 8, fontWeight: 500, fontSize: '0.92rem',
            }}
          >
            <Home size={15} aria-hidden="true" /> Back to home
          </a>
        </div>
      </div>
    </div>
  );
}
