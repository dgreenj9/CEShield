// Illinois — Occupational Therapist CE rules.
// Source: 225 ILCS 75 (Illinois Occupational Therapy Practice Act)
//         68 Ill. Adm. Code 1315.165 (Continuing Education)
// Board:  https://idfpr.illinois.gov/profs/occther.html

const rules = {
  state: 'IL',
  licenseType: 'OT',
  jurisdictionName: 'Illinois',

  citation: '225 ILCS 75 / 68 Ill. Adm. Code 1315.165',
  boardUrl: 'https://idfpr.illinois.gov/profs/occther.html',
  lastReviewed: '2026-06',
  verified: true,                   // confirmed by user (DPT) baseline; recheck OT ethics

  totalHours: 24,
  cycleYears: 2,
  cycleEndsOnOddYear: null,

  mandatory: {
    ethics: 1,                     // FLAG: prior review claimed IDFPR requires 3 — verify
    sexualHarassment: 1,           // PA 100-0762 (2018)
    culturalCompetency: 1,         // PA 102-1011 (effective 2023)
    implicitBias: 1,               // PA 102-0004 (2021)
    dementia: 1,                   // PA 102-0399 (2022)
  },

  limits: {
    selfStudy: 12,
    teaching: 12,
    clinicalInstructor: 6,
    journalClubs: 3,
    inservices: 3,
    districtMeetings: 3,
    skillsCertification: 3,
  },

  firstRenewalExempt: true,

  notes: [
    'OT cycle is 2 years with a 24-hour requirement (smaller than the PT 40-hour cycle).',
    'New OT licensees are exempt from CE for their first renewal.',
    'OT ethics hour count is currently 1; pending re-verification against the IDFPR renewal worksheet.',
  ],
};

export default rules;
