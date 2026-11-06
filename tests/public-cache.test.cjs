const fs = require('node:fs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const ts = require('typescript');

const code = ts.transpileModule(fs.readFileSync('src/lib/public-cache.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText;
const paymentCode = ts.transpileModule(fs.readFileSync('src/lib/payment-error.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const errorModule = { exports: {} };
new Function('module', 'exports', paymentCode)(errorModule, errorModule.exports);

function deferred() {
  let resolve, reject;
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

function redisServer() {
  const values = new Map();
  const calls = [];
  const clients = [];
  const server = { values, calls, clients, fail: null, hangConnect: false };
  const read = key => {
    const entry = values.get(key);
    if (entry && entry.until <= Date.now()) { values.delete(key); return null; }
    return entry?.value ?? null;
  };
  class FakeRedis {
    constructor(url, options) { this.status = 'wait'; this.options = options; clients.push(this); }
    on() { return this; }
    async connect() {
      calls.push(['connect']);
      if (server.hangConnect) return new Promise(() => {});
      if (server.fail === 'connect') throw new Error('redis://user:SECRET@private.internal');
      this.status = 'ready';
    }
    disconnect() { this.status = 'end'; calls.push(['disconnect']); }
    async get(key) {
      calls.push(['get', key]);
      if (server.getDelayMs) await new Promise(resolve => setTimeout(resolve, server.getDelayMs));
      if (server.fail === 'get') throw new Error('redis://user:SECRET@private.internal');
      return read(key);
    }
    async set(key, value, mode, ms, condition) {
      calls.push(['set', key, value, mode, ms, condition]);
      assert.equal(mode, 'PX'); assert.equal(condition, 'NX');
      if (server.fail === 'set') throw new Error('Redis down');
      if (read(key) !== null) return null;
      values.set(key, { value, until: Date.now() + ms });
      return 'OK';
    }
    async eval(script, keyCount, ...args) {
      calls.push(['eval', keyCount, ...args]);
      if (server.fail === 'eval') throw new Error('Redis down');
      if (keyCount === 2 && args.length === 2) {
        let removed = 0;
        for (const key of args) if (values.delete(key)) removed++;
        return removed;
      }
      if (keyCount === 2) {
        const [valueKey, lockKey, token, serialized, seconds] = args;
        if (read(lockKey) !== token) return 0;
        values.set(valueKey, { value: serialized, until: Date.now() + seconds * 1000 });
        values.delete(lockKey);
        return 1;
      }
      const [key, token] = args;
      if (read(key) !== token) return 0;
      return Number(values.delete(key));
    }
  }
  server.Redis = FakeRedis;
  server.read = read;
  return server;
}

function setup({ server = redisServer(), env = {} } = {}) {
  const logs = [];
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'process', 'globalThis', 'console', code)(
    name => name === 'ioredis' ? server.Redis : name === './payment-error' ? errorModule.exports : require(name),
    module, module.exports,
    { env: { REDIS_URL: 'redis://user:SECRET@private.internal', NODE_ENV: 'test', ...env } }, {},
    { info: (...args) => logs.push(args), warn: (...args) => logs.push(args), error: (...args) => logs.push(args) },
  );
  return { ...module.exports, server, logs };
}

const valueKey = 'smashbook:test:public:v1:venues';
const lockKey = `${valueKey}:lock`;

test('cache miss loads once, then a hit avoids DB and TTL stays in its bounded jitter range', async () => {
  const cache = setup();
  let queries = 0;
  const loader = async () => { queries++; cache.recordPublicCacheDbQueries(2); return [{ id: 'public-venue' }]; };
  assert.deepEqual(await cache.cachedPublicData('venues', loader), [{ id: 'public-venue' }]);
  assert.deepEqual(await cache.cachedPublicData('venues', loader), [{ id: 'public-venue' }]);
  assert.equal(queries, 1);
  const publish = cache.server.calls.find(c => c[0] === 'eval' && c.length > 4);
  const ttl = publish.at(-1);
  assert.ok(ttl >= 54 && ttl <= 60);
  const metrics = cache.getPublicCacheMetrics();
  assert.equal(metrics.hit, 1); assert.equal(metrics.miss, 1);
  assert.equal(metrics.dbLoads, 1); assert.equal(metrics.dbQueries, 2);
  assert.equal(metrics.hitRate, 0.5);
  assert.equal(cache.server.clients.length, 1);
  assert.equal(cache.server.clients[0].options.enableOfflineQueue, false);
  assert.equal(cache.server.clients[0].options.maxRetriesPerRequest, 0);
});

test('simultaneous readers coalesce on a single loader, including when Redis is disabled', async () => {
  for (const env of [{}, { PUBLIC_CACHE_ENABLED: 'false' }, { REDIS_URL: '' }]) {
    const cache = setup({ env });
    const gate = deferred();
    let loads = 0;
    const requests = Array.from({ length: 30 }, () => cache.cachedPublicData('venues', async () => { loads++; return gate.promise; }));
    await tick();
    assert.equal(loads, 1);
    gate.resolve(['public']);
    assert.deepEqual(await Promise.all(requests), Array.from({ length: 30 }, () => ['public']));
    assert.equal(cache.getPublicCacheMetrics().coalesced, 29);
    if (env.PUBLIC_CACHE_ENABLED === 'false' || env.REDIS_URL === '') assert.equal(cache.server.clients.length, 0);
  }
});

test('expired data reloads instead of returning an expired value', async () => {
  const cache = setup();
  cache.server.values.set(valueKey, { value: JSON.stringify({ value: ['old'] }), until: Date.now() - 1 });
  assert.deepEqual(await cache.cachedPublicData('venues', async () => ['new']), ['new']);
  assert.deepEqual(JSON.parse(cache.server.read(valueKey)), { value: ['new'] });
});

test('Redis errors fall back once, open the cooldown and never log credentials or keys', async () => {
  const cache = setup();
  cache.server.fail = 'get';
  let loads = 0;
  const loader = async () => { loads++; return ['public']; };
  assert.deepEqual(await cache.cachedPublicData('venues', loader), ['public']);
  assert.deepEqual(await cache.cachedPublicData('venues', loader), ['public']);
  assert.equal(loads, 2);
  assert.equal(cache.server.calls.filter(c => c[0] === 'connect').length, 1);
  assert.ok(cache.getPublicCacheMetrics().errors > 0);
  const output = JSON.stringify({ logs: cache.logs, metrics: cache.getPublicCacheMetrics() });
  assert.doesNotMatch(output, /SECRET|private\.internal|redis:\/\/|public-venue|smashbook:/);
  assert.equal(cache.logs.length, 1);
});

test('hanging Redis connect has a short deadline and falls back to DB', async () => {
  const cache = setup();
  cache.server.hangConnect = true;
  const started = Date.now();
  assert.deepEqual(await cache.cachedPublicData('venues', async () => ['fallback']), ['fallback']);
  assert.ok(Date.now() - started < 1500);
  assert.equal(cache.getPublicCacheMetrics().dbLoads, 1);
  assert.equal(cache.server.clients[0].status, 'end');
});

test('a loader rejection propagates once and releases its own lock', async () => {
  const cache = setup();
  let loads = 0;
  const failure = new Error('Database unavailable');
  await assert.rejects(cache.cachedPublicData('venues', async () => { loads++; throw failure; }), error => error === failure);
  assert.equal(loads, 1);
  assert.equal(cache.server.read(lockKey), null);
  assert.equal(cache.getPublicCacheMetrics().errors, 0);
  assert.equal(cache.getPublicCacheMetrics().loadErrors, 1);
});

test('shouldCache=false keeps demo/fallback data out of Redis', async () => {
  const cache = setup();
  let loads = 0;
  const loader = async () => { loads++; return ['mock']; };
  await cache.cachedPublicData('venues', loader, { shouldCache: () => false });
  await cache.cachedPublicData('venues', loader, { shouldCache: () => false });
  assert.equal(loads, 2);
  assert.equal(cache.server.read(valueKey), null);
  assert.equal(cache.server.read(lockKey), null);
});

test('distributed readers wait for the lock holder instead of duplicating its DB query', async () => {
  const server = redisServer();
  const one = setup({ server });
  const two = setup({ server });
  const gate = deferred();
  let loads = 0;
  const first = one.cachedPublicData('venues', async () => { loads++; return gate.promise; });
  await tick();
  const second = two.cachedPublicData('venues', async () => { loads++; return ['duplicate']; });
  await new Promise(resolve => setTimeout(resolve, 80));
  assert.equal(loads, 1);
  gate.resolve(['shared']);
  assert.deepEqual(await first, ['shared']);
  assert.deepEqual(await second, ['shared']);
  assert.equal(loads, 1);
});

test('healthy Redis with a contended lock rejects after bounded wait without DB fan-out', async () => {
  const cache = setup();
  cache.server.values.set(lockKey, { value: 'another-process', until: Date.now() + 15000 });
  let loads = 0;
  const started = Date.now();
  await assert.rejects(cache.cachedPublicData('venues', async () => { loads++; return []; }), error => error.status === 503);
  assert.equal(loads, 0);
  assert.ok(Date.now() - started < 2000);
  assert.equal(cache.getPublicCacheMetrics().rejected, 1);
  assert.equal(cache.server.read(lockKey), 'another-process');
});

test('a healthy slow GET crossing the contention deadline never becomes a DB fallback', async () => {
  const cache = setup();
  cache.server.getDelayMs = 35;
  cache.server.values.set(lockKey, { value: 'another-process', until: Date.now() + 15000 });
  let loads = 0;
  await assert.rejects(cache.cachedPublicData('venues', async () => { loads++; return []; }), error => error.status === 503);
  assert.equal(loads, 0);
  assert.equal(cache.getPublicCacheMetrics().errors, 0);
  assert.equal(cache.getPublicCacheMetrics().bypass, 0);
});

test('invalidation fences an old loader and a new reader does not join its detached flight', async () => {
  const cache = setup();
  const old = deferred();
  const first = cache.cachedPublicData('venues', () => old.promise);
  await tick();
  await cache.invalidatePublicVenueCache();
  assert.deepEqual(await cache.cachedPublicData('venues', async () => ['new']), ['new']);
  old.resolve(['old']);
  assert.deepEqual(await first, ['old']);
  assert.deepEqual(JSON.parse(cache.server.read(valueKey)), { value: ['new'] });
  assert.deepEqual(await cache.cachedPublicData('venues', async () => ['unexpected']), ['new']);
});

test('expired/replaced lock owner cannot publish or release another owners lock', async () => {
  const cache = setup();
  const gate = deferred();
  const request = cache.cachedPublicData('venues', () => gate.promise);
  await tick();
  cache.server.values.set(lockKey, { value: 'new-owner', until: Date.now() + 15000 });
  gate.resolve(['too-late']);
  assert.deepEqual(await request, ['too-late']);
  assert.equal(cache.server.read(valueKey), null);
  assert.equal(cache.server.read(lockKey), 'new-owner');
});

test('failed invalidation is best effort, then local reads bypass the stale cache', async () => {
  const cache = setup();
  await cache.cachedPublicData('venues', async () => ['old']);
  cache.server.fail = 'eval';
  await cache.invalidatePublicVenueCache();
  cache.server.fail = null;
  assert.deepEqual(await cache.cachedPublicData('venues', async () => ['new']), ['new']);
  assert.equal(cache.getPublicCacheMetrics().bypass, 1);
  assert.ok(cache.getPublicCacheMetrics().errors >= 1);
});

test('fallback DB concurrency is capped even across repeatedly detached invalidations', async () => {
  const cache = setup({ env: { REDIS_URL: '' } });
  const gate = deferred();
  const requests = [];
  for (let i = 0; i < 4; i++) {
    requests.push(cache.cachedPublicData('venues', () => gate.promise));
    await tick();
    await cache.invalidatePublicVenueCache();
  }
  await assert.rejects(cache.cachedPublicData('venues', async () => ['overload']), error => error.status === 503);
  assert.equal(cache.getPublicCacheMetrics().activeLoads, 4);
  gate.resolve(['done']);
  await Promise.all(requests);
  assert.equal(cache.getPublicCacheMetrics().activeLoads, 0);
  assert.equal(cache.getPublicCacheMetrics().dbLoads, 4);
});

test('unknown/private keys are refused before connecting, and custom TTL/prefix are applied', async () => {
  const cache = setup({ env: { REDIS_CACHE_PREFIX: 'smashbook:preview-123:public:v1', PUBLIC_CACHE_TTL_SECONDS: '999999' } });
  await assert.rejects(cache.cachedPublicData('booking:user-123', async () => ['private']), /chưa được hỗ trợ/);
  assert.equal(cache.server.clients.length, 0);
  await cache.cachedPublicData('venues', async () => ['safe']);
  const publish = cache.server.calls.find(c => c[0] === 'eval' && c.length > 4);
  assert.equal(publish[2], 'smashbook:preview-123:public:v1:venues');
  assert.ok(publish.at(-1) >= 270 && publish.at(-1) <= 300);
});

test('coach catalog has its own key, TTL and singleflight; venue invalidation clears both catalogs', async () => {
  const cache = setup();
  let loads = 0;
  const loader = async () => { loads++; return ['coach']; };
  await cache.cachedPublicData('venues', async () => ['venue']);
  const results = await Promise.all(Array.from({ length: 20 }, () => cache.cachedPublicData('coaches', loader)));
  assert.ok(results.every(value => value[0] === 'coach'));
  await cache.cachedPublicData('coaches', loader);
  assert.equal(loads, 1);
  const coachKey = 'smashbook:test:public:v1:coaches';
  const publish = cache.server.calls.find(c => c[0] === 'eval' && c[2] === coachKey && c.length > 4);
  assert.ok(publish.at(-1) >= 54 && publish.at(-1) <= 60);
  await cache.invalidatePublicCoachCache();
  assert.equal(cache.server.read(coachKey), null);
  assert.ok(cache.server.read(valueKey), 'coach changes do not discard venue catalog');
  await cache.cachedPublicData('coaches', loader);
  await cache.invalidatePublicVenueCache();
  assert.equal(cache.server.read(coachKey), null);
  assert.equal(cache.server.read(valueKey), null);
});

test('coach invalidation fences an old loader; an unknown id cannot create arbitrary keys', async () => {
  const cache = setup();
  const gate = deferred();
  const first = cache.cachedPublicData('coaches', () => gate.promise);
  await tick();
  await cache.invalidatePublicCoachCache();
  await cache.cachedPublicData('coaches', async () => ['new']);
  gate.resolve(['old']);
  await first;
  assert.deepEqual(await cache.cachedPublicData('coaches', async () => ['unexpected']), ['new']);
  await assert.rejects(cache.cachedPublicData('coaches:unknown-id', async () => []), /chưa được hỗ trợ/);
});

test('coach Redis failure and loader failure never run a loader twice; failed invalidation bypasses old data', async () => {
  const cache = setup();
  await cache.cachedPublicData('coaches', async () => ['old']);
  cache.server.fail = 'eval';
  await cache.invalidatePublicCoachCache();
  cache.server.fail = null;
  let loads = 0;
  assert.deepEqual(await cache.cachedPublicData('coaches', async () => { loads++; return ['new']; }), ['new']);
  assert.equal(loads, 1);
  const failure = new Error('DB unavailable');
  await assert.rejects(cache.cachedPublicData('coaches', async () => { loads++; throw failure; }), error => error === failure);
  assert.equal(loads, 2);
  assert.equal(cache.getPublicCacheMetrics().loadErrors, 1);
});
