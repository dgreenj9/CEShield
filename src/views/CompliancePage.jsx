import React, { useMemo } from 'react';
import { Shield } from 'lucide-react';
import { Link } from '../router';
import { useUserData } from '../contexts/UserDataContext';
import { getRequirements, calculateHours } from '../utils/calculations';
import { generateReport } from '../utils/reportGenerator';
import { A, FIG, INS, eyebrow, tabularNums } from '../components/atlas/theme';

// Compliance — "The Ledger" (Table 3). Make renewal boring.
// All values are computed by the rules engine, never hardcoded: the header
// citation, the hours meter, the mandatory-category checklist, the format
// caps, and the course log all derive from src/data/stateRules + the user's
// logged courses.

const labelize = (key) => key.replace(/([A-Z])/g, ' $1').trim();

const headLabel = { fontFamily: FIG, fontSize: 12.5, letterSpacing: '0.02em', fontWeight: 700, color: A.inkMuted };

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
        <div style={{ ...eyebrow(), marginBottom: 8 }}>The Ledger</div>
        <h1 style={{ fontFamily: INS, fontWeight: 600, fontSize: 36, lineHeight: 1.02, letterSpacing: '-0.025em', margin: '0 0 1.5rem' }}>
          Renewal day should be boring.
        </h1>
        <div style={{ border: `1px dashed ${A.ink}`, padding: '2rem', textAlign: 'center', color: A.inkBody }}>
          <Shield size={20} aria-hidden="true" style={{ color: A.inkMuted, marginBottom: 8 }} />
          <p style={{ margin: '0 0 4px', fontWeight: 600, color: A.ink }}>Your state isn&rsquo;t in our rules library yet.</p>
          <p style={{ margin: 0, fontSize: 14 }}>
            Pick a covered state (Illinois, Wisconsin, or North Carolina) in{' '}
            <Link to="/profile" style={{ color: A.accent, fontWeight: 700, textDecoration: 'none' }}>Profile →</Link>
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
      <header style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ ...eyebrow(), marginBottom: 8 }}>
            The Ledger · {requirements.jurisdictionName || user.state} {user.licenseType} ·{' '}
            {requirements.total}h / {requirements.cycleYears}yr{cite ? ` · ${cite}` : ''}
          </div>
          <h1 className="cs-h1-clamp" style={{ fontFamily: INS, fontWeight: 600, fontSize: 36, lineHeight: 1.02, letterSpacing: '-0.025em', margin: 0 }}>
            Renewal day should be boring.
          </h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          {renewalDays !== null ? (
            <>
              <span style={{ fontFamily: FIG, fontSize: 44, fontWeight: 800, lineHeight: 1, color: renewalDays < 90 ? A.warn : A.ink, ...tabularNums }}>
                {renewalDays}
              </span>
              <span style={{ display: 'block', fontFamily: FIG, fontSize: 11.5, letterSpacing: '0.02em', color: A.inkMuted, fontWeight: 600, marginTop: 2 }}>
                days to renewal{renewalDateLabel ? ` · ${renewalDateLabel}` : ''}
              </span>
            </>
          ) : (
            <Link to="/profile" style={{ fontFamily: FIG, fontSize: 12.5, fontWeight: 700, letterSpacing: '0.02em', color: A.accent, textDecoration: 'none' }}>
              Set your renewal date →
            </Link>
          )}
        </div>
      </header>

      {/* Unverified-state notice */}
      {requirements.verified === false && (
        <div role="alert" style={{ border: `1px dashed ${A.ink}`, padding: '0.85rem 1.4rem', marginBottom: '1.5rem', background: A.notice, display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: FIG, fontSize: 12, letterSpacing: '0.02em', fontWeight: 700, color: A.warn }}>Beta state</span>
          <span style={{ fontSize: 14 }}>
            {requirements.jurisdictionName} CE rules are unverified. Confirm against{' '}
            <a href={requirements.boardUrl} target="_blank" rel="noopener noreferrer" style={{ color: A.accent, fontWeight: 700 }}>
              {requirements.citation}
            </a>{' '}
            before relying on totals.
          </span>
        </div>
      )}

      {/* First-renewal exemption */}
      {user.isFirstRenewal && (
        <div style={{ border: `1px dashed ${A.ink}`, padding: '0.85rem 1.4rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: FIG, fontSize: 12, letterSpacing: '0.02em', fontWeight: 700, color: A.accent }}>First renewal</span>
          <span style={{ fontSize: 14 }}>No CE requirements needed for this cycle.</span>
        </div>
      )}

      {/* New-rule notice */}
      {showCulturalNotice && (
        <div style={{ border: `1px dashed ${A.ink}`, padding: '0.85rem 1.4rem', marginBottom: '1.5rem', background: A.notice, display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: FIG, fontSize: 12, letterSpacing: '0.02em', fontWeight: 700, color: A.warn }}>New 2025 rule</span>
          <span style={{ fontSize: 14 }}>
            Cultural competency ({requirements.mandatory.culturalCompetency} h) is now required in Illinois, starting this cycle.
          </span>
        </div>
      )}

      <div style={{ border: `1px solid ${A.ink}` }}>
        {/* Fig. 4 — hours banked + mandatory categories */}
        <div className="atlas-ledger-grid">
          <div style={{ padding: '1.5rem 1.75rem', borderRight: `1px solid ${A.ink}` }}>
            <div style={{ ...headLabel, marginBottom: 14 }}>Hours banked</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: FIG, fontSize: 58, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em', ...tabularNums }}>
                {hours.total}
              </span>
              <span style={{ fontFamily: FIG, fontSize: 20, fontWeight: 600, color: A.inkMuted }}>/ {requirements.total} h</span>
              <span style={{ fontFamily: FIG, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.02em', padding: '3px 10px', background: onPace ? A.accent : A.warn, color: A.onAccent, alignSelf: 'center' }}>
                {onPace ? 'On pace' : 'Behind pace'}
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Cycle hours progress"
              style={{ height: 8, background: A.ruleFaint, margin: '16px 0 8px' }}
            >
              <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: A.accent }} />
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
                <div key={key} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 14, alignItems: 'baseline', padding: '6px 0', borderBottom: `1px solid ${A.ruleFaintest}` }}>
                  <span style={{ fontSize: 14, textTransform: 'capitalize' }}>
                    {labelize(key)}{' '}
                    {key === 'culturalCompetency' && (
                      <span style={{ fontFamily: FIG, fontSize: 10, fontWeight: 700, color: A.warn, letterSpacing: '0.02em' }}>New 2025</span>
                    )}
                  </span>
                  <span style={{ fontFamily: FIG, fontSize: 13.5, fontWeight: 700, ...tabularNums }}>{done}/{required} h</span>
                  <span style={{ fontFamily: FIG, fontSize: 11.5, fontWeight: 800, color: ok ? A.accent : A.warn, letterSpacing: '0.02em', minWidth: 30, textAlign: 'right' }}>
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
          <div style={{ borderTop: `1px solid ${A.ink}`, padding: '1.25rem 1.75rem' }}>
            <div style={{ ...headLabel, marginBottom: 12 }}>Format caps</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
              {Object.entries(requirements.limits).map(([key, limit]) => {
                const current = hours[key] || 0;
                const over = current >= limit;
                const near = current >= limit * 0.8;
                return (
                  <div key={key} style={{ border: `1px solid ${A.ruleFaint}`, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontFamily: FIG, fontSize: 17, fontWeight: 800, ...tabularNums }}>
                        {current}
                        <span style={{ fontSize: 12, color: A.inkMuted, fontWeight: 600 }}>/{limit}</span>
                      </span>
                      <span style={{ fontFamily: FIG, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.02em', color: over || near ? A.warn : A.accentMid }}>
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
        <div style={{ borderTop: `1px solid ${A.ink}` }}>
          <div style={{ padding: '12px 1.75rem', borderBottom: `1px solid ${A.ruleFaint}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 10 }}>
            <span style={headLabel}>Course log · {courses.length} entries</span>
            <Link to="/courses" style={{ fontFamily: FIG, fontSize: 11.5, fontWeight: 700, color: A.accent, textDecoration: 'none' }}>
              Add or edit courses →
            </Link>
          </div>
          {sortedCourses.map((course, i) => (
            <div
              key={course.id || `${course.title}-${i}`}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0.62rem 1.75rem', borderBottom: i < sortedCourses.length - 1 ? `1px solid ${A.ruleFaintest}` : 'none' }}
            >
              <span style={{ fontFamily: FIG, fontSize: 12, color: A.inkMuted, width: 84, flexShrink: 0, ...tabularNums }}>
                {course.date
                  ? new Date(`${course.date}T12:00:00`)
                      .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                  : '·'}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 600, fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {course.title}
                </span>
                <span style={{ display: 'block', fontFamily: FIG, fontSize: 11.5, color: A.inkMuted, marginTop: 1, textTransform: 'capitalize' }}>
                  {[course.provider, labelize(course.category || '')].filter(Boolean).join(' · ')}
                </span>
              </span>
              {course.certificate_storage && (
                <span style={{ fontFamily: FIG, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.02em', padding: '2px 8px', border: `1px solid ${A.accent}`, color: A.accent, flexShrink: 0 }}>
                  Certificate
                </span>
              )}
              <span style={{ fontFamily: FIG, fontSize: 16, fontWeight: 800, width: 52, textAlign: 'right', flexShrink: 0, ...tabularNums }}>
                {course.hours}
                <span style={{ fontSize: 11, color: A.inkMuted, fontWeight: 600 }}> h</span>
              </span>
            </div>
          ))}
          {sortedCourses.length === 0 && (
            <div style={{ padding: '1.5rem 1.75rem', fontSize: 14, color: A.inkMuted }}>
              Nothing in the log yet.{' '}
              <Link to="/courses" style={{ color: A.accent, fontWeight: 700, textDecoration: 'none' }}>Log your first course →</Link>
            </div>
          )}
        </div>

        {/* Export strip */}
        <div style={{ borderTop: `1px solid ${A.ink}`, padding: '1rem 1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap', background: A.band }}>
          <span style={{ fontSize: 14, maxWidth: '34em', color: A.inkBody }}>
            <strong style={{ color: A.ink }}>The full binder, board-ready.</strong>
          </span>
          <span style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => generateReport(user, courses, false)}
              style={{ fontFamily: FIG, fontSize: 12, fontWeight: 700, letterSpacing: '0.02em', background: 'transparent', border: `1px solid ${A.ink}`, color: A.ink, padding: '10px 18px', cursor: 'pointer' }}
            >
              Export report
            </button>
            <button
              type="button"
              onClick={() => generateReport(user, courses, true)}
              style={{ fontFamily: FIG, fontSize: 12, fontWeight: 700, letterSpacing: '0.02em', background: A.accent, border: `1px solid ${A.accent}`, color: A.onAccent, padding: '10px 18px', cursor: 'pointer' }}
            >
              Certificates ZIP
            </button>
          </span>
        </div>
      </div>

      {/* Source footer */}
      <p style={{ fontFamily: FIG, fontSize: 11.5, color: A.inkMuted, margin: '1.25rem 0 0', letterSpacing: '0.04em' }}>
        Source: {requirements.citation || 'state board rules'}{requirements.lastReviewed ? ` · last reviewed ${requirements.lastReviewed}` : ''} ·{' '}
        <a href={requirements.boardUrl || '#'} target="_blank" rel="noopener noreferrer" style={{ color: A.accent, fontWeight: 700, textDecoration: 'none' }}>
          Read the rule ↗
        </a>
      </p>
    </div>
  );
}
