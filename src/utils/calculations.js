// CE compliance rules engine.
//
// State-specific rules are now declarative — see src/data/stateRules/.
// This file is the math layer: given a rules object + a list of courses,
// produce hour totals and category breakdowns. Adding a new state means
// dropping a file in src/data/stateRules/, NOT editing this engine.

import { getRulesFor } from '../data/stateRules';

/**
 * Look up the requirements for a (state, licenseType) pair.
 *
 * Returns null when no rules are registered. Returns a normalized object
 * with `total`, `mandatory`, `limits`, plus metadata (`verified`,
 * `citation`, `boardUrl`, `notes`) so the UI can surface a warning banner
 * for unverified states.
 */
export const getRequirements = (state, licenseType) => {
  const rules = getRulesFor(state, licenseType);
  if (!rules) return null;

  return {
    state: rules.state,
    licenseType: rules.licenseType,
    jurisdictionName: rules.jurisdictionName,
    citation: rules.citation,
    boardUrl: rules.boardUrl,
    lastReviewed: rules.lastReviewed,
    verified: rules.verified,
    firstRenewalExempt: rules.firstRenewalExempt,
    notes: rules.notes || [],

    total: rules.totalHours,
    cycleYears: rules.cycleYears,
    mandatory: { ...rules.mandatory },
    limits: { ...rules.limits },
  };
};

export const calculateHours = (courses) => {
  const hours = {
    total: 0, general: 0,
    // Known category keys — match the `category` enum on a course row and
    // the keys used in any state's `mandatory` map.
    ethics: 0, sexualHarassment: 0, culturalCompetency: 0,
    implicitBias: 0, dementia: 0, jurisprudence: 0,
    // Known format keys — match the `format` enum on a course row and
    // the keys used in any state's `limits` map.
    selfStudy: 0, teaching: 0, clinicalInstructor: 0,
    journalClubs: 0, inservices: 0, districtMeetings: 0, skillsCertification: 0,
  };

  courses.forEach((course) => {
    const courseHours = parseFloat(course.hours) || 0;
    hours.total += courseHours;

    if (hours[course.category] !== undefined) {
      hours[course.category] += courseHours;
    }
    if (hours[course.format] !== undefined) {
      hours[course.format] += courseHours;
    }
  });

  return hours;
};
