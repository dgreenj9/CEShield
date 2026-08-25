'use client';

// Branded error boundary for all routes (Next requires this to be a client
// component). Gives users a reset action instead of Next's unstyled default.

import React from 'react';
import { A, INS } from '@/components/atlas/theme';

export default function Error({ error, reset }) {
  // eslint-disable-next-line no-console
  console.error('Route error:', error);

  return (
    <div
      className="atlas-ground"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        color: A.ink,
      }}
    >
      <div style={{ maxWidth: 500, textAlign: 'center' }}>
        <h1 style={{ fontFamily: INS, fontSize: 29, fontWeight: 600, margin: 0, letterSpacing: '-0.03em' }}>
          Something went wrong.
        </h1>
        <p style={{ color: A.inkBody, lineHeight: 1.6, marginTop: '0.75rem', fontSize: 15.5 }}>
          Try reloading. If it persists, email{' '}
          <a href="mailto:hello@ceshield.com" style={{ color: A.accent, fontWeight: 700, textDecoration: 'none' }}>
            hello@ceshield.com
          </a>.
        </p>
        <div style={{ marginTop: '1.75rem', display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '12px 20px', background: A.accent, color: A.onAccent,
              border: 'none', fontWeight: 600, fontSize: 14.5, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              display: 'inline-block', padding: '11px 20px',
              border: `1px solid ${A.ink}`, color: A.ink,
              textDecoration: 'none', fontWeight: 600, fontSize: 14.5,
            }}
          >
            Back to home
          </a>
        </div>
      </div>
    </div>
  );
}
