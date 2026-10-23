import React from 'react';
import { A, FIG } from './theme';

// The three-layer shield on the plum stage: two lilac layers behind
// (quiet, then mid) and the peach front shield, the one warm voice. The
// wordmark is Figtree at a light-medium weight with tight tracking, so it
// sits in the same register as the display type.
export default function AtlasLogo({ width = 26, height = 18, wordmark = true, fontSize = 16 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width={width} height={height} viewBox="0 0 60 40" aria-hidden="true" style={{ flexShrink: 0 }}>
        <g transform="translate(0,4)">
          <path d="M10 0 L10 20 Q10 28 25 32 Q40 28 40 20 L40 0 Z" fill={A.accentMid} opacity="0.32" />
          <path d="M20 0 L20 20 Q20 28 35 32 Q50 28 50 20 L50 0 Z" fill={A.accentMid} opacity="0.78" />
          <path d="M30 0 L30 20 Q30 28 45 32 Q60 28 60 20 L60 0 Z" fill={A.accent} />
        </g>
      </svg>
      {wordmark && (
        <span style={{ fontFamily: FIG, fontWeight: 520, fontSize, letterSpacing: '-0.03em', color: A.ink, lineHeight: 1 }}>
          CE Shield
        </span>
      )}
    </span>
  );
}
