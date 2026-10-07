const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');
// Compile the real TypeScript modules in memory without adding a test dependency.
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
const { MOCK_VENUES } = require('../src/data/venues.data.ts');
const { bookingDates, vietnamDate, slotPrice, parseSelection, selectionError, voucherDiscount, isPastSlot } = require('../src/lib/booking.ts');
const venue = MOCK_VENUES[0];
const now = new Date('2026-10-06T00:00:00+07:00');
const slot = (start = 1020, courtId = 'court-1-1') => ({ courtId, startMin: start, endMin: start + 30, price: 1, courtName: 'forged' });
const params = (slots = [slot(), slot(1050)], date = '2026-10-06') => new URLSearchParams({ venueId: venue.id, date, slots: JSON.stringify(slots), total: '1', venueName: 'forged' });
test('weekday peak is 110,000 per hour and names/prices come from catalogue', () => {
  const result = parseSelection(MOCK_VENUES, params(), now);
  assert.equal(result.total, 110000);
  assert.equal(result.slots[0].courtName, venue.courts[0].name);
  assert.equal(result.slots[0].startMin, 1020);
  assert.equal(result.slots[1].endMin, 1080);
});
test('off peak, evening boundary, Saturday and Sunday prices', () => {
  assert.equal(slotPrice(venue, '2026-10-06', 930, 960), 30000);
  assert.equal(slotPrice(venue, '2026-10-06', 1230, 1260), 55000);
  assert.equal(slotPrice(venue, '2026-10-06', 1260, 1290), 35000);
  assert.equal(slotPrice(venue, '2026-10-10', 1020, 1050), 50000);
  assert.equal(slotPrice(venue, '2026-10-11', 1020, 1050), 50000);
});
test('missing rates, outside opening hours and malformed dates are unavailable', () => {
  assert.equal(slotPrice(MOCK_VENUES[1], '2026-10-06', 1260, 1290), null);
  assert.equal(slotPrice(venue, '2026-10-06', 1320, 1350), null);
  assert.equal(slotPrice(venue, '2026-02-30', 1020, 1050), null);
  assert.equal(slotPrice(venue, '2026-10-06', 1021, 1051), null);
});
test('Vietnam calendar rolls over at UTC 17:00 and across year/month boundaries', () => {
  assert.equal(vietnamDate(new Date('2026-12-31T17:00:00Z')), '2027-01-01');
  const dates = bookingDates(new Date('2026-12-30T17:00:00Z'));
  assert.equal(dates[0].value, '2026-12-31');
  assert.equal(dates[1].value, '2027-01-01');
  assert.equal(dates.length, 7);
});
for (const [name, slots] of [
  ['empty', []], ['duplicate', [slot(), slot()]],
  ['gapped', [slot(300), slot(360)]], ['mixed courts', [slot(), slot(1050, 'court-1-2')]],
  ['booked', [slot(1080)]], ['unknown court', [slot(1020, 'missing')]],
  ['bad shape', [null]], ['string minutes', [{ ...slot(), startMin: '1020' }]],
  ['invalid duration', [{ ...slot(), endMin: 1080 }]],
]) test(`rejects ${name} selection`, () => assert.equal(parseSelection(MOCK_VENUES, params(slots), now), null));
test('rejects invalid URL, past and out-of-window dates', () => {
  for (const date of ['2026-10-05', '2026-10-13', 'invalid']) assert.equal(parseSelection(MOCK_VENUES, params(undefined, date), now), null);
  assert.equal(parseSelection(MOCK_VENUES, new URLSearchParams(), now), null);
  const p = params(); p.set('slots', '{broken');
  assert.equal(parseSelection(MOCK_VENUES, p, now), null);
  assert.equal(parseSelection(MOCK_VENUES, params(), new Date('2026-10-06T17:01:00+07:00')), null);
  assert.equal(isPastSlot('2026-10-06', 1020, new Date('2026-10-06T17:00:00+07:00')), true);
});
test('sorts reverse selection and applies capped, normalized vouchers', () => {
  assert.equal(parseSelection(MOCK_VENUES, params([slot(1050), slot()]), now).slots[0].startMin, 1020);
  assert.equal(voucherDiscount(' chaoban10 ', 110000), 11000);
  assert.equal(voucherDiscount('GIAM20K', 10000), 10000);
  assert.equal(voucherDiscount('INVALID', 110000), 0);
  assert.ok(selectionError([]));
});
