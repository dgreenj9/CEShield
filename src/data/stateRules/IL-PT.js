// Illinois: Physical Therapist CE rules.
// Source: 225 ILCS 90 (Illinois Physical Therapy Act)
//         68 Ill. Adm. Code 1340.40 (Continuing Education)
// Board:  https://idfpr.illinois.gov/profs/physther.html
//
// Validated baseline: these values reflect what an IL-licensed physical
// therapist has been using in production.

const rules = {
  state: 'IL',
  licenseType: 'PT',
  jurisdictionName: 'Illinois',

  citation: '225 ILCS 90 / 68 Ill. Adm. Code 1340.40',
  boardUrl: 'https://idfpr.illinois.gov/profs/physther.html',
  lastReviewed: '2026-06',
  verified: true,

  totalHours: 40,
  cycleYears: 2,
  cycleEndsOnOddYear: null,        // IL renewal cycle ends per individual license

  mandatory: {
    ethics: 3,                     // 68 IAC 1340.40(b)(1)
    sexualHarassment: 1,           // PA 100-0762 (2018)
    culturalCompetency: 1,         // PA 102-1011 (effective 2023)
    implicitBias: 1,               // PA 102-0004 (2021)
    dementia: 1,                   // PA 102-0399 (2022)
  },

  limits: {
    selfStudy: 30,                 // TODO: confirm: some sources cite 20
    teaching: 20,
    clinicalInstructor: 10,
    journalClubs: 5,
    inservices: 5,
    districtMeetings: 5,
    skillsCertification: 5,
  },

  firstRenewalExempt: true,

  notes: [
    'New PT licensees are exempt from CE for their first renewal.',
    'Implicit bias and Alzheimer\'s/dementia were added in 2021–2022; cultural competency in 2023.',
    'Sexual harassment training requires 1 hour each renewal regardless of supervisor status (general workforce rule).',
  ],
};

export default rules;
