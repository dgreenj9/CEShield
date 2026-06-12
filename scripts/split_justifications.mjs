// Split per-cert justification strings out of certificationData.js into
// public/justifications/<slug>.json files.
//
// Why: certificationData.js is imported by client components (the matrix),
// so the whole file lands in the client bundle. The justifications blocks
// are 68% of the file (~282KB) but are only read in the detail pane — the
// same access pattern as citations, which already lazy-load per cert.
//
// After this runs:
//   - certificationData.js keeps scores/metadata only
//   - public/justifications/<slug>.json holds { justifications: {...} }
//   - CertificationDetail fetches them on demand (justificationsLibrary.js)
//   - The /credentials/[slug] SSG page reads them via fs at build time

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const certPath = path.join(ROOT, 'src/utils/certificationData.js');
const metaPath = path.join(ROOT, 'src/data/citations_meta.json');
const outDir = path.join(ROOT, 'public/justifications');

const src = fs.readFileSync(certPath, 'utf8');
const m = src.match(/export const certifications = (\[[\s\S]*\]);\s*$/);
if (!m) throw new Error('could not parse certificationData.js');
const certs = JSON.parse(m[1]);
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

fs.mkdirSync(outDir, { recursive: true });

let written = 0;
let missingSlug = [];
for (const cert of certs) {
  const just = cert.justifications;
  if (!just || Object.keys(just).length === 0) {
    delete cert.justifications;
    continue;
  }
  const slug = meta[cert.name]?.slug;
  if (!slug) {
    missingSlug.push(cert.name);
    continue; // keep justifications inline if we can't address them by slug
  }
  fs.writeFileSync(
    path.join(outDir, `${slug}.json`),
    JSON.stringify({ justifications: just }, null, 2),
  );
  delete cert.justifications;
  written += 1;
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

const newSize = fs.statSync(certPath).size;
console.log(`wrote ${written} justification files to public/justifications/`);
console.log(`certificationData.js: ${(src.length / 1024).toFixed(0)}KB -> ${(newSize / 1024).toFixed(0)}KB`);
if (missingSlug.length) console.log('kept inline (no slug):', missingSlug.join(', '));
