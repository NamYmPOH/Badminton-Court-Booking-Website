import Redis from "ioredis";
import { randomUUID } from "node:crypto";
import { PaymentError } from "./payment-error";

const COMMAND_TIMEOUT_MS = 250;
const CONNECT_TIMEOUT_MS = 300;
const LOCK_MS = 15_000;
const WAIT_MS = 1_000;
const MAX_DB_LOADS = 4;
const MAX_TTL_SECONDS = 300;

// Removing the lock on invalidation fences out a loader that read before a write.
const PUBLISH = `
if redis.call('GET', KEYS[2]) == ARGV[1] then
  redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
  redis.call('DEL', KEYS[2])
  return 1
end
return 0`;
const RELEASE = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0`;
const INVALIDATE = "return redis.call('DEL', KEYS[1], KEYS[2])";

interface Metrics {
  requests: number;
  hit: number;
  miss: number;
  coalesced: number;
  errors: number;
  bypass: number;
  dbLoads: number;
  dbQueries: number;
  rejected: number;
  loadErrors: number;
  invalidations: number;
  loaderMs: number;
  responseMs: number;
}

interface CacheState {
  redis: Redis | null;
  connecting: Promise<Redis | null> | null;
  cooldownUntil: number;
  flights: Map<string, Promise<unknown>>;
  activeLoads: number;
  lastLogAt: number;
  metrics: Metrics;
}

const globalCache = globalThis as typeof globalThis & { __smashbookPublicCacheV1?: CacheState };
const state = globalCache.__smashbookPublicCacheV1 ??= {
  redis: null,
  connecting: null,
  cooldownUntil: 0,
  flights: new Map(),
  activeLoads: 0,
  lastLogAt: 0,
  metrics: {
    requests: 0, hit: 0, miss: 0, coalesced: 0, errors: 0, bypass: 0,
    dbLoads: 0, dbQueries: 0, rejected: 0, loadErrors: 0,
    invalidations: 0, loaderMs: 0, responseMs: 0,
  },
};

function ttlSeconds(value: unknown = process.env.PUBLIC_CACHE_TTL_SECONDS): number {
  const parsed = Number(value ?? 60);
  return Number.isFinite(parsed) ? Math.min(MAX_TTL_SECONDS, Math.max(5, Math.floor(parsed))) : 60;
}

function keys(key: string) {
  // A fixed allowlist avoids unbounded search/user-controlled cache cardinality.
  if (key !== "venues" && key !== "coaches") throw new Error("Loại cache công khai chưa được hỗ trợ.");
  const prefix = process.env.REDIS_CACHE_PREFIX || `smashbook:${process.env.NODE_ENV || "development"}:public:v1`;
  return { value: `${prefix}:${key}`, lock: `${prefix}:${key}:lock` };
}

function enabled(): boolean {
  return process.env.PUBLIC_CACHE_ENABLED !== "false" && Boolean(process.env.REDIS_URL);
}

function bounded<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Cache timeout")), ms);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

function cacheFailure(cooldownMs = 5_000) {
  state.metrics.errors++;
  state.cooldownUntil = Math.max(state.cooldownUntil, Date.now() + cooldownMs);
  const redis = state.redis;
  state.redis = null;
  // Do not log error objects: connection errors can contain credentials/URLs.
  redis?.disconnect();
}

async function redisConnection(forInvalidation = false): Promise<Redis | null> {
  if ((!forInvalidation && !enabled()) || !process.env.REDIS_URL || Date.now() < state.cooldownUntil) return null;
  if (state.redis?.status === "ready") return state.redis;
  if (state.connecting) return state.connecting;

  let client: Redis;
  try {
    client = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      connectTimeout: CONNECT_TIMEOUT_MS,
      commandTimeout: COMMAND_TIMEOUT_MS,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 0,
      retryStrategy: null,
      autoResendUnfulfilledCommands: false,
    });
    client.on("error", () => { /* handled by bounded operations; never log secrets */ });
    state.redis = client;
  } catch {
    cacheFailure();
    return null;
  }

  const connecting = (async () => {
    try {
      await bounded(client.connect(), CONNECT_TIMEOUT_MS);
      return client;
    } catch {
      cacheFailure();
      return null;
    }
  })();
  state.connecting = connecting;
  try {
    return await connecting;
  } finally {
    if (state.connecting === connecting) state.connecting = null;
  }
}

async function loadDatabase<T>(loader: () => Promise<T>): Promise<T> {
  if (state.activeLoads >= MAX_DB_LOADS) {
    state.metrics.rejected++;
    throw new PaymentError(503, "Hệ thống đang tải dữ liệu. Vui lòng thử lại sau.");
  }
  state.activeLoads++;
  state.metrics.dbLoads++;
  const started = Date.now();
  try {
    return await loader();
  } catch (error) {
    state.metrics.loadErrors++;
    throw error;
  } finally {
    state.activeLoads--;
    state.metrics.loaderMs += Date.now() - started;
  }
}

function decode<T>(raw: string): T {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || !("value" in parsed)) throw new Error("Invalid cache payload");
  return (parsed as { value: T }).value;
}

export interface PublicCacheOptions<T> {
  ttlSeconds?: number;
  shouldCache?: (value: T) => boolean;
}

async function readOrLoad<T>(key: string, loader: () => Promise<T>, options: PublicCacheOptions<T>): Promise<T> {
  const cacheKeys = keys(key);
  const client = await redisConnection();
  if (!client) {
    state.metrics.bypass++;
    return loadDatabase(loader);
  }

  const token = randomUUID();
  let ownsLock = false;
  try {
    const raw = await bounded(client.get(cacheKeys.value), COMMAND_TIMEOUT_MS);
    if (raw !== null) {
      state.metrics.hit++;
      return decode<T>(raw);
    }
    state.metrics.miss++;
    const deadline = Date.now() + WAIT_MS;
    while (Date.now() < deadline) {
      ownsLock = await bounded(client.set(cacheKeys.lock, token, "PX", LOCK_MS, "NX"), COMMAND_TIMEOUT_MS) === "OK";
      if (ownsLock) break;
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      await new Promise(resolve => setTimeout(resolve, Math.min(50, remaining)));
      if (Date.now() >= deadline) break;
      // The contention deadline is not a Redis error. Keep a normal command
      // timeout so a healthy GET crossing that deadline cannot trigger DB fan-out.
      const value = await bounded(client.get(cacheKeys.value), COMMAND_TIMEOUT_MS);
      if (value !== null) {
        state.metrics.hit++;
        return decode<T>(value);
      }
      if (Date.now() >= deadline) break;
    }
  } catch {
    cacheFailure();
    state.metrics.bypass++;
    return loadDatabase(loader);
  }

  if (!ownsLock) {
    // Redis is healthy and another process is loading: do not fan out to DB.
    state.metrics.rejected++;
    throw new PaymentError(503, "Dữ liệu đang được làm mới. Vui lòng thử lại sau.");
  }

  try {
    // Another process may have filled the value between the first GET and SET NX.
    try {
      const raw = await bounded(client.get(cacheKeys.value), COMMAND_TIMEOUT_MS);
      if (raw !== null) {
        state.metrics.hit++;
        return decode<T>(raw);
      }
    } catch { cacheFailure(); }

    // Keep loader outside Redis catch blocks: a DB error must never run it twice.
    const value = await loadDatabase(loader);
    if ((!options.shouldCache || options.shouldCache(value)) && state.redis === client && Date.now() >= state.cooldownUntil) {
      try {
        const serialized = JSON.stringify({ value });
        // Downward jitter spreads expiry while keeping TTL at or below its configured bound.
        const ttl = Math.max(1, Math.floor(ttlSeconds(options.ttlSeconds) * (0.9 + Math.random() * 0.1)));
        await bounded(client.eval(PUBLISH, 2, cacheKeys.value, cacheKeys.lock, token, serialized, ttl), COMMAND_TIMEOUT_MS);
      } catch { cacheFailure(); }
    }
    return value;
  } finally {
    if (state.redis === client) {
      try { await bounded(client.eval(RELEASE, 1, cacheKeys.lock, token), COMMAND_TIMEOUT_MS); }
      catch { cacheFailure(); }
    }
  }
}

/** Only pass public, JSON-serializable data, before user-specific filtering/sorting. */
export async function cachedPublicData<T>(key: string, loader: () => Promise<T>, options: PublicCacheOptions<T> = {}): Promise<T> {
  keys(key);
  state.metrics.requests++;
  const started = Date.now();
  const existing = state.flights.get(key);
  try {
    if (existing) {
      state.metrics.coalesced++;
      return await existing as T;
    }
    const flight = readOrLoad(key, loader, options);
    state.flights.set(key, flight);
    try {
      return await flight;
    } finally {
      // An invalidation may have detached this flight and installed a newer one.
      if (state.flights.get(key) === flight) state.flights.delete(key);
    }
  } finally {
    state.metrics.responseMs += Date.now() - started;
    if (Date.now() - state.lastLogAt >= 60_000) {
      state.lastLogAt = Date.now();
      console.info("[PUBLIC_CACHE_METRICS]", JSON.stringify(getPublicCacheMetrics()));
    }
  }
}

/** Call only AFTER the database transaction has committed successfully. */
export async function invalidatePublicVenueCache(): Promise<void> {
  // Coach DTOs also contain venue names, addresses and opening hours.
  await Promise.all([invalidatePublicData("venues"), invalidatePublicCoachCache()]);
}

export async function invalidatePublicCoachCache(): Promise<void> {
  await invalidatePublicData("coaches");
}

async function invalidatePublicData(key: "venues" | "coaches"): Promise<void> {
  state.flights.delete(key);
  state.metrics.invalidations++;
  if (!process.env.REDIS_URL) return;
  try {
    const client = await redisConnection(true);
    if (!client) throw new Error("Cache unavailable");
    const cacheKeys = keys(key);
    await bounded(client.eval(INVALIDATE, 2, cacheKeys.value, cacheKeys.lock), COMMAND_TIMEOUT_MS);
  } catch {
    // Failed deletion can leave an old value behind; bypass locally for the maximum TTL.
    // Other replicas are still eventually consistent until that value expires.
    cacheFailure(MAX_TTL_SECONDS * 1_000);
  }
}

/** Explicit instrumentation for the DB queries performed by the catalog loader. */
export function recordPublicCacheDbQueries(count: number): void {
  if (Number.isFinite(count) && count > 0) state.metrics.dbQueries += Math.floor(count);
}

export function getPublicCacheMetrics() {
  const metrics = { ...state.metrics };
  return {
    ...metrics,
    hitRate: metrics.hit + metrics.miss ? metrics.hit / (metrics.hit + metrics.miss) : 0,
    averageLoaderMs: metrics.dbLoads ? metrics.loaderMs / metrics.dbLoads : 0,
    averageResponseMs: metrics.requests ? metrics.responseMs / metrics.requests : 0,
    activeLoads: state.activeLoads,
  };
}
