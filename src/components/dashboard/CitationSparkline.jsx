import React, { useMemo } from 'react';
import { colors } from '../../utils/constants';

// Compact area-chart sparkline of citation counts over time.
// Reads `year_dist` ({ "2018": 4, "2019": 7, ... }) from cert metadata.
// Zero data → returns null so the surrounding layout doesn't allocate space.
//
// Visual: gradient area fill (brand-blue at 22% → 2% bottom), 1.5px stroke
// on top, "n cites · since YYYY" caption beside. Renders inline in the
// CertificationDetail header, immediately right of the cert title.

const DEFAULT_WIDTH = 140;
const DEFAULT_HEIGHT = 36;

export default function CitationSparkline({
  yearDist,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  windowYears = 15,
}) {
  const data = useMemo(() => {
    if (!yearDist) return null;
    const entries = Object.entries(yearDist)
      .map(([y, n]) => [Number(y), Number(n)])
      .filter(([y, n]) => Number.isFinite(y) && Number.isFinite(n) && n > 0)
      .sort((a, b) => a[0] - b[0]);
    if (entries.length === 0) return null;

    // Show the last `windowYears` years (or all if fewer). Padded with zeros
    // for years inside the window that have no citations — so the sparkline
    // shows gaps honestly.
    const latest = entries[entries.length - 1][0];
    const start = Math.max(entries[0][0], latest - windowYears + 1);
    const byYear = Object.fromEntries(entries);
    const series = [];
    for (let y = start; y <= latest; y += 1) {
      series.push([y, byYear[y] || 0]);
    }
    return { series, total: entries.reduce((s, [, n]) => s + n, 0), startYear: entries[0][0] };
  }, [yearDist, windowYears]);

  if (!data) return null;
  const { series } = data;
  if (series.length < 2) return null;

  const max = Math.max(...series.map(([, n]) => n), 1);
  const padX = 1;
  const padY = 2;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const stepX = series.length > 1 ? innerW / (series.length - 1) : 0;

  // Build SVG path d= using straight line segments. Smoothing isn't worth
  // the complexity at this size.
  const linePoints = series.map(([, n], i) => {
    const x = padX + i * stepX;
    const y = padY + innerH - (n / max) * innerH;
    return [x, y];
  });
  const linePath = linePoints.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const areaPath =
    `M ${padX.toFixed(1)} ${(padY + innerH).toFixed(1)} ` +
    linePoints.map(([x, y]) => `L ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ') +
    ` L ${(padX + (series.length - 1) * stepX).toFixed(1)} ${(padY + innerH).toFixed(1)} Z`;

  const gradId = `sparkline-grad-${Math.abs(
    series.map(([y]) => y).join(',').split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0),
  )}`;

  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.primaryBlue} stopOpacity="0.22" />
            <stop offset="100%" stopColor={colors.primaryBlue} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={linePath} fill="none" stroke={colors.primaryBlue} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {/* Final-year emphasis dot */}
        {linePoints.length > 0 && (
          <circle
            cx={linePoints[linePoints.length - 1][0]}
            cy={linePoints[linePoints.length - 1][1]}
            r={2.5}
            fill={colors.primaryBlue}
          />
        )}
      </svg>
    </div>
  );
}
