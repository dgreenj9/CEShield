// Wisconsin — Physical Therapist CE rules.
// Source: Wis. Stat. ch. 448 (Subch. III, Physical Therapy)
//         Wis. Admin. Code PT 5 (Continuing Education)
// Board:  https://dsps.wi.gov/Pages/Professions/PhysicalTherapist/Default.aspx
//
// ⚠️ DRAFT — values below are best-effort and require verification against the
// current WI DSPS PT renewal worksheet before this state goes live.

const rules = {
  state: 'WI',
  licenseType: 'PT',
  jurisdictionName: 'Wisconsin',

  citation: 'Wis. Admin. Code PT 5',
  boardUrl: 'https://docs.legis.wisconsin.gov/code/admin_code/pt/5',
  lastReviewed: '2026-06',
  verified: false,                  // ⚠️ unverified — see notes

  // PT 5.01: 30 continuing-education hours per biennial cycle (cycle ending
  // August 31 of odd-numbered years for licensees renewing September 1).
  totalHours: 30,
  cycleYears: 2,
  cycleEndsOnOddYear: true,         // 2-year cycle, ends 8/31 of odd years

  mandatory: {
    // WI PT does not currently require a fixed ethics hour count the way IL does.
    // Most CE topics qualify if directly related to physical therapy practice.
    // Leave entries blank rather than guessing.
  },

  limits: {
    // PT 5.04: home-study / online courses are accepted but caps vary by topic.
    // Conservative draft: cap self-study at 50% (15 hours).
    selfStudy: 15,
  },

  firstRenewalExempt: false,        // verify — some states exempt first renewal

  notes: [
    '⚠️ DRAFT — verify totalHours, cycle dates, and any mandatory sub-topics against the current DSPS PT renewal worksheet before publishing.',
    'WI does not have IL-style implicit-bias / cultural-competency mandates as of last review.',
    'Cycle traditionally ends 8/31 of odd-numbered years for licensees renewing September 1.',
  ],
};

export default rules;
