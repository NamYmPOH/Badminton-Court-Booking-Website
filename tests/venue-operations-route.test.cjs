const fs = require("node:fs");
const ts = require("typescript");
const assert = require("node:assert/strict");
const { test } = require("node:test");

function setup(role, venues) {
  const calls = { live: [], bookings: [] };
  class PaymentError extends Error {
    constructor(status, message) { super(message); this.status = status; }
  }
  const db = {
    user: { findUniqueOrThrow: async () => ({ id: "actor", role, status: "ACTIVE" }) },
    venue: { findMany: async () => venues },
    booking: { findMany: async (args) => { calls.bookings.push(args); return []; } },
  };
  const scope = role === "ADMIN" ? {} : { ownerId: "actor" };
  const mocks = {
    "@/lib/db": { db },
    "@/lib/payment-session": { requirePaymentUser: async () => "actor" },
    "@/lib/venue-operations": { operatorVenueScope: () => scope },
    "@/lib/admin-policy": {},
    "@/lib/sepay": {
      PaymentError,
      paymentErrorResponse: (e) => Response.json({ message: e.message }, { status: e.status || 500 }),
    },
    "@/services/admin.service": {},
    "@/services/venue-session.service": {
      processOverdueAndCompletions: async () => {},
      getVenueCourtsLiveStatus: async (_db, id) => { calls.live.push(id); return []; },
      getCurrentStaffShift: async () => null,
      hasActiveStaffShift: async () => false,
    },
  };
  const source = ts.transpileModule(fs.readFileSync(require.resolve("../src/app/api/venue-operations/route.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const compiled = { exports: {} };
  new Function("require", "exports", "module", source)((id) => id in mocks ? mocks[id] : require(id), compiled.exports, compiled);
  return { GET: compiled.exports.GET, calls, scope };
}

for (const role of ["ADMIN", "OWNER"]) {
  test(`${role}: loads only the selected venue and retains authorized scope`, async () => {
    const { GET, calls, scope } = setup(role, [{ id: "v1" }, { id: "v2" }]);
    const response = await GET(new Request("https://example.test/api/venue-operations?venueId=v2"));
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.selectedVenueId, "v2");
    assert.equal(data.venues.length, 2);
    assert.deepEqual(calls.live, ["v2"]);
    assert.deepEqual(calls.bookings[0].where.venueId, { in: ["v2"] });
    assert.deepEqual(calls.bookings[0].where.venue, scope);
  });
}

test("rejects an unauthorized venue without loading its courts or bookings", async () => {
  const { GET, calls } = setup("OWNER", [{ id: "v1" }]);
  const response = await GET(new Request("https://example.test/api/venue-operations?venueId=v2"));
  assert.equal(response.status, 403);
  assert.deepEqual(calls, { live: [], bookings: [] });
});

test("defaults to the first authorized venue and handles an empty scope", async () => {
  for (const venues of [[{ id: "v1" }, { id: "v2" }], []]) {
    const { GET, calls } = setup("OWNER", venues);
    const response = await GET(new Request("https://example.test/api/venue-operations"));
    assert.equal(response.status, 200);
    assert.deepEqual(calls.live, venues.length ? ["v1"] : []);
    assert.deepEqual(calls.bookings[0].where.venueId, { in: venues.length ? ["v1"] : [] });
  }
});
