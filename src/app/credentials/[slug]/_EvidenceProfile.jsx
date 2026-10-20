// Evidence profile for a dossier: what kind of studies sit behind the
// scores, and how recent they are. Two small plates drawn from the build-time
// citation meta (evidence_mix, year_dist). Server component, no client JS.
//
// Color stays out of it: tier color is reserved for scores, so the mix
// meters take the validated green slot and the year columns the violet slot
// (recent years full strength, older years at half), on faint tracks, with
// the value always printed beside the mark.

import { A, FIG, tabularNums, panel, VIZ, LINE, LINE_FAINT } from '@/components/atlas/theme';
import { EVIDENCE_LABELS } from '@/utils/citationsLibrary';

const label = { fontFamily: FIG, fontSize: 12, fontWeight: 600, color: A.inkBody, letterSpacing: '0.02em' };

function MixPlate({ mix, total }) {
  const rows = Object.entries(mix || {})
    .filter(([, n]) => n > 0)
    .sort((a, b) => {
      if (a[0] === 'unknown') return 1;
      if (b[0] === 'unknown') return -1;
      return b[1] - a[1];
    });
  if (!rows.length) return null;
  const max = Math.max(...rows.map(([, n]) => n));
  return (
    <div>
      <div style={{ ...label, marginBottom: 10 }}>Evidence mix</div>
      <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 9.5rem) minmax(0, 1fr) 2rem 2.5rem', gap: '7px 12px', alignItems: 'center' }}>
        {rows.map(([type, n]) => (
          <div key={type} style={{ display: 'contents' }}>
            <dt style={{ fontSize: 13, color: type === 'unknown' ? A.inkMuted : A.inkBody, fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {EVIDENCE_LABELS[type] || type}
            </dt>
            <dd aria-hidden="true" style={{ margin: 0, height: 6, background: VIZ.track, borderRadius: 3, overflow: 'hidden' }}>
              <span className="plum-grow" style={{ display: 'block', height: '100%', width: `${(n / max) * 100}%`, background: type === 'unknown' ? A.dim : VIZ.c3, borderRadius: '0 4px 4px 0' }} />
            </dd>
            <dd style={{ margin: 0, fontSize: 13, fontWeight: 450, color: A.ink, textAlign: 'right', ...tabularNums }}>{n}</dd>
            <dd style={{ margin: 0, fontSize: 11.5, color: A.inkMuted, textAlign: 'right', ...tabularNums }}>
              {Math.round((n / total) * 100)}%
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function YearPlate({ dist }) {
  const years = Object.keys(dist || {}).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (years.length < 2) return null;
  const first = years[0];
  const last = years[years.length - 1];
  const span = [];
  for (let y = first; y <= last; y += 1) span.push([y, dist[String(y)] || 0]);
  const max = Math.max(...span.map(([, n]) => n));
  const peak = span.find(([, n]) => n === max)?.[0];
  const recent = span.filter(([y]) => y >= last - 4).reduce((a, [, n]) => a + n, 0);
  const total = span.reduce((a, [, n]) => a + n, 0);
  const H = 92;
  return (
    <div>
      <div style={{ ...label, marginBottom: 10, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span>Publication years</span>
        <span style={{ fontWeight: 400, color: A.inkMuted, ...tabularNums }}>{Math.round((recent / total) * 100)}% since {last - 4}</span>
      </div>
      <div
        role="img"
        aria-label={`Citations by publication year, ${first} to ${last}. Peak ${peak} with ${max}. ${recent} of ${total} published since ${last - 4}.`}
        style={{ position: 'relative', height: H, display: 'flex', alignItems: 'flex-end', gap: span.length > 24 ? 1 : 3, borderBottom: `1px solid ${LINE}` }}
      >
        {span.map(([y, n]) => (
          <span
            key={y}
            title={`${y} · ${n}`}
            style={{
              flex: 1,
              minWidth: 0,
              height: n ? `${Math.max(4, (n / max) * (H - 16))}px` : 1,
              background: n ? VIZ.c2 : LINE,
              opacity: n && y < last - 4 ? 0.5 : 1,
              borderRadius: '2px 2px 0 0',
              position: 'relative',
            }}
          >
            {y === peak && (
              <span style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 3, fontSize: 11, fontWeight: 500, color: A.ink, ...tabularNums }}>
                {n}
              </span>
            )}
          </span>
        ))}
      </div>
      <div aria-hidden="true" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, fontWeight: 400, color: A.inkMuted, ...tabularNums }}>
        <span>{first}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <i style={{ width: 8, height: 8, borderRadius: 2, background: VIZ.c2 }} /> last five years
          <i style={{ width: 8, height: 8, borderRadius: 2, background: VIZ.c2, opacity: 0.5, marginLeft: 6 }} /> earlier
        </span>
        <span>{last}</span>
      </div>
    </div>
  );
}

export default function EvidenceProfile({ meta }) {
  const total = meta?.count || 0;
  if (!total) return null;
  const mix = <MixPlate mix={meta.evidence_mix} total={total} />;
  const years = <YearPlate dist={meta.year_dist} />;
  return (
    <div className="atlas-evidence-profile" style={{ ...panel, marginBottom: 18 }}>
      <div style={{ padding: '1.25rem 1.35rem' }}>{mix}</div>
      <div style={{ padding: '1.25rem 1.35rem' }}>{years}</div>
      <div className="atlas-evidence-foot" style={{ padding: '11px 1.35rem', borderTop: `1px solid ${LINE_FAINT}`, fontSize: 11.5, color: A.inkMuted, fontWeight: 400, letterSpacing: '0.02em', display: 'flex', gap: '0.25rem 1rem', flexWrap: 'wrap' }}>
        {meta.source === 'librarian' && <span style={{ color: A.accent }}>Librarian-reviewed</span>}
        {meta.last_reviewed && <span style={tabularNums}>Last reviewed {meta.last_reviewed}</span>}
        <span style={tabularNums}>{total} sources</span>
      </div>
    </div>
  );
}
