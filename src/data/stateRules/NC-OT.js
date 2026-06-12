// North Carolina — Occupational Therapist CE rules.
// Source: N.C. Gen. Stat. § 90, Article 18D (Occupational Therapy Practice Act)
//         21 NCAC 38 (Occupational Therapy Rules)
// Board:  https://www.ncbot.org
//
// ⚠️ DRAFT — verify against the current NCBOT worksheet before this state
// goes live. NC OT and PT use different cycles and frameworks.

const rules = {
  state: 'NC',
  licenseType: 'OT',
  jurisdictionName: 'North Carolina',

  citation: '21 NCAC 38',
  boardUrl: 'https://www.ncbot.org',
  lastReviewed: '2026-06',
  verified: false,                  // ⚠️ unverified

  // NCBOT historically uses an annual reporting cycle with ~15 contact hours/yr.
  // We model the 2-year aggregate so the engine math is consistent.
  totalHours: 30,                   // 15 hr/yr × 2 yr
  cycleYears: 2,
  cycleEndsOnOddYear: null,         // NC OT cycle varies by license — verify

  mandatory: {
    // No state-specific mandatory categories known at draft time.
  },

  limits: {
    selfStudy: 15,                  // verify
  },

  firstRenewalExempt: false,        // verify

  notes: [
    '⚠️ DRAFT — NCBOT historically operated on a 15-hour annual cycle. Verify whether this is still the structure or if it has moved to a biennial model.',
    'Confirm whether limits / mandatories changed in the most recent rules revision.',
  ],
};

export default rules;
