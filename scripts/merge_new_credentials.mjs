// Merge newly researched credentials into the data files.
//
// Input: /tmp/new_creds/*.json — one researched credential per file, the
// JSON each research agent returned (optionally wrapped in ```json fences).
//
// Updates:
//   src/utils/certificationData.js     — appends certs (scores only; no inline justifications)
//   public/justifications/<slug>.json  — per-cert justification strings
//   public/citations/<slug>.json       — per-cert citation lists
//   src/data/citations_meta.json       — slug/count/evidence_mix/year_dist entries
//   src/data/siteStats.json            — recomputed site-wide stat counters

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { PATH_DIMENSIONS, PATHS } from '../src/utils/careerPaths.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const INPUT_DIR = '/tmp/new_creds';

// Schema guard. Research agents have twice returned pathScores with invented
// dimension keys (e.g. "evidenceQuality", "patientAcuity") instead of the
// canonical six per lens. Merging those silently corrupts the weighted-sum
// score (missing keys read as 0). This validates every pathScores block
// against PATH_DIMENSIONS and returns a list of problems (empty = clean).
const validatePathScores = (pathScores) => {
  const problems = [];
  if (!pathScores || typeof pathScores !== 'object') {
    return ['pathScores missing or not an object'];
  }
  for (const [lens, dims] of Object.entries(pathScores)) {
    if (!PATHS[lens]) {
      problems.push(`unknown lens "${lens}" (expected one of ${Object.keys(PATHS).join('/')})`);
      continue;
    }
    const expected = new Set(Object.keys(PATH_DIMENSIONS[lens]));
    const got = new Set(Object.keys(dims || {}));
    const missing = [...expected].filter((k) => !got.has(k));
    const extra = [...got].filter((k) => !expected.has(k));
    if (missing.length) problems.push(`${lens}: missing dims [${missing.join(', ')}]`);
    if (extra.length) problems.push(`${lens}: unexpected dims [${extra.join(', ')}]`);
    // Values must be numbers in 0–100.
    for (const [k, v] of Object.entries(dims || {})) {
      if (!expected.has(k)) continue;
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 100) {
        problems.push(`${lens}.${k}: invalid score ${JSON.stringify(v)} (need 0–100 number)`);
      }
    }
  }
  return problems;
};

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[-\s]+/g, '-')
    .replace(/^-|-$/g, '');

const stripFences = (raw) => {
  const m = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  return m ? m[1] : raw;
};

// Agents return free-form evidence/source labels — map to the canonical
// keys the UI knows (EVIDENCE_LABELS in citationsLibrary.js).
const normalizeEvidenceType = (raw) => {
  const t = String(raw || '').toLowerCase();
  if (/meta[- _]?anal/.test(t)) return 'meta_analysis';
  if (/systematic|scoping|cochrane/.test(t)) return 'systematic_review';
  if (/random|rct/.test(t)) return 'rct';
  if (/guideline|consensus/.test(t)) return 'guideline';
  if (/cohort|longitudinal|prospective|quasi/.test(t)) return 'cohort';
  if (/case[- _](control)/.test(t)) return 'case_control';
  if (/cross[- _]?sectional|basic[- _]science|psychometric|reliab|valid/.test(t)) return 'cross_sectional';
  if (/case[- _](report|series|study)/.test(t)) return 'case_series';
  if (/pilot|feasib|pre[- _\/]?post|uncontrolled/.test(t)) return 'pilot';
  if (/protocol/.test(t)) return 'protocol';
  if (/qualitative/.test(t)) return 'qualitative';
  if (/narrative|review|commentary|perspective|overview/.test(t)) return 'narrative';
  return 'unknown';
};

const normalizeSourceType = (raw) => {
  const t = String(raw || '').toLowerCase();
  if (/gov|bls|nih|onc|fda|cms/.test(t)) return 'government';
  if (/society|association|foundation|college\b/.test(t)) return 'professional-society';
  if (/industry|vendor|market|company/.test(t)) return 'industry';
  return 'peer-reviewed';
};

// ── load inputs ─────────────────────────────────────────────────────────────
const inputs = fs.readdirSync(INPUT_DIR).filter((f) => f.endsWith('.json'));
const records = [];
for (const f of inputs) {
  const raw = fs.readFileSync(path.join(INPUT_DIR, f), 'utf8');
  try {
    const obj = JSON.parse(stripFences(raw).trim());
    records.push({ file: f, ...obj });
  } catch (e) {
    console.error(`PARSE FAIL ${f}: ${e.message}`);
  }
}

// ── load current data ───────────────────────────────────────────────────────
const certPath = path.join(ROOT, 'src/utils/certificationData.js');
const certSrc = fs.readFileSync(certPath, 'utf8');
const m = certSrc.match(/export const certifications = (\[[\s\S]*\]);\s*$/);
const certs = JSON.parse(m[1]);
const existingNames = new Set(certs.map((c) => c.name.toLowerCase()));

const metaPath = path.join(ROOT, 'src/data/citations_meta.json');
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

// ── merge ───────────────────────────────────────────────────────────────────
let added = 0;
let rejected = 0;
for (const r of records) {
  if (r.verified === false) {
    console.log(`SKIP (unverified): ${r.file} — ${String(r.evidence || '').slice(0, 120)}`);
    continue;
  }
  if (!r.name || !r.pathScores?.clinical || !r.citations?.length) {
    console.log(`SKIP (incomplete): ${r.file}`);
    continue;
  }
  if (existingNames.has(r.name.toLowerCase())) {
    console.log(`SKIP (duplicate): ${r.name}`);
    continue;
  }
  // Reject records whose pathScores don't match the canonical schema — this
  // is the guard against silently-corrupted scores.
  const schemaProblems = validatePathScores(r.pathScores);
  if (schemaProblems.length) {
    console.error(`REJECT (bad schema): ${r.name}`);
    for (const p of schemaProblems) console.error(`    - ${p}`);
    rejected += 1;
    continue;
  }

  const slug = slugify(r.name);

  // 1) cert record — scores only, justifications live in public/
  certs.push({
    name: r.name,
    type: r.type || 'Certification',
    discipline: r.discipline || 'PT',
    ...(r.disciplines ? { disciplines: r.disciplines } : {}),
    evidence: r.evidence || '',
    pathScores: r.pathScores,
  });

  // 2) justifications file
  fs.writeFileSync(
    path.join(ROOT, 'public/justifications', `${slug}.json`),
    JSON.stringify({ justifications: r.justifications || {} }, null, 2),
  );

  // 3) citations file — normalize to the standard shape
  const citations = r.citations.map((c) => ({
    authors: c.authors || '',
    year: c.year || null,
    title: c.title || '',
    journal: c.journal || '',
    volume: c.volume || '',
    issue: c.issue || '',
    pages: c.pages || '',
    doi: c.doi || '',
    pmid: c.pmid ? String(c.pmid) : '',
    url: c.url || '',
    library_link: '',
    evidence_type: normalizeEvidenceType(c.evidence_type),
    source_type: normalizeSourceType(c.source_type),
    what_it_says: c.what_it_says || '',
  }));
  fs.writeFileSync(
    path.join(ROOT, 'public/citations', `${slug}.json`),
    JSON.stringify({ citations }, null, 2),
  );

  // 4) meta entry
  const evidence_mix = {};
  const year_dist = {};
  for (const c of citations) {
    const t = c.evidence_type || 'unknown';
    evidence_mix[t] = (evidence_mix[t] || 0) + 1;
    if (c.year) year_dist[c.year] = (year_dist[c.year] || 0) + 1;
  }
  meta[r.name] = {
    slug,
    source: 'workflow-2026-06',
    last_reviewed: '2026-06',
    count: citations.length,
    evidence_mix,
    year_dist,
  };

  existingNames.add(r.name.toLowerCase());
  added += 1;
  console.log(`ADDED: ${r.name} (${citations.length} citations, lenses: ${Object.keys(r.pathScores).join('/')})`);
}

// ── write back ──────────────────────────────────────────────────────────────
const header = `// Per-path certification scoring data.
//
// Each certification carries one or more \`pathScores\` blocks keyed by path
// (clinical / business / academicClinical / research / healthTech). The
// matrix filters certs to those that have a pathScores block for the
// active lens, then ranks them by the lens-specific weighted sum.
//
// Path dimensions + default weights are defined in utils/careerPaths.js.
//
// NOTE: per-dimension justification strings live in
// public/justifications/<slug>.json (lazy-loaded client-side, fs-read at
// build time by the SSG credential pages). Keeping them out of this module
// keeps ~282KB out of the client bundle. See scripts/split_justifications.mjs.

export const ALL_DISCIPLINES = ['PT', 'OT', 'SLP', 'AT', 'EP', 'RT', 'RN', 'MT', 'Audiology', 'Informatics', 'IT', 'HIM', 'QA', 'PM', 'Researcher'];

export const certifications = ${JSON.stringify(certs, null, 2)};
`;
fs.writeFileSync(certPath, header);
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

// 5) recompute siteStats
let total = 0;
let rctSrMa = 0;
for (const e of Object.values(meta)) {
  total += e.count || 0;
  const mix = e.evidence_mix || {};
  rctSrMa += (mix.rct || 0) + (mix.systematic_review || 0) + (mix.meta_analysis || 0);
}
const stats = {
  certCount: Object.keys(meta).length,
  citationTotal: total,
  rctSrMa,
  lensCount: 5,
  dimsPerLens: 6,
};
fs.writeFileSync(
  path.join(ROOT, 'src/data/siteStats.json'),
  JSON.stringify(stats, null, 2) + '\n',
);

console.log(`\nMerged ${added}/${records.length} records.`);
if (rejected > 0) {
  console.error(`\n⚠️  ${rejected} record(s) REJECTED for bad pathScores schema — see above. Fix the dimension keys and re-run.`);
}
console.log('siteStats:', stats);

// Nonzero exit when any record was rejected, so a build/CI pipeline fails
// loudly instead of silently shipping a partial merge.
if (rejected > 0) process.exit(1);
