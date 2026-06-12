// Apply the blind-spot audit corrections: score adjustments, evidence-text
// appends, and added citations for ITPT and the amputee credential.

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PATCHES = [
  {
    name: 'ImPACT Trained Physical Therapist (ITPT)',
    scoreChanges: [
      { path: 'clinical', dim: 'caseloadApplicability', to: 60 },
      { path: 'clinical', dim: 'marketDemand', to: 66 },
    ],
    evidenceAppend:
      ' Concussion-rehabilitation evidence extends to non-athlete adults (Langevin 2022, J Neurotrauma RCT in persistent mTBI), so the credential’s clinical value is not limited to sports return-to-play despite ImPACT-the-test’s sports-baseline orientation.',
    addCitations: [
      {
        authors: 'Langevin P, Frémont P, Fait P, Dubé MO, Bertrand-Charette M, Roy JS',
        year: 2022,
        title: 'Cervicovestibular Rehabilitation in Adults with Mild Traumatic Brain Injury: A Randomized Clinical Trial',
        journal: 'Journal of Neurotrauma',
        volume: '', issue: '', pages: '',
        doi: '10.1089/neu.2021.0508', pmid: '35102743',
        url: 'https://pubmed.ncbi.nlm.nih.gov/35102743/',
        evidence_type: 'rct', source_type: 'peer-reviewed',
        what_it_says: 'In 60 NON-athlete adults with persistent post-mTBI symptoms, cervicovestibular rehabilitation plus symptom-limited aerobic exercise improved post-concussion symptom severity — showing the rehab approach works beyond the athlete population.',
      },
    ],
  },
  {
    name: 'Lower Limb Amputee Rehabilitation (Physiopedia/ICRC Certificate)',
    scoreChanges: [
      { path: 'clinical', dim: 'caseloadApplicability', to: 42 },
      { path: 'business', dim: 'cashPayViability', to: 35 },
      { path: 'business', dim: 'pricingLeverage', to: 30 },
    ],
    evidenceAppend:
      ' Although acute/inpatient pre-prosthetic care is the entry point, the bulk of prosthetic gait, balance, and return-to-activity training occurs across outpatient, home-health, and community settings, where PT–prosthetist collaboration is ongoing — so applicability is not confined to IRF/VA/acute.',
    addCitations: [
      {
        authors: 'Christiansen CL, Miller MJ, Murray AM, Stephenson RO, Stevens-Lapsley JE, Hiatt WR, Schenkman ML',
        year: 2020,
        title: 'Behavior-Change Intervention Targeting Physical Function and Walking Activity After Dysvascular Amputation: A Randomized Controlled Trial',
        journal: 'Physical Therapy',
        volume: '100', issue: '5', pages: '773-787',
        doi: '10.1093/ptj/pzaa033', pmid: '32154873',
        url: 'https://academic.oup.com/ptj/article/100/5/773/5707560',
        evidence_type: 'rct', source_type: 'peer-reviewed',
        what_it_says: 'An OUTPATIENT evidence-based amputee rehabilitation program targeting physical function and community walking improved outcomes after lower-limb amputation, showing the prosthetic-training caseload extends well beyond the acute/inpatient setting.',
      },
    ],
  },
];

// ── certificationData.js: scores + evidence text ────────────────────────────
const certPath = path.join(ROOT, 'src/utils/certificationData.js');
const src = fs.readFileSync(certPath, 'utf8');
const m = src.match(/export const certifications = (\[[\s\S]*\]);\s*$/);
const certs = JSON.parse(m[1]);

for (const p of PATCHES) {
  const cert = certs.find((c) => c.name === p.name);
  if (!cert) { console.error(`NOT FOUND: ${p.name}`); continue; }
  for (const sc of p.scoreChanges) {
    const before = cert.pathScores[sc.path][sc.dim];
    cert.pathScores[sc.path][sc.dim] = sc.to;
    console.log(`${p.name}: ${sc.path}.${sc.dim} ${before} → ${sc.to}`);
  }
  if (p.evidenceAppend) cert.evidence = (cert.evidence || '') + p.evidenceAppend;
}

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

// ── citations + meta ────────────────────────────────────────────────────────
const metaPath = path.join(ROOT, 'src/data/citations_meta.json');
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

for (const p of PATCHES) {
  if (!p.addCitations?.length) continue;
  const slug = meta[p.name]?.slug;
  if (!slug) { console.error(`no slug for ${p.name}`); continue; }
  const cfile = path.join(ROOT, 'public/citations', `${slug}.json`);
  const data = JSON.parse(fs.readFileSync(cfile, 'utf8'));
  for (const c of p.addCitations) {
    data.citations.push({
      authors: c.authors, year: c.year, title: c.title, journal: c.journal,
      volume: c.volume || '', issue: c.issue || '', pages: c.pages || '',
      doi: c.doi || '', pmid: c.pmid ? String(c.pmid) : '', url: c.url || '',
      library_link: '', evidence_type: c.evidence_type || 'unknown',
      source_type: c.source_type || 'peer-reviewed', what_it_says: c.what_it_says || '',
    });
  }
  fs.writeFileSync(cfile, JSON.stringify(data, null, 2));

  // refresh meta count + evidence_mix + year_dist
  const evidence_mix = {}; const year_dist = {};
  for (const c of data.citations) {
    const t = c.evidence_type || 'unknown';
    evidence_mix[t] = (evidence_mix[t] || 0) + 1;
    if (c.year) year_dist[c.year] = (year_dist[c.year] || 0) + 1;
  }
  meta[p.name].count = data.citations.length;
  meta[p.name].evidence_mix = evidence_mix;
  meta[p.name].year_dist = year_dist;
  console.log(`${p.name}: +${p.addCitations.length} citation(s), now ${data.citations.length}`);
}

fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
console.log('Audit patches applied.');
