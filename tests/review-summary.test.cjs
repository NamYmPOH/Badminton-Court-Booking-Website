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

function sampleTotals(id) {
  const reviews = getDemoReviews(id);
  return { count: reviews.length, sum: reviews.reduce((total, r) => total + r.rating, 0) };
}

test('Review summary: demo-only venue discloses every sample and its arithmetic mean', () => {
  const sample = sampleTotals('venue-with-no-real-reviews');
  const summary = summarizeVenueReviews('venue-with-no-real-reviews', 0, 0);
  assert.equal(summary.count, sample.count);
  assert.equal(summary.demoCount, sample.count);
  assert.equal(summary.realCount, 0);
  assert.equal(summary.average, sample.sum / sample.count);
});

test('Review summary: one real one-star review contributes once to the combined mean', () => {
  const sample = sampleTotals('venue-1');
  const summary = summarizeVenueReviews('venue-1', 1, 1);
  assert.equal(summary.average, (sample.sum + 1) / (sample.count + 1));
  assert.equal(summary.count, sample.count + 1);
  assert.equal(summary.demoCount, sample.count);
  assert.equal(summary.realCount, 1);
});

test('Review summary: averages are weighted by count, not averages of subgroup means', () => {
  const sample = sampleTotals('venue-1');
  const summary = summarizeVenueReviews('venue-1', 45, 10);
  assert.equal(summary.average, (sample.sum + 45) / (sample.count + 10));
  assert.notEqual(summary.average, (4.5 + sample.sum / sample.count) / 2);
  assert.equal(summary.count, summary.realCount + summary.demoCount);
  assert.equal(summary.realCount, 10);
});

test('Review summary: large full-data aggregate is not limited to the visible page', () => {
  const sample = sampleTotals('venue-2');
  const summary = summarizeVenueReviews('venue-2', 1500, 500);
  assert.equal(summary.count, sample.count + 500);
  assert.equal(summary.realCount, 500);
  assert.equal(summary.average, (sample.sum + 1500) / (sample.count + 500));
});

test('Review summary: venue-specific totals remain stable and do not mutate fixtures', () => {
  for (const id of ['venue-1', 'venue-2', 'smashbook-demo-2000-venue']) {
    const before = getDemoReviews(id);
    const sample = sampleTotals(id);
    const summary = summarizeVenueReviews(id, 9, 2);
    assert.equal(summary.average, (sample.sum + 9) / (sample.count + 2));
    assert.equal(summary.count, sample.count + 2);
    assert.deepEqual(getDemoReviews(id), before);
    assert.deepEqual(summarizeVenueReviews(id, 9, 2), summary);
  }
});
