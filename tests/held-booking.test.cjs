const fs = require('node:fs');
const ts = require('typescript');
const { test } = require('node:test');
const assert = require('node:assert/strict');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
const { heldBookingPaymentUrl } = require('../src/lib/held-booking.ts');
const now = new Date('2026-11-03T02:00:00Z');
const booking = { userId: 'owner', code: 'SB123', status: 'PENDING_PAYMENT', expiresAt: new Date('2026-11-03T02:05:00Z') };
test('owner resumes the existing individual booking', () => {
  assert.equal(heldBookingPaymentUrl(booking, 'owner', now), '/payment/result?booking=SB123');
});
test('owner resumes group payment', () => {
  assert.equal(heldBookingPaymentUrl({ ...booking, group: { inviteToken: 'invite', closedAt: null } }, 'owner', now), '/groups/invite');
});
test('anonymous and other accounts receive no payment link or group token', () => {
  for (const viewer of [null, 'other']) {
    assert.equal(heldBookingPaymentUrl(booking, viewer, now), null);
    assert.equal(heldBookingPaymentUrl({ ...booking, group: { inviteToken: 'private-token', closedAt: null } }, viewer, now), null);
  }
  assert.equal(heldBookingPaymentUrl({ ...booking, userId: null }, null, now), null);
});
test('expired, paid, cancelled and closed group holds cannot resume', () => {
  for (const patch of [{ expiresAt: now }, { expiresAt: new Date(now.getTime() - 1) }, { expiresAt: null }, { status: 'CONFIRMED' }, { status: 'CANCELLED' }, { group: { inviteToken: 'invite', closedAt: now } }]) {
    assert.equal(heldBookingPaymentUrl({ ...booking, ...patch }, 'owner', now), null);
  }
});
