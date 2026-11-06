const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');

function loadTs(file, imports = {}) {
  const mod = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', source)(name => imports[name] || require(name), mod, mod.exports);
  return mod.exports;
}

const { PaymentError } = loadTs('src/lib/payment-error.ts');
const vietnamese = loadTs('src/lib/utils/vietnamese.ts');
const ranker = loadTs('src/lib/utils/search-ranker.ts', { './vietnamese': vietnamese });
function row(id, ownerId, priceFrom) {
  return {
    id, ownerId, priceFrom, slug: id, name: `Sân ${id}`, description: '', address: 'Hà Nội', district: 'Cầu Giấy',
    province: 'Hà Nội', lat: 21, lng: 105, openMin: 0, closeMin: 1440, images: [], amenities: ['WIFI'],
    cancelBeforeHours: 12, paymentMode: 'AT_VENUE', status: 'ACTIVE',
    // These fields must never leak into the shared payload.
    bankAccount: 'PRIVATE_BANK', contactPhone: 'PRIVATE_PHONE',
    courts: [{ id: `court-${id}`, name: 'Sân 1', surface: null, status: 'ACTIVE', privateNote: 'PRIVATE_NOTE' }],
    pricing: [{ id: `price-${id}`, daysOfWeek: [1], startMin: 0, endMin: 1440, walkInPrice: priceFrom, fixedPrice: priceFrom, createdAt: new Date(), internalNote: 'PRIVATE_PRICING' }],
  };
}

function fixture() {
  let stored;
  let mode = 'rows';
  let cacheError;
  const rows = [row('alpha', 'owner-a', 100000), row('beta', 'owner-b', 200000)];
  const calls = { venues: 0, ratings: 0, details: 0, dbQueries: 0 };
  const cache = {
    cachedPublicData: async (key, loader, options) => {
      assert.equal(key, 'venues');
      if (cacheError) throw cacheError;
      if (stored) return JSON.parse(stored);
      const value = await loader();
      if (options.shouldCache(value)) stored = JSON.stringify(value);
      return value;
    },
    recordPublicCacheDbQueries: count => { calls.dbQueries += count; },
  };
  const service = loadTs('src/services/venue.service.ts', {
    '@/lib/db': { db: {
      venue: { findMany: async ({ where }) => {
        calls.venues++;
        assert.deepEqual(where, { status: 'ACTIVE' });
        if (mode === 'error') throw new Error('database credentials must not be cached');
        return mode === 'empty' ? [] : rows;
      } },
      review: {
        groupBy: async () => { calls.ratings++; return rows.map(v => ({ venueId: v.id, _avg: { rating: 4 }, _count: { _all: 2 } })); },
        findMany: async () => { calls.details++; return [{ id: `r-${calls.details}`, user: { name: 'Khách' }, rating: 5, comment: '', createdAt: new Date() }]; },
      },
    } },
    '@/lib/utils/vietnamese': vietnamese,
    '@/lib/utils/search-ranker': ranker,
    '../lib/review-summary': { summarizeVenueReviews: (_, sum, count) => ({ average: count ? sum / count : 0, count, demoCount: 0 }) },
    '@/data/venues.data': { MOCK_VENUES: [{ ...row('demo', 'demo', 1), reviews: [] }] },
    '../lib/public-cache': cache,
    '../lib/payment-error': { PaymentError },
  });
  return { service, calls, rows, stored: () => stored, setMode: value => { mode = value; }, setCacheError: value => { cacheError = value; } };
}

test('venue catalog shares DB reads across home, search, list and detail lookup', async () => {
  const f = fixture();
  await f.service.getFeaturedVenues();
  await f.service.getTopRatedVenues();
  assert.equal((await f.service.getVenueById('alpha')).id, 'alpha');
  assert.equal((await f.service.searchVenueSuggestions('alpha'))[0].id, 'alpha');
  assert.equal((await f.service.getVenues({ minPrice: 150000 }))[0].id, 'beta');
  assert.deepEqual(f.calls, { venues: 1, ratings: 1, details: 0, dbQueries: 2 });
});

test('owner ordering and query filters never become another viewer cache result', async () => {
  const f = fixture();
  assert.deepEqual((await f.service.getVenues(undefined, 'owner-b')).map(v => v.id), ['beta', 'alpha']);
  assert.deepEqual((await f.service.getVenues(undefined, 'owner-a')).map(v => v.id), ['alpha', 'beta']);
  assert.deepEqual((await f.service.getVenues()).map(v => v.id), ['alpha', 'beta']);
  assert.deepEqual((await f.service.getVenues({ q: 'beta' })).map(v => v.id), ['beta']);
  assert.equal(f.calls.venues, 1);
});

test('catalog caches only projected fields and JSON-safe pricing, excluding personal details', async () => {
  const f = fixture();
  const first = await f.service.getVenueById('alpha');
  const hit = await f.service.getVenueById('alpha');
  assert.deepEqual(first, hit);
  assert.doesNotMatch(f.stored(), /PRIVATE_|createdAt|contactPhone|bankAccount/);
  assert.deepEqual(hit.reviews, []);
  assert.deepEqual(Object.keys(hit.pricingRules[0]), ['id', 'daysOfWeek', 'startMin', 'endMin', 'walkInPrice', 'fixedPrice']);
});

test('empty database and failures keep demo fallback out of Redis and permit recovery', async () => {
  for (const mode of ['empty', 'error']) {
    const f = fixture();
    f.setMode(mode);
    const originalWarn = console.warn;
    try {
      console.warn = () => {};
      assert.equal((await f.service.getVenues())[0].id, 'demo');
    } finally { console.warn = originalWarn; }
    assert.equal(f.stored(), undefined);
    f.setMode('rows');
    assert.equal((await f.service.getVenues())[0].id, 'alpha');
    assert.equal(f.calls.venues, 2);
  }
});

test('cache load shedding propagates 503 instead of presenting demo data', async () => {
  const f = fixture();
  f.setCacheError(new PaymentError(503, 'Hệ thống đang bận.'));
  await assert.rejects(f.service.getVenues(), e => e.status === 503);
  assert.equal(f.calls.venues, 0);
});

test('detail review lookup remains fresh outside the shared catalog cache', async () => {
  const previous = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'test-only';
  try {
    const f = fixture();
    const first = await f.service.getVenueBySlug('alpha');
    const second = await f.service.getVenueBySlug('alpha');
    assert.notEqual(first.reviews[0].id, second.reviews[0].id);
    assert.equal(f.calls.venues, 1);
    assert.equal(f.calls.details, 2);
    assert.deepEqual(JSON.parse(f.stored())[0].reviews, []);
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  }
});
