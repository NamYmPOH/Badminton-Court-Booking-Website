const { fixture, actors } = require("./helpers/refund-db.cjs");
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
  startStaffShift,
  endStaffShift,
  createVenueStaffAccount,
  addVenueStaff,
  setVenueStaffActive,
  createCounterBooking,
  requestBookingCancellation,
  approveBookingCancellation,
  recordManualRefund,
  confirmCashPayment,
  completeBookingSession,
  processOverdueAndCompletions,
} = require("../src/services/venue-session.service.ts");

const {
  createCourt,
  updateCourt,
  createCourtBlock,
} = require("../src/services/venue-court.service.ts");

const { operatorVenueScope } = require("../src/lib/venue-operations.ts");
const { checkBookingAction } = require("../src/lib/admin-policy.ts");

function createMockDb(initialState = {}) {
  let state = {
    users: [
      { id: "admin", name: "Quản trị viên", role: "ADMIN", status: "ACTIVE" },
      { id: "owner_a", name: "Chủ sân A", role: "OWNER", status: "ACTIVE" },
      { id: "owner_pending", name: "Người nộp hồ sơ", role: "CUSTOMER", status: "ACTIVE" },
      { id: "owner_multi", name: "Chủ sân A kiêm Staff B", role: "OWNER", status: "ACTIVE" },
      { id: "staff_a", name: "Nhân viên sân A", role: "STAFF", status: "ACTIVE" },
      { id: "staff_fired", name: "Nhân viên bị sa thải", role: "STAFF", status: "ACTIVE" },
      { id: "customer_x", name: "Khách hàng X", role: "CUSTOMER", status: "ACTIVE" },
    ],
    venues: [
      { id: "venue_a", name: "Sân Cầu Lông A", ownerId: "owner_a", status: "ACTIVE", openMin: 360, closeMin: 1320, minBookingMin: 60, maxBookingMin: 240, priceFrom: 100000, pricing: [] },
      { id: "venue_b", name: "Sân Cầu Lông B", ownerId: "admin", status: "ACTIVE", openMin: 360, closeMin: 1320, minBookingMin: 60, maxBookingMin: 240, priceFrom: 120000, pricing: [] },
      { id: "venue_pending", name: "Sân Chờ Duyệt", ownerId: "owner_pending", status: "PENDING", openMin: 360, closeMin: 1320, minBookingMin: 60, maxBookingMin: 240, priceFrom: 90000, pricing: [] },
      { id: "venue_suspended", name: "Sân Bị Đình Chỉ", ownerId: "owner_a", status: "SUSPENDED", openMin: 360, closeMin: 1320, minBookingMin: 60, maxBookingMin: 240, priceFrom: 100000, pricing: [] },
    ],
    courts: [
      { id: "court_a1", venueId: "venue_a", name: "Sân A1", status: "ACTIVE", sortOrder: 1 },
      { id: "court_b1", venueId: "venue_b", name: "Sân B1", status: "ACTIVE", sortOrder: 1 },
    ],
    venueStaff: [
      { userId: "staff_a", venueId: "venue_a", role: "STAFF", isActive: true },
      { userId: "owner_multi", venueId: "venue_b", role: "STAFF", isActive: true },
      { userId: "staff_fired", venueId: "venue_a", role: "STAFF", isActive: false },
    ],
    staffShifts: [],
    bookings: [],
    bookingItems: [],
    courtBlocks: [],
    adminAudit: [],
    notifications: [],
    payments: [],
    ...initialState,
  };

  const db = {
    $transaction: async (fn) => fn(db),
    user: {
      findUnique: async ({ where }) => state.users.find((u) => (where.id && u.id === where.id) || (where.phone && u.phone === where.phone) || (where.email && u.email === where.email)) || null,
      findFirst: async ({ where }) => state.users.find((u) => {
        if (where.phone && u.phone !== where.phone) return false;
        if (where.email && u.email !== where.email) return false;
        if (where.id && u.id !== where.id) return false;
        return true;
      }) || null,
      create: async ({ data }) => {
        const u = { id: `user_${Date.now()}_${Math.random()}`, ...data };
        state.users.push(u);
        return u;
      },
      update: async ({ where, data }) => {
        const u = state.users.find((x) => x.id === where.id);
        if (!u) throw new Error("User not found");
        Object.assign(u, data);
        return u;
      },
    },
    venue: {
      findUnique: async ({ where, include }) => {
        const v = state.venues.find((x) => x.id === where.id) || null;
        if (!v) return null;
        const res = { ...v };
        if (include?.owner) res.owner = state.users.find((u) => u.id === v.ownerId) || null;
        if (include?.pricing) res.pricing = v.pricing || [];
        return res;
      },
      findFirst: async ({ where, select }) => {
        const v = state.venues.find((x) => {
          if (where.id && x.id !== where.id) return false;
          if (where.ownerId && x.ownerId !== where.ownerId) return false;
          if (where.status && x.status !== where.status) return false;
          return true;
        }) || null;
        return v;
      },
      findMany: async ({ where }) => {
        return state.venues.filter((v) => {
          if (where?.id?.in && !where.id.in.includes(v.id)) return false;
          if (where?.ownerId && v.ownerId !== where.ownerId) return false;
          if (where?.status && v.status !== where.status) return false;
          return true;
        });
      },
      update: async ({ where, data }) => {
        const v = state.venues.find((x) => x.id === where.id);
        if (!v) throw new Error("Venue not found");
        Object.assign(v, data);
        return v;
      },
    },
    venueStaff: {
      findUnique: async ({ where, include }) => {
        const s = state.venueStaff.find(
          (x) => x.userId === where.userId_venueId?.userId && x.venueId === where.userId_venueId?.venueId
        );
        if (!s) return null;
        const res = { ...s };
        if (include?.user) res.user = state.users.find((u) => u.id === s.userId) || { name: "User" };
        return res;
      },
      findFirst: async ({ where }) => {
        return state.venueStaff.find((s) => {
          if (where.userId && s.userId !== where.userId) return false;
          if (where.venueId && s.venueId !== where.venueId) return false;
          if (where.isActive !== undefined && s.isActive !== where.isActive) return false;
          return true;
        }) || null;
      },
      findMany: async ({ where }) => {
        return state.venueStaff.filter((s) => {
          if (where.venueId && s.venueId !== where.venueId) return false;
          if (where.userId && s.userId !== where.userId) return false;
          if (where.isActive !== undefined && s.isActive !== where.isActive) return false;
          return true;
        });
      },
      create: async ({ data }) => {
        const s = { ...data };
        state.venueStaff.push(s);
        return s;
      },
      update: async ({ where, data }) => {
        const s = state.venueStaff.find(
          (x) => x.userId === where.userId_venueId?.userId && x.venueId === where.userId_venueId?.venueId
        );
        if (!s) throw new Error("Staff not found");
        Object.assign(s, data);
        return s;
      },
    },
    staffShift: {
      findFirst: async ({ where }) => {
        return state.staffShifts.find((sh) => {
          if (where.userId && sh.userId !== where.userId) return false;
          if (where.venueId && sh.venueId !== where.venueId) return false;
          if (where.endedAt === null && sh.endedAt !== null) return false;
          return true;
        }) || null;
      },
      create: async ({ data }) => {
        const sh = { id: `shift_${Date.now()}_${Math.random()}`, endedAt: null, ...data };
        state.staffShifts.push(sh);
        return sh;
      },
      update: async ({ where, data }) => {
        const sh = state.staffShifts.find((x) => x.id === where.id);
        if (!sh) throw new Error("Shift not found");
        Object.assign(sh, data);
        return sh;
      },
      updateMany: async ({ where, data }) => {
        let count = 0;
        state.staffShifts.forEach((sh) => {
          if (where.venueId && sh.venueId !== where.venueId) return;
          if (where.userId && sh.userId !== where.userId) return;
          if (where.endedAt === null && sh.endedAt !== null) return;
          Object.assign(sh, data);
          count++;
        });
        return { count };
      },
    },
    court: {
      findFirst: async ({ where }) => {
        return state.courts.find((c) => {
          if (where.id && c.id !== where.id) return false;
          if (where.venueId && c.venueId !== where.venueId) return false;
          if (where.status && c.status !== where.status) return false;
          if (where.name && c.name !== where.name) return false;
          return true;
        }) || null;
      },
      findUnique: async ({ where }) => state.courts.find((c) => c.id === where.id) || null,
      aggregate: async () => ({ _max: { sortOrder: state.courts.length } }),
      create: async ({ data }) => {
        const c = { id: `court_${Date.now()}`, ...data };
        state.courts.push(c);
        return c;
      },
      update: async ({ where, data }) => {
        const c = state.courts.find((x) => x.id === where.id);
        if (!c) throw new Error("Court not found");
        Object.assign(c, data);
        return c;
      },
    },
    booking: {
      findUnique: async ({ where, include }) => {
        const b = state.bookings.find((x) => x.id === where.id || (where.requestId && x.requestId === where.requestId)) || null;
        if (!b) return null;
        const res = { ...b };
        if (include?.items || true) res.items = state.bookingItems.filter((i) => i.bookingId === b.id);
        if (include?.venue) res.venue = state.venues.find((v) => v.id === b.venueId);
        if (include?.payments || true) res.payments = state.payments.filter((p) => p.bookingId === b.id);
        return res;
      },
      findMany: async () => state.bookings.map((b) => ({
        ...b,
        items: state.bookingItems.filter((i) => i.bookingId === b.id),
        payments: state.payments.filter((p) => p.bookingId === b.id),
      })),
      create: async ({ data }) => {
        const b = { id: `bk_${Date.now()}_${Math.random()}`, items: [], payments: [], ...data };
        state.bookings.push(b);
        if (data.items?.create) {
          const item = { id: `item_${Date.now()}`, bookingId: b.id, ...data.items.create };
          state.bookingItems.push(item);
        }
        return b;
      },
      update: async ({ where, data }) => {
        const b = state.bookings.find((x) => x.id === where.id);
        if (!b) throw new Error("Booking not found");
        Object.assign(b, data);
        return b;
      },
      updateMany: async ({ where, data }) => {
        let count = 0;
        state.bookings.forEach((b) => {
          if (where.venueId && b.venueId !== where.venueId) return;
          if (where.status?.in && !where.status.in.includes(b.status)) return;
          Object.assign(b, data);
          count++;
        });
        return { count };
      },
    },
    bookingItem: {
      findFirst: async ({ where }) => {
        return state.bookingItems.find((i) => {
          if (where.courtId && i.courtId !== where.courtId) return false;
          if (where.startMin && i.startMin >= where.startMin.lt) return false;
          if (where.endMin && i.endMin <= where.endMin.gt) return false;
          return true;
        }) || null;
      },
      findMany: async () => state.bookingItems,
      updateMany: async ({ where, data }) => {
        let count = 0;
        state.bookingItems.forEach((i) => {
          if (where.bookingId && i.bookingId !== where.bookingId) return;
          Object.assign(i, data);
          count++;
        });
        return { count };
      },
    },
    courtBlock: {
      findFirst: async ({ where }) => {
        return state.courtBlocks.find((cb) => {
          if (where.courtId && cb.courtId !== where.courtId) return false;
          return true;
        }) || null;
      },
      findMany: async () => state.courtBlocks,
      create: async ({ data }) => {
        const cb = { id: `cb_${Date.now()}`, ...data };
        state.courtBlocks.push(cb);
        return cb;
      },
    },
    adminAudit: {
      create: async ({ data }) => {
        state.adminAudit.push(data);
        return data;
      },
    },
    notification: {
      findFirst: async () => null,
      create: async ({ data }) => {
        state.notifications.push(data);
        return data;
      },
    },
    payment: {
      findMany: async () => state.payments,
      updateMany: async ({ where, data }) => {
        let count = 0;
        state.payments.forEach((p) => {
          if (where.bookingId && p.bookingId !== where.bookingId) return;
          Object.assign(p, data);
          count++;
        });
        return { count };
      },
    },
    getState: () => state,
  };

  return db;
}

// ───────────────────── TEST SUITE ─────────────────────

test("1. CUSTOMER không thể quản lý nhân viên dù sở hữu hồ sơ PENDING", async () => {
  const db = createMockDb();
  const customerPending = { id: "owner_pending", role: "CUSTOMER", status: "ACTIVE", name: "Người nộp hồ sơ" };

  await assert.rejects(
    async () => {
      await addVenueStaff(db, customerPending, "venue_pending", "staff_a", "STAFF");
    },
    { message: /Cơ sở sân cần được duyệt và đang hoạt động/ }
  );
});

test("2. STAFF tạo đơn tại quầy thành công khi có ca trực mở; thất bại khi chưa vào ca", async () => {
  const db = createMockDb();
  const staff = { id: "staff_a", role: "STAFF", status: "ACTIVE", name: "Nhân viên A" };
  const todayVn = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());

  // Chưa vào ca -> Báo lỗi cần ca trực
  await assert.rejects(
    async () => {
      await createCounterBooking(db, staff, {
        venueId: "venue_a",
        courtId: "court_a1",
        date: todayVn,
        startMin: 480,
        endMin: 540,
        customerName: "Khách Vãng Lai",
        customerPhone: "0901234567",
        paymentMethod: "CASH",
      });
    },
    { message: /Bạn cần bắt đầu ca trực để thực hiện thao tác này/ }
  );

  // Mở ca trực
  await startStaffShift(db, staff, "venue_a", "Bắt đầu ca sáng");

  // Đã vào ca -> Tạo đơn thành công
  const res = await createCounterBooking(db, staff, {
    venueId: "venue_a",
    courtId: "court_a1",
    date: todayVn,
    startMin: 480,
    endMin: 540,
    customerName: "Khách Vãng Lai",
    customerPhone: "0901234567",
    paymentMethod: "CASH",
  });

  assert.equal(res.success, true);
  assert.equal(res.booking.source, "COUNTER");
  assert.equal(res.booking.userId, null, "Khách vãng lai phải có userId = null, không gán ID nhân viên");
  assert.equal(res.booking.createdByStaffId, "staff_a");
  assert.equal(res.booking.expiresAt, null, "Đơn tại quầy không bị hết hạn giữ chỗ");
});

test("3. Không truy cập chéo cơ sở bằng cách thay đổi venueId", async () => {
  const db = createMockDb();
  const staffA = { id: "staff_a", role: "STAFF", status: "ACTIVE", name: "Nhân viên A" };

  // staffA thuộc venue_a cố truy cập venue_b
  await assert.rejects(
    async () => {
      await assertVenueOperatorAccess(db, staffA, "venue_b", false);
    },
    { message: /Bạn không có quyền quản lý hoặc làm việc tại cơ sở sân này/ }
  );
});

test("4. Nhân viên đã sa thải (isActive: false) mất quyền ngay lập tức", async () => {
  const db = createMockDb();
  const staffFired = { id: "staff_fired", role: "STAFF", status: "ACTIVE", name: "Nhân viên bị sa thải" };

  await assert.rejects(
    async () => {
      await assertVenueOperatorAccess(db, staffFired, "venue_a", false);
    },
    { message: /Bạn không có quyền quản lý hoặc làm việc tại cơ sở sân này/ }
  );
});

test("5. Sa thải nhân viên tự động đóng ca trực đang mở", async () => {
  const db = createMockDb();
  const ownerA = { id: "owner_a", role: "OWNER", status: "ACTIVE", name: "Chủ Sân A" };
  const staffA = { id: "staff_a", role: "STAFF", status: "ACTIVE", name: "Nhân viên A" };

  // Nhân viên đang mở ca
  await startStaffShift(db, staffA, "venue_a");
  let openShift = await db.staffShift.findFirst({ where: { userId: "staff_a", venueId: "venue_a", endedAt: null } });
  assert.ok(openShift);

  // Chủ sân sa thải / vô hiệu hóa
  await setVenueStaffActive(db, ownerA, "venue_a", "staff_a", false, "Vi phạm nội quy");

  // Kiểm tra ca trực đã tự động kết thúc
  openShift = await db.staffShift.findFirst({ where: { userId: "staff_a", venueId: "venue_a", endedAt: null } });
  assert.equal(openShift, null, "Ca trực phải bị đóng ngay khi bị sa thải");

  // Nhân viên mất quyền ngay
  await assert.rejects(
    async () => {
      await assertVenueOperatorAccess(db, staffA, "venue_a", false);
    },
    { message: /Bạn không có quyền quản lý hoặc làm việc tại cơ sở sân này/ }
  );
});

test("6. Một người vừa là OWNER sân A vừa là STAFF sân B: tính quyền theo từng cơ sở", async () => {
  const db = createMockDb();
  const multiRole = { id: "owner_multi", role: "OWNER", status: "ACTIVE", name: "Chủ sân A kiêm Staff B" };

  // Kiểm tra scope: bao gồm cả sân sở hữu và sân được phân quyền nhân viên active
  const scope = operatorVenueScope(multiRole);
  assert.ok(scope.OR, "Scope phải chứa điều kiện OR cho OWNER");

  // Thao tác tại venue_b (với vai trò STAFF) -> hợp lệ
  await assertVenueOperatorAccess(db, multiRole, "venue_b", false);

  // Không có quyền tại venue_pending
  await assert.rejects(
    async () => {
      await assertVenueOperatorAccess(db, multiRole, "venue_pending", false);
    },
    { message: /Bạn không có quyền quản lý hoặc làm việc tại cơ sở sân này/ }
  );
});

test("7. Chống trùng đơn khi gửi lại request với requestId (Idempotency)", async () => {
  const db = createMockDb();
  const ownerA = { id: "owner_a", role: "OWNER", status: "ACTIVE", name: "Chủ Sân A" };

  const todayVn = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
  const input = {
    venueId: "venue_a",
    courtId: "court_a1",
    date: todayVn,
    startMin: 600,
    endMin: 660,
    customerName: "Khách VIP",
    customerPhone: "0988776655",
    paymentMethod: "CASH",
    requestId: "req_unique_12345",
  };

  const firstCall = await createCounterBooking(db, ownerA, input);
  assert.equal(firstCall.success, true);

  // Thử lại với cùng requestId
  const secondCall = await createCounterBooking(db, ownerA, input);
  assert.equal(secondCall.success, true);
  assert.equal(secondCall.alreadyCreated, true, "Phải trả về đơn đã tạo, không tạo mới trùng lặp");
  assert.equal(secondCall.booking.id, firstCall.booking.id);
});

test("8. STAFF không được tự duyệt hủy đơn đã thanh toán hoặc tự duyệt hoàn tiền", async () => {
  const db = fixture();
  assert.equal((await requestBookingCancellation(db, actors.staff, 'b', 'Khách bận đột xuất')).requiresApproval, true);
  await assert.rejects(approveBookingCancellation(db, actors.staff, 'b', 400000, 'Tự duyệt hoàn tiền'), { status: 403 });
  assert.equal(db.state.refunds.length, 0);
});

test("9. OWNER duyệt hủy đơn và hoàn tiền 2 bước chuẩn xác", async () => {
  const db = fixture({total: 200000, amounts: [200000]});
  const result = await approveBookingCancellation(db, actors.owner, 'b', 180000, 'Duyệt hoàn 90% theo chính sách');
  assert.equal(result.refundAmountApproved, 180000);
  const id = db.state.refunds[0].id;
  await assert.rejects(recordManualRefund(db, actors.staff, 'b', 250000, 'Hoàn vượt mức', id, 'BANK-OVER'), { status: 409 });
  const paid = await recordManualRefund(db, actors.staff, 'b', 180000, 'Đã chuyển tiền', id, 'BANK-OK');
  assert.equal(paid.paymentStatus, 'REFUNDED');
  assert.equal((await recordManualRefund(db, actors.staff, 'b', 180000, 'Gửi lại yêu cầu', id, 'BANK-OK')).duplicate, true);
  await assert.rejects(recordManualRefund(db, actors.staff, 'b', 180000, 'Hoàn thêm lần nữa', id, 'BANK-TWICE'), { status: 409 });
});

test("10. Đơn tiền mặt không tự hoàn tất khi hết giờ nếu chưa thu đủ tiền", async () => {
  const db = createMockDb();

  // Đơn tiền mặt chưa trả tiền
  const booking = await db.booking.create({
    data: {
      code: "DATSAN_CASH_1",
      venueId: "venue_a",
      userId: null,
      status: "CONFIRMED",
      paymentStatus: "UNPAID",
      total: 150000,
      hasCashPayment: true,
      manualHandoverRequired: true,
      sessionStatus: "OVERDUE_PENDING",
    },
  });

  // Chạy auto overdue & completion
  const res = await processOverdueAndCompletions(db, new Date());
  assert.equal(res.autoCompletedCount, 0, "Đơn tiền mặt chưa trả tiền tuyệt đối không được tự động hoàn tất");

  const check = await db.booking.findUnique({ where: { id: booking.id } });
  assert.equal(check.status, "CONFIRMED", "Đơn vẫn giữ nguyên trạng thái chờ thu tiền và bàn giao thủ công");
});

test("11. Khóa khung giờ (CourtBlock) ngăn chặn đặt sân trùng lặp", async () => {
  const db = createMockDb();
  const ownerA = { id: "owner_a", role: "OWNER", status: "ACTIVE", name: "Chủ Sân A" };

  // Khóa khung giờ 08:00 - 10:00 (480 - 600) ngày 2026-10-31
  await createCourtBlock(db, ownerA, {
    courtId: "court_a1",
    date: "2026-10-31",
    startMin: 480,
    endMin: 600,
    reason: "Bảo trì định kỳ",
  });

  // Cố đặt sân vào khung giờ bị khóa -> Bị chặn 409
  await assert.rejects(
    async () => {
      await createCounterBooking(db, ownerA, {
        venueId: "venue_a",
        courtId: "court_a1",
        date: "2026-10-31",
        startMin: 500,
        endMin: 560,
        customerName: "Khách Test",
        customerPhone: "0911223344",
        paymentMethod: "CASH",
      });
    },
    { message: /Khung giờ này đã bị khóa/ }
  );
});

test("12. Kiểm tra checkBookingAction cho phép CHECK_IN đơn xác nhận thanh toán tại sân", () => {
  const onlineUnpaidOrder = { status: "CONFIRMED", paymentStatus: "UNPAID", hasCashPayment: false, expiresAt: null, venue: { paymentMode: "PREPAID_ONLINE" } };
  assert.throws(
    () => checkBookingAction(onlineUnpaidOrder, "CHECK_IN"),
    { message: /Trạng thái đơn không cho phép thao tác này/ },
    "Đơn online chưa thanh toán không được check-in"
  );

  const cashVenueOrder = { status: "CONFIRMED", paymentStatus: "UNPAID", paymentMethod: "CASH", hasCashPayment: true, expiresAt: null, venue: { paymentMode: "HYBRID" } };
  assert.doesNotThrow(
    () => checkBookingAction(cashVenueOrder, "CHECK_IN"),
    "Đơn tiền mặt tại sân đã xác nhận được phép check-in"
  );

  const paidOrder = { status: "CONFIRMED", paymentStatus: "PAID", hasCashPayment: false, expiresAt: null, venue: { paymentMode: "PREPAID_ONLINE" } };
  assert.doesNotThrow(
    () => checkBookingAction(paidOrder, "CHECK_IN"),
    "Đơn đã thanh toán được phép check-in"
  );
});
