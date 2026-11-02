const fs = require('node:fs');
const ts = require('typescript');
const { test } = require('node:test');
const assert = require('node:assert/strict');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const { manageCoach } = require('../src/services/admin-coach.service.ts');
function setup(options = {}) {
  const writes = [];
  const tx = {
    user: { findUnique: async () => ({ id: 'admin', name: 'Admin', role: options.role || 'ADMIN', status: 'ACTIVE' }) },
    coachProfile: { findUnique: async () => ({ id: 'coach', status: 'ACTIVE' }), update: async x => writes.push(x) },
    venue: { findUnique: async () => ({ status: 'ACTIVE' }) },
    coachVenue: { findUnique: async () => ({ status: options.link || 'ACTIVE', venue: { status: 'ACTIVE' } }), upsert: async x => writes.push(x) },
    coachAvailability: {
      findUnique: async () => ({ coachId: options.owner || 'coach', startsAt: new Date('2099-01-01T01:00:00Z'), endsAt: new Date('2099-01-01T02:00:00Z') }),
      findFirst: async ({ where }) => { assert.equal(where.coachId, 'coach'); assert.equal(where.venueId, undefined); return options.overlap ? { id: 'other' } : null; },
      create: async x => writes.push(x), update: async x => writes.push(x), delete: async x => writes.push(x),
    },
    coachBooking: { findFirst: async () => options.booked ? { id: 'booking' } : null },
    adminAudit: { create: async x => writes.push({ audit: x }) },
  };
  return { db: { $transaction: async fn => fn(tx) }, writes };
}
const slot = { venueId: 'venue', startsAt: '2099-01-01T03:00:00Z', endsAt: '2099-01-01T04:00:00Z' };
test('admin can create a linked slot and records an audit', async () => {
  const { db, writes } = setup();
  await manageCoach(db, 'admin', 'coach', { action: 'slot', slot });
  assert.equal(writes[0].data.venueId, 'venue');
  assert.equal(writes[0].data.startsAt.toISOString(), new Date(slot.startsAt).toISOString());
  assert.equal(writes[1].audit.data.actorId, 'admin');
});
for (const [name, options, input, status] of [
  ['non-admin', { role: 'CUSTOMER' }, { action: 'slot', slot }, 403],
  ['unapproved venue', { link: 'PENDING' }, { action: 'slot', slot }, 400],
  ['overlap across venues', { overlap: true }, { action: 'slot', slot }, 409],
  ['new slot conflicts with booking', { booked: true }, { action: 'slot', slot }, 409],
  ['edit booked slot', { booked: true }, { action: 'slot', id: 'slot', slot }, 409],
  ['delete booked slot', { booked: true }, { action: 'deleteSlot', id: 'slot' }, 409],
  ['delete another coach slot', { owner: 'other' }, { action: 'deleteSlot', id: 'slot' }, 404],
  ['past slot', {}, { action: 'slot', slot: { ...slot, startsAt: '2000-01-01T03:00:00Z', endsAt: '2000-01-01T04:00:00Z' } }, 400],
  ['invalid duration', {}, { action: 'slot', slot: { ...slot, endsAt: slot.startsAt } }, 400],
]) test(`rejects ${name} without writes`, async () => {
  const { db, writes } = setup(options);
  await assert.rejects(manageCoach(db, 'admin', 'coach', input), e => e.status === status);
  assert.equal(writes.length, 0);
});
test('admin can link a venue and edit or delete an unbooked slot', async () => {
  for (const input of [{ action: 'venue', venueId: 'venue', status: 'ACTIVE' }, { action: 'slot', id: 'slot', slot }, { action: 'deleteSlot', id: 'slot' }]) {
    const { db, writes } = setup();
    await manageCoach(db, 'admin', 'coach', input);
    assert.equal(writes.length, 2);
    assert.equal(writes[1].audit.data.details.action, input.action);
  }
});

