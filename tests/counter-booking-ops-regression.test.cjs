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
  assertVenueOperatorAccess,
  createCounterBooking,
  confirmCashPayment,
  completeBookingSession,
} = require("../src/services/venue-session.service.ts");

const { recordVoucherConsumption } = require("../src/services/settlement.service.ts");

function createMockDb(initialState = {}) {
  let state = {
    users: [
      { id: "admin", name: "Quản trị viên", role: "ADMIN", status: "ACTIVE" },
      { id: "owner_a", name: "Chủ sân A", role: "OWNER", status: "ACTIVE" },
      { id: "owner_multi", name: "Chủ sân A kiêm Staff B", role: "OWNER", status: "ACTIVE" },
      { id: "staff_b", name: "Nhân viên sân B", role: "STAFF", status: "ACTIVE" },
      { id: "blocked_staff", name: "Nhân viên bị khóa", role: "STAFF", status: "BLOCKED" },
      { id: "customer_x", name: "Khách hàng X", role: "CUSTOMER", status: "ACTIVE" },
    ],
    venues: [
      {
        id: "venue_a",
        name: "Sân A",
        ownerId: "owner_a",
        status: "ACTIVE",
        openMin: 360,
        closeMin: 1320,
        minBookingMin: 60,
        maxBookingMin: 240,
        priceFrom: 100000,
        pricing: [
          {
            id: "pr_a1",
            venueId: "venue_a",
            daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
            startMin: 360,
            endMin: 1080, // 06:00 - 18:00
            walkInPrice: 80000,
            fixedPrice: 70000,
          },
          {
            id: "pr_a2",
            venueId: "venue_a",
            daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
            startMin: 1080,
            endMin: 1320, // 18:00 - 22:00
            walkInPrice: 160000,
            fixedPrice: 140000,
          },
        ],
      },
      {
        id: "venue_b",
        name: "Sân B",
        ownerId: "owner_b",
        status: "ACTIVE",
        openMin: 360,
        closeMin: 1320,
        minBookingMin: 60,
        maxBookingMin: 240,
        priceFrom: 120000,
        pricing: [
          {
            id: "pr_b1",
            venueId: "venue_b",
            daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
            startMin: 360,
            endMin: 1320,
            walkInPrice: 120000,
            fixedPrice: 100000,
          },
        ],
      },
    ],
    courtBlocks: [],
    courts: [
      { id: "court_a1", venueId: "venue_a", name: "Sân A1", status: "ACTIVE" },
      { id: "court_b1", venueId: "venue_b", name: "Sân B1", status: "ACTIVE" },
    ],
    venueStaff: [
      { id: "vs_1", userId: "owner_multi", venueId: "venue_b", role: "STAFF", isActive: true },
      { id: "vs_2", userId: "staff_b", venueId: "venue_b", role: "STAFF", isActive: true },
    ],
    staffShifts: [],
    bookings: [],
    bookingItems: [],
    payments: [],
    adminAudits: [],
    notifications: [],
    priceLines: [],
    vouchers: [
      { id: "v_10k", code: "SALE10K", discount: 10000, usedCount: 0, maxUses: 100 },
    ],
    voucherUsages: [],
    offerUsages: [],
    partnerOffers: [
      { id: "offer_1", title: "Ưu đãi đối tác", currentUsage: 0, usedBudget: 0, budget: 1000000 },
    ],
    coachBookings: [],
    bookingGroups: [],
    groupPaymentIntents: [],
    groupRefunds: [],
    refundDisbursements: [],
    ...initialState,
  };

  const matches = (row, where = {}) =>
    Object.entries(where).every(([key, value]) => {
      if (value === undefined) return true;
      if (value && typeof value === "object") {
        if ("in" in value) return value.in.includes(row[key]);
        if ("not" in value) return row[key] !== value.not;
        if ("lt" in value) return row[key] < value.lt;
        if ("gt" in value) return row[key] > value.gt;
        return true;
      }
      return row[key] === value;
    });

  const model = (collectionName) => ({
    findUnique: async ({ where }) => {
      const rows = state[collectionName];
      if (where.voucherId_bookingId) {
        return (
          rows.find(
            (r) =>
              r.voucherId === where.voucherId_bookingId.voucherId &&
              r.bookingId === where.voucherId_bookingId.bookingId
          ) || null
        );
      }
      return rows.find((r) => matches(r, where)) || null;
    },
    findFirst: async ({ where }) => {
      const rows = state[collectionName];
      return (
        rows.find((r) => {
          if (where.venue && where.venue.status) {
            const venue = state.venues.find((v) => v.id === r.venueId);
            if (!venue || venue.status !== where.venue.status) return false;
          }
          if (where.user && where.user.status) {
            const user = state.users.find((u) => u.id === r.userId);
            if (!user || user.status !== where.user.status) return false;
          }
          return matches(r, where);
        }) || null
      );
    },
    findMany: async ({ where } = {}) => {
      const rows = state[collectionName];
      if (!where) return structuredClone(rows);
      return structuredClone(rows.filter((r) => matches(r, where)));
    },
    create: async ({ data }) => {
      const row = { id: data.id || `id_${Date.now()}_${Math.random()}`, ...data };
      state[collectionName].push(row);
      return structuredClone(row);
    },
    update: async ({ where, data }) => {
      const rows = state[collectionName];
      const row = rows.find((r) => matches(r, where));
      if (!row) throw new Error(`${collectionName} row not found for update`);
      for (const [k, v] of Object.entries(data)) {
        if (v && typeof v === "object" && "increment" in v) {
          row[k] = (row[k] || 0) + v.increment;
        } else {
          row[k] = v;
        }
      }
      return structuredClone(row);
    },
    updateMany: async ({ where, data }) => {
      const rows = state[collectionName];
      let count = 0;
      for (const row of rows) {
        if (matches(row, where)) {
          Object.assign(row, data);
          count++;
        }
      }
      return { count };
    },
    count: async ({ where } = {}) => {
      const rows = state[collectionName];
      return rows.filter((r) => matches(r, where)).length;
    },
  });

  const tx = {
    user: model("users"),
    venue: {
      ...model("venues"),
      findUnique: async ({ where, include }) => {
        const v = state.venues.find((x) => x.id === where.id);
        if (!v) return null;
        const copy = structuredClone(v);
        if (include?.pricing) {
          copy.pricing = copy.pricing || [];
        }
        return copy;
      },
    },
    court: model("courts"),
    courtBlock: model("courtBlocks"),
    venueStaff: model("venueStaff"),
    staffShift: model("staffShifts"),
    booking: {
      ...model("bookings"),
      findUnique: async ({ where, include }) => {
        const b = state.bookings.find((x) => matches(x, where));
        if (!b) return null;
        const copy = structuredClone(b);
        if (include?.items) {
          copy.items = state.bookingItems
            .filter((item) => item.bookingId === b.id)
            .map((item) => {
              const court = state.courts.find((c) => c.id === item.courtId);
              return { ...item, court };
            });
        }
        if (include?.payments) {
          copy.payments = state.payments.filter((p) => p.bookingId === b.id);
        }
        if (include?.venue) {
          const v = state.venues.find((v) => v.id === b.venueId);
          copy.venue = v ? { id: v.id, name: v.name, paymentMode: v.paymentMode } : null;
        }
        return copy;
      },
      create: async ({ data, include }) => {
        const { items, priceLines, ...bookingData } = data;
        const b = { id: `bk_${Date.now()}_${Math.random()}`, ...bookingData };
        state.bookings.push(b);
        if (items?.create) {
          const itemData = items.create;
          const it = { id: `it_${Date.now()}_${Math.random()}`, bookingId: b.id, ...itemData };
          state.bookingItems.push(it);
        }
        if (priceLines?.create) {
          const pl = { id: `pl_${Date.now()}_${Math.random()}`, bookingId: b.id, ...priceLines.create };
          state.priceLines.push(pl);
        }
        const copy = structuredClone(b);
        if (include?.items) {
          copy.items = state.bookingItems.filter((i) => i.bookingId === b.id);
        }
        if (include?.venue) {
          const v = state.venues.find((v) => v.id === b.venueId);
          copy.venue = v ? { id: v.id, name: v.name, paymentMode: v.paymentMode } : null;
        }
        return copy;
      },
    },
    bookingItem: model("bookingItems"),
    payment: {
      ...model("payments"),
      findMany: async ({ where } = {}) => {
        const rows = where ? state.payments.filter((p) => matches(p, where)) : state.payments;
        return rows.map((p) => ({
          ...p,
          groupRefund: state.groupRefunds.find((r) => r.paymentId === p.id) || null,
        }));
      },
    },
    adminAudit: model("adminAudits"),
    notification: model("notifications"),
    bookingPriceLine: model("priceLines"),
    voucher: model("vouchers"),
    voucherUsage: model("voucherUsages"),
    offerUsage: model("offerUsages"),
    partnerOffer: model("partnerOffers"),
    coachBooking: model("coachBookings"),
    bookingGroup: model("bookingGroups"),
    groupPaymentIntent: model("groupPaymentIntents"),
    groupRefund: model("groupRefunds"),
    refundDisbursement: model("refundDisbursements"),
  };

  const db = {
    ...tx,
    $transaction: async (fn, opts) => fn(tx),
  };

  return { db, state, tx };
}

// ──────────────────────────────────────────
// TEST SUITE: P1 & P2 REGRESSION TESTS
// ──────────────────────────────────────────

test("Issue A: Idempotency tại quầy - Replay cùng key và cùng payload trả về đúng đơn, không duplicate", async () => {
  const { db, state } = createMockDb();
  // Cho nhân viên B có ca trực
  state.staffShifts.push({ id: "shift_b", userId: "staff_b", venueId: "venue_b", endedAt: null });

  const actor = { id: "staff_b", name: "Nhân viên B", role: "STAFF", status: "ACTIVE" };
  const input = {
    venueId: "venue_b",
    courtId: "court_b1",
    date: "2026-11-05",
    startMin: 480,
    endMin: 540,
    customerName: "Nguyễn Văn A",
    customerPhone: "0912345678",
    paymentMethod: "CASH",
    requestId: "req_unique_1",
  };

  const res1 = await createCounterBooking(db, actor, input);
  assert.equal(res1.success, true);
  assert.equal(res1.alreadyCreated, undefined);
  const initialAuditCount = state.adminAudits.length;
  const initialBookingCount = state.bookings.length;

  // Gọi lại cùng key, cùng payload
  const res2 = await createCounterBooking(db, actor, input);
  assert.equal(res2.success, true);
  assert.equal(res2.alreadyCreated, true);
  assert.equal(res2.booking.id, res1.booking.id);
  assert.equal(state.bookings.length, initialBookingCount, "Không được tạo thêm booking mới");
  assert.equal(state.adminAudits.length, initialAuditCount, "Không được tạo thêm audit mới");
});

test("Issue A: Idempotency tại quầy - Chặn replay chéo cơ sở hoặc key trỏ tới đơn cơ sở khác", async () => {
  const { db, state } = createMockDb();
  // Sân A có 1 booking với requestId trỏ tới venue_a
  const bookingA = {
    id: "bk_a",
    requestId: "cross_venue_req",
    code: "DATSAN_A",
    venueId: "venue_a",
    source: "COUNTER",
    status: "CONFIRMED",
    paymentStatus: "UNPAID",
    paymentMethod: "CASH",
    customerName: "Khách bí mật sân A",
    customerPhone: "0999999999",
    total: 100000,
  };
  state.bookings.push(bookingA);
  state.bookingItems.push({
    id: "it_a",
    bookingId: "bk_a",
    courtId: "court_a1",
    date: new Date("2026-11-05"),
    startMin: 480,
    endMin: 540,
  });

  // Staff B chỉ có quyền ở venue_b, cố tình gửi requestId trỏ tới đơn venue_a
  state.staffShifts.push({ id: "shift_b", userId: "staff_b", venueId: "venue_b", endedAt: null });
  const actorB = { id: "staff_b", name: "Nhân viên B", role: "STAFF", status: "ACTIVE" };

  await assert.rejects(
    async () => {
      await createCounterBooking(db, actorB, {
        venueId: "venue_b",
        courtId: "court_b1",
        date: "2026-11-05",
        startMin: 480,
        endMin: 540,
        customerName: "Nguyễn Văn B",
        customerPhone: "0987654321",
        paymentMethod: "CASH",
        requestId: "cross_venue_req",
      });
    },
    (err) => {
      // Phải bị từ chối 403 (không có quyền xem booking sân A) hoặc 409
      assert.ok([403, 409].includes(err.status));
      return true;
    }
  );
});

test("Issue A: Idempotency tại quầy - Trùng requestId nhưng khác payload phải báo lỗi Conflict", async () => {
  const { db, state } = createMockDb();
  state.staffShifts.push({ id: "shift_b", userId: "staff_b", venueId: "venue_b", endedAt: null });
  const actor = { id: "staff_b", name: "Nhân viên B", role: "STAFF", status: "ACTIVE" };

  const input1 = {
    venueId: "venue_b",
    courtId: "court_b1",
    date: "2026-11-05",
    startMin: 480,
    endMin: 540,
    customerName: "Nguyễn Văn A",
    customerPhone: "0912345678",
    paymentMethod: "CASH",
    requestId: "req_same_diff_payload",
  };
  await createCounterBooking(db, actor, input1);

  // Đổi giờ sang 540 - 600 nhưng giữ cùng requestId
  const inputChangedTime = {
    ...input1,
    startMin: 540,
    endMin: 600,
  };
  await assert.rejects(
    async () => {
      await createCounterBooking(db, actor, inputChangedTime);
    },
    (err) => {
      assert.equal(err.status, 409);
      assert.match(err.message, /trùng lặp|đã được sử dụng/i);
      return true;
    }
  );
});

test("Issue B: OWNER sân A kiêm STAFF sân B - bắt buộc ca trực khi thao tác ở sân B", async () => {
  const { db, state } = createMockDb();
  const actorMulti = { id: "owner_multi", name: "Chủ A kiêm Staff B", role: "OWNER", status: "ACTIVE" };

  // 1. Khi chưa vào ca ở sân B: createCounterBooking bị từ chối
  await assert.rejects(
    async () => {
      await createCounterBooking(db, actorMulti, {
        venueId: "venue_b",
        courtId: "court_b1",
        date: "2026-11-05",
        startMin: 480,
        endMin: 540,
        customerName: "Khách Test",
        customerPhone: "0912345678",
        paymentMethod: "CASH",
      });
    },
    (err) => {
      assert.equal(err.status, 403);
      assert.match(err.message, /ca trực/i);
      return true;
    }
  );

  // 2. Vào ca ở sân B: thao tác thành công
  state.staffShifts.push({ id: "shift_multi", userId: "owner_multi", venueId: "venue_b", endedAt: null });
  const res = await createCounterBooking(db, actorMulti, {
    venueId: "venue_b",
    courtId: "court_b1",
    date: "2026-11-05",
    startMin: 480,
    endMin: 540,
    customerName: "Khách Test",
    customerPhone: "0912345678",
    paymentMethod: "CASH",
  });
  assert.equal(res.success, true);

  // 3. Kết thúc ca (endedAt khác null): bị từ chối
  state.staffShifts[0].endedAt = new Date();
  await assert.rejects(
    async () => {
      await createCounterBooking(db, actorMulti, {
        venueId: "venue_b",
        courtId: "court_b1",
        date: "2026-11-05",
        startMin: 600,
        endMin: 660,
        customerName: "Khách Test 2",
        customerPhone: "0912345678",
        paymentMethod: "CASH",
      });
    },
    (err) => {
      assert.equal(err.status, 403);
      assert.match(err.message, /ca trực/i);
      return true;
    }
  );

  // 4. Khi thao tác ở chính sân A của mình (ownerId === owner_multi hoặc owner_a):
  // Chủ sở hữu đúng sân A không cần ca trực
  const actorOwnerA = { id: "owner_a", name: "Chủ sân A", role: "OWNER", status: "ACTIVE" };
  const resOwner = await createCounterBooking(db, actorOwnerA, {
    venueId: "venue_a",
    courtId: "court_a1",
    date: "2026-11-05",
    startMin: 480,
    endMin: 540,
    customerName: "Khách Sân A",
    customerPhone: "0912345678",
    paymentMethod: "CASH",
  });
  assert.equal(resOwner.success, true);
});

test("Issue C: Thu tiền mặt tại quầy - Phải tiêu thụ voucher và PartnerOffer đúng một lần", async () => {
  const { db, state } = createMockDb();
  state.staffShifts.push({ id: "shift_b", userId: "staff_b", venueId: "venue_b", endedAt: null });
  const actor = { id: "staff_b", name: "Nhân viên B", role: "STAFF", status: "ACTIVE" };

  // Tạo booking có voucherId và offerUsage RESERVED
  const booking = {
    id: "bk_with_voucher",
    code: "DATSAN_VOUCHER",
    venueId: "venue_b",
    status: "CONFIRMED",
    paymentStatus: "UNPAID",
    total: 90000,
    subtotal: 100000,
    discount: 10000,
    voucherId: "v_10k",
    userId: "customer_x",
    customerName: "Khách X",
    customerPhone: "0912345678",
    cancelApprovedAt: null,
  };
  state.bookings.push(booking);
  state.offerUsages.push({
    id: "ou_1",
    bookingId: "bk_with_voucher",
    offerId: "offer_1",
    discountAmount: 10000,
    state: "RESERVED",
    expiresAt: new Date(Date.now() + 3600000),
  });

  const res = await confirmCashPayment(db, actor, "bk_with_voucher", 90000, "Thu tiền tại quầy");
  assert.equal(res.success, true);

  // Kiểm tra voucherUsage đã được tạo và OfferUsage thành CONSUMED
  const offerUsage = state.offerUsages.find((o) => o.id === "ou_1");
  assert.equal(offerUsage.state, "CONSUMED");
  const partnerOffer = state.partnerOffers.find((p) => p.id === "offer_1");
  assert.equal(partnerOffer.usedBudget, 10000);
  assert.equal(partnerOffer.currentUsage, 1);

  const voucher = state.vouchers.find((v) => v.id === "v_10k");
  assert.equal(voucher.usedCount, 1);
  assert.equal(state.voucherUsages.length, 1);

  // Gọi lại trên đơn đã thanh toán: phải bị chặn 409, không tăng voucher
  await assert.rejects(
    async () => {
      await confirmCashPayment(db, actor, "bk_with_voucher", 90000, "Thu tiền lần 2");
    },
    (err) => {
      assert.equal(err.status, 409);
      return true;
    }
  );
  assert.equal(voucher.usedCount, 1);
});

test("Issue D: Đặt sân tại quầy cắt qua 2 khung giá - Tính chính xác từng đoạn và kiểm tra ràng buộc", async () => {
  const { db, state } = createMockDb();
  // Sân A có 2 rule:
  // 06:00 - 18:00 (360 - 1080) giá 80.000 đ/h
  // 18:00 - 22:00 (1080 - 1320) giá 160.000 đ/h
  // Đặt từ 17:30 đến 18:30 (1050 - 1110) = 60 phút:
  // 30 phút giá 80k = 40.000 đ
  // 30 phút giá 160k = 80.000 đ
  // Tổng = 120.000 đ (KHÔNG được fallback về venue.priceFrom = 100.000 đ)
  const actor = { id: "owner_a", name: "Chủ sân A", role: "OWNER", status: "ACTIVE" };

  const res = await createCounterBooking(db, actor, {
    venueId: "venue_a",
    courtId: "court_a1",
    date: "2026-11-05", // Thứ 5
    startMin: 1050, // 17:30
    endMin: 1110,   // 18:30
    customerName: "Khách 2 khung giá",
    customerPhone: "0912345678",
    paymentMethod: "CASH",
  });

  assert.equal(res.success, true);
  assert.equal(res.booking.total, 120000, "Tổng tiền phải là 120.000 đ khớp chính xác 2 khung giá");

  // Kiểm tra ngày không tồn tại trên lịch thực (2026-02-30)
  await assert.rejects(
    async () => {
      await createCounterBooking(db, actor, {
        venueId: "venue_a",
        courtId: "court_a1",
        date: "2026-02-30",
        startMin: 480,
        endMin: 540,
        customerName: "Khách ngày ảo",
        customerPhone: "0912345678",
        paymentMethod: "CASH",
      });
    },
    (err) => {
      assert.equal(err.status, 400);
      assert.match(err.message, /lịch thực/i);
      return true;
    }
  );
});

test("Issue E: Yêu cầu hủy đơn - Phân biệt rõ giữa đơn chưa thanh toán (hủy ngay) và đơn đã thanh toán (chờ duyệt)", async () => {
  const { db, state } = createMockDb();
  const customer = { id: "customer_x", name: "Khách X", role: "CUSTOMER", status: "ACTIVE" };

  // 1. Đơn chưa thanh toán: Hủy ngay lập tức, requiresApproval = false
  const unpaidBooking = {
    id: "bk_unpaid",
    code: "DATSAN_UNPAID",
    venueId: "venue_a",
    userId: "customer_x",
    status: "PENDING_PAYMENT",
    paymentStatus: "UNPAID",
    total: 100000,
    subtotal: 100000,
    cancelApprovedAt: null,
  };
  state.bookings.push(unpaidBooking);
  state.bookingItems.push({
    id: "it_unpaid",
    bookingId: "bk_unpaid",
    courtId: "court_a1",
    date: new Date("2026-11-05"),
    startMin: 480,
    endMin: 540,
    status: "HELD",
  });

  const resUnpaid = await require("../src/services/venue-session.service.ts").requestBookingCancellation(
    db,
    customer,
    "bk_unpaid",
    "Bận việc đột xuất"
  );
  assert.equal(resUnpaid.success, true);
  assert.equal(resUnpaid.requiresApproval, false, "Đơn chưa thanh toán phải được hủy ngay không cần duyệt");
  assert.equal(resUnpaid.status, "CANCELLED");

  // 2. Đơn đã thanh toán: Khách yêu cầu hủy -> Chờ duyệt, requiresApproval = true
  const paidBooking = {
    id: "bk_paid",
    code: "DATSAN_PAID",
    venueId: "venue_a",
    userId: "customer_x",
    status: "CONFIRMED",
    paymentStatus: "PAID",
    total: 100000,
    subtotal: 100000,
    cancelApprovedAt: null,
  };
  state.bookings.push(paidBooking);
  state.bookingItems.push({
    id: "it_paid",
    bookingId: "bk_paid",
    courtId: "court_a1",
    date: new Date("2026-11-05"),
    startMin: 480,
    endMin: 540,
    status: "CONFIRMED",
  });
  state.payments.push({
    id: "p_paid",
    bookingId: "bk_paid",
    amount: 100000,
    status: "PAID",
    txnRef: "PAY-PAID-1",
    provider: "BANK_TRANSFER",
    paidAt: new Date(),
  });

  const resPaid = await require("../src/services/venue-session.service.ts").requestBookingCancellation(
    db,
    customer,
    "bk_paid",
    "Bị ốm không đi được"
  );
  assert.equal(resPaid.success, true);
  assert.equal(resPaid.requiresApproval, true, "Đơn đã thanh toán phải chờ chủ sân phê duyệt hoàn tiền");
});

