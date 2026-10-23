export const LEVELS = { introductory:'Introductory', intermediate:'Intermediate', advanced:'Advanced' };
export const SETTINGS = { outpatient:'Outpatient', acute:'Acute care', home:'Home & community', school:'School & early intervention', longTerm:'Long-term care' };
export const POPULATIONS = { children:'Children', adults:'Adults', olderAdults:'Older adults' };
export const LEARNING_GOALS = { assessment:'Assessment & clinical reasoning', treatment:'Intervention skills', prevention:'Prevention & risk reduction', accessibility:'Access & participation', professional:'Professional practice', research:'Research & evidence appraisal' };
export function matchesFacets(course, {level='',setting='',population='',goal=''}={}) {
 return (!level || (course.level || course.providerFacts?.level)===level) && (!setting || course.clinicalSettings?.includes(setting)) && (!population || course.populations?.includes(population)) && (!goal || course.learningGoals?.includes(goal));
}
