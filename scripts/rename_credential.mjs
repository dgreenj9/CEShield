// Rename a credential across all data stores: certificationData.js,
// citations_meta.json (key + slug), and the public/citations +
// public/justifications files. Usage:
//   node scripts/rename_credential.mjs "Old Name" "New Name"

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const [, , oldName, newName] = process.argv;
if (!oldName || !newName) {
  console.error('Usage: node scripts/rename_credential.mjs "Old Name" "New Name"');
  process.exit(1);
}

const slugify = (name) =>
  name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[-\s]+/g, '-').replace(/^-|-$/g, '');

const newSlug = slugify(newName);

// certificationData.js
const certPath = path.join(ROOT, 'src/utils/certificationData.js');
const src = fs.readFileSync(certPath, 'utf8');
const m = src.match(/export const certifications = (\[[\s\S]*\]);\s*$/);
const certs = JSON.parse(m[1]);
const cert = certs.find((c) => c.name === oldName);
if (!cert) { console.error(`NOT FOUND: ${oldName}`); process.exit(1); }
cert.name = newName;

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

// citations_meta.json
const metaPath = path.join(ROOT, 'src/data/citations_meta.json');
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
const oldEntry = meta[oldName];
const oldSlug = oldEntry?.slug;
if (oldEntry) {
  delete meta[oldName];
  oldEntry.slug = newSlug;
  meta[newName] = oldEntry;
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
}

// rename public files
for (const dir of ['public/citations', 'public/justifications']) {
  if (!oldSlug) break;
  const from = path.join(ROOT, dir, `${oldSlug}.json`);
  const to = path.join(ROOT, dir, `${newSlug}.json`);
  if (fs.existsSync(from)) fs.renameSync(from, to);
}

console.log(`Renamed "${oldName}" → "${newName}"`);
console.log(`slug: ${oldSlug} → ${newSlug}`);
