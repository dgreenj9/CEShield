// Course facts, course evaluation, and regulatory acceptance are separate records.
// A credential's clinical score must never be inherited by a provider's course.
export const SUBJECTS = {
  musculoskeletal: 'Musculoskeletal & orthopedics',
  neurology: 'Neurologic rehabilitation',
  vestibular: 'Vestibular & balance',
  pain: 'Pain science',
  geriatrics: 'Older adults & falls',
  pediatrics: 'Pediatrics & early intervention',
  pelvic: 'Pelvic & obstetric health',
  cardiopulmonary: 'Cardiac & pulmonary rehabilitation',
  acute: 'Acute & critical care',
  hand: 'Hand & upper extremity',
  swallowing: 'Feeding & swallowing',
  language: 'Language & literacy',
  speech: 'Speech, voice & fluency',
  aac: 'Augmentative & alternative communication',
  hearing: 'Hearing & audiology',
  cognition: 'Cognition & brain injury',
  sensory: 'Sensory processing',
  mentalHealth: 'Mental health & behavior',
  adaptive: 'Assistive technology & accessibility',
  sports: 'Sports & performance',
  wound: 'Wound care & lymphedema',
  oncology: 'Oncology rehabilitation',
  ethics: 'Ethics & professional practice',
  business: 'Practice management & documentation',
  research: 'Research & teaching',
  technology: 'Digital health & technology',
};

export const EDUCATION_TYPES = { course: 'Individual course', workshop: 'Workshop', series: 'Course series', certification: 'Certification program', unclassified: 'Type not yet reviewed' };
export const COURSE_FORMATS = { online: 'Online / on demand', liveOnline: 'Live online', blendedOnline: 'Online with scheduled sessions', live: 'Live / in person', hybrid: 'Hybrid', varies: 'Multiple formats' };

export function selectComparisonCourses(courses, selection = '', limit = 3) {
  const byId = new Map();
  for (const course of courses.filter(c => c.availability !== 'closed')) {
    for (const id of [course.id, ...(course.aliases || [])]) byId.set(id, course);
  }
  const selected = new Map();
  for (const id of selection.split(',')) {
    const course = byId.get(id);
    if (course) selected.set(course.id, course);
  }
  return [...selected.values()].slice(0, limit);
}

const RULES = {
  musculoskeletal: /orthop[ae]?edic|musculoskeletal|manual therapy|spine|spinal|low back|shoulder|knee|hip |tendon|ligament|joint|scoliosis|schroth|mckenzie|mulligan|graston|astym/i,
  neurology: /neurolog|neurorehab|stroke|parkinson|multiple sclerosis|spinal cord|pwr!|lsvt big|ndt|constraint.induced|cimt|habit/i,
  vestibular: /vestibular|dizz|balance|bppv/i,
  pain: /pain|nocicept|fibromyalgia/i,
  geriatrics: /geriatric|aging|ageing|older adult|fall[s -]|dementia|alzheimer|otago/i,
  pediatrics: /pediatr|paediatr|child|infant|neonat|early intervention|school|cerebral palsy|nidcap/i,
  pelvic: /pelvic|obstetric|pregnan|postpartum|continence|incontinence|women.s health/i,
  cardiopulmonary: /cardiac|pulmonary|cardiovascular|respirat|copd|cardiopulmonary|breathing|ventilat/i,
  acute: /acute care|critical care|icu|intensive care|ventilat|pocus|acls/i,
  hand: /hand therap|upper extremit|upper limb|upper quarter|wrist|elbow|splint|orthos/i,
  swallowing: /dysphagia|swallow|feeding|vitalstim/i,
  language: /language|aphasia|literacy|reading|vocabulary|discourse|bilingual|multilingual/i,
  speech: /speech|voice|fluency|stutter|clutter|articulat|dysarthria|apraxia|lsvt loud/i,
  aac: /augmentative|alternative communication|\baac\b|communication device/i,
  hearing: /hearing|audiolog|cochlear|tinnitus/i,
  cognition: /cogniti|brain injury|concussion|executive function|memory/i,
  sensory: /sensory|interocept|ayres|sipt/i,
  mentalHealth: /mental health|mindful|anxiety|depression|behavior|behaviour|motivational interview|cbit|trauma.informed/i,
  adaptive: /assistive|adaptive|seating|wheelchair|mobility specialist|driver|ergonomic|aging.in.place|amputee|prosthe/i,
  sports: /sport|athlet|strength|conditioning|return to play|golf|blood flow|bfr/i,
  wound: /wound|lymphedema|lymphoedema|edema|oedema/i,
  oncology: /oncolog|cancer/i,
  ethics: /ethic|jurisprudence|implicit bias|cultural|professional boundar/i,
  business: /business|billing|coding|documentat|practice management|reimbursement|entrepreneur/i,
  research: /research|systematic review|biostat|teaching|educator|phd|scholar|clinical trial/i,
  technology: /telehealth|digital|artificial intelligence|virtual reality|robotic|wearable|informatics|ultrasound|fhir|epic/i,
};

// These are discovery tags, not expert judgments about the full curriculum.
export const inferSubjects = (title) => Object.entries(RULES).filter(([, re]) => re.test(title)).map(([key]) => key);

export const canonicalCourseUrl = (value) => {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Public HTTP(S) URL required');
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (/^utm_/i.test(key) || ['fbclid', 'gclid', 'ref', 'referral', 'internalad', 'cacheminutes'].includes(key.toLowerCase())) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  url.pathname = url.pathname.replace(/\/+$/, '') || '/';
  return url.toString();
};

export function mergeCourseListings(discovered, curated, unavailable = []) {
  const entries = new Map();
  const closed = new Set(unavailable.filter(c => c.availability === 'closed').map(c => `${c.providerId}:${canonicalCourseUrl(c.url)}`));
  for (const course of [...discovered, ...curated]) {
    // Provider ownership is part of identity. Never merge different providers' courses by title.
    const key = `${course.providerId}:${canonicalCourseUrl(course.url)}`;
    if (closed.has(key) || course.availability === 'closed') continue;
    const previous = entries.get(key);
    const aliases = [...new Set([...(previous?.aliases || []), ...(previous ? [previous.id] : []), ...(course.aliases || [])])].filter(id => id !== course.id);
    entries.set(key, { ...course, aliases, subjects: course.subjects ?? inferSubjects(course.title), subjectBasis: course.subjects ? 'reviewed' : 'title' });
  }
  return [...entries.values()];
}

export const COURSE_DIMENSIONS = {
  evidenceAlignment: { label: 'Evidence alignment', weight: 30 },
  clinicalApplication: { label: 'Clinical application', weight: 25 },
  teachingAndAssessment: { label: 'Teaching & assessment', weight: 20 },
  transparency: { label: 'Curriculum transparency', weight: 15 },
  value: { label: 'Time & cost value', weight: 10 },
};

export function formatCoursePrice(course) {
  const price = course.price ?? (course.priceUsd != null ? { amount: course.priceUsd, currency: 'USD' } : null);
  if (!price || !Number.isFinite(price.amount) || price.amount < 0 || !/^[A-Z]{3}$/.test(price.currency || '')) return null;
  if (price.amount === 0) return 'Listed as free';
  return `Listed price: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: price.currency, currencyDisplay: 'code', maximumFractionDigits: 2 }).format(price.amount)}`;
}

export function courseScore(course) {
  const review = course.evaluation;
  if (course.reviewStatus !== 'ranked' || !review?.reviewedOn || !review?.reviewer || !review?.subject || !SUBJECTS[review.subject]) return null;
  if (!['public-materials', 'course-access'].includes(review.reviewBasis) || typeof review.limitations !== 'string' || !review.limitations.trim()) return null;
  let result = 0;
  for (const [key, { weight }] of Object.entries(COURSE_DIMENSIONS)) {
    const dimension = review.dimensions?.[key];
    if (!Number.isFinite(dimension?.score) || dimension.score < 0 || dimension.score > 100 ||
        typeof dimension.rationale !== 'string' || !dimension.rationale.trim() || !Array.isArray(dimension.sources) || !dimension.sources.length) return null;
    if (!dimension.sources.every(source => { try { return Boolean(canonicalCourseUrl(source)); } catch { return false; } })) return null;
    result += dimension.score * weight / 100;
  }
  return Math.round(result * 10) / 10;
}

export function filterCourses(courses, { query = '', subject = '', provider = '', discipline = '', format = '', status = '', type = '' } = {}) {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return courses.filter(course => {
    const haystack = [course.title, course.providerName, course.summary, ...(course.subjects || []).map(s => SUBJECTS[s])].filter(Boolean).join(' ').toLowerCase();
    return terms.every(term => haystack.includes(term)) &&
      (!subject || course.subjects?.includes(subject)) &&
      (!provider || course.providerId === provider) &&
      (!discipline || course.disciplines?.includes(discipline)) &&
      (!format || course.format === format) &&
      (!type || (course.educationType || 'unclassified') === type) &&
      (!status || (status === 'ranked' ? courseScore(course) !== null : course.reviewStatus === status));
  });
}

export function sortCourses(courses, sort = 'title', subject = '') {
  return [...courses].sort((a, b) => {
    if (sort === 'score' && subject) {
      const aScore = a.evaluation?.subject === subject ? courseScore(a) : null;
      const bScore = b.evaluation?.subject === subject ? courseScore(b) : null;
      const difference = (bScore ?? -1) - (aScore ?? -1);
      if (difference) return difference;
    }
    if (sort === 'hours') {
      const difference = (a.contactHours ?? Infinity) - (b.contactHours ?? Infinity);
      if (Number.isFinite(difference) && difference) return difference;
      if (a.contactHours == null && b.contactHours != null) return 1;
      if (b.contactHours == null && a.contactHours != null) return -1;
    }
    return a.title.localeCompare(b.title) || a.providerId.localeCompare(b.providerId);
  });
}
