// One-shot migration: convert certificationData.js from { subScores, roiSignals }
// to { pathScores } keyed by path. Preserves clinical-path data exactly;
// auto-derives business + academicClinical from existing roiSignals + subScores.
//
// Research + HealthTech paths get no entries for the existing 110 clinical
// certs — they'll be filtered out under those lenses (correct behavior).
// New research/healthtech credentials get added in Phases R2/R3.
//
// Run: node scripts/migrate_to_path_scoring.mjs

import { certifications as src } from '../src/utils/certificationData.js';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../src/utils/certificationData.js');

// Auto-derivation rules for paths we have no native scores for yet.

const deriveBusiness = (cert) => {
  const s = cert.subScores || {};
  const r = cert.roiSignals || {};
  const pp = r.privatePractice ?? 0;
  const md = s.marketDemand ?? 0;
  return {
    cashPayViability: pp,
    pricingLeverage: Math.round((pp * 0.7) + (md * 0.3)),
    marketDifferentiation: Math.max(0, Math.min(100, Math.round(md * 0.6 + (100 - (s.caseloadApplicability ?? 50)) * 0.4))),
    ownerLeverage: pp,
    marketDemand: md,
    efficiency: s.efficiency ?? 0,
  };
};

const deriveAcademicClinical = (cert) => {
  const s = cert.subScores || {};
  const r = cert.roiSignals || {};
  const ac = r.academic ?? 0;
  const co = s.clinicalOutcomes ?? 0;
  return {
    facultyRecognition: ac,
    scholarship: Math.round(co * 0.7 + ac * 0.3),
    teachingValue: ac,
    evidenceDepth: co,
    facultyDemand: ac,
    efficiency: s.efficiency ?? 0,
  };
};

// Re-key justifications: 'clinicalOutcomes' → 'clinical.clinicalOutcomes'.
// For business + academicClinical we don't autogenerate justifications;
// callers will see a "Derived from clinical scoring — pending review" hint
// in the UI when no native justification is present.
const rekeyJustifications = (j) => {
  if (!j || typeof j !== 'object') return {};
  const out = {};
  for (const [dim, text] of Object.entries(j)) {
    out[`clinical.${dim}`] = text;
  }
  return out;
};

// JSON-with-extras pretty-printer. We want output that's valid JS module
// syntax — single-quoted strings where possible, no trailing commas issue.
// Simplest path: write JSON.stringify output and accept double quotes.
const toJs = (cert) => {
  const out = {
    name: cert.name,
    type: cert.type,
    discipline: cert.discipline,
    disciplines: cert.disciplines,
    evidence: cert.evidence,
    pathScores: {
      clinical: { ...(cert.subScores || {}) },
      business: deriveBusiness(cert),
      academicClinical: deriveAcademicClinical(cert),
    },
    justifications: rekeyJustifications(cert.justifications),
    // Preserve original roiSignals as a legacy reference — useful during
    // R4 cross-mapping audit. Stripped in a later cleanup pass.
    legacyRoiSignals: cert.roiSignals || null,
  };
  return out;
};

const migrated = src.map(toJs);

// Render file
const header = `// Per-path certification scoring data.
//
// Each certification carries one or more \`pathScores\` blocks keyed by path
// (clinical / business / academicClinical / research / healthTech). The
// matrix filters certs to those that have a pathScores block for the
// active lens, then ranks them by the lens-specific weighted sum.
//
// Path dimensions + default weights are defined in utils/careerPaths.js.
//
// Original \`subScores\` and \`roiSignals\` have been migrated:
//   - clinical pathScores = direct copy of original subScores (lossless)
//   - business pathScores  = derived from original (privatePractice signal
//     informs cashPayViability + pricingLeverage + ownerLeverage; existing
//     marketDemand + efficiency carry through)
//   - academicClinical pathScores = derived (academic signal informs
//     facultyRecognition + teachingValue + facultyDemand; clinicalOutcomes
//     informs evidenceDepth + scholarship)
//   - research + healthTech pathScores = NOT SET for existing clinical certs
//     (they're filtered out under those lenses).
//
// The business + academicClinical derivations are lossy and should be
// reviewed/refined in Phase R4. Derived dimensions get no justification
// text yet; the UI flags them as "pending review".

export const ALL_DISCIPLINES = ['PT', 'OT', 'SLP', 'AT', 'EP', 'RT', 'RN', 'MT', 'Audiology'];

export const certifications = ${JSON.stringify(migrated, null, 2)};
`;

fs.writeFileSync(OUT, header);
console.log(`wrote ${OUT}`);
console.log(`  ${migrated.length} certs migrated`);
console.log(`  schema: pathScores { clinical, business, academicClinical }`);
console.log(`  legacy roiSignals preserved as legacyRoiSignals for R4 audit`);
