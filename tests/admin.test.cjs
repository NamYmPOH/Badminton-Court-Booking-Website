const fs = require("node:fs");
const ts = require("typescript");
const assert = require("node:assert/strict");
const { test } = require("node:test");
require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    }).outputText,
    filename,
  );
const {
  assertAdmin,
  assertSameOrigin,
  checkBookingAction,
  adminActionSchema,
} = require("../src/lib/admin-policy.ts");
const { venueRegistrationSchema } = require("../src/lib/venue-registration.ts");
const { performAdminAction } = require("../src/services/admin.service.ts");
const { signSessionToken, verifySessionToken } = require("../src/lib/auth-token.ts");

test("session tokens require configured secrets and reject tampering", () => {
  const previous = process.env.AUTH_SECRET;
  try {
    process.env.AUTH_SECRET = "local-test-session-secret-never-use-in-production";
    const token = signSessionToken("admin");
    assert.equal(verifySessionToken(token), "admin");
    assert.equal(verifySessionToken(token + "changed"), null);
    delete process.env.AUTH_SECRET;
    assert.equal(verifySessionToken(token), null);
    assert.throws(() => signSessionToken("admin"));
  } finally {
    if (previous === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = previous;
  }
});

test("only active admins pass the server authorization gate", () => {
  assert.doesNotThrow(() => assertAdmin({ role: "ADMIN", status: "ACTIVE" }));
  for (const user of [
    null,
    ...["CUSTOMER", "OWNER", "STAFF"].map((role) => ({
      role,
      status: "ACTIVE",
    })),
    { role: "ADMIN", status: "BLOCKED" },
  ]) {
    assert.throws(
      () => assertAdmin(user),
      (e) => e.status === 403,
    );
  }
});
test("admin writes reject cross-origin requests and privileged extra fields", () => {
  assert.throws(
    () =>
      assertSameOrigin(
        new Request("https://app.test/api/admin", {
          headers: { origin: "https://evil.test" },
        }),
      ),
    (e) => e.status === 403,
  );
  assert.throws(
    () =>
      assertSameOrigin(
        new Request("https://app.test/api/admin", {
          headers: { "sec-fetch-site": "cross-site" },
        }),
      ),
    (e) => e.status === 403,
  );
  assert.doesNotThrow(() =>
    assertSameOrigin(
      new Request("https://app.test/api/admin", {
        headers: { origin: "https://app.test" },
      }),
    ),
  );
  assert.equal(
    adminActionSchema.safeParse({
      action: "CASH_PAID",
      id: "b",
      reason: "Received in full",
      amount: 1,
    }).success,
    false,
  );
  assert.equal(
    adminActionSchema.safeParse({ action: "CANCEL", id: "b", reason: " " })
      .success,
    false,
  );
});
test("online bookings cannot be confirmed unpaid, paid late, or collected as cash", () => {
  const b = {
    status: "PENDING_PAYMENT",
    paymentStatus: "PENDING",
    expiresAt: new Date(Date.now() + 60000),
    venue: { paymentMode: "ONLINE_FULL" },
  };
  assert.throws(
    () => checkBookingAction(b, "CONFIRM"),
    (e) => e.status === 409,
  );
  assert.throws(
    () => checkBookingAction({ ...b, status: "CONFIRMED" }, "CASH_PAID"),
    (e) => e.status === 409,
  );
  assert.throws(
    () =>
      checkBookingAction(
        { ...b, paymentStatus: "PAID", expiresAt: new Date(0) },
        "CONFIRM",
      ),
    (e) => e.status === 409,
  );
  assert.doesNotThrow(() =>
    checkBookingAction({ ...b, paymentStatus: "PAID" }, "CONFIRM"),
  );
  assert.throws(
    () => checkBookingAction({ ...b, status: "CONFIRMED" }, "CHECK_IN"),
    (e) => e.status === 409,
  );
});
test("venue registration never accepts an owner ID, approval, or role from client", () => {
  const data = {
    name: "Test venue",
    address: "123 Test street",
    district: "Test",
    province: "Hà Nội",
    phone: "0901234567",
    lat: 21,
    lng: 105,
    courts: 2,
    hourlyPrice: 100000,
    openMin: 360,
    closeMin: 1320,
  };
  assert.equal(venueRegistrationSchema.safeParse(data).success, true);
  for (const extra of [
    { ownerId: "other-user" },
    { status: "ACTIVE" },
    { role: "ADMIN" },
    { hourlyPrice: -1 },
    { closeMin: 300 },
  ])
    assert.equal(
      venueRegistrationSchema.safeParse({ ...data, ...extra }).success,
      false,
    );
});

function database(patch = {}, failAudit = false) {
  let state = {
    users: [
      { id: "admin", name: "Administrator", role: "ADMIN", status: "ACTIVE" },
      { id: "customer", name: "Customer", role: "CUSTOMER", status: "ACTIVE" },
    ],
    booking: {
      id: "b",
      code: "DATSAN123",
      total: 100000,
      status: "CONFIRMED",
      paymentStatus: "UNPAID",
      expiresAt: null,
      venue: { paymentMode: "AT_VENUE" },
      items: [{ status: "CONFIRMED" }],
    },
    venue: {
      id: "v",
      name: "Test venue",
      status: "PENDING",
      ownerId: "customer",
      owner: { role: "CUSTOMER", status: "ACTIVE" },
      courts: [{ status: "ACTIVE" }],
      pricing: [{}],
    },
    payments: [],
    audits: [],
    receipt: null,
    ...patch,
  };
  return {
    get state() {
      return state;
    },
    async $transaction(work) {
      const copy = structuredClone(state);
      const tx = {
        user: {
          findUnique: async ({ where }) =>
            copy.users.find((u) => u.id === where.id),
          count: async () =>
            copy.users.filter(
              (u) => u.role === "ADMIN" && u.status === "ACTIVE",
            ).length,
          update: async ({ where, data }) =>
            Object.assign(
              copy.users.find((u) => u.id === where.id),
              data,
            ),
        },
        venue: {
          findUnique: async () => copy.venue,
          update: async ({ data }) => Object.assign(copy.venue, data),
        },
        booking: {
          findUnique: async () => copy.booking,
          update: async ({ data }) => Object.assign(copy.booking, data),
        },
        bookingItem: {
          updateMany: async ({ data }) => {
            copy.booking.items.forEach((i) => Object.assign(i, data));
            return { count: copy.booking.items.length };
          },
        },
        payment: {
          create: async ({ data }) => {
            if (copy.payments.some((p) => p.txnRef === data.txnRef))
              throw new Error("Duplicate payment");
            copy.payments.push(data);
            return data;
          },
          updateMany: async ({ data }) =>
            copy.payments.forEach((p) => Object.assign(p, data)),
        },
        sepayReceipt: {
          findUnique: async () => copy.receipt,
          update: async ({ data }) => Object.assign(copy.receipt, data),
        },
        adminAudit: {
          create: async ({ data }) => {
            if (failAudit) throw new Error("audit unavailable");
            copy.audits.push(data);
            return data;
          },
        },
      };
      const result = await work(tx);
      state = copy;
      return result;
    },
  };
}
const action = (name, extra = {}) => ({
  action: name,
  id: "b",
  reason: "Verified by administrator",
  ...extra,
});
test("permissions are re-read inside transaction; denial leaves no mutations", async () => {
  const db = database();
  await assert.rejects(
    performAdminAction(db, "customer", action("CASH_PAID")),
    (e) => e.status === 403,
  );
  assert.equal(db.state.payments.length, 0);
});
test("cash collection is atomic, audited, and cannot be applied twice", async () => {
  const db = database();
  await performAdminAction(db, "admin", action("CASH_PAID"));
  assert.equal(db.state.booking.paymentStatus, "PAID");
  assert.equal(db.state.payments[0].amount, 100000);
  assert.equal(db.state.audits.length, 1);
  await assert.rejects(
    performAdminAction(db, "admin", action("CASH_PAID")),
    (e) => e.status === 409,
  );
  assert.equal(db.state.payments.length, 1);
  const failed = database({}, true);
  await assert.rejects(
    performAdminAction(failed, "admin", action("CASH_PAID")),
  );
  assert.equal(failed.state.booking.paymentStatus, "UNPAID");
  assert.equal(failed.state.payments.length, 0);
});
test("paid cancellation releases slots and requests refund without claiming money returned", async () => {
  const db = database();
  await performAdminAction(db, "admin", action("CASH_PAID"));
  await performAdminAction(db, "admin", action("CANCEL"));
  assert.equal(db.state.booking.status, "CANCELLED");
  assert.equal(db.state.booking.paymentStatus, "REFUND_PENDING");
  assert.equal(db.state.payments[0].status, "REFUND_PENDING");
  assert.equal(db.state.booking.items[0].status, "CANCELLED");
});
test("admin cannot self-demote or self-block; approved owners cannot self-approve", async () => {
  const db = database();
  for (const change of [
    { role: "CUSTOMER", status: "ACTIVE" },
    { role: "ADMIN", status: "BLOCKED" },
  ])
    await assert.rejects(
      performAdminAction(
        db,
        "admin",
        action("USER_ACCESS", { id: "admin", ...change }),
      ),
      (e) => e.status === 409,
    );
  await performAdminAction(
    db,
    "admin",
    action("VENUE_STATUS", { id: "v", status: "ACTIVE" }),
  );
  assert.equal(db.state.venue.status, "ACTIVE");
  assert.equal(db.state.users[1].role, "OWNER");
  await assert.rejects(
    performAdminAction(
      db,
      "customer",
      action("VENUE_STATUS", { id: "v", status: "ACTIVE" }),
    ),
    (e) => e.status === 403,
  );
});
test("venue approval rejects missing courts, prices or blocked owners", async () => {
  for (const patch of [
    { courts: [] },
    { pricing: [] },
    { owner: { status: "BLOCKED" } },
  ]) {
    const db = database();
    const venue = { ...db.state.venue, ...patch };
    await assert.rejects(
      performAdminAction(
        database({ venue }),
        "admin",
        action("VENUE_STATUS", { id: "v", status: "ACTIVE" }),
      ),
      (e) => e.status === 409,
    );
  }
});
test("manual reconciliation checks stored bank evidence and refuses reused/expired/mismatched payments", async () => {
  Object.assign(process.env, {
    SEPAY_WEBHOOK_SECRET: "test-only-webhook-secret",
    BANK_BIN: "970415",
    BANK_ACCOUNT_NO: "0001234703",
    BANK_ACCOUNT_NAME: "TEST",
    SEPAY_BANK_GATEWAY: "VietinBank",
  });
  const payload = {
    id: 123,
    gateway: "VietinBank",
    accountNumber: "0001234703",
    content: "mistyped transfer",
    transferType: "in",
    transferAmount: 100000,
  };
  const receipt = {
    transactionId: "123",
    result: "REVIEW_BOOKING_CODE",
    payload,
  };
  const booking = {
    ...database().state.booking,
    status: "PENDING_PAYMENT",
    paymentStatus: "PENDING",
    expiresAt: new Date(Date.now() + 60000),
    items: [{ status: "HELD" }],
  };
  const match = action("MATCH_RECEIPT", {
    id: "123",
    bookingCode: "DATSAN123",
  });
  const db = database({ receipt, booking });
  await performAdminAction(db, "admin", match);
  assert.equal(db.state.booking.paymentStatus, "PAID");
  assert.equal(db.state.receipt.result, "PAID_MANUAL_MATCH");
  assert.equal(db.state.payments[0].txnRef, "SEPAY-123");
  await assert.rejects(
    performAdminAction(db, "admin", match),
    (e) => e.status === 409,
  );
  for (const patch of [
    { transferType: "out" },
    { transferAmount: 99999 },
    { accountNumber: "wrong" },
    { gateway: "wrong" },
  ]) {
    const failed = database({
      booking,
      receipt: { ...receipt, payload: { ...payload, ...patch } },
    });
    await assert.rejects(
      performAdminAction(failed, "admin", match),
      (e) => e.status === 409,
    );
    assert.equal(failed.state.payments.length, 0);
  }
  await assert.rejects(
    performAdminAction(
      database({ receipt, booking: { ...booking, expiresAt: new Date(0) } }),
      "admin",
      match,
    ),
    (e) => e.status === 409,
  );
});
