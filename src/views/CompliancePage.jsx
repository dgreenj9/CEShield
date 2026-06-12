import React, { useMemo, useCallback } from 'react';
import {
  AlertCircle, CheckCircle, Clock, Download, Info, Shield,
} from 'lucide-react';
import { colors } from '../utils/constants';
import { useUserData } from '../contexts/UserDataContext';
import { getRequirements, calculateHours } from '../utils/calculations';
import { generateReport } from '../utils/reportGenerator';
import { Link } from '../router';
import { PageHeader, Card, Button, EmptyState } from '../components/ui';
import CourseRecommendations from '../components/dashboard/CourseRecommendations';

const checkLimit = (requirements, category, currentHours) => {
  if (!requirements?.limits?.[category]) return 'ok';
  const limit = requirements.limits[category];
  if (currentHours >= limit) return 'exceeded';
  if (currentHours >= limit * 0.8) return 'warning';
  return 'ok';
};

export default function CompliancePage() {
  const { user, courses } = useUserData();
  const requirements = useMemo(
    () => getRequirements(user.state, user.licenseType),
    [user.state, user.licenseType],
  );
  const hours = useMemo(() => calculateHours(courses), [courses]);

  const getDaysUntilRenewal = useCallback(() => {
    if (!user.renewalDate) return null;
    const renewal = new Date(user.renewalDate);
    const today = new Date();
    return Math.ceil((renewal - today) / (1000 * 60 * 60 * 24));
  }, [user.renewalDate]);

  const daysUntilRenewal = getDaysUntilRenewal();
  const totalPct = requirements && requirements.total > 0
    ? Math.min((hours.total / requirements.total) * 100, 100)
    : 0;

  // Mandatory categories the user hasn't finished — drives the course
  // recommendations below the requirements cards. Empty catalog or no gaps
  // → the section renders nothing.
  const unmetCategories = useMemo(() => {
    if (!requirements) return [];
    return Object.entries(requirements.mandatory || {})
      .filter(([key, required]) => required > 0 && (hours[key] || 0) < required)
      .map(([key]) => key);
  }, [requirements, hours]);

  if (!requirements) {
    return (
      <div>
        <PageHeader icon={Shield} title="Compliance" />
        <EmptyState
          icon={Shield}
          title="Your state isn't in our rules library yet"
          description="Pick a state we cover (Illinois, Wisconsin, or North Carolina) in Profile to see your CE requirements."
          action={<Link to="/profile" className="text-brand-blue underline">Choose a state →</Link>}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        icon={Shield}
        title="Compliance"
        subtitle={
          <>
            {requirements.jurisdictionName} {user.licenseType} &middot;{' '}
            {requirements.total} hours per {requirements.cycleYears}-year cycle.
            {daysUntilRenewal !== null && (
              <strong
                className={daysUntilRenewal < 90 ? 'text-red-600 ml-1' : 'text-slate-medium ml-1'}
              >
                {daysUntilRenewal} days until renewal.
              </strong>
            )}
          </>
        }
      />

      {/* Unverified-state banner */}
      {requirements.verified === false && (
        <div
          role="alert"
          className="mb-5 px-4 py-3 rounded-md border text-sm"
          style={{ background: '#fef3c7', borderColor: '#fbbf24', color: '#92400e' }}
        >
          <strong>Beta state ({requirements.jurisdictionName}):</strong>{' '}
          CE rules are unverified. Confirm against{' '}
          <a
            href={requirements.boardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: '#92400e' }}
          >
            {requirements.citation}
          </a>{' '}
          before relying on totals.
        </div>
      )}

      {/* First-renewal exemption */}
      {user.isFirstRenewal && (
        <div className="mb-5 px-4 py-3 rounded-md border flex items-center gap-2 text-sm"
             style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }}>
          <CheckCircle size={18} aria-hidden="true" />
          First renewal &mdash; no CE requirements needed for this cycle.
        </div>
      )}

      {/* IL cultural competency banner */}
      {user.state === 'IL' && !user.isFirstRenewal && hours.culturalCompetency === 0 && (
        <div className="mb-5 px-4 py-3 rounded-md border flex items-start gap-2 text-sm"
             style={{ background: colors.lightBlue, borderColor: `${colors.primaryBlue}33` }}>
          <Info size={18} aria-hidden="true" className="text-brand-blue mt-0.5 flex-shrink-0" />
          <div className="text-ink-dark">
            <div className="font-semibold mb-0.5">New 2025 Illinois requirement</div>
            Cultural competency training (1 hour) is now required. You have 3 renewal
            cycles to complete it, but you can start now.
          </div>
        </div>
      )}

      {/* Stat strip — refined: index numerals, mono values, eyebrow labels */}
      <div className="grid gap-3 mb-6"
           style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        {[
          { label: 'Hours completed', value: hours.total, tone: 'brand' },
          { label: 'Hours required', value: requirements.total, tone: 'neutral' },
          { label: 'Hours remaining', value: Math.max(0, requirements.total - hours.total), tone: 'neutral' },
          { label: 'Courses logged', value: courses.length, tone: 'neutral' },
        ].map((s, i) => (
          <Card key={s.label} padding="sm" className="relative overflow-hidden">
            {i === 0 && (
              <div
                aria-hidden="true"
                className="absolute top-0 left-0 right-0"
                style={{ height: 2, background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)' }}
              />
            )}
            <div
              className="font-display tabular-nums leading-none"
              style={{
                fontSize: '2rem',
                fontWeight: 500,
                color: s.tone === 'brand' ? colors.primaryBlue : colors.textDark,
                letterSpacing: '-0.02em',
              }}
            >
              {s.value}
            </div>
            <div className="text-2xs text-ink-gray mt-1.5 uppercase tracking-wider font-semibold">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Progress — refined with eyebrow + percent tracking */}
      <Card className="mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base font-semibold text-ink-dark m-0">Overall progress</h2>
          <div className="flex items-baseline gap-2">
            <span className="font-mono tabular-nums text-sm text-ink-gray">{Math.round(totalPct)}%</span>
            <span className="font-mono tabular-nums text-sm font-semibold text-brand-blue">
              {hours.total} / {requirements.total}
            </span>
            <span className="text-2xs text-ink-gray">hours</span>
          </div>
        </div>
        <div
          role="progressbar"
          aria-valuenow={Math.round(totalPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ height: 8, background: colors.slateLight, borderRadius: 999, overflow: 'hidden', position: 'relative' }}
        >
          <div
            style={{
              height: '100%',
              width: `${totalPct}%`,
              background: totalPct >= 100
                ? 'linear-gradient(90deg, #2F6B4D 0%, #1F4D38 100%)'
                : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
              transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              borderRadius: 999,
            }}
          />
        </div>
      </Card>

      {/* Mandatory + Limits side-by-side */}
      <div className="grid gap-4 mb-6"
           style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <Card>
          <h2 className="text-base font-semibold text-ink-dark m-0 mb-3">Mandatory requirements</h2>
          <div className="flex flex-col gap-2">
            {Object.entries(requirements.mandatory || {}).map(([key, required]) => {
              if (required === 0) return null;
              const completed = hours[key] || 0;
              const isComplete = completed >= required;
              const isNew2025 = key === 'culturalCompetency';
              return (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                    {isNew2025 && (
                      <span className="ml-1.5 text-2xs text-brand-blue">(NEW 2025)</span>
                    )}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className={`font-mono tabular-nums font-semibold ${isComplete ? 'text-green-600' : 'text-red-600'}`}>
                      {completed}/{required}
                    </span>
                    {isComplete ? (
                      <CheckCircle size={16} className="text-green-600" aria-label="Complete" />
                    ) : (
                      <AlertCircle size={16} className="text-red-600" aria-label="Incomplete" />
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          <CourseRecommendations
            state={user.state}
            licenseType={user.licenseType}
            neededCategories={unmetCategories}
          />
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-ink-dark m-0 mb-3">Category limits</h2>
          <div className="grid gap-2"
               style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
            {Object.entries(requirements.limits || {}).map(([category, limit]) => {
              const current = hours[category] || 0;
              const status = checkLimit(requirements, category, current);
              const cls =
                status === 'exceeded' ? 'text-red-600'
                  : status === 'warning' ? 'text-amber-600'
                  : 'text-ink-dark';
              return (
                <div key={category} className="text-center py-2 px-1 rounded-md bg-gray-bg">
                  <div className="text-2xs text-ink-gray capitalize">
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className={`font-mono tabular-nums text-lg font-semibold ${cls}`}>
                    {current}/{limit}
                  </div>
                  {status === 'exceeded' && (
                    <div className="text-2xs text-red-600">Over limit</div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Reports */}
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-semibold text-ink-dark m-0">Audit-ready exports</h2>
            <p className="text-sm text-ink-gray m-0 mt-1">
              Renewal-ready report (printable HTML) or a ZIP of every uploaded certificate.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => generateReport(user, courses, false)}>
              <Download size={16} aria-hidden="true" /> HTML report
            </Button>
            <Button onClick={() => generateReport(user, courses, true)}>
              <Download size={16} aria-hidden="true" /> Certificates ZIP
            </Button>
          </div>
        </div>
      </Card>

      <p className="mt-6 text-center text-sm text-ink-gray">
        Need to add or edit a CE course?{' '}
        <Link to="/courses" className="text-brand-blue underline">
          Go to Courses &rarr;
        </Link>
      </p>
      {daysUntilRenewal !== null && daysUntilRenewal < 90 && (
        <p className="mt-2 text-center text-sm text-red-600 flex items-center justify-center gap-1">
          <Clock size={14} aria-hidden="true" /> Renewal in under 90 days.
        </p>
      )}
    </div>
  );
}
