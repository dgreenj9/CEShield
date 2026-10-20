// Landing page ("/"). A server component: every sentence and number below
// renders as HTML from the real dataset (siteStats, the credential module,
// the lens definitions, the citation library, the state rule sets). Three
// small client islands add the motion and the two live figures; see
// _landing-client.jsx.

import Link from 'next/link';
import PublicNav from '@/components/layout/PublicNav';
import PublicFooter from '@/components/layout/PublicFooter';
import siteStats from '@/data/siteStats.json';
import citationsMeta from '@/data/citations_meta.json';
import { landingCerts, landingLenses, landingStates } from './_landing-data';
import { Reveals, FieldScene, FieldPreview } from './_landing-client';

export const metadata = {
  title: { absolute: 'CE Shield · Credential scores and CE compliance' },
  description:
    `${siteStats.certCount} rehab credentials scored across five career lenses with ${siteStats.citationTotal.toLocaleString()} curated citations. CE compliance tracked against your state's rule. Built by practicing PTs.`,
  alternates: { canonical: '/' },
};

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const fmt = (n) => n.toLocaleString('en-US');
const listJoin = (xs) => (xs.length < 3 ? xs.join(' and ') : `${xs.slice(0, -1).join(', ')}, and ${xs[xs.length - 1]}`);

// Arms the reveal styles only when scripts run, so the page reads complete
// without JavaScript. Executes during parse, before the content paints.
const ARM = "document.documentElement.classList.add('lp-js');setTimeout(function(){document.querySelectorAll('.lp .rise,.lp .lines').forEach(function(e){e.classList.add('in')})},6000)";

const Arrow = () => (
  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M2 9h13M10 4l5 5-5 5" /></svg>
);

// A display heading split into masked lines; `em` marks the lilac clause.
function Lines({ as: Tag = 'h2', className, lines, id }) {
  return (
    <Tag className={`${className} lines`} id={id}>
      {lines.map((l) => (
        <span className="line" key={l.text}>
          <span>{l.em ? <em>{l.text}</em> : l.text}</span>
        </span>
      ))}
    </Tag>
  );
}

export default function HomePage() {
  const certs = landingCerts();
  const lenses = landingLenses(certs);
  const states = landingStates();
  const byKey = Object.fromEntries(lenses.map((l) => [l.key, l]));
  const N = certs.length;
  const librarianLists = Object.values(citationsMeta).filter((m) => String(m.source || '').includes('librarian')).length;

  // Compact payloads for the islands.
  const sceneCerts = certs.map((c) => ({ n: c.n, s: { clinical: c.s.clinical, business: c.s.business, research: c.s.research } }));
  const previewCerts = certs.map((c) => ({ n: c.n, t: c.t, d: c.d.slice(0, 4), c: c.c, s: c.s }));
  const lensLabels = Object.fromEntries(lenses.map((l) => [l.key, l.label]));

  const research = byKey.research;
  const phd = certs.find((c) => c.n === research.leader?.n);
  const captions = [
    {
      eyebrow: 'The field',
      title: `${N} credentials. One question.`,
      body: 'Certifications cost clinicians months and money. The evidence on which ones pay back is scattered across journals, job boards, and payer rules.',
    },
    {
      eyebrow: `Clinical lens · ${byKey.clinical.count} scored`,
      title: `Scored on ${WORDS[siteStats.dimsPerLens] || siteStats.dimsPerLens} dimensions.`,
      body: `Weighted toward ${listJoin(byKey.clinical.heaviest)}. Each dot is one credential.`,
    },
    {
      eyebrow: `Business lens · ${byKey.business.count} scored`,
      title: 'Same credentials, new frame.',
      body: `Weighted toward ${listJoin(byKey.business.heaviest.slice(0, 2))}. Every dot is the credential it was a moment ago.`,
    },
    {
      eyebrow: `Research lens · ${research.count} scored`,
      title: 'Most fall out of frame.',
      body: phd && phd.s.clinical != null
        ? `${phd.n} score ${Math.round(phd.s.clinical)} in the Clinical lens and ${Math.round(phd.s.research)} in Research. One rubric cannot serve both careers.`
        : `Only ${research.count} of ${N} credentials are scored for a research career. One rubric cannot serve every career.`,
    },
    {
      eyebrow: 'Research lens',
      title: 'The five that lead.',
      body: 'Every score links to its evidence. Below, the same field under all five lenses.',
    },
  ];
  const researchTop = certs
    .filter((c) => c.s.research != null)
    .sort((a, b) => b.s.research - a.s.research)
    .slice(0, 5);

  const verified = states.filter((s) => s.verified);
  const stateNames = [...new Set(states.map((s) => s.name))];

  return (
    <div className="lp-page">
      <PublicNav
        maxWidth={1320}
        cta={(
          <>
            <Link href="/sign-in" className="atlas-nav-signin">Sign in</Link>
            <Link href="/matrix" className="atlas-nav-btn">Explore the field</Link>
          </>
        )}
      />
      {/* eslint-disable-next-line react/no-danger */}
      <script dangerouslySetInnerHTML={{ __html: ARM }} />
      <Reveals />

      <main id="main" className="lp">
        {/* Opening */}
        <section className="lp-opening" aria-labelledby="lp-title">
          <div className="lp-wrap">
            <p className="lp-eyebrow rise">CE Shield · For rehab clinicians</p>
            <Lines
              as="h1"
              id="lp-title"
              className="lp-display"
              lines={[{ text: 'Which credential is' }, { text: 'worth your time?', em: true }]}
            />
            <p className="lp-lede rise d1">
              {`${N} credentials scored across ${WORDS[siteStats.lensCount] || siteStats.lensCount} career lenses, each score backed by a curated library of ${fmt(siteStats.citationTotal)} citations. See what a certification is worth to your career before you pay for it, then track your CE against your state’s rule.`}
            </p>
            <div className="lp-actions rise d2">
              <Link href="/matrix" className="lp-btn">Explore the field <Arrow /></Link>
              <Link href="/methodology" className="lp-textlink">How scores are built</Link>
            </div>
            <dl className="lp-meta rise d2">
              <div><dt>Independence</dt><dd>$0 from the programs we score</dd></div>
              <div><dt>Built by</dt><dd>Practicing PTs</dd></div>
              <div><dt>Price</dt><dd>Free for students, always</dd></div>
            </dl>
          </div>
          <span className="lp-cue" aria-hidden="true">Scroll</span>
        </section>

        {/* Stat band */}
        <section className="lp-stats" aria-label="By the numbers">
          <dl className="lp-wrap lp-stats-grid">
            {[
              [fmt(siteStats.certCount), 'credentials scored'],
              [fmt(siteStats.citationTotal), 'curated citations'],
              [fmt(siteStats.rctSrMa), 'trials, systematic reviews, and meta-analyses'],
              [`${siteStats.lensCount} × ${siteStats.dimsPerLens}`, 'career lenses × dimensions each'],
            ].map(([v, l], i) => (
              <div key={l} className={`rise d${i}`}>
                <dd>{v}</dd>
                <dt>{l}</dt>
              </div>
            ))}
          </dl>
        </section>

        {/* The cinematic field */}
        <FieldScene certs={sceneCerts} lensLabels={lensLabels} captions={captions} />
        <p className="lp-sr">
          Under the Research lens, {research.count} of {N} credentials are scored. The five that
          lead: {researchTop.map((c) => `${c.n} (${c.s.research.toFixed(1)})`).join(', ')}.
        </p>

        {/* Lenses */}
        <section className="lp-section" aria-labelledby="lp-lenses">
          <div className="lp-wrap">
            <div className="lp-head">
              <div>
                <p className="lp-eyebrow rise">Five career lenses</p>
                <Lines
                  id="lp-lenses"
                  className="lp-h2"
                  lines={[{ text: 'One rubric' }, { text: 'per career.', em: true }]}
                />
              </div>
              <p className="lp-body rise d1">
                Each lens has its own {WORDS[siteStats.dimsPerLens] || siteStats.dimsPerLens} dimensions, default weights, and
                evidence frame. Clinical lenses read trial and review literature on the
                intervention; career lenses read placement, demand, and pay. Scores are not
                comparable across lenses, deliberately.
              </p>
            </div>
            <ol className="lp-lenses">
              {lenses.map((l, i) => (
                <li key={l.key} className={`rise d${i % 4}`}>
                  <Link href={`/matrix?lens=${l.key}`} className="lp-lens">
                    <span className="lp-lens-i">0{i + 1}</span>
                    <span className="lp-lens-name">{l.fullLabel}</span>
                    <span className="lp-lens-blurb">{l.blurb}</span>
                    <span className="lp-lens-foot">
                      <span><b>{l.count}</b> scored</span>
                      {l.leader && (
                        <span className="lp-lens-lead" title={l.leader.n}>
                          Leads: {l.leader.n} <b>{l.leader.v.toFixed(1)}</b>
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Working preview of the field */}
        <section className="lp-section lp-section-tight" aria-labelledby="lp-preview">
          <div className="lp-wrap">
            <div className="lp-head">
              <div>
                <p className="lp-eyebrow rise">The field · live data</p>
                <Lines
                  id="lp-preview"
                  className="lp-h2"
                  lines={[{ text: 'Switch the lens.' }, { text: 'Watch it re-sort.', em: true }]}
                />
              </div>
              <p className="lp-body rise d1">
                The same scoring model as the full instrument, at default weights. In the field you
                can move every weight, filter by discipline, and open the dossier behind any score.
              </p>
            </div>
            <div className="rise">
              <FieldPreview certs={previewCerts} lenses={lenses} />
            </div>
          </div>
        </section>

        {/* CE compliance */}
        <section className="lp-section" aria-labelledby="lp-ledger">
          <div className="lp-wrap lp-split">
            <div>
              <p className="lp-eyebrow rise">The Ledger · CE compliance</p>
              <Lines
                id="lp-ledger"
                className="lp-h2"
                lines={[{ text: 'Your renewal,' }, { text: 'against the rule.', em: true }]}
              />
              <p className="lp-body rise d1">
                Log a course and the Ledger checks it against your state&rsquo;s rule: total hours,
                mandatory categories, and format caps, with the board citation named. Upload a
                certificate and OCR fills the form. Export the report or every certificate in one
                ZIP for an audit.
              </p>
              <div className="lp-actions rise d2">
                <Link href="/sign-in" className="lp-btn">Start your Ledger <Arrow /></Link>
                <Link href="/states" className="lp-textlink">CE rules by state</Link>
              </div>
            </div>
            <div className="lp-panel rise d1">
              <div className="lp-panel-top">
                <div>
                  <h3>State rule sets</h3>
                  <p className="lp-sub">
                    {stateNames.length} states · {verified.length} of {states.length} verified against the board rule
                  </p>
                </div>
              </div>
              <ul className="lp-states">
                {states.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/states/${s.slug}`}>
                      <span className="lp-st-name">{s.name} <small>{s.license}</small></span>
                      <span className="lp-st-hours"><b>{s.hours}</b> h / {s.years} yr</span>
                      <span className="lp-st-mand">{s.mandatory ? `${s.mandatory} mandatory` : 'No mandatory'}</span>
                      <span className={`lp-st-tag${s.verified ? ' ok' : ''}`}><i aria-hidden="true" />{s.verified ? 'Verified' : 'Draft'}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="lp-note">Draft rule sets are a first pass. Confirm against the cited rule before relying on them.</p>
            </div>
          </div>
        </section>

        {/* How the scores hold up */}
        <section className="lp-section" aria-labelledby="lp-trust">
          <div className="lp-wrap lp-split">
            <div>
              <p className="lp-eyebrow rise">Method</p>
              <Lines
                id="lp-trust"
                className="lp-h2"
                lines={[{ text: 'Every score,' }, { text: 'traced to a source.', em: true }]}
              />
              <p className="lp-body rise d1">
                The method is public, the limitations are stated up front, and each dossier
                carries a written justification for every dimension score.
              </p>
              <div className="lp-actions rise d2">
                <Link href="/methodology" className="lp-textlink">Methodology, limitations included</Link>
              </div>
            </div>
            <dl className="lp-ledger rise d1">
              <div><dt>Two evidence frames</dt><dd><b>Clinical intervention vs. career outcome.</b>Clinical lenses read trial and review literature on the intervention. Career lenses read placement, demand, and pay.</dd></div>
              <div><dt>Independence</dt><dd><b>$0 from the programs we score.</b>No ads. No sponsored rankings.</dd></div>
              <div><dt>Citations</dt><dd><b>{fmt(siteStats.citationTotal)} curated, {fmt(siteStats.rctSrMa)} of them trials or reviews.</b>Classified by study type. {librarianLists} of {N} citation lists reviewed by research librarians.</dd></div>
              <div><dt>Dossiers</dt><dd><b>A published page for each of the {N} credentials.</b>Cross-lens scores, per-dimension justifications, and the full citation list.</dd></div>
            </dl>
          </div>
        </section>

        {/* Closing */}
        <Link href="/matrix" className="lp-next">
          <span className="lp-wrap">
            <span className="lp-eyebrow">Free to explore · No account required</span>
            <span className="lp-next-title">See where your next credential lands.</span>
            <span className="lp-next-go">Explore the field <Arrow /></span>
          </span>
        </Link>
      </main>

      <PublicFooter maxWidth={1320} />
    </div>
  );
}
