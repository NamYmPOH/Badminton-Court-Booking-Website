const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');

require.extensions['.ts'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText,
  filename,
);
const { summarizeVenueReviews } = require('../src/lib/review-summary.ts');
const { getDemoReviews } = require('../src/data/demo-reviews.ts');

test('Review summary: demo-only venue displays the sample mean and discloses all twelve samples', () => {
  const summary = summarizeVenueReviews('venue-with-no-real-reviews', 0, 0);
  assert.equal(summary.count, 12);
  assert.equal(summary.demoCount, 12);
  assert.equal(summary.realCount, 0);
  assert.equal(summary.average, 44 / 12);
});

test('Review summary: one real one-star review changes the combined mean to 45/13', () => {
  const summary = summarizeVenueReviews('venue-1', 1, 1);
  assert.equal(summary.average, 45 / 13);
  assert.equal(summary.count, 13);
  assert.equal(summary.demoCount, 12);
  assert.equal(summary.realCount, 1);
});

test('Review summary: averages are weighted by count, not averages of subgroup means', () => {
  const summary = summarizeVenueReviews('venue-1', 45, 10);
  assert.equal(summary.average, 89 / 22);
  assert.notEqual(summary.average, (4.5 + 44 / 12) / 2);
  assert.equal(summary.count, summary.realCount + summary.demoCount);
  assert.equal(summary.realCount, 10);
});

test('Review summary: large full-data aggregate is not limited to the visible page', () => {
  const summary = summarizeVenueReviews('venue-2', 1500, 500);
  assert.equal(summary.count, 512);
  assert.equal(summary.realCount, 500);
  assert.equal(summary.average, 1544 / 512);
});

test('Review summary: different venue identifiers preserve sample totals and do not mutate fixtures', () => {
  for (const id of ['venue-1', 'venue-2', 'smashbook-demo-2000-venue']) {
    const before = getDemoReviews(id);
    const summary = summarizeVenueReviews(id, 9, 2);
    assert.equal(summary.average, 53 / 14);
    assert.equal(summary.count, 14);
    assert.deepEqual(getDemoReviews(id), before);
    assert.deepEqual(summarizeVenueReviews(id, 9, 2), summary);
  }
});
