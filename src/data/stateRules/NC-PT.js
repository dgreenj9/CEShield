// North Carolina — Physical Therapist CE rules.
// Source: N.C. Gen. Stat. § 90, Article 18B (Physical Therapy Practice Act)
//         21 NCAC 48G (Continuing Competence)
// Board:  https://www.ncptboard.org
//
// ⚠️ DRAFT — verify against the current NCBPTE worksheet before this state
// goes live. NC has been actively updating its competence requirements.

const rules = {
  state: 'NC',
  licenseType: 'PT',
  jurisdictionName: 'North Carolina',

  citation: '21 NCAC 48G',
  boardUrl: 'https://www.ncptboard.org/licensure/continuing-competence/',
  lastReviewed: '2026-06',
  verified: false,                  // ⚠️ unverified

  // NCBPTE uses "Points" not "hours" via its Continuing Competence framework
  // (PCS plan-of-study system). Most renewals require demonstration via
  // activities equating to ~30 contact hours per 2-year cycle.
  totalHours: 30,
  cycleYears: 2,
  cycleEndsOnOddYear: true,         // 2-year compliance period

  mandatory: {
    jurisprudence: 2,               // NC added a jurisprudence requirement (verify hours)
    // Ethics is typically embedded in jurisprudence rather than a separate hour count.
  },

  limits: {
    // 21 NCAC 48G permits home-study; conservative cap at ~50%.
    selfStudy: 15,
  },

  firstRenewalExempt: false,        // verify

  notes: [
    '⚠️ DRAFT — NCBPTE uses a points-based "Continuing Competence" model that does not map 1:1 to clock hours. Verify the conversion before launching.',
    'Jurisprudence/ethics: NC requires periodic jurisprudence exam plus a small CE hour count — confirm current numbers.',
    'No implicit-bias / cultural-competency / dementia mandates known at draft time.',
  ],
};

export default rules;
