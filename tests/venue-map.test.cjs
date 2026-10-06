const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
const { venuesHref, validCoordinates, directionsUrl } = require('../src/lib/venue-map.ts');
const { MOCK_VENUES } = require('../src/data/venues.data.ts');

test('view switches and district changes preserve price, amenities and other active filters', () => {
  const current = { q: 'Sân & CLB', district: 'Hoàn Kiếm', view: 'map', maxPrice: '80000', amenity: 'AC', hasSlotTonight: 'true', sort: 'rating' };
  const url = new URL(venuesHref(current, { view: undefined, district: 'Thanh Xuân' }), 'https://example.com');
  assert.equal(url.searchParams.get('view'), null);
  assert.equal(url.searchParams.get('district'), 'Thanh Xuân');
  for (const key of ['q', 'maxPrice', 'amenity', 'hasSlotTonight', 'sort']) assert.equal(url.searchParams.get(key), current[key]);
  const reset = new URL(venuesHref(current, { district: undefined, hasSlotTonight: undefined }), 'https://example.com');
  assert.equal(reset.searchParams.get('district'), null);
  assert.equal(reset.searchParams.get('view'), 'map');
  assert.equal(reset.searchParams.get('hasSlotTonight'), null);
});
test('invalid and non-Mercator positions cannot become map markers', () => {
  for (const location of [{lat:NaN,lng:105}, {lat:21,lng:Infinity}, {lat:90,lng:105}, {lat:21,lng:181}, {lat:'21',lng:105}]) assert.equal(validCoordinates(location), false);
  assert.equal(validCoordinates({lat:0,lng:0}), true);
});
test('all existing venues can be plotted and Hoan Kiem filtering has pins', () => {
  assert.ok(MOCK_VENUES.length > 0);
  assert.equal(MOCK_VENUES.filter(validCoordinates).length, MOCK_VENUES.length);
  assert.ok(MOCK_VENUES.filter(v => v.district === 'Hoàn Kiếm').length > 0);
  assert.equal(new Set(MOCK_VENUES.map(v=>v.id)).size, MOCK_VENUES.length);
});
test('directions use the actual stored destination coordinates in the right order', () => {
  const url = new URL(directionsUrl({lat:21.0265,lng:105.8525}));
  assert.equal(url.hostname, 'www.google.com');
  assert.equal(url.searchParams.get('api'), '1');
  assert.equal(url.searchParams.get('destination'), '21.0265,105.8525');
});
