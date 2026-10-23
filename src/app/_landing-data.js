// Server-only data for the landing page. Everything the homepage prints is
// computed here from the real dataset (credentials, lens definitions, the
// citation library, the state rule sets) and handed to the client islands
// as a compact array, so the 150KB credential module never ships to the
// browser for "/".

import { certifications } from '@/utils/certificationData';
import { PATHS, PATH_ORDER, PATH_DIMENSIONS, getPathDefaultWeights } from '@/utils/careerPaths';
import { computeScore, certScoresForPath } from '@/utils/certScoring';
import { allStateLicenseEntries } from '@/data/stateRules';
import citationsMeta from '@/data/citations_meta.json';

const shortLabel = (key) => PATHS[key].label.replace(' & Industry', '');
const firstSentence = (s) => (s.match(/^[^.]*\./) || [s])[0];

// One row per credential: name, slug, type, disciplines, citation count, and
// the composite score under each lens at its default weights (null when the
// credential is not scored in that lens).
export function landingCerts() {
  return certifications.map((c) => {
    const meta = citationsMeta[c.name] || {};
    const s = {};
    for (const key of PATH_ORDER) {
      const subs = certScoresForPath(c, key);
      s[key] = subs ? computeScore(subs, getPathDefaultWeights(key)) : null;
    }
    return {
      n: c.name,
      slug: meta.slug || null,
      t: c.type || '',
      d: c.disciplines || [],
      c: meta.count || 0,
      s,
    };
  });
}

// Lens summaries: label, first sentence of the definition, how many
// credentials it scores, its leader, and its three heaviest dimensions.
export function landingLenses(certs) {
  return PATH_ORDER.map((key) => {
    const ranked = certs
      .filter((c) => c.s[key] != null)
      .sort((a, b) => b.s[key] - a.s[key]);
    const weights = getPathDefaultWeights(key);
    const heaviest = Object.entries(weights)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([dim]) => PATH_DIMENSIONS[key][dim].label.toLowerCase());
    return {
      key,
      label: shortLabel(key),
      fullLabel: PATHS[key].label,
      blurb: firstSentence(PATHS[key].description),
      count: ranked.length,
      leader: ranked[0] ? { n: ranked[0].n, v: ranked[0].s[key] } : null,
      heaviest,
    };
  });
}

// State rule sets for the compliance section.
export function landingStates() {
  return allStateLicenseEntries().map((e) => ({
    slug: e.slug,
    state: e.state,
    name: e.rules.jurisdictionName,
    license: e.licenseType,
    hours: e.rules.totalHours,
    years: e.rules.cycleYears,
    mandatory: Object.values(e.rules.mandatory || {}).filter((v) => v > 0).length,
    verified: !!e.rules.verified,
  }));
}
