// Wisconsin: Occupational Therapist CE rules.
// Source: Wis. Stat. ch. 448 (Subch. VII, Occupational Therapy)
//         Wis. Admin. Code OT 4 (Continuing Education)
// Board:  https://dsps.wi.gov/Pages/Professions/OccupationalTherapist/Default.aspx
//
// ⚠️ DRAFT: values below require verification against the current WI DSPS OT
// renewal worksheet before this state goes live.

const rules = {
  state: 'WI',
  licenseType: 'OT',
  jurisdictionName: 'Wisconsin',

  citation: 'Wis. Admin. Code OT 4',
  boardUrl: 'https://docs.legis.wisconsin.gov/code/admin_code/ot/4',
  lastReviewed: '2026-06',
  verified: false,                  // ⚠️ unverified

  // OT 4.02: 24 continuing-education hours per biennial cycle (typically ending
  // September 30 of odd-numbered years).
  totalHours: 24,
  cycleYears: 2,
  cycleEndsOnOddYear: true,

  mandatory: {
    // No state-specific mandatory hour requirements known at draft time.
  },

  limits: {
    // OT 4.03: at least 12 of the 24 hours must be Category A (live, peer-reviewed).
    // Implementation: model this as a cap of 12 hours on self-study (Category B).
    selfStudy: 12,
  },

  firstRenewalExempt: false,        // verify

  notes: [
    '⚠️ DRAFT: verify totalHours, cycle dates, and Category A/B requirements against the current DSPS OT renewal worksheet before publishing.',
    'WI distinguishes Category A (live, peer-reviewed: ≥12 hr) from Category B (other). Modeled here as a 12-hour cap on self-study.',
    'No state-specific mandatory training (ethics / cultural competency / implicit bias / dementia) known at draft time.',
  ],
};

export default rules;
