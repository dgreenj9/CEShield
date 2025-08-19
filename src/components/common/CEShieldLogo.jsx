import React from 'react';
import { colors } from '../../utils/constants';

// CE Shield Logo Component
const CEShieldLogo = ({ showTagline = true, className = "", size = "large", centered = false }) => {
  const scales = {
    small: { svg: "30", text: "14", tagline: "8" },
    medium: { svg: "44", text: "20", tagline: "10" },
    large: { svg: "54", text: "30", tagline: "10" },
    xlarge: { svg: "48", text: "32", tagline: "6" }
  };
  
  const scale = scales[size] || scales.large;
  const logoSvg = (
    <svg width={scale.svg} height={parseInt(scale.svg) * 0.67} viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <g transform="translate(0, 4)">
        <path d="M10 0 L10 20 Q10 28 25 32 Q40 28 40 20 L40 0 Z" fill={colors.lightBlue}/>
        <path d="M20 0 L20 20 Q20 28 35 32 Q50 28 50 20 L50 0 Z" fill={colors.primaryBlue} opacity="0.85"/>
        <path d="M30 0 L30 20 Q30 28 45 32 Q60 28 60 20 L60 0 Z" fill={colors.primaryPurple} opacity="0.85"/>
      </g>
    </svg>
  );

  const logoText = (
    <h1 style={{ fontSize: `${scale.text}px`, lineHeight: '1', color: colors.textDark }}>
      <span style={{ fontWeight: 200 }}>CE</span><span style={{ fontWeight: 400 }}>Shield</span>
    </h1>
  );

  if (showTagline) {
    return (
      <div className={`${centered ? 'flex flex-col items-center' : ''} ${className}`}>
        <div className="flex items-center gap-2 align-middle">
          {logoSvg}
          {logoText}
        </div>
        <p className={`text-[${scale.tagline}px] tracking-[1.5px] mt-2 uppercase ${centered ? 'text-center whitespace-nowrap' : ''}`} 
           style={{ color: colors.textGray, paddingLeft: '0', fontSize: size === 'xlarge' ? '10px' : `${scale.tagline}px` }}>
          Track Education. Protect Your License.
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
