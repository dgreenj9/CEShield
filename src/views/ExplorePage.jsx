import React, { useMemo, useState } from 'react';
import { Link } from '../router';
import { useUserData } from '../contexts/UserDataContext';
import { getRequirements, calculateHours } from '../utils/calculations';
import { certifications } from '../utils/certificationData';
import { PATHS, getPathDefaultWeights } from '../utils/careerPaths';
import { rankCertifications } from '../utils/certScoring';
import { getPreference, setPreference } from '../utils/userPreferences';
import { A, FIG, tabularNums, tierColor, tierTextColor, tierLabel, kicker, display, panel, kpi, VIZ, LINE, LINE_FAINT } from '../components/atlas/theme';
import LensTabs from '../components/atlas/LensTabs';

// Explore — the signed-in home. A real dashboard, not a bare matrix:
//   1. Ledger strip — renewal countdown, hours banked, mandatory progress.
//   2. Table 1 (abridged) — top 10 for the user's saved lens.
//   3. The ledger + the user's claims, linking out to the full surfaces.

const labelize = (key) => key.replace(/([A-Z])/g, ' $1').trim();

const statLabel = {
  display: 'block', fontFamily: FIG, fontSize: 12,
  color: A.inkMuted, marginTop: 8, fontWeight: 400,
};
const bigStat = { ...kpi(34), display: 'block' };
const cardHead = {
  padding: '16px 20px 12px', borderBottom: `1px solid ${LINE_FAINT}`, display: 'flex',
  justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap',
};
const cardHeadLabel = { fontFamily: FIG, fontSize: 12, letterSpacing: '0.02em', fontWeight: 600, color: A.inkBody };
const cardHeadLink = { fontFamily: FIG, fontSize: 12, fontWeight: 500, color: A.accent, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 32 };

export default function ExplorePage() {
  const { user, courses, credentials } = useUserData();
  const [lens, setLens] = useState(() => {
    const saved = getPreference('careerPath');
    return saved && PATHS[saved] ? saved : 'clinical';
  });

  const requirements = useMemo(
    () => getRequirements(user.state, user.licenseType),
    [user.state, user.licenseType],
  );
  const hours = useMemo(() => calculateHours(courses), [courses]);

  const renewalDays = useMemo(() => {
    if (!user.renewalDate) return null;
    const days = Math.ceil((new Date(user.renewalDate) - new Date()) / 86400000);
    return Number.isFinite(days) ? days : null;
  }, [user.renewalDate]);

  const renewalShort = user.renewalDate
    ? new Date(`${user.renewalDate}T12:00:00`)
        .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  const mandatoryEntries = useMemo(
    () => Object.entries(requirements?.mandatory || {}).filter(([, r]) => r > 0),
    [requirements],
  );
  const mandatoryDone = mandatoryEntries.filter(([k, r]) => (hours[k] || 0) >= r).length;
  const missing = mandatoryEntries.filter(([k, r]) => (hours[k] || 0) < r);
  const certCount = courses.filter((c) => c.certificate_storage).length;
  const pct = requirements?.total > 0 ? Math.min(100, (hours.total / requirements.total) * 100) : 0;

  const ranked = useMemo(
    () => rankCertifications(certifications, getPathDefaultWeights(lens), lens),
    [lens],
  );
  const claimedByName = useMemo(() => {
    const map = {};
    (credentials || []).forEach((c) => { map[c.cert_name] = c.status; });
    return map;
  }, [credentials]);

  const selectLens = (key) => {
    setLens(key);
    setPreference('careerPath', key);
  };

  const logDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div>
      {/* Header */}
      <header className="plum-rise" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.25rem 2rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ ...kicker(), marginBottom: 14 }}>{logDate}</div>
          <h1 style={display('clamp(2rem, 4.4vw, 3.25rem)', 360)}>
            Your position <em style={{ fontStyle: 'normal', color: A.accentMid }}>in the field.</em>
          </h1>
        </div>
        <Link
          to="/matrix"
          className="atlas-btn atlas-btn-primary"
          style={{ fontSize: 14.5 }}
        >
          Open the full field →
        </Link>
      </header>

      {/* Ledger strip */}
      <section aria-label="Status" className="atlas-4col plum-statband" style={panel}>
        <div style={{ padding: '1.25rem 1.5rem' }}>
          {renewalDays !== null ? (
            <>
              <span style={{ ...bigStat, color: renewalDays < 90 ? A.warn : A.ink }}>{renewalDays}</span>
              <span style={statLabel}>
                days to {user.state || ''} renewal{renewalShort ? ` · ${renewalShort}` : ''}
              </span>
            </>
          ) : (
            <>
              <span style={{ ...bigStat, color: A.inkMuted }}>·</span>
              <span style={statLabel}>
                <Link to="/profile" className="atlas-link" style={{ textDecoration: 'none' }}>Set renewal date →</Link>
              </span>
            </>
          )}
        </div>
        <div style={{ padding: '1.25rem 1.5rem' }}>
          <span style={bigStat}>
            {hours.total}
            <span style={{ fontSize: 17, color: A.inkMuted, fontWeight: 400, letterSpacing: 0 }}> / {requirements?.total ?? '·'}</span>
          </span>
          <span style={statLabel}>hours banked this cycle</span>
        </div>
        <div style={{ padding: '1.25rem 1.5rem' }}>
          <span style={bigStat}>
            {mandatoryDone}
            <span style={{ fontSize: 17, color: A.inkMuted, fontWeight: 400, letterSpacing: 0 }}> / {mandatoryEntries.length}</span>
          </span>
          <span style={statLabel}>mandatory categories done</span>
        </div>
        <div style={{ padding: '1.25rem 1.5rem' }}>
          <span style={bigStat}>{courses.length}</span>
          <span style={statLabel}>courses logged · {certCount} certificates</span>
        </div>
      </section>

      {/* Next action */}
      {missing.length > 0 && !user.isFirstRenewal && (
        <section
          aria-label="Next action"
          style={{ marginTop: 10, borderRadius: 6, border: '1px solid rgba(224,142,109,0.35)', padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem 1.5rem', flexWrap: 'wrap', background: 'rgba(224,142,109,0.06)' }}
        >
          <span style={{ fontSize: 14.5, color: A.inkBody }}>
            <strong style={{ ...kicker(10.5, A.warn), marginRight: 12 }}>Next action</strong>
            {missing[0][1]}h {labelize(missing[0][0]).toLowerCase()} · {hours[missing[0][0]] || 0}/{missing[0][1]} logged.
          </span>
          <Link to="/courses" className="atlas-link" style={{ fontFamily: FIG, fontSize: 13, fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', minHeight: 44 }}>
            Log a course →
          </Link>
        </section>
      )}

      <div className="atlas-dash-grid" style={{ marginTop: '2rem' }}>
        {/* Table 1 (abridged) — top 10 for the saved lens */}
        <section aria-label="The field, your lens" style={{ ...panel, overflow: 'hidden' }}>
          <LensTabs
            active={lens}
            onSelect={selectLens}
            size="sm"
            trailing={(
              <span style={{ marginLeft: 'auto', alignSelf: 'center', paddingRight: 16, fontFamily: FIG, fontSize: 12, color: A.inkMuted, letterSpacing: '0.02em', whiteSpace: 'nowrap', flexShrink: 0 }}>
                Top 10 of {ranked.length}
              </span>
            )}
          />
          {ranked.slice(0, 10).map((cert, i) => {
            const claim = claimedByName[cert.name];
            return (
              <div key={cert.name} className="atlas-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 1.1rem', minHeight: 48, borderBottom: i < 9 ? `1px solid ${LINE_FAINT}` : 'none' }}>
                <span style={{ fontFamily: FIG, fontSize: 11, color: A.inkMuted, width: 26, textAlign: 'right', flexShrink: 0, ...tabularNums }}>
                  {String(cert.rank).padStart(2, '0')}
                </span>
                <Link
                  to={`/matrix?lens=${lens}&cert=${encodeURIComponent(cert.name)}`}
                  className="atlas-ink-link"
                  style={{ flex: 1, minWidth: 0, fontWeight: 400, fontSize: 14.5, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: A.ink, textDecoration: 'none', padding: '12px 0' }}
                >
                  {cert.name}
                </Link>
                {claim && (
                  <span style={{ fontFamily: FIG, fontSize: 10.5, fontWeight: 500, padding: '2px 9px', borderRadius: 20, border: '1px solid rgba(226,196,143,0.45)', color: A.accent, flexShrink: 0, textTransform: 'capitalize' }}>
                    {claim.replace('_', ' ')}
                  </span>
                )}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, color: tierTextColor(cert.computedScore), flexShrink: 0 }}>
                  <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: tierColor(cert.computedScore) }} />
                  {tierLabel(cert.computedScore)}
                </span>
                <span style={{ fontFamily: FIG, fontSize: 16, fontWeight: 400, letterSpacing: '-0.02em', width: 36, textAlign: 'right', flexShrink: 0, ...tabularNums }}>
                  {Math.round(cert.computedScore)}
                </span>
              </div>
            );
          })}
          <div style={{ padding: '6px 20px', borderTop: `1px solid ${LINE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontFamily: FIG, fontSize: 12, color: A.inkMuted }}>
            <span>Default weights</span>
            <Link to={`/matrix?lens=${lens}`} className="atlas-link" style={{ fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 44 }}>
              Calibrate the weights →
            </Link>
          </div>
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* The ledger */}
          <section aria-label="The ledger" style={panel}>
            <div style={cardHead}>
              <span style={cardHeadLabel}>
                The Ledger{requirements ? ` · ${user.state} ${user.licenseType} · ${requirements.total}h / ${requirements.cycleYears}yr` : ''}
              </span>
              <Link to="/compliance" style={cardHeadLink}>Full ledger →</Link>
            </div>
            {requirements ? (
              <div style={{ padding: '1.1rem 1.25rem 1.25rem' }}>
                <div role="img" aria-label={`${hours.total} of ${requirements.total} hours banked`} style={{ height: 8, background: VIZ.track, borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
                  <span className="plum-grow" style={{ display: 'block', height: '100%', width: `${pct}%`, background: VIZ.c3, borderRadius: '0 4px 4px 0' }} />
                </div>
                {mandatoryEntries.map(([key, required]) => {
                  const done = (hours[key] || 0) >= required;
                  return (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 0', borderBottom: `1px solid ${LINE_FAINT}` }}>
                      <span style={{ fontSize: 13.5, color: A.inkBody, textTransform: 'capitalize' }}>{labelize(key)}</span>
                      <span style={{ fontFamily: FIG, fontSize: 12, fontWeight: 500, color: done ? '#2E9F8C' : A.warn, ...tabularNums }}>
                        {hours[key] || 0}/{required} {done ? '✓' : 'Due'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '1.1rem 1.35rem', fontSize: 13.5, color: A.inkMuted }}>
                Your state isn&rsquo;t in the rules library yet.{' '}
                <Link to="/profile" className="atlas-link" style={{ fontWeight: 500, textDecoration: 'none' }}>Pick a covered state →</Link>
              </div>
            )}
          </section>

          {/* Claims */}
          <section aria-label="Your claims" style={panel}>
            <div style={cardHead}>
              <span style={cardHeadLabel}>Your claims on the field</span>
              <Link to="/profile" style={cardHeadLink}>Profile →</Link>
            </div>
            {(credentials || []).map((c) => (
              <div key={c.id || c.cert_name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.7rem 1.25rem', borderBottom: `1px solid ${LINE_FAINT}` }}>
                <span aria-hidden="true" style={{ color: c.status === 'earned' ? A.accent : c.status === 'in_progress' ? A.warn : A.inkMuted, fontSize: 13, flexShrink: 0 }}>
                  {c.status === 'earned' ? '●' : c.status === 'in_progress' ? '◐' : '○'}
                </span>
                <span style={{ flex: 1, minWidth: 0, fontWeight: 400, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.cert_name}
                </span>
                <span style={{ fontFamily: FIG, fontSize: 11, letterSpacing: '0.02em', color: A.inkMuted, textTransform: 'capitalize' }}>
                  {(c.status || '').replace('_', ' ')}
                </span>
              </div>
            ))}
            {(credentials || []).length === 0 && (
              <div style={{ padding: '0.9rem 1.25rem', fontSize: 13.5, color: A.inkMuted }}>
                No claims yet.{' '}
                <Link to="/profile" className="atlas-link" style={{ fontWeight: 500, textDecoration: 'none' }}>Claim your first credential →</Link>
              </div>
            )}
            <div style={{ padding: '10px 20px', fontFamily: FIG, fontSize: 11.5, color: A.inkMuted }}>Self-reported</div>
          </section>
        </div>
      </div>
    </div>
  );
}
