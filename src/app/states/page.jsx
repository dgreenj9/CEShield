// /states — index of all (state, license) landing pages. Helps with
// internal linking and gives Google a single page that links to all the
// per-state SSG pages. Also useful as a public directory.

import Link from 'next/link';
import PublicNav from '@/components/layout/PublicNav';
import PublicFooter from '@/components/layout/PublicFooter';
import { allStateLicenseEntries } from '@/data/stateRules';
import { A, INS, tabularNums } from '@/components/atlas/theme';

const mandatoryLabel = (n) => (n === 0 ? 'None' : `${n} ${n === 1 ? 'category' : 'categories'}`);

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

      <main id="main" className="atlas-wrap" style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 2rem 6rem', lineHeight: 1.65 }}>
        <div style={{ maxWidth: 960 }}>
          <header style={{ marginBottom: '2.25rem' }}>
            <h1
              className="cs-h1-clamp"
              style={{ fontFamily: INS, fontSize: 40, fontWeight: 600, margin: 0, letterSpacing: '-0.025em', lineHeight: 1.05 }}
            >
              CE requirements by state
            </h1>
            <p style={{ marginTop: '0.75rem', marginBottom: 0, color: A.inkBody, fontSize: 16.5, maxWidth: '38em' }}>
              Continuing-education rules for physical and occupational therapists,
              per state. Verified states are checked against the board rule and
              cited. Draft states are a first pass: confirm against the citation
              before you rely on them.
            </p>
          </header>

          <div className="atlas-state-table">
            <div className="atlas-state-row atlas-state-head" aria-hidden="true">
              <span style={{ gridArea: 'state' }}>State</span>
              <span style={{ gridArea: 'lic' }}>License</span>
              <span style={{ gridArea: 'hours', textAlign: 'right' }}>Hours</span>
              <span style={{ gridArea: 'cycle', textAlign: 'right' }}>Cycle</span>
              <span style={{ gridArea: 'mand' }}>Mandatory</span>
              <span style={{ gridArea: 'status' }}>Status</span>
            </div>
            {Object.entries(byState).map(([stateCode, items]) => (
              <div key={stateCode} className="atlas-state-group">
                {items.map((e, i) => {
                  const mandatory = Object.values(e.rules.mandatory || {}).filter((v) => v > 0).length;
                  const licenseLong = e.licenseType === 'PT' ? 'Physical therapy' : 'Occupational therapy';
                  const draft = e.rules.verified === false;
                  return (
                    <Link
                      key={e.slug}
                      href={`/states/${e.slug}`}
                      className="atlas-state-row atlas-row"
                      aria-label={`${e.rules.jurisdictionName} ${licenseLong}: ${e.rules.totalHours} hours every ${e.rules.cycleYears} years, ${mandatoryLabel(mandatory)}${draft ? ', draft' : ', verified'}`}
                    >
                      <span style={{ gridArea: 'state', fontFamily: INS, fontWeight: 600, fontSize: 17, letterSpacing: '-0.02em', color: A.ink }}>
                        <span className={i > 0 ? 'atlas-state-repeat' : undefined}>{e.rules.jurisdictionName}</span>
                      </span>
                      <span style={{ gridArea: 'lic', fontSize: 14.5, color: A.ink, fontWeight: 500 }}>
                        {licenseLong}
                      </span>
                      <span style={{ gridArea: 'hours', textAlign: 'right', fontWeight: 700, fontSize: 17, color: A.accent, ...tabularNums }}>
                        {e.rules.totalHours}<span style={{ fontSize: 12, color: A.inkMuted, fontWeight: 600 }}> h</span>
                      </span>
                      <span style={{ gridArea: 'cycle', textAlign: 'right', fontSize: 14, color: A.inkBody, ...tabularNums }}>
                        {e.rules.cycleYears} yr
                      </span>
                      <span style={{ gridArea: 'mand', fontSize: 14, color: A.inkBody, ...tabularNums }}>
                        {mandatoryLabel(mandatory)}
                      </span>
                      <span style={{ gridArea: 'status', fontSize: 12.5, fontWeight: 700, letterSpacing: '0.02em', color: draft ? A.warn : A.accent, whiteSpace: 'nowrap' }}>
                        {draft ? 'Draft · verify' : '✓ Verified'}
                      </span>
                      <span aria-hidden="true" style={{ gridArea: 'go', color: A.accent, fontWeight: 700, textAlign: 'right' }}>→</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          <section
            style={{
              marginTop: '2.5rem', padding: '1.1rem 1.5rem',
              border: `1px dashed ${A.ink}`, background: A.notice,
            }}
          >
            <p style={{ color: A.inkBody, fontSize: 14.5, margin: 0 }}>
              Don&rsquo;t see your state?{' '}
              <a href="mailto:hello@ceshield.com" className="atlas-link" style={{ fontWeight: 700, textDecoration: 'none', borderBottom: `2px solid ${A.accent}` }}>
                Email us
              </a>{' '}
              and it goes on the coverage list.
            </p>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
