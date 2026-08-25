// /states — index of all (state, license) landing pages. Helps with
// internal linking and gives Google a single page that links to all the
// per-state SSG pages. Also useful as a public directory.

import Link from 'next/link';
import PublicNav from '@/components/layout/PublicNav';
import { allStateLicenseEntries } from '@/data/stateRules';
import { A, FIG, INS, tabularNums } from '@/components/atlas/theme';

export const metadata = {
  title: 'CE requirements by state',
  description:
    'Continuing-education requirements for PT and OT licensees, by state. Coverage so far: Illinois (verified), Wisconsin (draft), North Carolina (draft).',
  alternates: { canonical: '/states' },
};

export default function StatesIndex() {
  const entries = allStateLicenseEntries();

  // Group by state for the listing.
  const byState = {};
  for (const e of entries) {
    if (!byState[e.state]) byState[e.state] = [];
    byState[e.state].push(e);
  }

  return (
    <div className="atlas-ground" style={{ minHeight: '100vh', color: A.ink }}>
      <PublicNav />

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '3rem 2rem 6rem', lineHeight: 1.65 }}>
        <header style={{ marginBottom: '2.5rem' }}>
          <h1
            className="cs-h1-clamp"
            style={{ fontFamily: INS, fontSize: 40, fontWeight: 600, margin: 0, letterSpacing: '-0.025em', lineHeight: 1.05 }}
          >
            CE requirements by state
          </h1>
          <p style={{ marginTop: '0.75rem', color: A.inkBody, fontSize: 16.5, maxWidth: '38em' }}>
            Continuing-education rules for physical and occupational therapists,
            broken out per state. Verified states are checked against the board
            rule and cited. Draft states are first-pass: confirm against the
            citation before you rely on them.
          </p>
        </header>

        {Object.entries(byState).map(([stateCode, items]) => {
          const stateName = items[0].rules.jurisdictionName;
          return (
            <section key={stateCode} style={{ marginBottom: '2.5rem' }}>
              <div
                style={{
                  fontFamily: FIG, fontSize: 12.5, fontWeight: 700, color: A.inkMuted,
                  letterSpacing: '0.02em', borderTop: `2px solid ${A.ink}`, paddingTop: 10, marginBottom: 14,
                }}
              >
                {stateName}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                {items.map((e) => (
                  <Link
                    key={e.slug}
                    href={`/states/${e.slug}`}
                    className="card-hover"
                    style={{
                      display: 'block', padding: '1.25rem',
                      background: A.paper,
                      border: `1px solid ${A.ink}`,
                      textDecoration: 'none', color: 'inherit',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ fontFamily: INS, fontWeight: 600, fontSize: 17, letterSpacing: '-0.02em', color: A.ink }}>
                        {e.licenseType === 'PT' ? 'Physical Therapy' : 'Occupational Therapy'}
                      </div>
                      <div style={{ fontFamily: FIG, fontSize: 18, fontWeight: 700, color: A.accent, ...tabularNums }}>
                        {e.rules.totalHours}h
                      </div>
                    </div>
                    <div style={{ fontFamily: FIG, fontSize: 13, color: A.inkMuted, marginTop: 4 }}>
                      every {e.rules.cycleYears} years · {Object.keys(e.rules.mandatory || {}).filter((k) => e.rules.mandatory[k] > 0).length} mandatory categories
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: FIG, fontSize: 12.5, color: A.accent, fontWeight: 700 }}>
                        View requirements →
                      </span>
                      {e.rules.verified === false && (
                        <span style={{ fontFamily: FIG, fontSize: 11, fontWeight: 700, color: A.warn, letterSpacing: '0.02em' }}>
                          Draft · verify before use
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        <section
          style={{
            marginTop: '3rem', padding: '1.25rem 1.5rem',
            border: `1px dashed ${A.ink}`, background: A.notice, textAlign: 'center',
          }}
        >
          <p style={{ color: A.inkBody, fontSize: 14.5, margin: 0 }}>
            Don&rsquo;t see your state?{' '}
            <a href="mailto:hello@ceshield.com" style={{ color: A.accent, fontWeight: 700, textDecoration: 'none' }}>
              Email us
            </a>{' '}
            and it goes on the coverage list.
          </p>
        </section>
      </main>
    </div>
  );
}
