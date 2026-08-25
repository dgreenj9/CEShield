import React from 'react';
import { A, INS } from './theme';

// The three-layer shield, re-inked to petrol at three opacities per the
// Atlas spec: back @ 0.25, mid @ 0.6, front @ 1.0. Wordmark is Instrument
// Sans 600 with no weight split.
export default function AtlasLogo({ width = 26, height = 18, wordmark = true, fontSize = 16 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width={width} height={height} viewBox="0 0 60 40" aria-hidden="true" style={{ flexShrink: 0 }}>
        <g transform="translate(0,4)">
          <path d="M10 0 L10 20 Q10 28 25 32 Q40 28 40 20 L40 0 Z" fill={A.accent} opacity="0.25" />
          <path d="M20 0 L20 20 Q20 28 35 32 Q50 28 50 20 L50 0 Z" fill={A.accent} opacity="0.6" />
          <path d="M30 0 L30 20 Q30 28 45 32 Q60 28 60 20 L60 0 Z" fill={A.accent} />
        </g>
      </svg>
      {wordmark && (
        <span style={{ fontFamily: INS, fontWeight: 600, fontSize, letterSpacing: '-0.02em', color: A.ink }}>
          CE Shield
        </span>
      )}
    </span>
  );
}
