const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const { test } = require("node:test");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText,
  filename,
);

function loadService(name, invalidate) {
  const filename = path.resolve(__dirname, `../src/services/${name}.ts`);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const localRequire = createRequire(filename);
  const mod = { exports: {} };
  vm.runInThisContext(`(function(require, module, exports) {${source}\n})`, { filename })(
    (id) => id === "../lib/public-cache" ? { invalidatePublicVenueCache: invalidate, invalidatePublicCoachCache: invalidate } : localRequire(id),
    mod,
    mod.exports,
  );
  return mod.exports;
}

const actor = { id: "admin", name: "Quản trị viên", role: "ADMIN", status: "ACTIVE" };

function fixture({ failCommit = false } = {}) {
  const events = [];
  const court = { id: "court", venueId: "venue", name: "Sân 1", status: "ACTIVE", sortOrder: 1, _count: { items: 0 } };
  const rule = { id: "price", venueId: "venue", walkInPrice: 100000 };
  const tx = {
    user: { findUnique: async () => actor, update: async () => actor },
    court: {
      findFirst: async () => null,
      findUnique: async () => court,
      aggregate: async () => ({ _max: { sortOrder: 1 } }),
      create: async ({ data }) => ({ ...court, ...data }),
      update: async ({ data }) => ({ ...court, ...data }),
      delete: async () => court,
    },
    pricingRule: {
      findUnique: async () => rule,
      create: async ({ data }) => ({ ...rule, ...data }),
      update: async ({ data }) => ({ ...rule, ...data }),
      delete: async () => rule,
    },
    venue: {
      findUnique: async () => ({ id: "venue", name: "Cơ sở", status: "PENDING", ownerId: "admin", owner: actor, courts: [court], pricing: [rule] }),
      update: async () => ({ id: "venue" }),
    },
    booking: {
      findFirst: async () => ({ id: "booking", venueId: "venue", status: "COMPLETED", items: [{ date: new Date("2026-01-01"), endMin: 600 }], review: null }),
    },
    review: {
      create: async ({ data }) => ({ id: "review", ...data }),
      aggregate: async () => ({ _avg: { rating: 5 }, _count: { _all: 1 } }),
    },
    coachProfile: {
      findUnique: async () => ({ id: "coach", userId: "admin", status: "ACTIVE", user: actor }),
      update: async () => ({ id: "coach", status: "ACTIVE" }),
    },
    coachVenue: {
      findUnique: async () => ({ id: "link", status: "PENDING", coach: { user: actor }, venue: { name: "Cơ sở" } }),
      update: async () => ({ id: "link", status: "ACTIVE" }),
      upsert: async () => ({ id: "link", status: "ACTIVE" }),
    },
    adminAudit: { create: async () => ({}) },
  };
  const db = {
    $transaction: async (work) => {
      const result = await work(tx);
      assert.deepEqual(events, [], "Cache must remain intact before commit");
      if (failCommit) throw new Error("commit failed");
      events.push("commit");
      return result;
    },
  };
  return {
    db, events,
    invalidate: async () => {
      assert.equal(events.at(-1), "commit", "Invalidation must follow successful commit");
      events.push("invalidate");
    },
  };
}

const cases = [
  ["createCourt", "venue-court.service", (s, db) => s.createCourt(db, actor, { venueId: "venue", name: "Sân 2" })],
  ["updateCourt", "venue-court.service", (s, db) => s.updateCourt(db, actor, { courtId: "court", name: "Sân mới" })],
  ["deleteCourt", "venue-court.service", (s, db) => s.deleteCourt(db, actor, "court")],
  ["upsertPricingRule", "venue-court.service", (s, db) => s.upsertPricingRule(db, actor, { venueId: "venue", daysOfWeek: [1], startMin: 360, endMin: 600, walkInPrice: 120000 })],
  ["deletePricingRule", "venue-court.service", (s, db) => s.deletePricingRule(db, actor, "price")],
  ["submitBookingReview", "review.service", (s, db) => s.submitBookingReview(db, "admin", "BOOK", { rating: 5 }, new Date("2026-01-02"))],
  ["VENUE_STATUS", "admin.service", (s, db) => s.performAdminAction(db, "admin", { action: "VENUE_STATUS", id: "venue", status: "ACTIVE", reason: "Duyệt cơ sở" })],
  ["COACH_STATUS", "admin.service", (s, db) => s.performAdminAction(db, "admin", { action: "COACH_STATUS", id: "coach", status: "ACTIVE", reason: "Duyệt huấn luyện viên" })],
  ["COACH_VENUE_STATUS", "admin.service", (s, db) => s.performAdminAction(db, "admin", { action: "COACH_VENUE_STATUS", id: "link", status: "ACTIVE", reason: "Duyệt liên kết cơ sở" })],
  ["USER_ACCESS", "admin.service", (s, db) => s.performAdminAction(db, "admin", { action: "USER_ACCESS", id: "admin", role: "ADMIN", status: "ACTIVE", reason: "Cập nhật quyền tài khoản" })],
  ["upsertMyCoachProfile", "coach.service", (s, db) => s.upsertMyCoachProfile(db, "admin", { bio: "Huấn luyện cầu lông cơ bản", specialties: ["Cơ bản"], experienceYears: 3, hourlyRate: 200000 })],
  ["reviewCoachVenue", "coach.service", (s, db) => s.reviewCoachVenue(db, "admin", { coachId: "coach", venueId: "venue", status: "ACTIVE", reason: "Duyệt liên kết cơ sở" })],
  ["manageCoach profile", "admin-coach.service", (s, db) => s.manageCoach(db, "admin", "coach", { action: "profile", profile: { bio: "Huấn luyện cầu lông cơ bản", specialties: ["Cơ bản"], experienceYears: 3, hourlyRate: 200000 } })],
  ["manageCoach venue", "admin-coach.service", (s, db) => s.manageCoach(db, "admin", "coach", { action: "venue", venueId: "venue", status: "SUSPENDED" })],
];

for (const [name, service, invoke] of cases) {
  test(`${name}: invalidates public cache after commit and preserves return value`, async () => {
    const f = fixture();
    const result = await invoke(loadService(service, f.invalidate), f.db);
    assert.ok(result);
    assert.deepEqual(f.events, ["commit", "invalidate"]);
  });

  test(`${name}: rejected commit does not invalidate public cache`, async () => {
    const f = fixture({ failCommit: true });
    await assert.rejects(invoke(loadService(service, f.invalidate), f.db), /commit failed/);
    assert.deepEqual(f.events, []);
  });
}
