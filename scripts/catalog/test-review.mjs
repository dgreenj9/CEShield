import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { COURSE_DIMENSIONS } from '../../src/utils/educationCatalog.js';

test('review CLI preserves drafts, previews without mutation, applies complete reviews, and rejects stale snapshots', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'ce-shield-review-'));
  try {
    for (const dir of ['scripts/catalog', 'src/utils', 'src/data/education']) await mkdir(path.join(root, dir), { recursive: true });
    for (const file of ['scripts/catalog/review.mjs', 'src/utils/educationCatalog.js', 'src/utils/educationReview.js']) {
      await copyFile(new URL('../../' + file, import.meta.url), path.join(root, file));
    }
    await writeFile(path.join(root, 'package.json'), '{"type":"module"}');
    const course = { id: 'fixture', providerId: 'example', title: 'Test fixture course', url: 'https://example.org/course', subjects: ['pain'], reviewStatus: 'verified' };
    const data = path.join(root, 'src/data/education');
    await writeFile(path.join(data, 'courses.json'), JSON.stringify([course]));
    await writeFile(path.join(data, 'discoveredCourses.json'), '[]');
    await writeFile(path.join(data, 'unavailableCourses.json'), '[]');
    await writeFile(path.join(data, 'providers.json'), JSON.stringify({ providers: [{ id: 'example' }] }));
    const run = (...args) => spawnSync(process.execPath, [path.join(root, 'scripts/catalog/review.mjs'), ...args], { cwd: root, encoding: 'utf8' });
    assert.equal(run('draft', '--course', 'fixture', '--subject', 'pain').status, 0);
    const draftPath = path.join(root, 'artifacts/catalog/reviews/fixture.json');
    const originalDraft = await readFile(draftPath, 'utf8');
    assert.equal(run('draft', '--course', 'fixture', '--subject', 'pain').status, 1);
    assert.equal(await readFile(draftPath, 'utf8'), originalDraft);
    assert.equal(run('apply', '--file', draftPath, '--write').status, 1, 'An incomplete draft must not publish');
    const before = await readFile(path.join(data, 'courses.json'), 'utf8');
    const draft = JSON.parse(originalDraft);
    Object.assign(draft.evaluation, { reviewer: 'Automated test fixture', reviewedOn: new Date().toISOString().slice(0, 10), reviewBasis: 'public-materials', limitations: 'Synthetic fixture for isolated CLI testing.' });
    draft.evaluation.dimensions = Object.fromEntries(Object.keys(COURSE_DIMENSIONS).map(key => [key, { score: 70, rationale: 'Synthetic fixture rationale.', sources: ['https://example.org/evidence'] }]));
    await writeFile(draftPath, JSON.stringify(draft));
    assert.equal(run('apply', '--file', draftPath).status, 0);
    assert.equal(await readFile(path.join(data, 'courses.json'), 'utf8'), before, 'Preview must not change the dataset');
    assert.equal(run('apply', '--file', draftPath, '--write').status, 0);
    const published = JSON.parse(await readFile(path.join(data, 'courses.json'), 'utf8'));
    assert.equal(published[0].reviewStatus, 'ranked');
    assert.equal(run('apply', '--file', draftPath, '--write').status, 1, 'Stale review must not overwrite the updated record');
    assert.deepEqual(JSON.parse(await readFile(path.join(data, 'courses.json'), 'utf8')), published);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
