import React, { memo } from 'react';
import { colors } from '../../utils/constants';
import { getScoreStyle, getBorderColor } from '../../utils/certScoring';
import { getEvidenceMix, EVIDENCE_LABELS, getLibraryMetaForCertification } from '../../utils/citationsLibrary';

// Compact row in the master list. Memoized — the 110-row list re-renders
// on every weight change, but most rows don't actually change visually
// other than score, so cheap memoization on (cert, weights) pays off.
function CertificationListItem({ cert, active, onSelect }) {
  const mix = getEvidenceMix(cert.name);
  const meta = getLibraryMetaForCertification(cert.name);
  const topEvidence = ['meta_analysis', 'systematic_review', 'rct']
    .filter((k) => (mix[k] || 0) > 0)
    .slice(0, 2);

  return (
    <button
      type="button"
      onClick={() => onSelect(cert.name)}
      aria-current={active ? 'true' : undefined}
      className="card-hover"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        width: '100%',
        textAlign: 'left',
        padding: '0.75rem',
        background: active ? colors.lightBlue : 'white',
        borderLeft: `3px solid ${active ? colors.primaryBlue : getBorderColor(cert.computedScore)}`,
        borderTop: `1px solid ${colors.slateLight}`,
        borderRight: `1px solid ${colors.slateLight}`,
        borderBottom: `1px solid ${colors.slateLight}`,
        borderRadius: 0,
        cursor: 'pointer',
      }}
    >
      <div
        className="font-mono"
        style={{
          width: 28,
          flexShrink: 0,
          textAlign: 'right',
          fontSize: '0.7rem',
          color: colors.textGray,
          fontWeight: 500,
        }}
      >
        {String(cert.rank).padStart(2, '0')}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: active ? 600 : 500,
            fontSize: '0.92rem',
            color: colors.textDark,
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {cert.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.65rem',
            color: colors.textGray,
            background: colors.slateLight,
            padding: '1px 6px',
            borderRadius: 999,
          }}>
            {cert.type}
          </span>
          {topEvidence.map((k) => (
            <span
              key={k}
              style={{
                fontSize: '0.65rem',
                color: colors.primaryBlue,
                background: colors.lightBlue,
                padding: '1px 6px',
                borderRadius: 999,
                whiteSpace: 'nowrap',
              }}
            >
              {mix[k]} {EVIDENCE_LABELS[k].split(' ')[0]}
            </span>
          ))}
          {meta.source === 'legacy' && (
            <span
              style={{
                fontSize: '0.6rem',
                color: '#92400e',
                background: '#fef3c7',
                padding: '1px 5px',
                borderRadius: 999,
                fontWeight: 600,
              }}
              title="Legacy citations — deeper review pending"
            >
              LEGACY
            </span>
          )}
        </div>
      </div>
      <div
        className="tabular-nums"
        style={{
          ...getScoreStyle(cert.computedScore),
          padding: '4px 9px',
          borderRadius: 6,
          fontSize: '0.88rem',
          fontWeight: 600,
          flexShrink: 0,
          minWidth: 40,
          textAlign: 'center',
          letterSpacing: '-0.01em',
        }}
      >
        {cert.computedScore}
      </div>
    </button>
  );
}

export default memo(CertificationListItem);
