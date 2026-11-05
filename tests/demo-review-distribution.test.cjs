const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
const { getDemoReviews } = require('../src/data/demo-reviews.ts');
const { MOCK_VENUES } = require('../src/data/venues.data.ts');
const venueIds = [...MOCK_VENUES.map(v => v.id), 'smashbook-demo-2000-venue'];
test('Demo distribution: over 70% of venue catalog displays above 4.5 stars, with diverse averages', () => {
  const averages = venueIds.map(id => { const rows = getDemoReviews(id); return rows.reduce((sum, r) => sum + r.rating, 0) / rows.length; });
  assert.ok(averages.filter(avg => Number(avg.toFixed(1)) > 4.5).length / venueIds.length > 0.7);
  assert.ok(averages.some(avg => avg < 4.5), 'preserve a lower-rated group');
  assert.ok(new Set(averages.map(avg => avg.toFixed(1))).size >= 5, 'avoid uniform-looking venue ratings');
});
test('Demo distribution: preserve original low ratings, label all samples, and keep IDs/comments unique per venue', () => {
  for (const id of venueIds) {
    const rows = getDemoReviews(id);
    assert.ok(rows.length > 12);
    assert.equal(rows.slice(0,12).reduce((sum, r) => sum + r.rating, 0), 44);
    assert.equal(rows.filter(r => r.rating === 1).length, 3);
    assert.equal(new Set(rows.map(r => r.id)).size, rows.length);
    assert.equal(new Set(rows.map(r => r.comment)).size, rows.length);
    assert.ok(rows.every(r => r.isDemo && r.userName.includes('mẫu') && r.rating >= 1 && r.rating <= 5));
    assert.ok(rows.every(r => Number.isFinite(new Date(r.createdAt).getTime())));
    assert.deepEqual(rows, getDemoReviews(id));
  }
});
