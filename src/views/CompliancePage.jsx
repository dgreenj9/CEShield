import React, { useMemo } from 'react';
import { Shield } from 'lucide-react';
import { Link } from '../router';
import { useUserData } from '../contexts/UserDataContext';
import { getRequirements, calculateHours } from '../utils/calculations';
import { generateReport } from '../utils/reportGenerator';
import { A, FIG, tabularNums, LINE, LINE_FAINT, VIZ, kicker, display, kpi, panel } from '../components/atlas/theme';

// Compliance — "The Ledger" (Table 3). Make renewal boring.
// All values are computed by the rules engine, never hardcoded: the header
// citation, the hours meter, the mandatory-category checklist, the format
// caps, and the course log all derive from src/data/stateRules + the user's
// logged courses.

const labelize = (key) => key.replace(/([A-Z])/g, ' $1').trim();

const headLabel = { fontFamily: FIG, fontSize: 12, letterSpacing: '0.02em', fontWeight: 600, color: A.inkBody };
const GOOD = '#2fa894';

export default function CompliancePage() {
  const { user, courses } = useUserData();
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

  const renewalDateLabel = user.renewalDate
    ? new Date(`${user.renewalDate}T12:00:00`)
        .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  if (!requirements) {
    return (
      <div>
        <div style={{ ...kicker(), marginBottom: 14 }}>The Ledger</div>
        <h1 style={{ ...display('clamp(2rem, 4.4vw, 3.25rem)', 360), marginBottom: '2rem' }}>
          Renewal day should be <em style={{ fontStyle: 'normal', color: A.accentMid }}>boring.</em>
        </h1>
        <div style={{ ...panel, padding: '2rem', textAlign: 'center', color: A.inkBody }}>
          <Shield size={20} aria-hidden="true" style={{ color: A.inkMuted, marginBottom: 8 }} />
          <p style={{ margin: '0 0 4px', fontWeight: 500, color: A.ink }}>Your state isn&rsquo;t in our rules library yet.</p>
          <p style={{ margin: 0, fontSize: 14 }}>
            Pick a covered state (Illinois, Wisconsin, or North Carolina) in{' '}
            <Link to="/profile" className="atlas-link" style={{ fontWeight: 500, textDecoration: 'none' }}>Profile →</Link>
          </p>
        </div>
      </div>
    );
  }

  const pct = requirements.total > 0 ? Math.min(100, (hours.total / requirements.total) * 100) : 0;
  const mandatoryEntries = Object.entries(requirements.mandatory || {}).filter(([, r]) => r > 0);
  const mandatoryDone = mandatoryEntries.filter(([k, r]) => (hours[k] || 0) >= r).length;
  const cycleDays = (requirements.cycleYears || 2) * 365;
  const onPace = renewalDays === null
    ? pct >= 50
    : pct / 100 >= (1 - renewalDays / cycleDays) - 0.1;
  const showCulturalNotice =
    user.state === 'IL' && !user.isFirstRenewal &&
    (requirements.mandatory.culturalCompetency || 0) > 0 &&
    (hours.culturalCompetency || 0) < requirements.mandatory.culturalCompetency;
  const sortedCourses = [...courses].sort((a, b) => new Date(b.date) - new Date(a.date));
  const cite = (requirements.citation || '').toUpperCase();

  return (
    <div>
      {/* Header */}
      <header className="plum-rise" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.25rem 2rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ ...kicker(), marginBottom: 14, ...tabularNums }}>
            The Ledger · {requirements.jurisdictionName || user.state} {user.licenseType} ·{' '}
            {requirements.total}h / {requirements.cycleYears}yr{cite ? ` · ${cite}` : ''}
          </div>
          <h1 style={display('clamp(2rem, 4.4vw, 3.25rem)', 360)}>
            Renewal day should be <em style={{ fontStyle: 'normal', color: A.accentMid }}>boring.</em>
          </h1>
        </div>
        <div className="plum-renewal" style={{ textAlign: 'right' }}>
          {renewalDays !== null ? (
            <>
              <span style={{ ...kpi(48), lineHeight: 1, color: renewalDays < 90 ? A.warn : A.ink }}>
                {renewalDays}
              </span>
              <span style={{ display: 'block', fontFamily: FIG, fontSize: 12, color: A.inkMuted, fontWeight: 400, marginTop: 6 }}>
                days to renewal{renewalDateLabel ? ` · ${renewalDateLabel}` : ''}
              </span>
            </>
          ) : (
            <Link to="/profile" className="atlas-link" style={{ fontFamily: FIG, fontSize: 13, fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 44 }}>
              Set your renewal date →
            </Link>
          )}
        </div>
      </header>

      {/* Unverified-state notice */}
      {requirements.verified === false && (
        <div role="alert" style={{ border: '1px solid rgba(224,168,90,0.35)', borderRadius: 6, padding: '0.85rem 1.4rem', marginBottom: '1.5rem', background: 'rgba(224,168,90,0.06)', display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          <span style={kicker(10.5, A.warn)}>Beta state</span>
          <span style={{ fontSize: 14 }}>
            {requirements.jurisdictionName} CE rules are unverified. Confirm against{' '}
            <a href={requirements.boardUrl} target="_blank" rel="noopener noreferrer" className="atlas-link" style={{ fontWeight: 500 }}>
              {requirements.citation}
            </a>{' '}
            before relying on totals.
          </span>
        </div>
      )}

      {/* First-renewal exemption */}
      {user.isFirstRenewal && (
        <div style={{ ...panel, padding: '0.85rem 1.4rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          <span style={kicker()}>First renewal</span>
          <span style={{ fontSize: 14 }}>No CE requirements needed for this cycle.</span>
        </div>
      )}

      {/* New-rule notice */}
      {showCulturalNotice && (
        <div style={{ border: '1px solid rgba(224,168,90,0.35)', borderRadius: 6, padding: '0.85rem 1.4rem', marginBottom: '1.5rem', background: 'rgba(224,168,90,0.06)', display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          <span style={kicker(10.5, A.warn)}>New 2025 rule</span>
          <span style={{ fontSize: 14 }}>
            Cultural competency ({requirements.mandatory.culturalCompetency} h) is now required in Illinois, starting this cycle.
          </span>
        </div>
      )}

      <div style={{ ...panel, overflow: 'hidden' }}>
        {/* Fig. 4 — hours banked + mandatory categories */}
        <div className="atlas-ledger-grid">
          <div style={{ padding: '1.5rem 1.75rem', borderRight: `1px solid ${LINE_FAINT}` }}>
            <div style={{ ...headLabel, marginBottom: 14 }}>Hours banked</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ ...kpi(60), fontWeight: 330, lineHeight: 1 }}>
                {hours.total}
              </span>
              <span style={{ fontFamily: FIG, fontSize: 20, fontWeight: 400, color: A.inkMuted }}>/ {requirements.total} h</span>
              <span style={{ fontFamily: FIG, fontSize: 11, fontWeight: 500, padding: '4px 11px', borderRadius: 20, border: `1px solid ${onPace ? 'rgba(47,168,148,0.5)' : 'rgba(224,168,90,0.5)'}`, color: onPace ? GOOD : A.warn, alignSelf: 'center', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <i aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: onPace ? GOOD : A.warn }} />
                {onPace ? 'On pace' : 'Behind pace'}
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Cycle hours progress"
              style={{ height: 8, background: VIZ.track, borderRadius: 4, overflow: 'hidden', margin: '18px 0 10px' }}
            >
              <span className="plum-grow" style={{ display: 'block', height: '100%', width: `${pct}%`, background: VIZ.c3, borderRadius: '0 4px 4px 0' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FIG, fontSize: 11.5, color: A.inkMuted }}>
              <span>{Math.round(pct)}% of cycle requirement</span>
              <span>{Math.max(0, requirements.total - hours.total)} h still to log</span>
            </div>
          </div>
          <div style={{ padding: '1.5rem 1.75rem' }}>
            <div style={{ ...headLabel, marginBottom: 14 }}>
              Mandatory categories · {mandatoryDone} of {mandatoryEntries.length} done
            </div>
            {mandatoryEntries.map(([key, required]) => {
              const done = hours[key] || 0;
              const ok = done >= required;
              return (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 14, alignItems: 'baseline', padding: '9px 0', borderBottom: `1px solid ${LINE_FAINT}` }}>
                  <span style={{ fontSize: 14, color: A.inkBody, textTransform: 'capitalize' }}>
                    {labelize(key)}{' '}
                    {key === 'culturalCompetency' && (
                      <span style={{ fontFamily: FIG, fontSize: 10, fontWeight: 500, color: A.warn, letterSpacing: '0.02em' }}>New 2025</span>
                    )}
                  </span>
                  <span style={{ fontFamily: FIG, fontSize: 13.5, fontWeight: 450, color: A.ink, ...tabularNums }}>{done}/{required} h</span>
                  <span style={{ fontFamily: FIG, fontSize: 11.5, fontWeight: 500, color: ok ? GOOD : A.warn, minWidth: 30, textAlign: 'right' }}>
                    {ok ? '✓' : 'Due'}
                  </span>
                </div>
              );
            })}
            {mandatoryEntries.length === 0 && (
              <p style={{ fontSize: 14, color: A.inkMuted, margin: 0 }}>No mandatory categories for this jurisdiction.</p>
            )}
          </div>
        </div>

        {/* Format caps */}
        {Object.keys(requirements.limits || {}).length > 0 && (
          <div style={{ borderTop: `1px solid ${LINE}`, padding: '1.25rem 1.75rem' }}>
            <div style={{ ...headLabel, marginBottom: 12 }}>Format caps</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
              {Object.entries(requirements.limits).map(([key, limit]) => {
                const current = hours[key] || 0;
                const over = current >= limit;
                const near = current >= limit * 0.8;
                return (
                  <div key={key} style={{ border: `1px solid ${LINE_FAINT}`, borderRadius: 6, background: 'rgba(255,255,255,0.02)', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ ...kpi(20) }}>
                        {current}
                        <span style={{ fontSize: 12, color: A.inkMuted, fontWeight: 400, letterSpacing: 0 }}>/{limit}</span>
                      </span>
                      <span style={{ fontFamily: FIG, fontSize: 11, fontWeight: 500, color: over || near ? A.warn : A.inkBody }}>
                        {over ? 'At cap' : near ? 'Near' : 'OK'}
                      </span>
                    </div>
                    <span style={{ display: 'block', fontSize: 11.5, color: A.inkMuted, marginTop: 3, textTransform: 'capitalize' }}>
                      {labelize(key)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Table 4 — the course log */}
        <div style={{ borderTop: `1px solid ${LINE}` }}>
          <div style={{ padding: '12px 1.75rem', borderBottom: `1px solid ${LINE_FAINT}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 10 }}>
            <span style={headLabel}>Course log · {courses.length} entries</span>
            <Link to="/courses" className="atlas-link" style={{ fontFamily: FIG, fontSize: 12, fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 36 }}>
              Add or edit courses →
            </Link>
          </div>
          {sortedCourses.map((course, i) => (
            <div
              key={course.id || `${course.title}-${i}`}
              className="atlas-row plum-logrow"
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0.75rem 1.75rem', borderBottom: i < sortedCourses.length - 1 ? `1px solid ${LINE_FAINT}` : 'none' }}
            >
              <span className="plum-logrow-date" style={{ fontFamily: FIG, fontSize: 12, color: A.inkMuted, width: 84, flexShrink: 0, ...tabularNums }}>
                {course.date
                  ? new Date(`${course.date}T12:00:00`)
                      .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                  : '·'}
              </span>
              <span className="plum-logrow-title" style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 400, fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {course.title}
                </span>
                <span style={{ display: 'block', fontFamily: FIG, fontSize: 11.5, color: A.inkMuted, marginTop: 1, textTransform: 'capitalize' }}>
                  {[course.provider, labelize(course.category || '')].filter(Boolean).join(' · ')}
                </span>
              </span>
              {course.certificate_storage && (
                <span className="plum-logrow-badge" style={{ fontFamily: FIG, fontSize: 10.5, fontWeight: 500, padding: '2px 9px', borderRadius: 20, border: '1px solid rgba(240,195,168,0.45)', color: A.accent, flexShrink: 0 }}>
                  Certificate
                </span>
              )}
              <span className="plum-logrow-hours" style={{ fontFamily: FIG, fontSize: 16, fontWeight: 400, letterSpacing: '-0.02em', width: 52, textAlign: 'right', flexShrink: 0, ...tabularNums }}>
                {course.hours}
                <span style={{ fontSize: 11, color: A.inkMuted, fontWeight: 400, letterSpacing: 0 }}> h</span>
              </span>
            </div>
          ))}
          {sortedCourses.length === 0 && (
            <div style={{ padding: '1.5rem 1.75rem', fontSize: 14, color: A.inkMuted }}>
              Nothing in the log yet.{' '}
              <Link to="/courses" className="atlas-link" style={{ fontWeight: 500, textDecoration: 'none' }}>Log your first course →</Link>
            </div>
          )}
        </div>

        {/* Export strip */}
        <div style={{ borderTop: `1px solid ${LINE}`, padding: '1rem 1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)' }}>
          <span style={{ fontSize: 14, maxWidth: '34em', color: A.inkBody }}>
            <strong style={{ color: A.ink, fontWeight: 450, fontSize: 16, letterSpacing: '-0.02em' }}>The full binder, board-ready.</strong>
          </span>
          <span style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => generateReport(user, courses, false)}
              className="atlas-btn atlas-btn-secondary atlas-btn-sm"
              style={{ fontFamily: FIG, fontSize: 13, minHeight: 44 }}
            >
              Export report
            </button>
            <button
              type="button"
              onClick={() => generateReport(user, courses, true)}
              className="atlas-btn atlas-btn-primary atlas-btn-sm"
              style={{ fontFamily: FIG, fontSize: 13, minHeight: 44 }}
            >
              Certificates ZIP
            </button>
          </span>
        </div>
      </div>

      {/* Source footer */}
      <p style={{ fontFamily: FIG, fontSize: 11.5, color: A.inkMuted, margin: '1.25rem 0 0' }}>
        Source: {requirements.citation || 'state board rules'}{requirements.lastReviewed ? ` · last reviewed ${requirements.lastReviewed}` : ''} ·{' '}
        <a href={requirements.boardUrl || '#'} target="_blank" rel="noopener noreferrer" className="atlas-link atlas-hit" style={{ fontWeight: 500, textDecoration: 'none' }}>
          Read the rule ↗
        </a>
      </p>
    </div>
  );
}
