import { canonicalCourseUrl } from './educationCatalog.js';

export const PLAN_KEY = 'ceshield-learning-plan-v1';
export const EMPTY_PLAN = { version: 1, profession: '', jurisdiction: '', items: [] };
export const PROFESSIONS = ['PT', 'PTA', 'OT', 'OTA', 'SLP', 'SLPA', 'Audiology', 'Other'];
export const US_STATES = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
export function validPlanDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function normalizePlan(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.items)) throw new Error('Unsupported plan file.');
  const seen = new Set();
  return { version: 1, profession: PROFESSIONS.includes(value.profession) ? value.profession : '', jurisdiction: US_STATES.includes(value.jurisdiction) ? value.jurisdiction : '',
    items: value.items.filter(x => x && typeof x.courseId === 'string' && x.courseId.trim() && x.courseId.length <= 160 && !seen.has(x.courseId) && seen.add(x.courseId)).slice(0, 100).map(x => ({courseId: x.courseId, targetDate: validPlanDate(x.targetDate) ? x.targetDate : '', note: typeof x.note === 'string' ? x.note.slice(0, 1000) : ''})) };
}
export function resolvePlan(plan, courses) {
  const lookup = new Map();
  for (const c of courses) if (c.availability !== 'closed') for (const id of [c.id, ...(c.aliases || [])]) lookup.set(id, c);
  const seen = new Set();
  return plan.items.map(item => ({...item, course: lookup.get(item.courseId) || null})).filter(item => !item.course || (!seen.has(item.course.id) && seen.add(item.course.id)));
}
export function acceptanceFor(course, { profession, jurisdiction, date }) {
  if (!PROFESSIONS.includes(profession) || !US_STATES.includes(jurisdiction) || !validPlanDate(date)) return {status: 'unknown', message: 'Choose a profession, state, and planned date to check recorded acceptance evidence.'};
  // Provider CEUs, course hours, and user notes never establish state acceptance.
  const match = (course.ceApprovals || []).find(a => {
    try { canonicalCourseUrl(a.sourceUrl); } catch { return false; }
    return a.status === 'verified' && a.profession === profession && a.jurisdiction === jurisdiction &&
      course.format && a.format === course.format && validPlanDate(a.validFrom) && validPlanDate(a.validThrough) &&
      a.validFrom <= date && date <= a.validThrough && validPlanDate(a.checkedOn) && a.checkedOn <= new Date().toISOString().slice(0,10);
  });
  return match ? { status: 'recorded', message: 'Acceptance evidence recorded for this profession, state, format, and date. Confirm completion requirements and your renewal cycle.', sourceUrl: match.sourceUrl }
    : { status: 'unknown', message: `CE acceptance has not been verified for ${jurisdiction} ${profession} on this date. Confirm the exact course and delivery format with the provider and licensing board.` };
}
export function ledgerDraft(course) {
  if (!course || course.availability === 'closed') return null;
  // Completion date, credited hours, category, and exam completion must come from the clinician.
  return {title: course.title, provider: course.providerName, sourceUrl: course.url, suggestedHours: course.contactHours ?? null};
}
