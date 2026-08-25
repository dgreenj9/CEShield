import React, { useMemo, useState } from 'react';
import { Link } from '../router';
import { useUserData } from '../contexts/UserDataContext';
import { getRequirements, calculateHours } from '../utils/calculations';
import { certifications } from '../utils/certificationData';
import { PATHS, getPathDefaultWeights } from '../utils/careerPaths';
import { rankCertifications } from '../utils/certScoring';
import { getPreference, setPreference } from '../utils/userPreferences';
import { A, FIG, INS, eyebrow, tabularNums, tierColor } from '../components/atlas/theme';
import LensTabs from '../components/atlas/LensTabs';

// Explore — the signed-in home. A real dashboard, not a bare matrix:
//   1. Ledger strip — renewal countdown, hours banked, mandatory progress.
//   2. Table 1 (abridged) — top 10 for the user's saved lens.
//   3. The ledger + the user's claims, linking out to the full surfaces.

const labelize = (key) => key.replace(/([A-Z])/g, ' $1').trim();

const statLabel = {
  display: 'block', fontFamily: FIG, fontSize: 11.5, letterSpacing: '0.02em',
  color: A.inkMuted, marginTop: 4, fontWeight: 600,
};
const bigStat = { fontFamily: FIG, fontSize: 34, fontWeight: 800, lineHeight: 1, ...tabularNums };
const cardHead = {
  padding: '12px 16px', borderBottom: `1px solid ${A.ink}`, display: 'flex',
  justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap',
};
const cardHeadLabel = { fontFamily: FIG, fontSize: 12.5, letterSpacing: '0.02em', fontWeight: 700 };
const cardHeadLink = { fontFamily: FIG, fontSize: 12, fontWeight: 700, color: A.accent, textDecoration: 'none' };

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
      <header style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ ...eyebrow(), marginBottom: 8 }}>{logDate}</div>
          <h1 className="cs-h1-clamp" style={{ fontFamily: INS, fontWeight: 600, fontSize: 36, lineHeight: 1.02, letterSpacing: '-0.025em', margin: 0 }}>
            Your position in the field.
          </h1>
        </div>
        <Link
          to="/matrix"
          style={{ textDecoration: 'none', fontWeight: 700, fontSize: 14.5, background: A.accent, color: A.onAccent, padding: '12px 20px', whiteSpace: 'nowrap' }}
        >
          Open the full field →
        </Link>
      </header>

      {/* Ledger strip */}
      <section aria-label="Status" className="atlas-4col" style={{ border: `1px solid ${A.ink}`, background: A.paper }}>
        <div style={{ padding: '1.2rem 1.5rem', borderRight: `1px solid ${A.ruleMinor}` }}>
          {renewalDays !== null ? (
            <>
              <span style={{ ...bigStat, color: renewalDays < 90 ? A.warn : A.ink }}>{renewalDays}</span>
              <span style={statLabel}>
                days to {user.state || ''} renewal{renewalShort ? ` · ${renewalShort}` : ''}
              </span>
            </>
          ) : (
            <>
              <span style={{ ...bigStat, color: A.dim }}>·</span>
              <span style={statLabel}>
                <Link to="/profile" style={{ color: A.accent, textDecoration: 'none' }}>Set renewal date →</Link>
              </span>
            </>
          )}
        </div>
        <div style={{ padding: '1.2rem 1.5rem', borderRight: `1px solid ${A.ruleMinor}` }}>
          <span style={bigStat}>
            {hours.total}
            <span style={{ fontSize: 17, color: A.inkMuted, fontWeight: 600 }}> / {requirements?.total ?? '·'}</span>
          </span>
          <span style={statLabel}>hours banked this cycle</span>
        </div>
        <div style={{ padding: '1.2rem 1.5rem', borderRight: `1px solid ${A.ruleMinor}` }}>
          <span style={bigStat}>
            {mandatoryDone}
            <span style={{ fontSize: 17, color: A.inkMuted, fontWeight: 600 }}> / {mandatoryEntries.length}</span>
          </span>
          <span style={statLabel}>mandatory categories done</span>
        </div>
        <div style={{ padding: '1.2rem 1.5rem' }}>
          <span style={bigStat}>{courses.length}</span>
          <span style={statLabel}>courses logged · {certCount} certificates</span>
        </div>
      </section>

      {/* Next action */}
      {missing.length > 0 && !user.isFirstRenewal && (
        <section
          aria-label="Next action"
          style={{ border: `1px dashed ${A.ink}`, borderTop: 'none', padding: '0.9rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap', background: A.notice }}
        >
          <span style={{ fontSize: 14.5 }}>
            <strong style={{ fontFamily: FIG, fontSize: 12, letterSpacing: '0.02em', color: A.warn, marginRight: 10 }}>Next action</strong>
            {missing[0][1]}h {labelize(missing[0][0]).toLowerCase()} · {hours[missing[0][0]] || 0}/{missing[0][1]} logged.
          </span>
          <Link to="/courses" style={{ fontFamily: FIG, fontSize: 12.5, fontWeight: 700, color: A.accent, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Log a course →
          </Link>
        </section>
      )}

      <div className="atlas-dash-grid" style={{ marginTop: '2rem' }}>
        {/* Table 1 (abridged) — top 10 for the saved lens */}
        <section aria-label="The field, your lens" style={{ border: `1px solid ${A.ink}` }}>
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
              <div key={cert.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.62rem 1rem', borderBottom: i < 9 ? `1px solid ${A.ruleFaintest}` : 'none' }}>
                <span style={{ fontFamily: FIG, fontSize: 11, color: A.inkMuted, width: 26, textAlign: 'right', flexShrink: 0, ...tabularNums }}>
                  {String(cert.rank).padStart(2, '0')}
                </span>
                <Link
                  to={`/matrix?lens=${lens}&cert=${encodeURIComponent(cert.name)}`}
                  style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 14.5, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: A.ink, textDecoration: 'none' }}
                >
                  {cert.name}
                </Link>
                {claim && (
                  <span style={{ fontFamily: FIG, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.02em', padding: '2px 8px', background: A.accent, color: A.onAccent, flexShrink: 0, textTransform: 'capitalize' }}>
                    {claim.replace('_', ' ')}
                  </span>
                )}
                <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: '50%', background: tierColor(cert.computedScore), flexShrink: 0 }} />
                <span style={{ fontFamily: FIG, fontSize: 15, fontWeight: 700, width: 44, textAlign: 'right', flexShrink: 0, ...tabularNums }}>
                  {Math.round(cert.computedScore)}
                </span>
              </div>
            );
          })}
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${A.ink}`, display: 'flex', justifyContent: 'space-between', fontFamily: FIG, fontSize: 12, letterSpacing: '0.02em', color: A.inkMuted }}>
            <span>Default weights</span>
            <Link to={`/matrix?lens=${lens}`} style={{ color: A.accent, fontWeight: 700, textDecoration: 'none' }}>
              Calibrate the weights →
            </Link>
          </div>
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* The ledger */}
          <section aria-label="The ledger" style={{ border: `1px solid ${A.ink}` }}>
            <div style={cardHead}>
              <span style={cardHeadLabel}>
                The Ledger{requirements ? ` · ${user.state} ${user.licenseType} · ${requirements.total}h / ${requirements.cycleYears}yr` : ''}
              </span>
              <Link to="/compliance" style={cardHeadLink}>Full ledger →</Link>
            </div>
            {requirements ? (
              <div style={{ padding: '1.1rem 1.35rem' }}>
                <div style={{ height: 7, background: A.ruleFaint, marginBottom: 14 }}>
                  <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: A.accent }} />
                </div>
                {mandatoryEntries.map(([key, required]) => {
                  const done = (hours[key] || 0) >= required;
                  return (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '5px 0', borderBottom: `1px solid ${A.ruleFaintest}` }}>
                      <span style={{ fontSize: 13.5, textTransform: 'capitalize' }}>{labelize(key)}</span>
                      <span style={{ fontFamily: FIG, fontSize: 12, fontWeight: 700, color: done ? A.accent : A.warn, letterSpacing: '0.04em', ...tabularNums }}>
                        {hours[key] || 0}/{required} {done ? '✓' : 'Due'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '1.1rem 1.35rem', fontSize: 13.5, color: A.inkMuted }}>
                Your state isn&rsquo;t in the rules library yet.{' '}
                <Link to="/profile" style={{ color: A.accent, fontWeight: 700, textDecoration: 'none' }}>Pick a covered state →</Link>
              </div>
            )}
          </section>

          {/* Claims */}
          <section aria-label="Your claims" style={{ border: `1px solid ${A.ink}` }}>
            <div style={cardHead}>
              <span style={cardHeadLabel}>Your claims on the field</span>
              <Link to="/profile" style={cardHeadLink}>Profile →</Link>
            </div>
            {(credentials || []).map((c) => (
              <div key={c.id || c.cert_name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.65rem 1.35rem', borderBottom: `1px solid ${A.ruleFaintest}` }}>
                <span aria-hidden="true" style={{ color: c.status === 'earned' ? A.accent : c.status === 'in_progress' ? A.warn : A.dim, fontSize: 13, flexShrink: 0 }}>
                  {c.status === 'earned' ? '●' : c.status === 'in_progress' ? '◐' : '○'}
                </span>
                <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.cert_name}
                </span>
                <span style={{ fontFamily: FIG, fontSize: 11, letterSpacing: '0.02em', color: A.inkMuted, textTransform: 'capitalize' }}>
                  {(c.status || '').replace('_', ' ')}
                </span>
              </div>
            ))}
            {(credentials || []).length === 0 && (
              <div style={{ padding: '0.9rem 1.35rem', fontSize: 13.5, color: A.inkMuted }}>
                No claims yet.{' '}
                <Link to="/profile" style={{ color: A.accent, fontWeight: 700, textDecoration: 'none' }}>Claim your first credential →</Link>
              </div>
            )}
            <div style={{ padding: '10px 16px', fontFamily: FIG, fontSize: 11.5, color: A.inkMuted, letterSpacing: '0.02em' }}>Self-reported</div>
          </section>
        </div>
      </div>
    </div>
  );
}
