// Registry of all supported (state, licenseType) rule sets.
// To add a state: drop a {STATE}-{LICENSE}.js file in this directory, import
// it here, and add it to the maps below. The engine in utils/calculations.js
// picks up the new entry automatically.

import IL_PT from './IL-PT';
import IL_OT from './IL-OT';
import WI_PT from './WI-PT';
import WI_OT from './WI-OT';
import NC_PT from './NC-PT';
import NC_OT from './NC-OT';

const RULES = {
  IL: { PT: IL_PT, OT: IL_OT },
  WI: { PT: WI_PT, OT: WI_OT },
  NC: { PT: NC_PT, OT: NC_OT },
};

export const SUPPORTED_STATES = Object.keys(RULES);

export const SUPPORTED_LICENSE_TYPES = ['PT', 'OT'];

// Pretty names + verified status for the state picker.
export const stateSummaries = () =>
  SUPPORTED_STATES.flatMap((state) =>
    SUPPORTED_LICENSE_TYPES.flatMap((lic) => {
      const r = RULES[state]?.[lic];
      if (!r) return [];
      return [{
        key: `${state}-${lic}`,
        state,
        licenseType: lic,
        jurisdictionName: r.jurisdictionName,
        totalHours: r.totalHours,
        verified: r.verified,
      }];
    })
  );

export const getRulesFor = (state, licenseType) =>
  RULES[state]?.[licenseType] || null;

// SEO-friendly slug for the per-state landing page route. Example:
//   ('IL', 'PT') → 'illinois-pt-ce-requirements'
// Long-form because the slug is the URL Google indexes; we want the
// keywords ("illinois pt ce requirements") in the path itself.
export const slugForStateLicense = (state, licenseType) => {
  const r = RULES[state]?.[licenseType];
  if (!r) return null;
  const stateSlug = r.jurisdictionName.toLowerCase().replace(/\s+/g, '-');
  return `${stateSlug}-${licenseType.toLowerCase()}-ce-requirements`;
};

// Inverse — given a URL slug, find the (state, licenseType) pair.
export const parseStateLicenseSlug = (slug) => {
  if (!slug) return null;
  for (const state of SUPPORTED_STATES) {
    for (const lic of SUPPORTED_LICENSE_TYPES) {
      if (slugForStateLicense(state, lic) === slug) {
        return { state, licenseType: lic };
      }
    }
  }
  return null;
};

// All (state, licenseType, slug, rules) combos — used by Next's
// generateStaticParams for SSG and by the /states index page.
export const allStateLicenseEntries = () =>
  SUPPORTED_STATES.flatMap((state) =>
    SUPPORTED_LICENSE_TYPES.map((lic) => {
      const r = RULES[state]?.[lic];
      if (!r) return null;
      return {
        state,
        licenseType: lic,
        slug: slugForStateLicense(state, lic),
        rules: r,
      };
    }).filter(Boolean),
  );

export default RULES;
