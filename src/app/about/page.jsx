// /about — Server Component (no client hooks needed).
//
// Layout: centered single-column editorial doc. About is short enough that
// a 1200px-wide layout creates an empty right gutter the content can't
// honestly fill. So we commit to a ~780px max-width and let the page
// breathe symmetrically. Atlas: paper ground, 1px ink rules, petrol accent.

import Link from 'next/link';
import { Shield, FileText, Mail, Compass } from 'lucide-react';
import PublicNav from '@/components/layout/PublicNav';
import { A, INS, eyebrow, tabularNums } from '@/components/atlas/theme';
import citationMeta from '@/data/citations_meta.json';

export const metadata = {
  title: 'About',
  description:
    'CE Shield scores 143 rehab credentials against 8,609 curated citations and tracks CE compliance for physical and occupational therapists. Built by practicing PTs. No sponsorship.',
  alternates: { canonical: '/about' },
  openGraph: { title: 'About CE Shield', url: '/about' },
};

const totalCitations = Object.values(citationMeta).reduce(
  (sum, e) => sum + (e?.count || 0), 0,
);
const totalCerts = Object.keys(citationMeta).length;

function AboutCard({ icon: Icon, label, title, children }) {
  return (
    <section
      style={{
        padding: '1.5rem 1.5rem 1.25rem',
        background: A.paper,
        border: `1px solid ${A.ink}`,
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '0.875rem' }}>
        {Icon ? <Icon size={20} aria-hidden="true" style={{ color: A.accent, flexShrink: 0, marginTop: 2 }} /> : null}
        <div style={{ minWidth: 0 }}>
          {label && (
            <div style={{ ...eyebrow(12), marginBottom: 4 }}>{label}</div>
          )}
          <h2 style={{ fontFamily: INS, fontSize: '1.15rem', fontWeight: 600, margin: 0, color: A.ink, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            {title}
          </h2>
        </div>
      </div>
      <div style={{ color: A.inkBody, lineHeight: 1.65 }}>{children}</div>
    </section>
  );
}

// Tiny inline stat — three of these flow horizontally below the lead.
function HeroStat({ value, label }) {
  return (
    <div>
      <div
        style={{
          fontFamily: INS,
          fontSize: '1.4rem',
          fontWeight: 600,
          color: A.ink,
          lineHeight: 1,
          letterSpacing: '-0.03em',
          ...tabularNums,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: '0.8rem', color: A.inkMuted, marginTop: 4, fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );
}

const proseLink = { color: A.accent, textDecoration: 'underline', textUnderlineOffset: 2 };
const footLink = { color: A.accent, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600 };

export default function AboutPage() {
  return (
    <div className="atlas-ground" style={{ minHeight: '100vh', color: A.ink }}>
      <PublicNav />

      <main className="cs-page-pad" style={{ maxWidth: 780, margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>
        <header style={{ marginBottom: '2rem' }}>
          <div style={{ ...eyebrow(), marginBottom: 12 }}>About CE Shield</div>
          <h1 className="cs-h1-clamp" style={{
            fontFamily: INS, fontSize: '2.5rem', fontWeight: 600, margin: 0, letterSpacing: '-0.03em', lineHeight: 1.05, color: A.ink,
          }}>
            Credential decisions, run on evidence.
          </h1>
          <p style={{ marginTop: '1rem', color: A.inkBody, fontSize: '1.08rem', lineHeight: 1.6 }}>
            One product for compliance, credential intelligence, and career
            direction, built for physical and occupational therapists
            by physical therapists. Independent. No sponsorship. Free during
            beta.
          </p>

          {/* Inline 3-stat strip — flows below the lead in the same column. */}
          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: `1px solid ${A.ink}`,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '1rem',
            }}
          >
            <HeroStat value={totalCerts.toString()} label="Credentials scored" />
            <HeroStat value="5" label="Career-path lenses" />
            <HeroStat value={totalCitations.toLocaleString()} label="Curated citations" />
          </div>
        </header>

        <AboutCard icon={Shield} label="The problem" title="CE spending runs on marketing.">
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

        <AboutCard icon={FileText} label="Authors" title="Who built it">
          <p>
            CE Shield is built by <strong>physical therapists</strong> who
            treat patients and have lived the credential-decision problem
            firsthand. Clinical scoring is informed by practicing-clinician
            experience; the business analysis (reimbursement, market demand)
            draws on healthcare-administration backgrounds. The evidence
            library is curated in collaboration with research librarians.
          </p>
        </AboutCard>

        <AboutCard icon={Shield} label="Independence" title="How we make money, and how we don't">
          <p>
            <strong style={{ color: A.accent }}>Credential scores are not for sale.</strong>{' '}
            We take no money from certification programs, training vendors, or
            sponsors for rankings, and we don&rsquo;t run display ads. The
            entire product is free during beta.
          </p>
          <p>
            Here&rsquo;s the model we&rsquo;re building toward, stated up front
            so you can hold us to it:
          </p>
          <ul style={{ paddingLeft: '1.25rem', margin: '0.5rem 0' }}>
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
            <strong>Free for students, always.</strong> If you&rsquo;re in a
            DPT, OTD, or related program, CE Shield&rsquo;s career-path
            intelligence is free for you, not just during beta.
          </p>
        </AboutCard>

        <AboutCard icon={Mail} label="Feedback" title="Get in touch">
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
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: `1px solid ${A.ink}`,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem 1.5rem',
            fontSize: '0.88rem',
          }}
        >
          <Link href="/career-paths" style={footLink}>
            <Compass size={14} aria-hidden="true" /> Five career paths
          </Link>
          <Link href="/credentials" style={footLink}>
            <Shield size={14} aria-hidden="true" /> Credential library
          </Link>
          <Link href="/methodology" style={footLink}>
            <FileText size={14} aria-hidden="true" /> Methodology
          </Link>
          <Link href="/states" style={footLink}>
            <Shield size={14} aria-hidden="true" /> State CE requirements
          </Link>
        </div>
      </main>
    </div>
  );
}
