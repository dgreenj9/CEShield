// /methodology — Server Component. Editorial doc layout: sticky scroll-spy
// TOC on the left, prose on the right. Atlas: reads like a published
// survey — numbered sections, ink rules, quiet labels, petrol accents.
// The conflict-of-interest section is the trust centerpiece.

import { AlertCircle } from 'lucide-react';
import PublicNav from '@/components/layout/PublicNav';
import PublicFooter from '@/components/layout/PublicFooter';
import { A, tabularNums, tierColor, kicker, display, panel, VIZ, LINE } from '@/components/atlas/theme';
import { METHODOLOGY_CONTENT } from '@/utils/certificationCitationMap';
import { PATH_DIMENSIONS, getPathDefaultWeights } from '@/utils/careerPaths';
import { rankCertifications, tierCountsFor } from '@/utils/certScoring';
import { certifications } from '@/utils/certificationData';
import TOC from './_TOC';
import siteStats from '@/data/siteStats.json';
import { EVIDENCE_LABELS } from '@/utils/citationsLibrary';

export const metadata = {
  title: METHODOLOGY_CONTENT.title,
  description:
    `How CE Shield scores ${siteStats.certCount} rehab credentials across five career-path lenses, six adjustable dimensions per lens, and ${siteStats.citationTotal.toLocaleString()} curated citations. Full methodology, scoring tiers, limitations, and COI statement.`,
  alternates: { canonical: '/methodology' },
  openGraph: { title: METHODOLOGY_CONTENT.title, url: '/methodology' },
};


// Build-time evidence-type breakdown — used inside the Evidence Base section.
import citationMeta from '@/data/citations_meta.json';
const evidenceCounts = {};
const evidenceBreakdown = (() => {
  const counts = evidenceCounts;
  for (const entry of Object.values(citationMeta)) {
    for (const [k, n] of Object.entries(entry.evidence_mix || {})) {
      counts[k] = (counts[k] || 0) + n;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .filter(([k]) => k !== 'unknown');
})();
const typedTotal = evidenceBreakdown.reduce((a, [, n]) => a + n, 0);
const evidenceMax = evidenceBreakdown[0]?.[1] || 1;

// Scoring dimensions: weights and labels come from the live lens config
// (the same source the field uses), criteria from the methodology copy.
const CLINICAL_WEIGHTS = getPathDefaultWeights('clinical');
const CRITERIA = Object.fromEntries(
  METHODOLOGY_CONTENT.scoringComponents.map((c) => [c.dimensionKey, c]),
);
const clinicalDimensions = Object.entries(PATH_DIMENSIONS.clinical)
  .map(([key, d]) => ({
    key,
    label: d.label,
    description: CRITERIA[key]?.description || d.description,
    criteria: CRITERIA[key]?.criteria || [],
    weight: CLINICAL_WEIGHTS[key] || 0,
  }))
  .sort((a, b) => b.weight - a.weight);

// Tier distribution under the clinical lens at default weights, computed
// from the dataset at build time (the copy promised counts; now it has them).
const clinicalTierCounts = tierCountsFor(
  rankCertifications(certifications, CLINICAL_WEIGHTS, 'clinical'),
  'All',
);
const TIERS = [
  { key: 'strong', word: 'Strong', range: '70–100', floor: 70 },
  { key: 'good', word: 'Good', range: '50–69', floor: 50 },
  { key: 'moderate', word: 'Moderate', range: '30–49', floor: 30 },
  { key: 'limited', word: 'Limited', range: '0–29', floor: 0 },
].map((t) => ({
  ...t,
  color: tierColor(t.floor),
  count: clinicalTierCounts[t.key],
  description: METHODOLOGY_CONTENT.scoringTiers.find((s) => s.tier.toLowerCase().startsWith(t.key))?.description || '',
}));

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

// Numbered section header: section number + a hairline rule, then the
// title once, in the display face.
function Section({ section, children }) {
  return (
    <section
      id={section.id}
      style={{ marginTop: '3.5rem', scrollMarginTop: '5rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <span style={{ ...kicker(), ...tabularNums }}>
          {String(section.number).padStart(2, '0')}
        </span>
        <hr style={{ flex: 1, border: 0, borderTop: `1px solid ${LINE}`, margin: 0 }} />
      </div>
      <h2 style={{ ...display('clamp(1.6rem, 2.4vw, 2rem)', 380), lineHeight: 1.1, marginBottom: '1.25rem' }}>
        {section.title}
      </h2>
      <div className="cs-prose">{children}</div>
    </section>
  );
}

export default function MethodologyPage() {
  return (
    <div className="atlas-ground" style={{ minHeight: '100vh', color: A.ink }}>
      <PublicNav currentPath="/methodology" />

      <main id="main" className="atlas-wrap" style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '4.5rem 2rem 6rem',
        lineHeight: 1.65,
      }}>
        {/* Hero — single column, left-anchored. Methodology is philosophy;
            numbers live on /credentials and /about. */}
        <header className="plum-rise" style={{ marginBottom: '3.5rem', maxWidth: 860 }}>
          <div style={{ ...kicker(), marginBottom: 18 }}>
            {METHODOLOGY_CONTENT.version} · last reviewed March 2026
          </div>
          <h1 style={display('clamp(2.3rem, 5.4vw, 4.4rem)', 350)}>
            Scoring methodology. <em style={{ fontStyle: 'normal', color: A.accentMid }}>How every score is made.</em>
          </h1>
          <p style={{ fontSize: 'clamp(15px, 1.25vw, 17.5px)', lineHeight: 1.75, marginTop: '1.75rem', marginBottom: 0, color: A.inkBody, maxWidth: '36em' }}>
            {METHODOLOGY_CONTENT.overview}
          </p>
        </header>

        <div className="cs-doc-grid">
          <TOC sections={SECTIONS} />

          <article className="cs-article">
            <Section section={SECTIONS[0]}>
              <p>
                The scores rest on a curated literature review conducted with
                research librarians. The typed citations in the library, by
                study design:
              </p>
              <div className="cs-bleed atlas-bar-table" role="table" aria-label="Citations by study design">
                <div role="row" className="atlas-bar-row atlas-bar-head">
                  <span role="columnheader">Study design</span>
                  <span role="columnheader" aria-hidden="true" />
                  <span role="columnheader" style={{ textAlign: 'right' }}>Citations</span>
                  <span role="columnheader" style={{ textAlign: 'right' }}>Share</span>
                </div>
                {evidenceBreakdown.map(([type, n]) => (
                  <div role="row" key={type} className="atlas-bar-row">
                    <span role="cell" style={{ fontWeight: 400, color: A.inkBody }}>{EVIDENCE_LABELS[type] || type}</span>
                    <span role="cell" aria-hidden="true" style={{ height: 6, background: VIZ.track, borderRadius: 3, overflow: 'hidden', alignSelf: 'center' }}>
                      <span className="plum-grow" style={{ display: 'block', height: '100%', width: `${(n / evidenceMax) * 100}%`, background: VIZ.c3, borderRadius: '0 4px 4px 0' }} />
                    </span>
                    <span role="cell" style={{ textAlign: 'right', fontWeight: 450, color: A.ink, ...tabularNums }}>{n.toLocaleString()}</span>
                    <span role="cell" style={{ textAlign: 'right', color: A.inkMuted, ...tabularNums }}>
                      {((n / typedTotal) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
                <div role="row" className="atlas-bar-row atlas-bar-total">
                  <span role="cell">Typed citations</span>
                  <span role="cell" aria-hidden="true" />
                  <span role="cell" style={{ textAlign: 'right', ...tabularNums }}>{typedTotal.toLocaleString()}</span>
                  <span role="cell" style={{ textAlign: 'right', ...tabularNums }}>100%</span>
                </div>
              </div>
              <p style={{ color: A.inkMuted, fontSize: '0.9rem', marginTop: '0.75rem' }}>
                A further {(evidenceCounts.unknown || 0).toLocaleString()} citations carry no study-design tag
                and are left out of this table.
              </p>
            </Section>

            <Section section={SECTIONS[1]}>
              <p>
                Every credential is scored 0&ndash;100 on six dimensions per
                lens. A weighted sum produces the displayed score. Below, the
                clinical lens at its default weights; each lens has its own
                six, listed under Lenses.
              </p>
              <div className="cs-bleed cs-dim-list">
                {clinicalDimensions.map((c) => (
                  <div key={c.key} className="cs-dim-card">
                    <div className="cs-dim-card-header">
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 450, margin: 0, letterSpacing: '-0.02em', color: A.ink }}>
                        {c.label}
                      </h3>
                      <span style={{ color: A.inkMuted, fontWeight: 400, fontSize: '0.8rem', whiteSpace: 'nowrap', ...tabularNums }}>
                        weight <span style={{ color: A.ink, fontWeight: 500 }}>{c.weight}</span>
                      </span>
                    </div>
                    <div aria-hidden="true" style={{ height: 4, background: VIZ.track, borderRadius: 2, overflow: 'hidden', margin: '10px 0 12px' }}>
                      <span className="plum-grow" style={{ display: 'block', height: '100%', width: `${c.weight}%`, background: VIZ.c2, borderRadius: '0 3px 3px 0' }} />
                    </div>
                    <p style={{ margin: '0 0 8px', color: A.inkBody, fontSize: '0.92rem', lineHeight: 1.55 }}>
                      {c.description}
                    </p>
                    {c.criteria.length > 0 && (
                      <ul className="cs-bullet-list" style={{ color: A.inkMuted, fontSize: '0.85rem' }}>
                        {c.criteria.map((cr) => (<li key={cr}>{cr}</li>))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
              <p style={{ color: A.inkMuted, fontSize: '0.9rem', marginTop: '0.75rem' }}>
                Weights sum to {Object.values(CLINICAL_WEIGHTS).reduce((a, b) => a + b, 0)}. The bar under each name is its share.
              </p>
            </Section>

            <Section section={SECTIONS[2]}>
              <p>
                CE Shield uses two different evidence frames depending on
                which career path you&rsquo;re evaluating a credential
                against. Each states what kind of evidence is available and
                what it demonstrates.
              </p>
              <div className="cs-bleed cs-frame-grid">
                <div className="cs-frame cs-frame-blue">
                  <div className="cs-frame-eyebrow">Clinical-intervention frame</div>
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
                  <div className="cs-frame-eyebrow">Career-outcome frame</div>
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
                <strong>What per-path scoring does:</strong> a PhD
                scores low on the Clinical path (no patient-intervention
                evidence for the credential itself) and high on the
                Research path (K-to-R conversion data, publication output).
                Epic certification inverts: low on Clinical, high on
                HealthTech. One rubric for both would either inflate the
                wrong cells or compress the right ones; per-path scoring
                keeps each evaluation inside its evidence frame.
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
                Four tiers, the only place color carries data. Counts are the
                clinical lens at default weights; recalibrating moves
                credentials between tiers.
              </p>
              <div className="cs-bleed" style={{ marginTop: '1.25rem' }}>
                <div
                  role="img"
                  aria-label={`Clinical lens, ${clinicalTierCounts.all} credentials: ${TIERS.map((t) => `${t.count} ${t.word.toLowerCase()}`).join(', ')}.`}
                  style={{ display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden', background: A.paper }}
                >
                  {[...TIERS].reverse().map((t) => (
                    <span
                      key={t.key}
                      style={{
                        flex: `${t.count} 0 0`,
                        minWidth: t.count ? 3 : 0,
                        background: t.color,
                        borderLeft: t.key === 'limited' ? 'none' : `2px solid ${A.paper}`,
                      }}
                    />
                  ))}
                </div>
                <div aria-hidden="true" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11.5, fontWeight: 400, color: A.inkMuted, ...tabularNums }}>
                  <span>Lower scores</span>
                  <span>n = {clinicalTierCounts.all}</span>
                  <span>Higher scores</span>
                </div>
                <dl className="atlas-tier-table">
                  {TIERS.map((t) => (
                    <div key={t.key} className="atlas-tier-row">
                      <dt>
                        <span aria-hidden="true" style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: t.color, marginRight: 10 }} />
                        <span style={{ fontWeight: 500, color: A.ink }}>{t.word}</span>
                        <span style={{ color: A.inkMuted, fontWeight: 400, marginLeft: 8, ...tabularNums }}>{t.range}</span>
                      </dt>
                      <dd style={{ margin: 0, color: A.inkBody }}>{t.description}</dd>
                      <dd style={{ margin: 0, textAlign: 'right', fontWeight: 450, color: A.ink, ...tabularNums }}>{t.count}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Section>

            <Section section={SECTIONS[4]}>
              <ul className="cs-bullet-list">
                {METHODOLOGY_CONTENT.keyFindings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </Section>

            <Section section={SECTIONS[5]}>
              <div className="cs-bleed cs-callout cs-callout-blue" style={{ borderColor: 'rgba(224,142,109,0.35)', background: 'rgba(224,142,109,0.06)' }}>
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
              <div className="cs-bleed" style={{ ...panel, padding: '1.75rem 2rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 'clamp(2.75rem, 5vw, 3.75rem)', fontWeight: 330, lineHeight: 1, letterSpacing: '-0.05em', color: A.ink, ...tabularNums }}>
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
                exist. Credential scores are not for sale, and we do not run
                display advertising.
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
                error? Corrections are welcome. This page is versioned on
                every release.
              </p>
            </Section>

            <p
              style={{
                marginTop: '3.5rem',
                marginBottom: 0,
                paddingTop: '1.5rem',
                borderTop: `1px solid ${LINE}`,
                color: A.inkMuted,
                fontSize: '0.85rem',
                lineHeight: 1.6,
                maxWidth: 760,
              }}
            >
              {METHODOLOGY_CONTENT.dataSource}
            </p>
          </article>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
