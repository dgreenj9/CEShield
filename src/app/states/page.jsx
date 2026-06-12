// /states — index of all (state, license) landing pages. Helps with
// internal linking and gives Google a single page that links to all the
// per-state SSG pages. Also useful as a public directory.

import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { colors } from '@/utils/constants';
import PublicNav from '@/components/layout/PublicNav';
import { allStateLicenseEntries } from '@/data/stateRules';

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
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAFAF6',
        backgroundImage: 'radial-gradient(circle, rgba(15, 23, 42, 0.05) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        color: colors.textDark,
      }}
    >
      <PublicNav />

      <main style={{
        maxWidth: 860, margin: '0 auto', padding: '3rem 2rem 6rem', lineHeight: 1.65,
      }}>
        <header style={{ marginBottom: '2.5rem' }}>
          <div
            className="font-mono"
            style={{
              fontSize: '0.7rem', color: colors.textGray,
              letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6,
            }}
          >
            <MapPin size={11} style={{ display: 'inline', marginRight: 4 }} aria-hidden="true" />
            CE requirements directory
          </div>
          <h1 style={{
            fontSize: '2.4rem', fontWeight: 600, color: colors.textDark, margin: 0,
            letterSpacing: '-0.02em', lineHeight: 1.1,
          }}>
            CE requirements by state
          </h1>
          <p style={{ marginTop: '0.75rem', color: colors.slateMedium, fontSize: '1.05rem' }}>
            Continuing-education rules for physical and occupational therapists,
            broken out per state. Coverage is growing &mdash; verified states are
            ready to rely on; draft states are first-pass and require your
            verification before renewal.
          </p>
        </header>

        {Object.entries(byState).map(([stateCode, items]) => {
          const stateName = items[0].rules.jurisdictionName;
          return (
            <section key={stateCode} style={{ marginBottom: '2rem' }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="eyebrow">{stateName}</span>
                <hr className="section-rule flex-1 m-0" />
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '0.75rem',
              }}>
                {items.map((e) => (
                  <Link
                    key={e.slug}
                    href={`/states/${e.slug}`}
                    style={{
                      display: 'block', padding: '1.25rem',
                      background: 'white',
                      border: `1px solid ${colors.slateLight}`,
                      borderRadius: 12, textDecoration: 'none', color: 'inherit',
                    }}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                    }}>
                      <div style={{ fontWeight: 600, fontSize: '1.05rem', color: colors.textDark }}>
                        {e.licenseType === 'PT' ? 'Physical Therapy' : 'Occupational Therapy'}
                      </div>
                      <div className="font-mono tabular-nums" style={{
                        fontSize: '1.1rem', fontWeight: 600, color: colors.primaryBlue,
                      }}>
                        {e.rules.totalHours}h
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: colors.textGray, marginTop: 4 }}>
                      every {e.rules.cycleYears} years · {Object.keys(e.rules.mandatory || {}).filter((k) => e.rules.mandatory[k] > 0).length} mandatory categories
                    </div>
                    <div style={{
                      marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: '0.78rem', color: colors.primaryBlue, fontWeight: 500,
                    }}>
                      View requirements <ArrowRight size={13} aria-hidden="true" />
                    </div>
                    {e.rules.verified === false && (
                      <div className="font-mono" style={{
                        marginTop: 6, fontSize: '0.6rem',
                        color: '#92400e', letterSpacing: '0.05em',
                      }}>
                        DRAFT — VERIFY BEFORE USE
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        <section
          style={{
            marginTop: '3rem', padding: '1.5rem',
            background: 'white', border: `1px solid ${colors.slateLight}`,
            borderRadius: 12, textAlign: 'center',
          }}
        >
          <p style={{ color: colors.textGray, fontSize: '0.95rem', margin: 0 }}>
            Don&rsquo;t see your state?{' '}
            <a href="mailto:hello@ceshield.com" style={{ color: colors.primaryBlue, textDecoration: 'underline' }}>
              Email us
            </a>{' '}
            &mdash; we&rsquo;re adding states monthly.
          </p>
        </section>
      </main>
    </div>
  );
}
