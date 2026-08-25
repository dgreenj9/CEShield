// /methodology — Server Component. Editorial doc layout: sticky scroll-spy
// TOC on the left, prose on the right. Atlas: reads like a published
// survey — numbered sections, ink rules, quiet labels, petrol accents.
// The conflict-of-interest section is the trust centerpiece.

import Link from 'next/link';
import { BookOpen, AlertCircle } from 'lucide-react';
import PublicNav from '@/components/layout/PublicNav';
import { A, INS, eyebrow, tabularNums } from '@/components/atlas/theme';
import { METHODOLOGY_CONTENT } from '@/utils/certificationCitationMap';
import TOC from './_TOC';
import siteStats from '@/data/siteStats.json';

export const metadata = {
  title: METHODOLOGY_CONTENT.title,
  description:
    `How CE Shield scores ${siteStats.certCount} rehab credentials across five career-path lenses, six adjustable dimensions per lens, and ${siteStats.citationTotal.toLocaleString()} curated citations. Full methodology, scoring tiers, limitations, and COI statement.`,
  alternates: { canonical: '/methodology' },
  openGraph: { title: METHODOLOGY_CONTENT.title, url: '/methodology' },
};

const EVIDENCE_LABELS = {
  meta_analysis: 'Meta-analysis',
  systematic_review: 'Systematic review',
  rct: 'RCT',
  guideline: 'Clinical guideline',
  cohort: 'Cohort study',
  case_control: 'Case-control',
  cross_sectional: 'Cross-sectional',
  case_series: 'Case series',
  pilot: 'Pilot/feasibility',
  protocol: 'Study protocol',
  qualitative: 'Qualitative',
  narrative: 'Narrative review',
  unknown: 'Other',
};

// Build-time evidence-type breakdown — used inside the Evidence Base section.
import citationMeta from '@/data/citations_meta.json';
const evidenceBreakdown = (() => {
  const counts = {};
  for (const entry of Object.values(citationMeta)) {
    for (const [k, n] of Object.entries(entry.evidence_mix || {})) {
      counts[k] = (counts[k] || 0) + n;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .filter(([k]) => k !== 'unknown');
})();

const slugify = (s) =>
  s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

const SECTIONS = [
  { title: 'Evidence base' },
  { title: 'Scoring dimensions' },
  { title: 'Two evidence frames' },
  { title: 'Score tiers' },
  { title: "What we've learned" },
  { title: 'Known limitations' },
  { title: 'Conflict of interest' },
  { title: 'Authors' },
].map((s, i) => ({ ...s, id: slugify(s.title), number: i + 1 }));

// Atlas tier colors for the score-tier list. The content module carries
// legacy hex values — remap by tier name so color stays within the
// accent family (and Limited stays readable as text).
const TIER_TEXT_COLORS = {
  strong: A.accent,
  good: A.accentMid,
  moderate: A.warn,
  limited: A.inkMuted,
};
const tierTextColor = (name) =>
  TIER_TEXT_COLORS[String(name).toLowerCase().split(' ')[0]] || A.ink;

// Numbered section header: section number + a hairline rule, then the
// title once, in the display face.
function Section({ section, children }) {
  return (
    <section
      id={section.id}
      style={{ marginTop: '3.5rem', scrollMarginTop: '5rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
        <span
          style={{
            fontSize: '0.8rem',
            color: A.inkMuted,
            fontWeight: 600,
            ...tabularNums,
          }}
        >
          {String(section.number).padStart(2, '0')}
        </span>
        <hr style={{ flex: 1, border: 0, borderTop: `1px solid ${A.ruleMinor}`, margin: 0 }} />
      </div>
      <h2
        style={{
          fontFamily: INS,
          fontSize: '1.6rem',
          fontWeight: 600,
          color: A.ink,
          margin: 0,
          marginBottom: '1.25rem',
          letterSpacing: '-0.025em',
          lineHeight: 1.15,
        }}
      >
        {section.title}
      </h2>
      <div className="cs-prose">{children}</div>
    </section>
  );
}

const proseLink = { color: A.accent, textDecoration: 'underline', textUnderlineOffset: 2 };

export default function MethodologyPage() {
  return (
    <div className="atlas-ground" style={{ minHeight: '100vh', color: A.ink }}>
      <PublicNav currentPath="/methodology" />

      <main className="cs-page-pad" style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '3rem 2rem 6rem',
        lineHeight: 1.65,
      }}>
        {/* Hero — single column, left-anchored. Methodology is philosophy;
            numbers live on /credentials and /about. */}
        <header style={{ marginBottom: '2.5rem', maxWidth: 760 }}>
          <div style={{ ...eyebrow(), marginBottom: 12 }}>
            {METHODOLOGY_CONTENT.version} · last reviewed March 2026
          </div>
          <h1
            className="cs-h1-clamp"
            style={{
              fontFamily: INS,
              fontSize: '2.5rem',
              fontWeight: 600,
              color: A.ink,
              margin: 0,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
            }}
          >
            {METHODOLOGY_CONTENT.title}
          </h1>
          <p style={{ fontSize: '1.08rem', marginTop: '1rem', color: A.inkBody }}>
            {METHODOLOGY_CONTENT.overview}
          </p>
        </header>

        <div className="cs-doc-grid">
          <TOC sections={SECTIONS} />

          <article className="cs-article">
            <Section section={SECTIONS[0]}>
              <p>
                CE Shield&rsquo;s certification rankings are built on a curated
                literature review conducted in collaboration with research
                librarians. Below: the evidence-type composition of the
                citation library, the kind of studies that sit behind the
                scores.
              </p>
              <ul className="cs-bullet-list">
                {evidenceBreakdown.map(([type, n]) => (
                  <li key={type}>
                    <strong>{EVIDENCE_LABELS[type] || type}:</strong>{' '}
                    <span className="tabular-nums">{n.toLocaleString()}</span> citations
                  </li>
                ))}
              </ul>
            </Section>

            <Section section={SECTIONS[1]}>
              <p>
                Every credential is scored 0&ndash;100 on six dimensions per
                lens. A weighted sum produces the displayed score. Weights
                are user-adjustable in the matrix; the values below are the
                defaults for the clinical lens.
              </p>
              <div className="cs-bleed cs-dim-list">
                {METHODOLOGY_CONTENT.scoringComponents.map((c) => (
                  <div key={c.dimensionKey} className="cs-dim-card">
                    <div className="cs-dim-card-header">
                      <h3 style={{ fontFamily: INS, fontSize: '1rem', fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>
                        {c.name}
                      </h3>
                      <span
                        style={{
                          color: A.accent,
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          whiteSpace: 'nowrap',
                          ...tabularNums,
                        }}
                      >
                        ×{c.defaultWeight}
                      </span>
                    </div>
                    <p style={{ marginTop: 6, marginBottom: 8, color: A.inkBody, fontSize: '0.92rem' }}>
                      {c.description}
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '1.1rem', color: A.inkMuted, fontSize: '0.85rem' }}>
                      {c.criteria.map((cr) => (<li key={cr}>{cr}</li>))}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>

            <Section section={SECTIONS[2]}>
              <p>
                CE Shield uses two different evidence frames depending on
                which career path you&rsquo;re evaluating a credential
                against. Each is honest about what kind of evidence is
                available and what it actually demonstrates.
              </p>
              <div className="cs-bleed cs-frame-grid">
                <div className="cs-frame cs-frame-blue">
                  <div className="cs-frame-eyebrow" style={{ letterSpacing: '0.02em', textTransform: 'none', fontSize: '0.8rem' }}>Clinical-intervention frame</div>
                  <div className="cs-frame-label">Clinical · Business · Academic Clinical</div>
                  <p>
                    Evaluates credentials by the published clinical-outcome
                    evidence for the underlying intervention. Source:
                    peer-reviewed RCTs, systematic reviews, meta-analyses,
                    clinical guidelines, curated by research librarians
                    across two passes (Dec 2025, Mar 2026).
                  </p>
                </div>
                <div className="cs-frame cs-frame-sage">
                  <div className="cs-frame-eyebrow" style={{ letterSpacing: '0.02em', textTransform: 'none', fontSize: '0.8rem' }}>Career-outcome frame</div>
                  <div className="cs-frame-label">Research · HealthTech &amp; Industry</div>
                  <p>
                    Evaluates credentials by the documented career outcomes
                    for people who hold them: grant-funding rates,
                    time-to-PI, publication output, industry placement,
                    salary premiums. Sources include peer-reviewed
                    career-outcome studies (JAMIA, Academic Medicine,
                    J Clin Transl Sci), government workforce reports (BLS,
                    NIH, ONC), and tagged industry / professional-society
                    reports where peer-reviewed data is unavailable.
                    Industry-only sources are always tagged.
                  </p>
                </div>
              </div>
              <p>
                <strong>What this lets us do honestly:</strong> a PhD
                scores poorly on the Clinical path (no patient-intervention
                evidence for the credential itself) and excellently on the
                Research path (K-to-R conversion data, publication output).
                Epic certification inverts: poor on Clinical, strong on
                HealthTech. Forcing both into one rubric would either
                inflate the wrong cells or compress the right ones;
                per-path scoring keeps the evaluation honest.
              </p>
              <p>
                Citations are tagged by evidence type using a deterministic
                heuristic over the title text. Source-type tags
                (peer-reviewed, government, professional-society, industry)
                are surfaced in the citations panel so users can weigh each
                source appropriately.
              </p>
            </Section>

            <Section section={SECTIONS[3]}>
              <p>
                Score ranges and their meanings (counts reflect the default
                weights; adjusting sliders will shift credentials between
                tiers).
              </p>
              <ul className="cs-bullet-list">
                {METHODOLOGY_CONTENT.scoringTiers.map((t) => (
                  <li key={t.tier}>
                    <strong style={{ color: tierTextColor(t.tier) }}>{t.tier} ({t.range}):</strong>{' '}
                    {t.description}
                  </li>
                ))}
              </ul>
            </Section>

            <Section section={SECTIONS[4]}>
              <ul className="cs-bullet-list">
                {METHODOLOGY_CONTENT.keyFindings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </Section>

            <Section section={SECTIONS[5]}>
              <div className="cs-callout cs-callout-blue" style={{ border: `1px dashed ${A.ink}`, background: A.notice }}>
                <AlertCircle size={20} aria-hidden="true" style={{ color: A.warn }} />
                <p>
                  Rankings are tools for clinical reasoning, not
                  endorsements. They describe the evidence base for an
                  intervention, not the marginal value a credential adds
                  over an uncertified clinician practicing the same
                  approach.
                </p>
              </div>
              <ul className="cs-bullet-list" style={{ marginTop: '1rem' }}>
                {METHODOLOGY_CONTENT.limitations.map((l, i) => (<li key={i}>{l}</li>))}
              </ul>
            </Section>

            <Section section={SECTIONS[6]}>
              {/* The trust centerpiece — banded, ink-ruled, with the $0
                  declaration carried over from the landing. */}
              <div className="cs-bleed" style={{ background: A.band, border: `1px solid ${A.ink}`, padding: '1.5rem 1.75rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: INS, fontSize: '3rem', fontWeight: 600, lineHeight: 1, letterSpacing: '-0.04em', color: A.ink, ...tabularNums }}>
                    $0
                  </span>
                  <span style={{ color: A.inkBody, fontSize: '0.98rem' }}>
                    from the programs we score. No ads. No sponsored rankings.
                  </span>
                </div>
              </div>
              <p>
                <strong>CE Shield receives no compensation from any
                certification program, training organization, or vendor.</strong>{' '}
                Scores are not influenced by sponsorship, advertising, or
                partnership relationships, because none exist. The project
                is currently self-funded by the author.
              </p>
              <p>
                Planned monetization is limited to surfaces that don&rsquo;t
                touch scoring: a premium tier for compliance tracking, team
                plans for clinics, and clearly labeled referral links on CE
                <em> course</em> listings (never on credential rankings).
                Referral relationships will be disclosed inline wherever they
                exist. Credential scores are not for sale, and display
                advertising is off the table.
              </p>
            </Section>

            <Section section={SECTIONS[7]}>
              <p>
                CE Shield is authored by <strong>practicing physical
                therapists</strong> with healthcare-administration
                backgrounds. Methodology is informed by clinical
                experience, payer/policy literature, and the
                librarian-curated citation library referenced above.
              </p>
              <p style={{ color: A.inkMuted, fontSize: '0.92rem' }}>
                Disagree with a score, find a missing citation, or spot an
                error? Corrections welcome. This page versions on every
                release.
              </p>
            </Section>

            <div
              style={{
                marginTop: '3.5rem',
                paddingTop: '1.25rem',
                borderTop: `1px solid ${A.ink}`,
                color: A.inkMuted,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <BookOpen size={14} aria-hidden="true" style={{ color: A.accent }} />
              {METHODOLOGY_CONTENT.dataSource}
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
