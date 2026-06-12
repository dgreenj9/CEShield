// Apply R4 cross-map additions: merge the audit agent's pathScores into
// existing clinical certs so they appear under research / healthTech lenses
// where the agent identified legitimate relevance.

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const additions = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'scripts/cross_map_output.json'), 'utf8'),
).additions;

const certPath = path.join(ROOT, 'src/utils/certificationData.js');
const certSrc = fs.readFileSync(certPath, 'utf8');
const m = certSrc.match(/export const certifications = (\[[\s\S]*?\]);/);
const certs = JSON.parse(m[1]);
const byName = new Map(certs.map((c, i) => [c.name, i]));

let applied = 0;
let missing = [];
for (const a of additions) {
  const idx = byName.get(a.name);
  if (idx === undefined) {
    missing.push(a.name);
    continue;
  }
  // Merge in new pathScores blocks. Don't overwrite existing.
  certs[idx].pathScores = {
    ...certs[idx].pathScores,
    ...a.addPaths,
  };
  // Merge justifications (keyed as 'research.dim' / 'healthTech.dim')
  certs[idx].justifications = {
    ...(certs[idx].justifications || {}),
    ...(a.justifications || {}),
  };
  applied += 1;
}

const header = `// Per-path certification scoring data.
//
// Each certification carries one or more \`pathScores\` blocks keyed by path
// (clinical / business / academicClinical / research / healthTech). The
// matrix filters certs to those that have a pathScores block for the
// active lens, then ranks them by the lens-specific weighted sum.
//
// Path dimensions + default weights are defined in utils/careerPaths.js.

export const ALL_DISCIPLINES = ['PT', 'OT', 'SLP', 'AT', 'EP', 'RT', 'RN', 'MT', 'Audiology', 'Informatics', 'IT', 'HIM', 'QA', 'PM', 'Researcher'];

export const certifications = ${JSON.stringify(certs, null, 2)};
`;
fs.writeFileSync(certPath, header);

console.log(`applied: ${applied} cross-map additions`);
if (missing.length) console.log(`MISSING (cert not found): ${missing.join(', ')}`);

// Quick sanity: count certs per path
const counts = {};
for (const c of certs) {
  for (const p of Object.keys(c.pathScores || {})) counts[p] = (counts[p] || 0) + 1;
}
console.log('certs per path now:', counts);
