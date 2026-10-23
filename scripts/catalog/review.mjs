#!/usr/bin/env node
// Local editorial workflow. No network requests or deployment.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mergeCourseListings, SUBJECTS, courseScore } from '../../src/utils/educationCatalog.js';
import { buildReviewQueue, createEvaluationDraft, validateEvaluationDraft } from '../../src/utils/educationReview.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const data = path.join(root, 'src/data/education');
const artifacts = path.join(root, 'artifacts/catalog/reviews');
const readJSON = async filename => JSON.parse(await readFile(filename, 'utf8'));
const fingerprint = course => createHash('sha256').update(JSON.stringify(course)).digest('hex');

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    course: { type: 'string' }, subject: { type: 'string' }, provider: { type: 'string' },
    limit: { type: 'string', default: '50' }, file: { type: 'string' }, write: { type: 'boolean', default: false },
  } });
  const [command] = positionals;
  const curatedPath = path.join(data, 'courses.json');
  const curated = await readJSON(curatedPath);
  const discovered = await readJSON(path.join(data, 'discoveredCourses.json'));
  const unavailable = await readJSON(path.join(data, 'unavailableCourses.json'));
  const courses = mergeCourseListings(discovered, curated, unavailable);
  const registry = await readJSON(path.join(data, 'providers.json'));
  if (values.subject && !SUBJECTS[values.subject]) throw new Error('Unknown subject.');
  if (values.provider && !registry.providers.some(p => p.id === values.provider)) throw new Error('Unknown provider.');
  await mkdir(artifacts, { recursive: true });
  if (command === 'queue') {
    const limit = Number(values.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) throw new Error('Limit must be 1–1000.');
    const queue = buildReviewQueue(courses, { limit, subject: values.subject, provider: values.provider });
    const destination = path.join(artifacts, `queue${values.subject ? '-' + values.subject : ''}${values.provider ? '-' + values.provider : ''}.json`);
    await writeFile(destination, JSON.stringify({ generatedAt: new Date().toISOString(), items: queue }, null, 2) + '\n');
    console.log(`Saved ${queue.length} review tasks to ${destination}. This is work order, not a quality ranking.`);
  } else if (command === 'draft') {
    const course = curated.find(c => c.id === values.course);
    if (!course) throw new Error('Select a course in courses.json with checked facts.');
    if (!courses.some(c => c.id === course.id)) throw new Error('This course is currently recorded as unavailable.');
    if (values.subject && !course.subjects?.includes(values.subject)) throw new Error('Subject is not assigned to this course.');
    const draft = { ...createEvaluationDraft(course, values.subject || ''), courseFingerprint: fingerprint(course) };
    const destination = path.join(artifacts, `${course.id}.json`);
    // Never overwrite a review someone has already started.
    await writeFile(destination, JSON.stringify(draft, null, 2) + '\n', { flag: 'wx' });
    console.log(`Created ${destination}. Scores are blank until evaluated.`);
  } else if (['validate', 'apply'].includes(command)) {
    if (!values.file) throw new Error('--file is required.');
    const draft = await readJSON(path.resolve(values.file));
    const course = curated.find(c => c.id === draft.courseId);
    const errors = validateEvaluationDraft(draft, course);
    if (course && !courses.some(c => c.id === course.id)) errors.push('This course is currently recorded as unavailable.');
    if (course && draft.courseFingerprint !== fingerprint(course)) errors.push('Course facts changed since this draft was created. Reconcile the draft against a new snapshot.');
    if (errors.length) throw new Error(errors.join('\n'));
    const updated = { ...course, evaluation: draft.evaluation, reviewStatus: 'ranked' };
    if (courseScore(updated) === null) throw new Error('Evaluation cannot produce a valid score.');
    console.log(`${course.title}: ${courseScore(updated)}/100 in ${SUBJECTS[draft.evaluation.subject]}.`);
    if (command === 'apply' && values.write) {
      await writeFile(curatedPath, JSON.stringify(curated.map(c => c.id === course.id ? updated : c), null, 2) + '\n');
      console.log('Updated the local curated dataset. Nothing was deployed.');
    } else console.log('Validation passed. Dataset unchanged; apply --write updates the local record.');
  } else throw new Error('Usage: review.mjs queue [--subject pain] | draft --course ID [--subject pain] | validate --file PATH | apply --file PATH [--write]');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
