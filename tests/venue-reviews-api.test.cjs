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
const { getDemoReviews } = require('../src/data/demo-reviews.ts');
const { summarizeVenueReviews } = require('../src/lib/review-summary.ts');
const { PaymentError } = require('../src/lib/payment-error.ts');

const venue = { id: 'venue-api-test', name: 'Sân kiểm thử đánh giá', slug: 'test' };
const recentRatings = [1, 5, 4, 3, 1, 4, 5, 2];
const recent = recentRatings.map((rating, i) => ({
  id: `new-${i + 1}`, venueId: venue.id, rating, comment: `Nhận xét mới ${i + 1}`,
  createdAt: new Date(`2026-11-${String(8 - i).padStart(2, '0')}T12:00:00Z`),
  user: { name: `Khách ${i + 1}` }, images: i === 0 ? [{ id: 'photo-new-1' }] : [],
}));
const older = Array.from({ length: 20 }, (_, i) => ({
  id: `old-${i + 1}`, venueId: venue.id, rating: i % 5 + 1, comment: `Nhận xét cũ ${i + 1}`,
  createdAt: new Date(`2026-09-${String(20 - i).padStart(2, '0')}T12:00:00Z`),
  user: { name: `Khách cũ ${i + 1}` }, images: [],
}));
const foreign = { id: 'foreign-review', venueId: 'another-venue', rating: 5, comment: 'Không thuộc sân này', createdAt: new Date('2027-01-01'), user: { name: 'Khách sân khác' }, images: [] };
const realRows = [...recent, ...older, foreign];
const allVenueRows = [...recent, ...older, ...getDemoReviews(venue.id)].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt) || a.id.localeCompare(b.id));
const expectedIds = allVenueRows.map(r => r.id);
const expectedPages = Math.ceil(expectedIds.length / 12);

function setup({ missingVenue = false } = {}) {
  const calls = [];
  const matches = (row, where) => row.venueId === where.venueId && (where.rating === undefined || row.rating === where.rating);
  const tx = {
    review: {
      groupBy: async ({ where, by }) => {
        calls.push({ action: 'groupBy', where });
        assert.deepEqual(by, ['rating']);
        const counts = new Map();
        for (const row of realRows.filter(r => matches(r, where))) counts.set(row.rating, (counts.get(row.rating) || 0) + 1);
        return [...counts].map(([rating, count]) => ({ rating, _count: { _all: count } }));
      },
      findMany: async ({ where, take, skip = 0, orderBy }) => {
        calls.push({ action: 'findMany', where, take, skip });
        assert.deepEqual(orderBy, [{ createdAt: 'desc' }, { id: 'asc' }]);
        return realRows.filter(r => matches(r, where))
          .sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id))
          .slice(skip, skip + take);
      },
    },
  };
  const db = {
    venue: { findFirst: async ({ where }) => {
      assert.equal(where.status, 'ACTIVE');
      return !missingVenue && where.slug === venue.slug ? venue : null;
    } },
    $transaction: async (fn, options) => {
      assert.equal(options.isolationLevel, 'RepeatableRead');
      return fn(tx);
    },
  };
  const imports = {
    '@/lib/db': { db },
    '@/data/demo-reviews': { getDemoReviews },
    '@/lib/review-summary': { summarizeVenueReviews },
    '@/lib/sepay': {
      PaymentError,
      paymentErrorResponse: error => Response.json({ message: error.message }, { status: error instanceof PaymentError ? error.status : 500 }),
    },
  };
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync('src/app/api/venues/[id]/reviews/route.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', source)(name => imports[name] || require(name), module, module.exports);
  return {
    calls,
    async request(search = '', slug = 'test') {
      const response = await module.exports.GET(new Request(`http://localhost/api/venues/${slug}/reviews${search ? `?${search}` : ''}`), { params: { id: slug } });
      return { response, body: await response.json() };
    },
  };
}

test('Venue reviews API: summary includes all real and demo reviews with counts disclosed', async () => {
  const { body, response } = await setup().request('page=1&rating=all');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.deepEqual(body.venue, venue);
  assert.equal(body.summary.count, allVenueRows.length);
  assert.equal(body.summary.realCount, 28);
  assert.equal(body.summary.demoCount, getDemoReviews(venue.id).length);
  assert.equal(body.summary.average, allVenueRows.reduce((sum, r) => sum + r.rating, 0) / allVenueRows.length);
  assert.deepEqual(body.summary.distribution, Object.fromEntries([1,2,3,4,5].map(rating => [String(rating), allVenueRows.filter(r => r.rating === rating).length])));
  assert.equal(body.totalPages, expectedPages);
  assert.equal(body.page, 1);
});

test('Venue reviews API: combined pagination retains sample and older real rows at page boundaries', async () => {
  const api = setup();
  const returned = [];
  for (let page = 1; page <= expectedPages; page++) {
    const { body, response } = await api.request(`page=${page}&rating=all`);
    assert.equal(response.status, 200);
    assert.equal(body.page, page);
    assert.equal(body.totalPages, expectedPages);
    assert.equal(body.reviews.length, expectedIds.slice((page - 1) * 12, page * 12).length);
    assert.deepEqual(body.reviews.map(r => r.id), expectedIds.slice((page - 1) * 12, page * 12));
    returned.push(...body.reviews.map(r => r.id));
  }
  assert.deepEqual(returned, expectedIds);
  assert.equal(new Set(returned).size, expectedIds.length);
  assert.ok(!returned.includes(foreign.id));
});

test('Venue reviews API: rating filter leaves full summary unchanged and includes matching demo rows', async () => {
  const api = setup();
  const full = await api.request('page=3&rating=all');
  const filtered = await api.request('page=1&rating=1');
  assert.equal(filtered.response.status, 200);
  assert.deepEqual(filtered.body.summary, full.body.summary);
  assert.equal(filtered.body.totalPages, 1);
  assert.equal(filtered.body.reviews.length, 9);
  assert.ok(filtered.body.reviews.every(r => r.rating === 1));
  assert.equal(filtered.body.reviews.filter(r => r.isDemo).length, 3);
  assert.equal(filtered.body.reviews.filter(r => !r.isDemo).length, 6);
  const expected = [...recent.filter(r => r.rating === 1).map(r => r.id), ...getDemoReviews(venue.id).filter(r => r.rating === 1).map(r => r.id), ...older.filter(r => r.rating === 1).map(r => r.id)];
  assert.deepEqual(filtered.body.reviews.map(r => r.id), expected);
  assert.ok(api.calls.filter(call => call.action === 'groupBy').every(call => call.where.rating === undefined), 'summary must not inherit the list rating filter');
});

test('Venue reviews API: published photo links and demo metadata stay attached to their reviews', async () => {
  const { body } = await setup().request();
  const photoReview = body.reviews.find(r => r.id === recent[0].id);
  assert.equal(photoReview.isDemo, false);
  assert.deepEqual(photoReview.images, ['/api/review-images/photo-new-1']);
  const demoReview = body.reviews.find(r => r.isDemo);
  assert.ok(demoReview);
  assert.deepEqual(demoReview.images, []);
  assert.ok(demoReview.userName.includes('mẫu'));
});

test('Venue reviews API: out-of-range page clamps to final valid page', async () => {
  const { response, body } = await setup().request('page=999&rating=all');
  assert.equal(response.status, 200);
  assert.equal(body.page, expectedPages);
  assert.equal(body.totalPages, expectedPages);
  assert.deepEqual(body.reviews.map(r => r.id), expectedIds.slice((expectedPages - 1) * 12));
});

test('Venue reviews API: invalid page or rating returns 400 before database access', async () => {
  for (const search of ['page=0', 'page=-1', 'page=1.5', 'page=10001', 'page=abc', 'rating=0', 'rating=6', 'rating=unknown']) {
    const api = setup();
    const { response } = await api.request(search);
    assert.equal(response.status, 400, search);
    assert.equal(api.calls.length, 0);
  }
});

test('Venue reviews API: missing or inactive venue returns 404', async () => {
  const missing = await setup({ missingVenue: true }).request();
  assert.equal(missing.response.status, 404);
  const unknownSlug = await setup().request('', 'missing');
  assert.equal(unknownSlug.response.status, 404);
});
