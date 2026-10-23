// /career-paths: the five lenses. Server Component. Computes each lens's
// ranking at its default weights at build time, then hands the data to a
// client tabbed UI so visitors can switch lenses without scrolling.
// Peach is the interactive voice; credentials are drawn in the chart
// palette's lilac-violet in every lens, so color never encodes lens identity.

import Link from 'next/link';
import PublicNav from '@/components/layout/PublicNav';
import PublicFooter from '@/components/layout/PublicFooter';
import { A, mxEyebrow, mxDisplay } from '@/components/atlas/theme';
import { certifications as certData } from '@/utils/certificationData';
import { rankCertifications } from '@/utils/certScoring';
import { PATHS, PATH_ORDER, getPathDefaultWeights } from '@/utils/careerPaths';
import citationsMeta from '@/data/citations_meta.json';
import PathTabs from './_PathTabs';
import siteStats from '@/data/siteStats.json';

export const metadata = {
  title: 'Five career paths',
  description:
    'Five career lenses for PTs and OTs: clinical, business, academic clinical, research, and healthtech. Each scores six dimensions against its own evidence frame.',
  alternates: { canonical: '/career-paths' },
  openGraph: { title: 'Five career paths · CE Shield', url: '/career-paths' },
};

const discList = (c) =>
  (c.disciplines && c.disciplines.length ? c.disciplines : String(c.discipline || '').split('/'))
    .map((d) => d.trim()).filter(Boolean);

// Every scored credential per lens at that lens's default weights. Small
// rows only: enough for the top picks and the distribution strip.
const FIELD = Object.fromEntries(
  PATH_ORDER.map((key) => [
    key,
    rankCertifications(certData, getPathDefaultWeights(key), key).map((c) => ({
      name: c.name,
      type: c.type,
      disciplines: discList(c),
      v: c.computedScore,
      rank: c.rank,
      count: citationsMeta[c.name]?.count || 0,
      slug: citationsMeta[c.name]?.slug || null,
    })),
  ]),
);

const PATHS_DATA = PATH_ORDER.map((key) => ({
  key,
  label: PATHS[key].label,
  description: PATHS[key].description,
  defaultWeights: PATHS[key].defaultWeights,
}));

export default function CareerPathsPage() {
  const stats = [
    { value: String(siteStats.lensCount ?? PATH_ORDER.length), label: 'Career-path lenses' },
    { value: String(siteStats.dimsPerLens ?? 6), label: 'Dimensions per lens' },
    { value: String(siteStats.certCount), label: 'Credentials scored' },
    { value: siteStats.citationTotal.toLocaleString(), label: 'Curated citations' },
  ];
  return (
    <div className="mx-stage">
      <PublicNav currentPath="/career-paths" />

      <main id="main" className="mx-wrap" style={{ paddingTop: 'clamp(40px, 6vw, 72px)', paddingBottom: 80 }}>
        <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '28px 48px', marginBottom: 34 }}>
          <div style={{ flex: '1 1 30rem', minWidth: 0 }}>
            <p style={{ ...mxEyebrow, margin: 0 }}>The five lenses</p>
            <h1 className="mx-display" style={{ ...mxDisplay(), marginTop: 16 }}>
              Five paths.<br /><em>Five different questions.</em>
            </h1>
            <p className="mx-lede">
              A PhD ranks low under the clinical lens and near the top under
              research. An Epic build certification matters in health IT and
              rarely elsewhere. Each lens scores its own six dimensions against
              its own evidence frame, so the same credential ranks differently
              under each.
            </p>
            <p style={{ fontSize: 13, color: A.inkMuted, margin: '12px 0 0', maxWidth: '34rem', lineHeight: 1.7 }}>
              Each lens below shows its rubric, its top picks, and where the
              whole field sits. The{' '}
              <Link href="/methodology" className="mx-out" style={{ minHeight: 0, fontSize: 13 }}>methodology</Link>{' '}
              covers how dimensions and weights were chosen.
            </p>
          </div>
          <dl aria-label="At a glance" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0, margin: 0, flex: '0 1 22rem', borderTop: '1px solid #ffffff1a' }}>
            {stats.map((s) => (
              <div key={s.label} style={{ padding: '14px 0', borderBottom: '1px solid #ffffff1a', display: 'flex', flexDirection: 'column-reverse' }}>
                <dt className="mx-lbl" style={{ marginTop: 2 }}>{s.label}</dt>
                <dd className="mx-kpi" style={{ margin: 0 }}>{s.value}</dd>
              </div>
            ))}
          </dl>
        </header>

        <PathTabs paths={PATHS_DATA} field={FIELD} />

        <section className="mx-panel" style={{ marginTop: 14, padding: '22px 22px 18px' }} aria-labelledby="pick-h">
          <h2 id="pick-h" className="mx-ph" style={{ fontSize: 12, fontWeight: 600, color: A.inkBody, margin: '0 0 12px' }}>Picking your lens</h2>
          <ol className="atlas-steps mx-steps">
            <li>Pick the lens that matches where your career is headed.</li>
            <li>
              Open{' '}
              <Link href="/matrix" className="mx-out" style={{ minHeight: 0, fontSize: "inherit" }}>the field</Link>{' '}
              under that lens. It ranks only the credentials scored on it.
            </li>
            <li>Move the lens weights toward the dimensions you care about. The ranking updates live.</li>
            <li>Read the dossier before committing dollars and hours.</li>
            <li>Log the CE hours those courses earn in the Ledger.</li>
          </ol>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
