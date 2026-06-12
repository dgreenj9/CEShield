// Update the existing Women's Health Clinical Specialist record from the
// re-examination: refresh scores + evidence + justifications, and APPEND
// the new credential-level citations to the existing librarian set (dedupe
// by title). Preserves the 76 existing citations.

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const NAME = "Women's Health Clinical Specialist";  // existing record name (keep slug stable)

const REC = JSON.parse(fs.readFileSync('/tmp/wcs_update.json', 'utf8'));

const normEvidence = (raw) => {
  const t = String(raw || '').toLowerCase();
  if (/meta[- _]?anal/.test(t)) return 'meta_analysis';
  if (/systematic|scoping|cochrane/.test(t)) return 'systematic_review';
  if (/random|rct/.test(t)) return 'rct';
  if (/guideline|consensus|credentialing/.test(t)) return 'guideline';
  if (/cohort|longitudinal|prospective/.test(t)) return 'cohort';
  if (/cross[- _]?sectional|survey|workforce/.test(t)) return 'cross_sectional';
  if (/case[- _](report|series)/.test(t)) return 'case_series';
  if (/narrative|review|perspective/.test(t)) return 'narrative';
  return 'unknown';
};
const normSource = (raw) => {
  const t = String(raw || '').toLowerCase();
  if (/gov|bls|nih|onc|fda|cms/.test(t)) return 'government';
  if (/abpts|apta|society|association|academy|credentialing/.test(t)) return 'professional-society';
  if (/industry|vendor|market/.test(t)) return 'industry';
  return 'peer-reviewed';
};

// ── certificationData.js: scores + evidence (keep existing name) ────────────
const certPath = path.join(ROOT, 'src/utils/certificationData.js');
const src = fs.readFileSync(certPath, 'utf8');
const m = src.match(/export const certifications = (\[[\s\S]*\]);\s*$/);
const certs = JSON.parse(m[1]);
const cert = certs.find((c) => c.name === NAME);
if (!cert) throw new Error(`WCS record not found as "${NAME}"`);

cert.type = 'Board Specialty';
cert.evidence = REC.evidence;
cert.pathScores = REC.pathScores;

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

// ── justifications file: overwrite with refreshed text ──────────────────────
const metaPath = path.join(ROOT, 'src/data/citations_meta.json');
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
const slug = meta[NAME].slug;

fs.writeFileSync(
  path.join(ROOT, 'public/justifications', `${slug}.json`),
  JSON.stringify({ justifications: REC.justifications }, null, 2),
);

// ── citations: append new (dedupe by normalized title) ──────────────────────
const cfile = path.join(ROOT, 'public/citations', `${slug}.json`);
const cdata = JSON.parse(fs.readFileSync(cfile, 'utf8'));
const seen = new Set(cdata.citations.map((c) => (c.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60)));

let appended = 0;
for (const c of REC.citations) {
  const key = (c.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
  if (seen.has(key)) continue;
  seen.add(key);
  cdata.citations.push({
    authors: c.authors || '', year: c.year || null, title: c.title || '',
    journal: c.journal || '', volume: c.volume || '', issue: c.issue || '', pages: c.pages || '',
    doi: c.doi || '', pmid: c.pmid ? String(c.pmid) : '', url: c.url || '', library_link: '',
    evidence_type: normEvidence(c.evidence_type), source_type: normSource(c.source_type),
    what_it_says: c.what_it_says || '',
  });
  appended += 1;
}
fs.writeFileSync(cfile, JSON.stringify(cdata, null, 2));

// refresh meta
const evidence_mix = {}; const year_dist = {};
for (const c of cdata.citations) {
  const t = c.evidence_type || 'unknown';
  evidence_mix[t] = (evidence_mix[t] || 0) + 1;
  if (c.year) year_dist[c.year] = (year_dist[c.year] || 0) + 1;
}
meta[NAME].count = cdata.citations.length;
meta[NAME].evidence_mix = evidence_mix;
meta[NAME].year_dist = year_dist;
meta[NAME].last_reviewed = '2026-06';
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

console.log(`WCS updated: scores + evidence + justifications refreshed.`);
console.log(`Citations: ${cdata.citations.length} total (+${appended} appended, ${REC.citations.length - appended} were dupes of librarian set).`);
