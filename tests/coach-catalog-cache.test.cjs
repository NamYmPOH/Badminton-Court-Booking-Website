const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');

require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);

function loadTs(file, imports) {
  const filename = path.resolve(file);
  const localRequire = createRequire(filename);
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', code)(id => imports[id] || localRequire(id), mod, mod.exports);
  return mod.exports;
}

function row(id, rate, specialty, district) {
  return {
    id, userId: `user-${id}`, bio: `Dạy ${specialty}`, specialties: [specialty],
    experienceYears: 3, hourlyRate: rate, createdAt: new Date('2026-01-01'),
    phone: 'PRIVATE_PHONE', reviewReason: 'PRIVATE_REASON',
    user: { name: `HLV ${id}`, image: null, email: 'PRIVATE_EMAIL' },
    certificates: [{ id: `cert-${id}`, title: 'Chứng chỉ', verifiedAt: new Date('2026-01-01'), fileKey: 'PRIVATE_FILE' }],
    venues: [{ venue: { id: `venue-${id}`, name: 'Sân', slug: 'san', address: 'Hà Nội',
      district, province: 'Hà Nội', openMin: 300, closeMin: 1380, bankAccount: 'PRIVATE_BANK' } }],
  };
}

function fixture() {
  let stored;
  let fail = false;
  const calls = { loads: 0, cache: 0, queries: 0 };
  const rows = [row('alpha', 100000, 'Cơ bản', 'Cầu Giấy'), row('beta', 200000, 'Nâng cao', 'Ba Đình')];
  const database = { coachProfile: { findMany: async args => {
    calls.loads++;
    assert.deepEqual(args.where, { status: 'ACTIVE', user: { status: 'ACTIVE' } });
    assert.deepEqual(args.select.venues.where, { status: 'ACTIVE', venue: { status: 'ACTIVE' } });
    assert.deepEqual(args.select.certificates.where, { verifiedAt: { not: null } });
    assert.equal(args.select.user.select.email, undefined);
    assert.equal(args.select.user.select.phone, undefined);
    assert.equal(args.select.certificates.select.fileKey, undefined);
    if (fail) throw new Error('DB unavailable');
    return rows;
  } } };
  const imports = {
    '../lib/db': { db: database },
    '../lib/public-cache': {
      cachedPublicData: async (key, loader) => {
        calls.cache++; assert.equal(key, 'coaches');
        if (stored !== undefined) return JSON.parse(stored);
        const value = await loader();
        stored = JSON.stringify(value);
        return value;
      },
      recordPublicCacheDbQueries: count => { calls.queries += count; },
    },
  };
  const catalog = loadTs('src/services/public-coach-catalog.ts', imports);
  const service = loadTs('src/services/coach.service.ts', { ...imports, './public-coach-catalog': catalog });
  return { catalog, service, database, calls, rows, stored: () => stored, fail: () => { fail = true; } };
}

test('list, search, pagination and detail share the public coach catalog without extra DB reads', async () => {
  const f = fixture();
  assert.equal((await f.service.getPublicCoaches()).total, 2);
  assert.equal((await f.service.getPublicCoaches(undefined, { q: 'ALPHA' })).coaches[0].id, 'alpha');
  assert.equal((await f.service.getPublicCoaches(undefined, { page: 2, limit: 1 })).coaches[0].id, 'beta');
  assert.equal((await f.service.getPublicCoachById(undefined, 'beta')).id, 'beta');
  assert.equal(f.calls.loads, 1);
  assert.equal(f.calls.queries, 1);
  await assert.rejects(f.service.getPublicCoachById(undefined, 'unknown'), error => error.status === 404);
  assert.equal(f.calls.loads, 1, 'unknown ids never create new cache keys or query the DB');
});

test('filters are applied per request; one viewer never receives another filter result', async () => {
  const f = fixture();
  const list = params => f.service.getPublicCoaches(undefined, params);
  assert.deepEqual((await list({ minRate: 150000 })).coaches.map(c => c.id), ['beta']);
  assert.deepEqual((await list({ maxRate: 150000 })).coaches.map(c => c.id), ['alpha']);
  assert.deepEqual((await list({ specialty: 'Cơ bản' })).coaches.map(c => c.id), ['alpha']);
  assert.deepEqual((await list({ venueId: 'venue-beta' })).coaches.map(c => c.id), ['beta']);
  assert.deepEqual((await list({ district: 'CẦU GIẤY' })).coaches.map(c => c.id), ['alpha']);
  assert.equal((await list({ q: 'missing' })).total, 0);
  assert.equal((await list({})).total, 2);
  assert.equal(f.calls.loads, 1);
});

test('shared DTO excludes credentials, contacts, certificate files and internal metadata; dates survive JSON', async () => {
  const f = fixture();
  await f.service.getPublicCoaches();
  assert.doesNotMatch(f.stored(), /PRIVATE_|email|phone|fileKey|bankAccount|reviewReason/);
  const detail = await f.service.getPublicCoachById(undefined, 'alpha');
  assert.equal(detail.createdAt, '2026-01-01T00:00:00.000Z');
  assert.equal(detail.certificates[0].verifiedAt, '2026-01-01T00:00:00.000Z');
  const list = await f.service.getPublicCoaches();
  assert.equal(list.coaches[0].certificates, undefined);
  assert.equal(list.coaches[0].venues[0].openMin, undefined);
});

test('injected clients bypass shared Redis; DB failure propagates without being cached or retried', async () => {
  const f = fixture();
  await f.service.getPublicCoaches();
  const alternate = { coachProfile: { findMany: async () => [row('other', 500000, 'Cơ bản', 'Quận khác')] } };
  assert.equal((await f.service.getPublicCoaches(alternate)).coaches[0].id, 'other');
  assert.equal((await f.service.getPublicCoaches()).coaches[0].id, 'alpha');
  const broken = fixture();
  broken.fail();
  await assert.rejects(broken.service.getPublicCoaches(), /DB unavailable/);
  assert.equal(broken.stored(), undefined);
  assert.equal(broken.calls.loads, 1);
});

test('certificate deletion invalidates after successful deletion, and leaves cache intact on failure', async () => {
  for (const fail of [false, true]) {
    const events = [];
    const service = loadTs('src/services/coach.service.ts', {
      '../lib/public-cache': { invalidatePublicCoachCache: async () => events.push('invalidate') },
    });
    const database = {
      coachProfile: { findUnique: async () => ({ id: 'coach' }) },
      coachCertificate: {
        findUnique: async () => ({ coachId: 'coach' }),
        delete: async () => {
          if (fail) throw new Error('delete failed');
          events.push('deleted'); return { id: 'cert' };
        },
      },
    };
    if (fail) {
      await assert.rejects(service.deleteCoachCertificate(database, 'user', 'cert'), /delete failed/);
      assert.deepEqual(events, []);
    } else {
      assert.equal((await service.deleteCoachCertificate(database, 'user', 'cert')).id, 'cert');
      assert.deepEqual(events, ['deleted', 'invalidate']);
    }
  }
});

test('account name/image update invalidates coach cache after write; rejected update leaves cache intact', async () => {
  for (const fail of [false, true]) {
    const events = [];
    const route = loadTs('src/app/api/auth/profile/route.ts', {
      'next/server': { NextResponse: { json: value => value } },
      '@/lib/db': { db: { user: {
        findFirst: async () => null,
        update: async () => {
          if (fail) throw new Error('write failed');
          events.push('updated'); return { id: 'user', name: 'Tên mới', image: null, phone: '0912345678', emailVerified: null };
        },
      } } },
      '@/lib/payment-session': { requirePaymentUser: async () => 'user' },
      '@/services/auth.service': {},
      '@/services/email.service': {},
      '@/lib/sepay': { paymentErrorResponse: error => ({ error: error.message }) },
      '@/lib/admin-policy': { assertSameOrigin() {} },
      '@/lib/public-cache': { invalidatePublicCoachCache: async () => events.push('invalidate') },
    });
    const result = await route.PATCH({ json: async () => ({ name: 'Tên mới', phone: '0912345678' }) });
    if (fail) {
      assert.equal(result.error, 'write failed'); assert.deepEqual(events, []);
    } else {
      assert.equal(result.success, true); assert.deepEqual(events, ['updated', 'invalidate']);
    }
  }
});
