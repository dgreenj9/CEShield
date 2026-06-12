// Merge R2 (research) + R3 (healthtech) workflow outputs into the data files.
//
// Updates:
//   src/utils/certificationData.js         — appends 20 new certs with their pathScores
//   src/data/citations_meta.json           — adds metadata entries (slug, source, evidence_mix, year_dist)
//   public/citations/<slug>.json           — writes per-cert citation files
//
// Workflow outputs live in /tmp/.../wczoz2gml.output and /tmp/.../w7l45ykeg.output

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const R2_PATH = '/private/tmp/claude-501/-Users-danielgreen/a7890bb3-4e52-40bb-bed6-bca31566958e/tasks/wczoz2gml.output';
const R3_PATH = '/private/tmp/claude-501/-Users-danielgreen/a7890bb3-4e52-40bb-bed6-bca31566958e/tasks/w7l45ykeg.output';

const r2 = JSON.parse(fs.readFileSync(R2_PATH, 'utf8')).result.credentials;
const r3 = JSON.parse(fs.readFileSync(R3_PATH, 'utf8')).result.credentials;
const allNew = [...r2, ...r3];

// ── slugify helper (same as scripts/split_citations.py) ───────────────────
const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[-\s]+/g, '-')
    .replace(/^-|-$/g, '');

// Classify citation evidence_type for the evidence_mix histogram. Same
// heuristic Tailwind as scripts/normalize_citations.py.
const EVIDENCE_PATTERNS = [
  ['meta_analysis',     /\bmeta[- ]?anal/i],
  ['systematic_review', /\bsystematic review\b|\bscoping review\b|\bumbrella review\b/i],
  ['rct',               /\brandomi[sz]ed\b|\brct\b/i],
  ['protocol',          /\bprotocol\b(?!.*\bguideline\b)/i],
  ['guideline',         /\bclinical practice guideline\b|\bconsensus statement\b|\brecommendation\b|\bworkforce report\b|\boccupational outlook\b/i],
  ['cohort',            /\bcohort\b|\bprospective\b|\blongitudinal\b/i],
  ['cross_sectional',   /\bcross[- ]sectional\b|\bsurvey\b|\bnational survey\b/i],
  ['case_series',       /\bcase series\b|\bcase report\b|\bcase stud/i],
  ['narrative',         /\bnarrative review\b|\bliterature review\b|\boverview\b|\bperspective\b/i],
  ['qualitative',       /\bqualitative\b/i],
];

const classifyEvidence = (title) => {
  if (!title) return 'unknown';
  for (const [label, re] of EVIDENCE_PATTERNS) {
    if (re.test(title)) return label;
  }
  return 'unknown';
};

// ── build the cert-data entries for the new credentials ────────────────────
// Schema must match the migrated certificationData.js: name, type, discipline,
// disciplines, evidence, pathScores, justifications, legacyRoiSignals (null).

const newCertEntries = allNew.map((c) => ({
  name: c.name,
  type: c.type,
  discipline: c.discipline,
  disciplines: c.disciplines,
  evidence: c.evidence,
  pathScores: c.pathScores,
  justifications: c.justifications || {},
  legacyRoiSignals: null,
}));

// ── append to certificationData.js ─────────────────────────────────────────
const certPath = path.join(ROOT, 'src/utils/certificationData.js');
const certSrc = fs.readFileSync(certPath, 'utf8');
const m = certSrc.match(/export const certifications = (\[[\s\S]*?\]);/);
if (!m) throw new Error('could not locate certifications array in certificationData.js');
const existing = JSON.parse(m[1]);

// Dedupe — if a workflow returned a cert that already exists (e.g.,
// "PhD/ScD in Rehabilitation Science" vs original "Research Doctorates (PhD/ScD)"),
// keep the new richer entry by replacing the old one. Otherwise append.
const byName = new Map(existing.map((e, i) => [e.name, i]));

// Manual alias map for credentials whose existing names differ from R2/R3 names
const ALIASES = {
  'PhD/ScD in Rehabilitation Science': 'Research Doctorates (PhD/ScD)',
};

let replaced = 0;
let appended = 0;
for (const entry of newCertEntries) {
  const existingName = ALIASES[entry.name];
  if (existingName && byName.has(existingName)) {
    const idx = byName.get(existingName);
    // Keep the OLD name to preserve any external references; merge in the
    // new pathScores + justifications + evidence + citations.
    existing[idx] = {
      ...existing[idx],
      evidence: entry.evidence,
      pathScores: { ...existing[idx].pathScores, ...entry.pathScores },
      justifications: { ...existing[idx].justifications, ...entry.justifications },
      disciplines: Array.from(new Set([...(existing[idx].disciplines || []), ...(entry.disciplines || [])])),
    };
    replaced += 1;
  } else if (byName.has(entry.name)) {
    const idx = byName.get(entry.name);
    existing[idx] = { ...existing[idx], ...entry };
    replaced += 1;
  } else {
    existing.push(entry);
    appended += 1;
  }
}

const certHeader = `// Per-path certification scoring data.
//
// Each certification carries one or more \`pathScores\` blocks keyed by path
// (clinical / business / academicClinical / research / healthTech). The
// matrix filters certs to those that have a pathScores block for the
// active lens, then ranks them by the lens-specific weighted sum.
//
// Path dimensions + default weights are defined in utils/careerPaths.js.

export const ALL_DISCIPLINES = ['PT', 'OT', 'SLP', 'AT', 'EP', 'RT', 'RN', 'MT', 'Audiology', 'Informatics', 'IT', 'HIM', 'QA', 'PM', 'Researcher'];

export const certifications = ${JSON.stringify(existing, null, 2)};
`;

fs.writeFileSync(certPath, certHeader);
console.log(`certificationData.js: ${replaced} merged, ${appended} appended (now ${existing.length} total)`);

// ── update citation metadata + write per-cert citation files ───────────────
const metaPath = path.join(ROOT, 'src/data/citations_meta.json');
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

const citationsDir = path.join(ROOT, 'public/citations');

// Track existing slugs to disambiguate
const existingSlugs = new Set(Object.values(meta).map((e) => e.slug));

let citationFilesWritten = 0;
for (const c of allNew) {
  // Determine the canonical name we stored in the cert data (may be aliased)
  const aliasTarget = ALIASES[c.name];
  const canonicalName = aliasTarget || c.name;

  // Build evidence_mix + year_dist + citation array for the metadata
  const evidenceMix = {};
  const yearDist = {};
  const citationsForFile = (c.citations || []).map((cit) => {
    const et = classifyEvidence(cit.title);
    evidenceMix[et] = (evidenceMix[et] || 0) + 1;
    if (cit.year) yearDist[cit.year] = (yearDist[cit.year] || 0) + 1;
    return {
      authors: cit.authors || '',
      year: cit.year ?? null,
      title: cit.title || '',
      journal: cit.journal || '',
      volume: '',
      issue: '',
      pages: '',
      doi: cit.doi || '',
      pmid: cit.pmid || '',
      url: '',
      library_link: '',
      evidence_type: et,
      // Extra fields specific to the R2/R3 workflow outputs
      source_type: cit.source_type || 'unknown',
      what_it_says: cit.what_it_says || '',
    };
  });

  let slug = slugify(canonicalName);
  if (existingSlugs.has(slug) && !meta[canonicalName]) {
    // collision with a different cert — disambiguate
    let i = 2;
    while (existingSlugs.has(`${slug}-${i}`)) i += 1;
    slug = `${slug}-${i}`;
  }
  existingSlugs.add(slug);

  meta[canonicalName] = {
    slug,
    source: 'workflow-2026-06',
    last_reviewed: '2026-06',
    count: citationsForFile.length,
    evidence_mix: evidenceMix,
    year_dist: Object.fromEntries(Object.entries(yearDist).map(([y, n]) => [String(y), n])),
  };

  const outFile = path.join(citationsDir, `${slug}.json`);
  fs.writeFileSync(outFile, JSON.stringify({ citations: citationsForFile }, null, 2));
  citationFilesWritten += 1;
}

fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
console.log(`citations_meta.json: ${Object.keys(meta).length} cert entries`);
console.log(`public/citations/: ${citationFilesWritten} new files written`);
console.log(`\nDone. Now: rm -rf .next && npm run build`);
