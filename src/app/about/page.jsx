// /about — Server Component (no client hooks needed).
//
// Layout: centered single-column editorial doc. About is short enough that
// a 1200px-wide layout creates an empty right gutter the content can't
// honestly fill. So we commit to a ~780px max-width and let the page
// breathe symmetrically. Plum: open ground under the world light, 6px
// panels with hairline borders, light display type, peach as the one voice.

import Link from 'next/link';
import PublicNav from '@/components/layout/PublicNav';
import PublicFooter from '@/components/layout/PublicFooter';
import { A, tabularNums, kicker, display, panel, kpi, LINE } from '@/components/atlas/theme';
import citationMeta from '@/data/citations_meta.json';
import siteStats from '@/data/siteStats.json';

export const metadata = {
  title: 'About',
  description:
    `CE Shield scores ${siteStats.certCount} rehab credentials against ${siteStats.citationTotal.toLocaleString()} curated citations and tracks CE compliance for physical and occupational therapists. Built by practicing PTs. No sponsorship.`,
  alternates: { canonical: '/about' },
  openGraph: { title: 'About CE Shield', url: '/about' },
};

const totalCitations = Object.values(citationMeta).reduce(
  (sum, e) => sum + (e?.count || 0), 0,
);
const totalCerts = Object.keys(citationMeta).length;

function AboutCard({ label, title, children }) {
  return (
    <section
      style={{
        ...panel,
        padding: '1.6rem 1.75rem 1.5rem',
        marginBottom: '0.875rem',
      }}
    >
      <div style={{ marginBottom: '0.875rem' }}>
        <div style={{ minWidth: 0 }}>
          {label && (
            <div style={{ ...kicker(), marginBottom: 10 }}>{label}</div>
          )}
          <h2 style={{ ...display('1.45rem', 400), lineHeight: 1.2 }}>
            {title}
          </h2>
        </div>
      </div>
      <div className="atlas-card-prose" style={{ color: A.inkBody, lineHeight: 1.75, fontSize: 15 }}>{children}</div>
    </section>
  );
}

// Tiny inline stat — three of these flow horizontally below the lead.
function HeroStat({ value, label }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: A.inkMuted, fontWeight: 400 }}>
        {label}
      </div>
      <div style={{ ...kpi(30), marginTop: 8, ...tabularNums }}>
        {value}
      </div>
    </div>
  );
}

const proseLink = { color: A.accent, textDecoration: 'underline', textDecorationColor: 'rgba(240,195,168,0.45)', textUnderlineOffset: 3 };
const footLink = { textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 500, padding: '10px 0' };

export default function AboutPage() {
  return (
    <div className="atlas-ground" style={{ minHeight: '100vh', color: A.ink }}>
      <PublicNav />

      <main id="main" className="atlas-wrap" style={{ maxWidth: 1280, margin: '0 auto', padding: '4.5rem 2rem 6rem' }}>
        <div style={{ maxWidth: 820 }}>
        <header className="plum-rise" style={{ marginBottom: '3rem' }}>
          <div style={{ ...kicker(), marginBottom: 18 }}>About CE Shield</div>
          <h1 style={display('clamp(2.3rem, 5.4vw, 4.2rem)', 350)}>
            Credential decisions, <em style={{ fontStyle: 'normal', color: A.accentMid }}>run on evidence.</em>
          </h1>
          <p style={{ marginTop: '1.5rem', color: A.inkBody, fontSize: 'clamp(15px, 1.25vw, 17.5px)', lineHeight: 1.75, maxWidth: '36em' }}>
            One product for compliance, credential intelligence, and career
            direction, built for physical and occupational therapists
            by physical therapists. Independent. No sponsorship. Free during
            beta.
          </p>

          {/* Inline 3-stat strip — flows below the lead in the same column. */}
          <div
            style={{
              marginTop: '2.25rem',
              paddingTop: '1.5rem',
              borderTop: `1px solid ${LINE}`,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '1rem',
            }}
          >
            <HeroStat value={totalCerts.toString()} label="Credentials scored" />
            <HeroStat value={String(siteStats.lensCount)} label="Career-path lenses" />
            <HeroStat value={totalCitations.toLocaleString()} label="Curated citations" />
          </div>
        </header>

        <AboutCard label="The problem" title="CE spending runs on marketing.">
          <p>
            Rehabilitation professionals spend thousands of dollars and hundreds
            of hours each renewal cycle on continuing education, and most of
            that spend is driven by marketing rather than evidence. Career
            decisions (which certification, which fellowship, which
            clinical doctorate) are made the same way, often with even
            less data.
          </p>
          <p>
            CE Shield is built on the premise that those decisions deserve the
            same rigor a clinician would apply to a treatment plan: published
            evidence, transparent methodology, and a plain accounting of
            trade-offs. The product has three pillars:{' '}
            <Link href="/career-paths" style={proseLink}>
              career-path intelligence
            </Link>,{' '}
            <Link href="/matrix" style={proseLink}>
              the ranked credential field
            </Link>, and a CE Ledger that tracks your hours against your
            state&rsquo;s rule.
          </p>
        </AboutCard>

        <AboutCard label="Authors" title="Who built it">
          <p>
            CE Shield is built by <strong>physical therapists</strong> who
            treat patients and have lived the credential-decision problem
            firsthand. Clinical scoring is informed by practicing-clinician
            experience; the business analysis (reimbursement, market demand)
            draws on healthcare-administration backgrounds. The evidence
            library is curated in collaboration with research librarians.
          </p>
        </AboutCard>

        <AboutCard label="Independence" title="How we make money, and how we don't">
          <p>
            <strong style={{ color: A.ink, fontWeight: 600 }}>Credential scores are not for sale.</strong>{' '}
            We take no money from certification programs, training vendors, or
            sponsors for rankings, and we don&rsquo;t run display ads. The
            entire product is free during beta.
          </p>
          <p>
            Here&rsquo;s the model we&rsquo;re building toward, stated up front
            so you can hold us to it:
          </p>
          <ul className="cs-bullet-list" style={{ margin: '0 0 0.9rem' }}>
            <li style={{ marginBottom: 6 }}>
              <strong>Premium tracking</strong> · a paid tier for
              compliance tracking and the document vault, priced under the
              incumbents.
            </li>
            <li style={{ marginBottom: 6 }}>
              <strong>Disclosed course referrals</strong> · when we link
              to CE courses that satisfy your state&rsquo;s requirements, some
              links may earn us a referral fee. Those links will always be
              labeled, and they will never appear on, or influence,
              credential scores.
            </li>
            <li style={{ marginBottom: 6 }}>
              <strong>Team plans</strong> · compliance dashboards for
              clinics and departments.
            </li>
          </ul>
          <p>
            <strong>Free for students, always.</strong>{' '}If you&rsquo;re in a
            DPT, OTD, or related program, CE Shield&rsquo;s career-path
            intelligence is free for you, not just during beta.
          </p>
        </AboutCard>

        <AboutCard label="Feedback" title="Get in touch">
          <p>
            Found an error, disagree with a score, or have a certification we
            should add? Scores are revised as the evidence changes, and each
            dossier shows its last review. Email{' '}
            <a href="mailto:hello@ceshield.com" style={proseLink}>
              hello@ceshield.com
            </a>.
          </p>
        </AboutCard>

        {/* Cross-link footer row — site navigation belongs at the foot
            of a doc, not in a side rail. */}
        <div
          style={{
            marginTop: '2.5rem',
            paddingTop: '1.5rem',
            borderTop: `1px solid ${LINE}`,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem 1.5rem',
            fontSize: '0.88rem',
          }}
        >
          <Link href="/career-paths" className="atlas-link" style={footLink}>Five career lenses →</Link>
          <Link href="/credentials" className="atlas-link" style={footLink}>Dossier library →</Link>
          <Link href="/methodology" className="atlas-link" style={footLink}>Methodology →</Link>
          <Link href="/states" className="atlas-link" style={footLink}>State CE requirements →</Link>
        </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
