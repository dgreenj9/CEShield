import React from 'react';

// CE Shield logo — Atlas re-ink. The three-layer shield in petrol at three
// opacities (back 0.25, mid 0.6, front 1.0); wordmark "CE Shield" in
// Instrument Sans 600 with no weight split.
const PETROL = '#F0C3A8';
const INK = '#F6EEE9';
const MUTED = '#A998AE';
const INS = "'Figtree', ui-sans-serif, system-ui, sans-serif";

const CEShieldLogo = ({ showTagline = true, className = '', size = 'large', centered = false }) => {
  const scales = {
    small: { svg: 30, text: 15 },
    medium: { svg: 40, text: 19 },
    large: { svg: 52, text: 27 },
    xlarge: { svg: 48, text: 29 },
  };

  const scale = scales[size] || scales.large;
  const logoSvg = (
    <svg
      width={scale.svg}
      height={Math.round(scale.svg * 0.67)}
      viewBox="0 0 60 40"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
      aria-hidden="true"
    >
      <g transform="translate(0, 4)">
        <path d="M10 0 L10 20 Q10 28 25 32 Q40 28 40 20 L40 0 Z" fill={PETROL} opacity="0.25" />
        <path d="M20 0 L20 20 Q20 28 35 32 Q50 28 50 20 L50 0 Z" fill={PETROL} opacity="0.6" />
        <path d="M30 0 L30 20 Q30 28 45 32 Q60 28 60 20 L60 0 Z" fill={PETROL} />
      </g>
    </svg>
  );

  const logoText = (
    <h1
      style={{
        fontFamily: INS,
        fontSize: `${scale.text}px`,
        lineHeight: 1,
        color: INK,
        fontWeight: 600,
        letterSpacing: '-0.02em',
        margin: 0,
      }}
    >
      CE Shield
    </h1>
  );

  if (showTagline) {
    return (
      <div className={`${centered ? 'flex flex-col items-center' : ''} ${className}`}>
        <div className="flex items-center gap-2 align-middle">
          {logoSvg}
          {logoText}
        </div>
        <p
          className={`mt-2 ${centered ? 'text-center whitespace-nowrap' : ''}`}
          style={{ color: MUTED, fontSize: 11.5, letterSpacing: '0.02em', fontWeight: 600, margin: '8px 0 0' }}
        >
          Credential scores. CE compliance.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {logoSvg}
      {logoText}
    </div>
  );
};

export default CEShieldLogo;
