'use client';

// Branded error boundary for all routes (Next requires this to be a client
// component). Gives users a reset action instead of Next's unstyled default.

import React from 'react';
import { A, kicker, display } from '@/components/atlas/theme';

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
      <div style={{ maxWidth: 540, textAlign: 'center' }}>
        <div style={kicker()}>Error</div>
        <h1 style={{ ...display('clamp(2rem, 4.5vw, 3rem)', 350), marginTop: '1.25rem' }}>
          Something went <em style={{ fontStyle: 'normal', color: A.accentMid }}>wrong.</em>
        </h1>
        <p style={{ color: A.inkBody, lineHeight: 1.75, marginTop: '1rem', fontSize: 15.5 }}>
          Try reloading. If it persists, email{' '}
          <a href="mailto:hello@ceshield.com" className="atlas-link" style={{ fontWeight: 500, textDecoration: 'none' }}>
            hello@ceshield.com
          </a>.
        </p>
        <div style={{ marginTop: '1.75rem', display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => reset()}
            className="atlas-btn atlas-btn-primary"
            style={{ fontSize: 14.5, fontFamily: 'inherit', minHeight: 44 }}
          >
            Try again
          </button>
          <a
            href="/"
            className="atlas-btn atlas-btn-secondary"
            style={{ fontSize: 14.5, minHeight: 44 }}
          >
            Back to home
          </a>
        </div>
      </div>
    </div>
  );
}
