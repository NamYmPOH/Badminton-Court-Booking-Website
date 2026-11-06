// Smoke test Redis thật bằng namespace tạm; --catalog đọc DB, không sửa catalog thật.
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const assert = require('node:assert/strict');
const ts = require('typescript');
const Redis = require('ioredis');
const { loadEnvConfig } = require('@next/env');

const root = path.resolve(__dirname, '..');
loadEnvConfig(root, true, { info() {}, error() {} });

function loadTs(filename, imports = {}) {
  const mod = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', source)(name => imports[name] || require(name), mod, mod.exports);
  return mod.exports;
}

async function main() {
  if (!process.env.REDIS_URL) throw new Error('REDIS_URL chưa được cấu hình.');
  const prefix = `smashbook:cache-check:${randomUUID()}`;
  process.env.REDIS_CACHE_PREFIX = prefix;
  process.env.PUBLIC_CACHE_ENABLED = 'true';
  process.env.PUBLIC_CACHE_TTL_SECONDS = '60';
  const clients = [];
  class TrackedRedis extends Redis {
    constructor(...args) { super(...args); clients.push(this); }
  }
  const cache = loadTs(path.join(root, 'src/lib/public-cache.ts'), {
    ioredis: TrackedRedis,
    './payment-error': loadTs(path.join(root, 'src/lib/payment-error.ts')),
  });
  try {
    for (const key of ['venues', 'coaches']) {
      let loads = 0;
      const loader = async () => {
        loads++;
        await new Promise(resolve => setTimeout(resolve, 25));
        return [{ id: 'cache-check', revision: loads }];
      };
      const results = await Promise.all(Array.from({ length: 20 }, () => cache.cachedPublicData(key, loader)));
      assert.ok(results.every(value => value[0].revision === 1));
      assert.equal(loads, 1);
      assert.equal(cache.getPublicCacheMetrics().errors, 0, 'Không kết nối được Redis hoặc Redis trả lỗi.');
      const client = clients.find(c => c.status === 'ready');
      const ttl = await client.ttl(prefix + ':' + key);
      assert.ok(ttl > 0 && ttl <= 60, 'Key phải có TTL dương và tối đa 60 giây.');
      const hits = cache.getPublicCacheMetrics().hit;
      await cache.cachedPublicData(key, loader);
      assert.equal(loads, 1, 'Cache hit không được gọi loader.');
      assert.equal(cache.getPublicCacheMetrics().hit, hits + 1);
      if (key === 'venues') await cache.invalidatePublicVenueCache();
      else await cache.invalidatePublicCoachCache();
      assert.equal((await cache.cachedPublicData(key, loader))[0].revision, 2);
      assert.equal(loads, 2);
      assert.equal(cache.getPublicCacheMetrics().errors, 0);
      console.log('PASS: ' + key + '; Redis thật; TTL=' + ttl + 's; gộp 20 yêu cầu; cache hit; invalidation và tải lại.');
    }
    if (process.argv.includes('--catalog')) {
      // Opt-in: read the real public coach catalog, but cache it in the temporary namespace.
      require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
      }).outputText, filename);
      const { PrismaClient } = require('@prisma/client');
      const { runtimeDatabaseUrl } = require('../src/lib/database-url.ts');
      const url = runtimeDatabaseUrl(process.env.DATABASE_URL);
      const database = new PrismaClient({ ...(url ? { datasources: { db: { url } } } : {}), log: [] });
      try {
        await cache.invalidatePublicCoachCache();
        const catalog = loadTs(path.join(root, 'src/services/public-coach-catalog.ts'), {
          '../lib/db': { db: database },
          '../lib/public-cache': cache,
          '../lib/coach-policy': require('../src/lib/coach-policy.ts'),
        });
        const started = Date.now();
        const first = await catalog.listPublicCoachCatalog(database, {});
        const coldMs = Date.now() - started;
        const before = cache.getPublicCacheMetrics();
        const warmStart = Date.now();
        const second = await catalog.listPublicCoachCatalog(database, {});
        const warmMs = Date.now() - warmStart;
        const after = cache.getPublicCacheMetrics();
        assert.deepEqual(second, first);
        assert.equal(after.hit, before.hit + 1);
        assert.equal(after.dbQueries, before.dbQueries);
        assert.equal(after.errors, 0);
        console.log('PASS: catalog HLV thật; ' + first.total + ' hồ sơ; cold=' + coldMs + 'ms; warm=' + warmMs + 'ms; lượt đọc lại không truy vấn DB.');
      } finally { await database.$disconnect(); }
    }
    console.log(JSON.stringify(cache.getPublicCacheMetrics(), null, 2));
  } finally {
    const client = clients.find(c => c.status === 'ready');
    try { if (client) await client.del(`${prefix}:venues`, `${prefix}:venues:lock`, `${prefix}:coaches`, `${prefix}:coaches:lock`); }
    finally { for (const connection of clients) connection.disconnect(); }
  }
}

main().catch(() => {
  // Không in error gốc vì lỗi kết nối có thể chứa URL/credentials.
  console.error('FAIL: kiểm tra REDIS_URL, TLS, quyền GET/SET/EVAL/DEL; với --catalog kiểm tra thêm DATABASE_URL. Xem docs/redis-cache.vi.md.');
  process.exitCode = 1;
});
