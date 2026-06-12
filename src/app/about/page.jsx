// /about — Server Component (no client hooks needed).
//
// Layout: centered single-column editorial doc. About is short enough that
// a 1200px-wide layout creates an empty right gutter the content can't
// honestly fill. So we commit to a 760-880px max-width and let the page
// breathe symmetrically.

import Link from 'next/link';
import { Shield, FileText, Mail, Compass } from 'lucide-react';
import { colors } from '@/utils/constants';
import PublicNav from '@/components/layout/PublicNav';
import citationMeta from '@/data/citations_meta.json';

export const metadata = {
  title: 'About',
  description:
    'CE Shield is the Rehab Career OS — career intelligence, an evidence-backed certifications matrix, and CE compliance for physical and occupational therapists. Built by practicing PTs.',
  alternates: { canonical: '/about' },
  openGraph: { title: 'About CE Shield', url: '/about' },
};

const totalCitations = Object.values(citationMeta).reduce(
  (sum, e) => sum + (e?.count || 0), 0,
);
const totalCerts = Object.keys(citationMeta).length;

function AboutCard({ icon: Icon, eyebrow, title, children }) {
  return (
    <section
      style={{
        padding: '1.5rem 1.5rem 1.25rem',
        background: 'white',
        border: `1px solid ${colors.slateLight}`,
        borderRadius: 12,
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '0.875rem' }}>
        {Icon ? (
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: colors.lightBlue, color: colors.primaryBlue,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={18} />
          </div>
        ) : null}
        <div style={{ minWidth: 0 }}>
          {eyebrow && (
            <div
              className="font-mono"
              style={{
                fontSize: '0.66rem',
                color: colors.textGray,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              {eyebrow}
            </div>
          )}
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: colors.textDark, letterSpacing: '-0.005em', lineHeight: 1.25 }}>
            {title}
          </h2>
        </div>
      </div>
      <div style={{ color: colors.slateMedium, lineHeight: 1.65 }}>{children}</div>
    </section>
  );
}

// Tiny inline stat — three of these flow horizontally below the lead.
// Doesn't need its own panel; the data lives in the body's natural rhythm.
function HeroStat({ value, label }) {
  return (
    <div>
      <div
        className="font-mono tabular-nums"
        style={{
          fontSize: '1.3rem',
          fontWeight: 600,
          color: colors.textDark,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: '0.74rem', color: colors.textGray, marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

export default function AboutPage() {
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
      <PublicNav currentPath="/about" />

      <main className="cs-page-pad" style={{ maxWidth: 780, margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>
        <header style={{ marginBottom: '2rem' }}>
          <div
            className="font-mono"
            style={{
              fontSize: '0.72rem',
              color: colors.primaryPurple,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            About CE Shield
          </div>
          <h1 className="cs-h1-clamp" style={{
            fontSize: '2.25rem', fontWeight: 600, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.15,
          }}>
            The Rehab Career OS.
          </h1>
          <p style={{ marginTop: '1rem', color: colors.slateMedium, fontSize: '1.08rem' }}>
            One product for compliance, credential intelligence, and career
            direction &mdash; built for physical and occupational therapists
            by physical therapists. Independent. No sponsorship. Free during
            beta.
          </p>

          {/* Inline 3-stat strip — flows below the lead in the same column,
              no separate right panel competing for attention. */}
          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: `1px solid ${colors.slateLight}`,
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

        <AboutCard icon={Shield} eyebrow="The problem" title="The problem we're solving">
          <p>
            Rehabilitation professionals spend thousands of dollars and hundreds
            of hours each renewal cycle on continuing education, and most of
            that spend is driven by marketing rather than evidence. Career
            decisions &mdash; which certification, which fellowship, which
            clinical doctorate &mdash; are made the same way, often with even
            less data.
          </p>
          <p>
            CE Shield is built on the premise that those decisions deserve the
            same rigor a clinician would apply to a treatment plan: published
            evidence, transparent methodology, and an honest accounting of
            trade-offs. The product has three pillars &mdash;{' '}
            <Link href="/career-paths" style={{ color: colors.primaryBlue, textDecoration: 'underline' }}>
              career-path intelligence
            </Link>,{' '}
            <Link href="/methodology" style={{ color: colors.primaryBlue, textDecoration: 'underline' }}>
              an evidence-backed certifications matrix
            </Link>, and a CE compliance tracker that keeps you licensed while
            you specialize.
          </p>
        </AboutCard>

        <AboutCard icon={FileText} eyebrow="Authors" title="Who built it">
          <p>
            CE Shield is built by <strong>physical therapists</strong> who
            treat patients and have lived the credential-decision problem
            firsthand. Clinical scoring is informed by practicing-clinician
            experience; the business analysis (reimbursement, market demand)
            draws on healthcare-administration backgrounds. The evidence
            library is curated in collaboration with research librarians.
          </p>
        </AboutCard>

        <AboutCard icon={Shield} eyebrow="Independence" title="How we make money — and how we don't">
          <p>
            <strong>Credential scores are not for sale — full stop.</strong>{' '}
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
              <strong>Premium tracking</strong> &mdash; a paid tier for
              compliance tracking and the document vault, priced under the
              incumbents.
            </li>
            <li style={{ marginBottom: 6 }}>
              <strong>Disclosed course referrals</strong> &mdash; when we link
              to CE courses that satisfy your state&rsquo;s requirements, some
              links may earn us a referral fee. Those links will always be
              labeled, and they will never appear on &mdash; or influence
              &mdash; credential scores.
            </li>
            <li style={{ marginBottom: 6 }}>
              <strong>Team plans</strong> &mdash; compliance dashboards for
              clinics and departments.
            </li>
          </ul>
          <p>
            <strong>Free for students, always.</strong> If you&rsquo;re in a
            DPT, OTD, or related program, CE Shield&rsquo;s career-path
            intelligence is free for you &mdash; not just during beta.
          </p>
        </AboutCard>

        <AboutCard icon={Mail} eyebrow="Feedback" title="Get in touch">
          <p>
            Found an error, disagree with a score, or have a certification you
            think we should add? We treat the matrix as a living document and
            re-publish on every revision. Reach out through the contact form
            once you&rsquo;re signed in, or email{' '}
            <a
              href="mailto:hello@ceshield.com"
              style={{ color: colors.primaryBlue, textDecoration: 'underline' }}
            >
              hello@ceshield.com
            </a>.
          </p>
        </AboutCard>

        {/* Cross-link footer pill row — site navigation belongs at the foot
            of a doc, not in a side rail. */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: `1px solid ${colors.slateLight}`,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem 1.5rem',
            fontSize: '0.88rem',
          }}
        >
          <Link href="/career-paths" style={{ color: colors.primaryBlue, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Compass size={14} aria-hidden="true" /> Five career paths
          </Link>
          <Link href="/credentials" style={{ color: colors.primaryBlue, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Shield size={14} aria-hidden="true" /> Credential library
          </Link>
          <Link href="/methodology" style={{ color: colors.primaryBlue, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <FileText size={14} aria-hidden="true" /> Methodology
          </Link>
          <Link href="/states" style={{ color: colors.primaryBlue, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Shield size={14} aria-hidden="true" /> State CE requirements
          </Link>
        </div>
      </main>
    </div>
  );
}
