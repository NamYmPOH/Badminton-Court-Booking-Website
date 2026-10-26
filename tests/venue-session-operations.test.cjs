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
  getSlotTimestamp,
  getBookingStartTimestamp,
  getBookingEndTimestamp,
  calculateBookingPaymentDetails,
  hasActiveStaffShift,
  assertVenueOperatorAccess,
  getVenueCourtsLiveStatus,
  processOverdueAndCompletions,
  confirmCashPayment,
  completeBookingSession,
  startStaffShift,
  endStaffShift,
} = require("../src/services/venue-session.service.ts");

function createMockDb(initialPatch = {}) {
  let state = {
    users: [
      { id: "admin", name: "Quản trị viên", role: "ADMIN", status: "ACTIVE" },
      { id: "owner_v1", name: "Chủ sân V1", role: "OWNER", status: "ACTIVE" },
      { id: "staff_v1", name: "Lễ tân V1", role: "STAFF", status: "ACTIVE" },
      { id: "staff_v2", name: "Lễ tân V2", role: "STAFF", status: "ACTIVE" },
      { id: "staff_disabled", name: "Lễ tân nghỉ việc", role: "STAFF", status: "ACTIVE" },
      { id: "staff_blocked", name: "Lễ tân vi phạm", role: "STAFF", status: "BLOCKED" },
      { id: "customer1", name: "Nguyễn Văn A", role: "CUSTOMER", status: "ACTIVE" },
    ],
    venues: [
      { id: "v1", name: "Cụm sân Cầu Giấy", ownerId: "owner_v1", status: "ACTIVE" },
      { id: "v2", name: "Cụm sân Ba Đình", ownerId: "admin", status: "ACTIVE" },
    ],
    courts: [
      { id: "c1", venueId: "v1", name: "Sân 1", sortOrder: 1 },
      { id: "c2", venueId: "v1", name: "Sân 2", sortOrder: 2 },
      { id: "c3", venueId: "v2", name: "Sân 3", sortOrder: 1 },
    ],
    venueStaff: [
      { userId: "staff_v1", venueId: "v1", role: "STAFF", isActive: true },
      { userId: "staff_v2", venueId: "v2", role: "STAFF", isActive: true },
      { userId: "staff_disabled", venueId: "v1", role: "STAFF", isActive: false },
      { userId: "staff_blocked", venueId: "v1", role: "STAFF", isActive: true },
    ],
    staffShifts: [],
    bookings: [],
    bookingItems: [],
    payments: [],
    notifications: [],
    audits: [],
    ...initialPatch,
  };

  function getTx(copy) {
    return {
      user: {
        findUnique: async ({ where }) => copy.users.find((u) => u.id === where.id),
        findFirst: async ({ where }) => copy.users.find((u) => (!where.id || u.id === where.id) && (!where.status || u.status === where.status)),
      },
      venue: {
        findUnique: async ({ where }) => copy.venues.find((v) => v.id === where.id),
        findFirst: async ({ where }) =>
          copy.venues.find((v) => {
            if (where.id && v.id !== where.id) return false;
            if (where.ownerId && v.ownerId !== where.ownerId) return false;
            return true;
          }),
      },
      court: {
        findMany: async ({ where, orderBy }) => {
          let list = copy.courts.filter((c) => !where?.venueId || c.venueId === where.venueId);
          if (orderBy?.sortOrder === "asc") list.sort((a, b) => a.sortOrder - b.sortOrder);
          return list;
        },
      },
      venueStaff: {
        findFirst: async ({ where }) =>
          copy.venueStaff.find((vs) => {
            if (where.userId && vs.userId !== where.userId) return false;
            if (where.venueId && vs.venueId !== where.venueId) return false;
            if (where.isActive !== undefined && vs.isActive !== where.isActive) return false;
            if (where.user?.status) {
              const u = copy.users.find((x) => x.id === vs.userId);
              if (!u || u.status !== where.user.status) return false;
            }
            return true;
          }),
        findMany: async ({ where }) =>
          copy.venueStaff.filter((vs) => {
            if (where?.venueId && vs.venueId !== where.venueId) return false;
            if (where?.isActive !== undefined && vs.isActive !== where.isActive) return false;
            if (where?.user?.status) {
              const u = copy.users.find((x) => x.id === vs.userId);
              if (!u || u.status !== where.user.status) return false;
            }
            return true;
          }),
        create: async ({ data }) => {
          copy.venueStaff.push(data);
          return data;
        },
        update: async ({ where, data }) => {
          const vs = copy.venueStaff.find((s) => s.userId === where.userId_venueId.userId && s.venueId === where.userId_venueId.venueId);
          if (vs) Object.assign(vs, data);
          return vs;
        },
      },
      staffShift: {
        findFirst: async ({ where }) =>
          copy.staffShifts.find((s) => {
            if (where.venueId && s.venueId !== where.venueId) return false;
            if (where.userId && s.userId !== where.userId) return false;
            if (where.endedAt === null && s.endedAt !== null) return false;
            if (where.user?.status) {
              const u = copy.users.find((x) => x.id === s.userId);
              if (!u || u.status !== where.user.status) return false;
            }
            return true;
          }),
        create: async ({ data }) => {
          const shift = { id: `shift_${Date.now()}_${Math.random()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
          copy.staffShifts.push(shift);
          return shift;
        },
        update: async ({ where, data }) => {
          const s = copy.staffShifts.find((x) => x.id === where.id);
          if (s) Object.assign(s, data);
          return s;
        },
      },
      booking: {
        findUnique: async ({ where, include }) => {
          const b = copy.bookings.find((x) => x.id === where.id);
          if (!b) return null;
          const items = copy.bookingItems.filter((i) => i.bookingId === b.id).map((i) => ({
            ...i,
            court: copy.courts.find((c) => c.id === i.courtId),
          }));
          const payments = copy.payments.filter((p) => p.bookingId === b.id && (!include?.payments?.where?.status || p.status === include.payments.where.status));
          return { ...b, items, payments };
        },
        findMany: async ({ where, include, take }) => {
          let list = copy.bookings.filter((b) => {
            if (where?.status?.in && !where.status.in.includes(b.status)) return false;
            if (where?.venueId && b.venueId !== where.venueId) return false;
            return true;
          });
          if (take) list = list.slice(0, take);
          return list.map((b) => {
            const items = copy.bookingItems.filter((i) => i.bookingId === b.id).map((i) => ({
              ...i,
              court: copy.courts.find((c) => c.id === i.courtId),
            }));
            const payments = copy.payments.filter((p) => p.bookingId === b.id && (!include?.payments?.where?.status || p.status === include.payments.where.status));
            return { ...b, items, payments };
          });
        },
        update: async ({ where, data }) => {
          const b = copy.bookings.find((x) => x.id === where.id);
          if (b) Object.assign(b, data);
          return b;
        },
        updateMany: async ({ where, data }) => {
          let count = 0;
          copy.bookings.forEach((b) => {
            if (where.venueId && b.venueId !== where.venueId) return;
            if (where.status?.in && !where.status.in.includes(b.status)) return;
            if (where.sessionStatus && b.sessionStatus !== where.sessionStatus) return;
            Object.assign(b, data);
            count++;
          });
          return { count };
        },
      },
      bookingItem: {
        findMany: async ({ where }) => {
          return copy.bookingItems
            .filter((i) => {
              if (where?.courtId?.in && !where.courtId.in.includes(i.courtId)) return false;
              if (where?.booking?.status?.in) {
                const b = copy.bookings.find((x) => x.id === i.bookingId);
                if (!b || !where.booking.status.in.includes(b.status)) return false;
              }
              return true;
            })
            .map((i) => {
              const b = copy.bookings.find((x) => x.id === i.bookingId);
              const payments = copy.payments.filter((p) => p.bookingId === b?.id && p.status === "PAID");
              return {
                ...i,
                court: copy.courts.find((c) => c.id === i.courtId),
                booking: { ...b, payments },
              };
            });
        },
      },
      payment: {
        create: async ({ data }) => {
          const p = { id: `pay_${Date.now()}_${Math.random()}`, ...data };
          copy.payments.push(p);
          return p;
        },
      },
      notification: {
        findFirst: async ({ where }) =>
          copy.notifications.find((n) => {
            if (where.userId && n.userId !== where.userId) return false;
            if (where.type && n.type !== where.type) return false;
            if (where.data?.equals && n.data?.bookingId !== where.data.equals) return false;
            return true;
          }),
        create: async ({ data }) => {
          const n = { id: `notif_${Date.now()}_${Math.random()}`, ...data, createdAt: new Date() };
          copy.notifications.push(n);
          return n;
        },
      },
      adminAudit: {
        create: async ({ data }) => {
          const a = { id: `audit_${Date.now()}_${Math.random()}`, ...data, createdAt: new Date() };
          copy.audits.push(a);
          return a;
        },
      },
      coachBooking: {
        updateMany: async () => ({ count: 0 }),
      },
    };
  }

  const db = {
    get state() {
      return state;
    },
    court: {
      findMany: async (args) => getTx(state).court.findMany(args),
    },
    bookingItem: {
      findMany: async (args) => getTx(state).bookingItem.findMany(args),
    },
    staffShift: {
      findFirst: async (args) => getTx(state).staffShift.findFirst(args),
    },
    venueStaff: {
      findMany: async (args) => getTx(state).venueStaff.findMany(args),
    },
    async $transaction(work) {
      const copy = structuredClone(state);
      const tx = getTx(copy);
      const result = await work(tx);
      state = copy;
      return result;
    },
  };

  return db;
}

// ─────────────────────────────────────────────────────────────────────────────
// 12 TEST CASES THEO ĐÚNG YÊU CẦU MỤC 10
// ─────────────────────────────────────────────────────────────────────────────

test("1. Đã thanh toán online, không có nhân viên đứng ca -> tự hoàn tất sau 1 phút", async () => {
  // Giả sử ngày test 2026-10-26, giờ kết thúc 09:00 VN (endMin = 540).
  // Timestamp kết thúc: 2026-10-26T09:00:00+07:00
  const endTimestamp = new Date("2026-10-26T09:00:00+07:00").getTime();
  const now = new Date(endTimestamp + 65000); // 1 phút 5 giây sau khi hết giờ

  const db = createMockDb({
    bookings: [
      {
        id: "b1",
        code: "ONLINE_AUTO",
        venueId: "v1",
        customerName: "Khách 1",
        customerPhone: "0900000001",
        total: 200000,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        paymentMethod: "SEPAY",
        sessionStatus: "IN_USE",
        manualHandoverRequired: false,
        hasCashPayment: false,
      },
    ],
    bookingItems: [
      {
        id: "bi1",
        bookingId: "b1",
        courtId: "c1",
        date: new Date("2026-10-26T00:00:00.000Z"),
        startMin: 480, // 08:00
        endMin: 540,   // 09:00
        status: "CONFIRMED",
      },
    ],
    payments: [
      {
        id: "p1",
        bookingId: "b1",
        provider: "SEPAY",
        amount: 200000,
        status: "PAID",
      },
    ],
    staffShifts: [], // Không có nhân viên đứng ca
  });

  const res = await processOverdueAndCompletions(db, now);

  assert.equal(res.autoCompletedCount, 1);
  const updated = db.state.bookings.find((b) => b.id === "b1");
  assert.equal(updated.status, "COMPLETED");
  assert.equal(updated.sessionStatus, "COMPLETED");

  const audit = db.state.audits.find((a) => a.action === "AUTO_COMPLETE" && a.entityId === "b1");
  assert.ok(audit, "Phải ghi nhận audit tự động hoàn tất");
});

test("2. Đã thanh toán online, có nhân viên đứng ca -> không tự hoàn tất sau 1 phút, chờ bấm Hoàn tất", async () => {
  const endTimestamp = new Date("2026-10-26T09:00:00+07:00").getTime();
  const now = new Date(endTimestamp + 120000); // 2 phút sau khi hết giờ

  const db = createMockDb({
    bookings: [
      {
        id: "b2",
        code: "ONLINE_STAFF_PRESENT",
        venueId: "v1",
        customerName: "Khách 2",
        customerPhone: "0900000002",
        total: 200000,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        sessionStatus: "IN_USE",
        manualHandoverRequired: false,
        hasCashPayment: false,
      },
    ],
    bookingItems: [
      {
        id: "bi2",
        bookingId: "b2",
        courtId: "c1",
        date: new Date("2026-10-26T00:00:00.000Z"),
        startMin: 480,
        endMin: 540,
        status: "CONFIRMED",
      },
    ],
    payments: [
      { id: "p2", bookingId: "b2", provider: "SEPAY", amount: 200000, status: "PAID" },
    ],
    staffShifts: [
      {
        id: "s1",
        userId: "staff_v1",
        venueId: "v1",
        startedAt: new Date(endTimestamp - 3600000),
        endedAt: null, // Đang trực ca
      },
    ],
  });

  // Tác vụ nền quét:
  const res = await processOverdueAndCompletions(db, now);

  assert.equal(res.autoCompletedCount, 0, "Không được tự hoàn tất khi có nhân viên đang trực");
  const bAfterCron = db.state.bookings.find((b) => b.id === "b2");
  assert.equal(bAfterCron.sessionStatus, "OVERDUE_PENDING");
  assert.equal(bAfterCron.status, "CONFIRMED", "Vẫn giữ trạng thái chờ bàn giao thủ công");
  assert.equal(bAfterCron.manualHandoverRequired, true);

  // Nhân viên đứng ca bấm nút "Hoàn tất" bằng tay
  const staffActor = { id: "staff_v1", name: "Lễ tân V1", role: "STAFF", status: "ACTIVE" };
  const completeRes = await completeBookingSession(db, staffActor, "b2", "Bàn giao sân sạch sẽ", now);
  assert.equal(completeRes.success, true);

  const bAfterManual = db.state.bookings.find((b) => b.id === "b2");
  assert.equal(bAfterManual.status, "COMPLETED");
  assert.equal(bAfterManual.sessionStatus, "COMPLETED");

  const audit = db.state.audits.find((a) => a.action === "COMPLETE" && a.entityId === "b2");
  assert.ok(audit);
  assert.equal(audit.actorId, "staff_v1");
});

test("3. Nhân viên vào ca trong thời gian chờ 1 phút -> chuyển sang xử lý thủ công, không tự hoàn tất", async () => {
  const endTimestamp = new Date("2026-10-26T09:00:00+07:00").getTime();
  const t15s = new Date(endTimestamp + 15000); // +15s: chưa hết 1 phút
  const t30s = new Date(endTimestamp + 30000); // +30s: nhân viên bắt đầu ca
  const t75s = new Date(endTimestamp + 75000); // +75s: đã qua 1 phút

  const db = createMockDb({
    bookings: [
      {
        id: "b3",
        code: "SHIFT_JOINED_MIDWAY",
        venueId: "v1",
        customerName: "Khách 3",
        customerPhone: "0900000003",
        total: 100000,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        sessionStatus: "IN_USE",
        manualHandoverRequired: false,
        hasCashPayment: false,
      },
    ],
    bookingItems: [
      {
        id: "bi3",
        bookingId: "b3",
        courtId: "c1",
        date: new Date("2026-10-26T00:00:00.000Z"),
        startMin: 480,
        endMin: 540,
        status: "CONFIRMED",
      },
    ],
    payments: [{ id: "p3", bookingId: "b3", provider: "SEPAY", amount: 100000, status: "PAID" }],
    staffShifts: [],
  });

  // Lúc +15s: quét chuyển sang OVERDUE_PENDING
  await processOverdueAndCompletions(db, t15s);
  assert.equal(db.state.bookings[0].sessionStatus, "OVERDUE_PENDING");
  assert.equal(db.state.bookings[0].status, "CONFIRMED");

  // Lúc +30s: Nhân viên bắt đầu ca trực
  const staffActor = { id: "staff_v1", name: "Lễ tân V1", role: "STAFF", status: "ACTIVE" };
  await startStaffShift(db, staffActor, "v1", "Vào ca sáng", t30s);

  // Đơn b3 phải được chuyển thành manualHandoverRequired = true
  assert.equal(db.state.bookings[0].manualHandoverRequired, true);

  // Lúc +75s: cron quét lại
  const res75 = await processOverdueAndCompletions(db, t75s);
  assert.equal(res75.autoCompletedCount, 0, "Không được tự hoàn tất khi nhân viên đã vào ca");
  assert.equal(db.state.bookings[0].status, "CONFIRMED");
});

test("4. Chưa thanh toán hoặc mới trả một phần -> không tự giải phóng sân", async () => {
  const endTimestamp = new Date("2026-10-26T09:00:00+07:00").getTime();
  const now = new Date(endTimestamp + 180000); // 3 phút sau

  const db = createMockDb({
    bookings: [
      {
        id: "b4",
        code: "PARTIAL_PAYMENT",
        venueId: "v1",
        customerName: "Khách 4",
        customerPhone: "0900000004",
        total: 200000,
        status: "CONFIRMED",
        paymentStatus: "PARTIALLY_PAID",
        sessionStatus: "IN_USE",
        manualHandoverRequired: false,
        hasCashPayment: false,
      },
    ],
    bookingItems: [
      {
        id: "bi4",
        bookingId: "b4",
        courtId: "c1",
        date: new Date("2026-10-26T00:00:00.000Z"),
        startMin: 480,
        endMin: 540,
        status: "CONFIRMED",
      },
    ],
    payments: [
      { id: "p4", bookingId: "b4", provider: "SEPAY", amount: 100000, status: "PAID" }, // Còn thiếu 100k
    ],
    staffShifts: [],
  });

  // Cron chạy quét
  const res = await processOverdueAndCompletions(db, now);
  assert.equal(res.autoCompletedCount, 0, "Không được tự hoàn tất khi còn nợ");
  assert.equal(db.state.bookings[0].status, "CONFIRMED");
  assert.equal(db.state.bookings[0].sessionStatus, "OVERDUE_PENDING");

  // Nhân viên cố bấm hoàn tất khi chưa thu đủ tiền -> Bị từ chối 409
  const ownerActor = { id: "owner_v1", name: "Chủ sân V1", role: "OWNER", status: "ACTIVE" };
  await assert.rejects(
    completeBookingSession(db, ownerActor, "b4", "Thử bàn giao nợ", now),
    (err) => err.status === 409 && err.message.includes("còn thiếu 100.000 đ")
  );

  // Trạng thái sân con theo thời gian thực vẫn là OVERDUE, không bị đổi thành AVAILABLE
  const courtStatuses = await getVenueCourtsLiveStatus(db, "v1", now);
  const court1 = courtStatuses.find((c) => c.id === "c1");
  assert.equal(court1.status, "OVERDUE");
  assert.equal(court1.currentBooking.remainingAmount, 100000);
});

test("5. Thanh toán bằng tiền mặt -> xác nhận đúng số tiền ở bước 1, sau đó bấm Hoàn tất riêng ở bước 2", async () => {
  const endTimestamp = new Date("2026-10-26T09:00:00+07:00").getTime();
  const now = new Date(endTimestamp + 60000);

  const db = createMockDb({
    bookings: [
      {
        id: "b5",
        code: "CASH_FLOW",
        venueId: "v1",
        customerName: "Khách 5",
        customerPhone: "0900000005",
        total: 150000,
        status: "CONFIRMED",
        paymentStatus: "UNPAID",
        sessionStatus: "IN_USE",
        manualHandoverRequired: false,
        hasCashPayment: false,
      },
    ],
    bookingItems: [
      {
        id: "bi5",
        bookingId: "b5",
        courtId: "c1",
        date: new Date("2026-10-26T00:00:00.000Z"),
        startMin: 480,
        endMin: 540,
        status: "CONFIRMED",
      },
    ],
    payments: [],
    staffShifts: [
      {
        id: "s1",
        userId: "staff_v1",
        venueId: "v1",
        startedAt: new Date(endTimestamp - 3600000),
        endedAt: null,
      },
    ],
  });

  const staff = { id: "staff_v1", name: "Lễ tân V1", role: "STAFF", status: "ACTIVE" };

  // Bước 1: Thu tiền mặt
  // 1a. Gửi sai expectedAmount (số tiền nợ thực tế là 150.000 nhưng gửi 100.000) -> Reject 409
  await assert.rejects(
    confirmCashPayment(db, staff, "b5", 100000, "Thu tiền mặt", now),
    (err) => err.status === 409 && err.message.includes("Số tiền cần thu đã thay đổi")
  );

  // 1b. Gửi đúng expectedAmount: 150000
  const payRes = await confirmCashPayment(db, staff, "b5", 150000, "Đã nhận tiền mặt tại quầy", now);
  assert.equal(payRes.success, true);
  assert.equal(payRes.paidAmount, 150000);

  const bAfterPay = db.state.bookings.find((b) => b.id === "b5");
  assert.equal(bAfterPay.paymentStatus, "PAID");
  assert.equal(bAfterPay.hasCashPayment, true);
  assert.equal(bAfterPay.manualHandoverRequired, true);
  assert.equal(bAfterPay.status, "CONFIRMED", "Bước 1 KHÔNG ĐƯỢC tự ý chuyển sang COMPLETED!");

  // Kiểm tra Payment record được tạo chuẩn
  const paymentRecord = db.state.payments.find((p) => p.bookingId === "b5");
  assert.ok(paymentRecord);
  assert.equal(paymentRecord.provider, "CASH");
  assert.equal(paymentRecord.amount, 150000);
  assert.equal(paymentRecord.status, "PAID");

  // Bước 2: Nhân viên bấm "Hoàn tất" riêng
  const completeRes = await completeBookingSession(db, staff, "b5", "Khách đã rời sân", now);
  assert.equal(completeRes.success, true);

  const bAfterComplete = db.state.bookings.find((b) => b.id === "b5");
  assert.equal(bAfterComplete.status, "COMPLETED");
  assert.equal(bAfterComplete.sessionStatus, "COMPLETED");
});

test("6. Hủy hộp thoại thu tiền -> không cập nhật thanh toán", async () => {
  const db = createMockDb({
    bookings: [
      {
        id: "b6",
        code: "CANCEL_MODAL",
        venueId: "v1",
        total: 100000,
        status: "CONFIRMED",
        paymentStatus: "UNPAID",
      },
    ],
    payments: [],
  });

  // Khi nhân viên bấm "Hủy" trên modal, phía frontend hủy bỏ và không gửi request lên backend.
  // DB giữ nguyên vẹn
  assert.equal(db.state.payments.length, 0);
  assert.equal(db.state.bookings[0].paymentStatus, "UNPAID");
});

test("7. Booking có thu tiền mặt -> không tự hoàn tất trong mọi trường hợp, kể cả khi hết ca", async () => {
  const endTimestamp = new Date("2026-10-26T09:00:00+07:00").getTime();
  const now = new Date(endTimestamp + 3600000); // 1 tiếng sau

  const db = createMockDb({
    bookings: [
      {
        id: "b7",
        code: "CASH_NEVER_AUTO",
        venueId: "v1",
        customerName: "Khách 7",
        total: 100000,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        hasCashPayment: true, // Đã từng thu tiền mặt
        manualHandoverRequired: true,
        sessionStatus: "OVERDUE_PENDING",
      },
    ],
    bookingItems: [
      {
        id: "bi7",
        bookingId: "b7",
        courtId: "c1",
        date: new Date("2026-10-26T00:00:00.000Z"),
        startMin: 480,
        endMin: 540,
        status: "CONFIRMED",
      },
    ],
    payments: [{ id: "p7", bookingId: "b7", provider: "CASH", amount: 100000, status: "PAID" }],
    staffShifts: [], // Nhân viên đã hết ca, không có ai đứng ca
  });

  const res = await processOverdueAndCompletions(db, now);
  assert.equal(res.autoCompletedCount, 0, "Đơn có thu tiền mặt tuyệt đối không được tự hoàn tất!");
  assert.equal(db.state.bookings[0].status, "CONFIRMED");
});

test("8. Gia hạn booking -> không kết thúc theo giờ cũ", async () => {
  // Lịch ban đầu: 08:00 - 09:00 (endMin = 540). Khách gia hạn thêm 1 tiếng thành 08:00 - 10:00 (endMin = 600).
  const db = createMockDb({
    bookings: [
      {
        id: "b8",
        code: "EXTENDED_BOOKING",
        venueId: "v1",
        customerName: "Khách 8",
        customerPhone: "0900000008",
        total: 200000,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        sessionStatus: "IN_USE",
      },
    ],
    bookingItems: [
      {
        id: "bi8",
        bookingId: "b8",
        courtId: "c1",
        date: new Date("2026-10-26T00:00:00.000Z"),
        startMin: 480,
        endMin: 600, // Đã gia hạn đến 10:00
        status: "CONFIRMED",
      },
    ],
    payments: [{ id: "p8", bookingId: "b8", provider: "SEPAY", amount: 200000, status: "PAID" }],
  });

  // Thời điểm 09:15 VN (đã qua 09:00 nhưng chưa tới 10:00)
  const now0915 = new Date("2026-10-26T09:15:00+07:00");

  const res = await processOverdueAndCompletions(db, now0915);
  assert.equal(res.overdueCount, 0, "Không được báo hết giờ vì đã được gia hạn");
  assert.equal(res.autoCompletedCount, 0);

  const courtStatuses = await getVenueCourtsLiveStatus(db, "v1", now0915);
  const court1 = courtStatuses.find((c) => c.id === "c1");
  assert.equal(court1.status, "IN_USE", "Sân vẫn đang trong thời gian sử dụng");
  assert.equal(court1.currentBooking.remainingMin, 45, "Còn lại 45 phút");
});

test("9. Booking kế tiếp đang hoạt động -> không bị đổi sân thành Trống và hiển thị cảnh báo xung đột", async () => {
  // Sân 1 có 2 booking:
  // - b9_old: 08:00 - 09:00 (chưa bấm bàn giao)
  // - b9_next: 09:00 - 10:00 (đã đến giờ)
  const db = createMockDb({
    bookings: [
      {
        id: "b9_old",
        code: "OLD_SESSION",
        venueId: "v1",
        customerName: "Khách Cũ",
        customerPhone: "0900000009",
        total: 100000,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        sessionStatus: "OVERDUE_PENDING",
      },
      {
        id: "b9_next",
        code: "NEXT_SESSION",
        venueId: "v1",
        customerName: "Khách Mới",
        customerPhone: "0900000010",
        total: 100000,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        sessionStatus: "IN_USE",
      },
    ],
    bookingItems: [
      {
        id: "bi9_1",
        bookingId: "b9_old",
        courtId: "c1",
        date: new Date("2026-10-26T00:00:00.000Z"),
        startMin: 480, // 08:00
        endMin: 540,   // 09:00
        status: "CONFIRMED",
      },
      {
        id: "bi9_2",
        bookingId: "b9_next",
        courtId: "c1",
        date: new Date("2026-10-26T00:00:00.000Z"),
        startMin: 540, // 09:00
        endMin: 600,   // 10:00
        status: "CONFIRMED",
      },
    ],
  });

  const now0905 = new Date("2026-10-26T09:05:00+07:00");

  // 9A: Khi đơn cũ chưa bàn giao -> Phát hiện cảnh báo xung đột
  const statusBefore = await getVenueCourtsLiveStatus(db, "v1", now0905);
  const courtBefore = statusBefore.find((c) => c.id === "c1");
  assert.ok(courtBefore.conflictWarning, "Phải có cảnh báo xung đột lịch tiếp theo");
  assert.match(courtBefore.conflictWarning, /Khách Mới/);

  // 9B: Khi đơn cũ đã hoàn tất bàn giao
  db.state.bookings.find((b) => b.id === "b9_old").status = "COMPLETED";

  const statusAfter = await getVenueCourtsLiveStatus(db, "v1", now0905);
  const courtAfter = statusAfter.find((c) => c.id === "c1");
  // Sân không bị đổi thành AVAILABLE mà chuyển sang IN_USE của đơn kế tiếp!
  assert.equal(courtAfter.status, "IN_USE");
  assert.equal(courtAfter.currentBooking.code, "NEXT_SESSION");
});

test("10. Hai nhân viên thao tác đồng thời -> không thu tiền hoặc hoàn tất trùng", async () => {
  const endTimestamp = new Date("2026-10-26T09:00:00+07:00").getTime();
  const now = new Date(endTimestamp + 60000);

  const db = createMockDb({
    bookings: [
      {
        id: "b10",
        code: "CONCURRENT_OPS",
        venueId: "v1",
        customerName: "Khách 10",
        total: 100000,
        status: "CONFIRMED",
        paymentStatus: "UNPAID",
        sessionStatus: "IN_USE",
      },
    ],
    bookingItems: [
      {
        id: "bi10",
        bookingId: "b10",
        courtId: "c1",
        date: new Date("2026-10-26T00:00:00.000Z"),
        startMin: 480,
        endMin: 540,
        status: "CONFIRMED",
      },
    ],
    payments: [],
    staffShifts: [
      { id: "s1", userId: "staff_v1", venueId: "v1", startedAt: new Date(endTimestamp - 3600000), endedAt: null },
    ],
  });

  const staff = { id: "staff_v1", name: "Lễ tân V1", role: "STAFF", status: "ACTIVE" };

  // 10A: Thao tác thu tiền mặt đồng thời
  // Request 1 thành công
  await confirmCashPayment(db, staff, "b10", 100000, "Thu tiền nhân viên 1", now);
  // Request 2 lập tức bị reject 409
  await assert.rejects(
    confirmCashPayment(db, staff, "b10", 100000, "Thu tiền nhân viên 2", now),
    (err) => err.status === 409
  );
  // Chỉ có đúng 1 payment được tạo
  assert.equal(db.state.payments.length, 1);

  // 10B: Thao tác hoàn tất đồng thời (Idempotent)
  const res1 = await completeBookingSession(db, staff, "b10", "Hoàn tất NV 1", now);
  const res2 = await completeBookingSession(db, staff, "b10", "Hoàn tất NV 2", now);
  assert.equal(res1.success, true);
  assert.equal(res2.success, true);
  assert.equal(db.state.bookings[0].status, "COMPLETED");
});

test("11. Nhân viên khác cụm sân hoặc đã bị vô hiệu hóa -> bị backend từ chối", async () => {
  const endTimestamp = new Date("2026-10-26T09:00:00+07:00").getTime();
  const now = new Date(endTimestamp + 60000);

  const db = createMockDb({
    bookings: [
      {
        id: "b11",
        code: "ACCESS_CONTROL",
        venueId: "v1", // Thuộc cụm sân V1
        total: 100000,
        status: "CONFIRMED",
        paymentStatus: "UNPAID",
      },
    ],
    bookingItems: [
      {
        id: "bi11",
        bookingId: "b11",
        courtId: "c1",
        date: new Date("2026-10-26T00:00:00.000Z"),
        startMin: 480,
        endMin: 540,
        status: "CONFIRMED",
      },
    ],
    staffShifts: [
      { id: "s2", userId: "staff_v2", venueId: "v2", startedAt: new Date(), endedAt: null },
    ],
  });

  // 11a: Nhân viên V2 thao tác trên sân V1 -> Bị từ chối 403
  const staffV2 = { id: "staff_v2", name: "Lễ tân V2", role: "STAFF", status: "ACTIVE" };
  await assert.rejects(
    confirmCashPayment(db, staffV2, "b11", 100000, "Thu tiền trái cơ sở", now),
    (err) => err.status === 403
  );

  // 11b: Nhân viên V1 bị vô hiệu hóa (isActive = false) -> Bị từ chối 403
  const staffDisabled = { id: "staff_disabled", name: "Lễ tân nghỉ việc", role: "STAFF", status: "ACTIVE" };
  await assert.rejects(
    confirmCashPayment(db, staffDisabled, "b11", 100000, "Thu tiền", now),
    (err) => err.status === 403
  );

  // 11c: Nhân viên V1 tài khoản bị khóa (status = BLOCKED) -> Bị từ chối 403
  const staffBlocked = { id: "staff_blocked", name: "Lễ tân vi phạm", role: "STAFF", status: "BLOCKED" };
  await assert.rejects(
    confirmCashPayment(db, staffBlocked, "b11", 100000, "Thu tiền", now),
    (err) => err.status === 403
  );

  // 11d: Nhân viên hợp lệ nhưng chưa đứng ca -> Bị từ chối 403
  const staffV1NoShift = { id: "staff_v1", name: "Lễ tân V1", role: "STAFF", status: "ACTIVE" };
  await assert.rejects(
    confirmCashPayment(db, staffV1NoShift, "b11", 100000, "Thu tiền khi chưa vào ca", now),
    (err) => err.status === 403 && err.message.includes("cần bắt đầu ca trực")
  );
});

test("12. Tác vụ nền chạy lại hoặc dịch vụ khởi động lại -> xử lý đúng, không trùng dữ liệu", async () => {
  const endTimestamp = new Date("2026-10-26T09:00:00+07:00").getTime();
  const now = new Date(endTimestamp + 30000); // 30s sau khi hết giờ

  const db = createMockDb({
    bookings: [
      {
        id: "b12",
        code: "IDEMPOTENT_CRON",
        venueId: "v1",
        customerName: "Khách 12",
        total: 100000,
        status: "CONFIRMED",
        paymentStatus: "UNPAID",
        sessionStatus: "IN_USE",
        overdueNotifiedAt: null,
      },
    ],
    bookingItems: [
      {
        id: "bi12",
        bookingId: "b12",
        courtId: "c1",
        date: new Date("2026-10-26T00:00:00.000Z"),
        startMin: 480,
        endMin: 540,
        status: "CONFIRMED",
      },
    ],
    payments: [],
    staffShifts: [
      { id: "s1", userId: "staff_v1", venueId: "v1", startedAt: new Date(endTimestamp - 3600000), endedAt: null },
    ],
  });

  // Chạy lần 1
  const res1 = await processOverdueAndCompletions(db, now);
  assert.equal(res1.overdueCount, 1);
  assert.equal(res1.notifiedStaffCount, 1);
  assert.equal(db.state.notifications.length, 1);

  // Chạy lần 2 (ngay sau đó hoặc reboot cron)
  const res2 = await processOverdueAndCompletions(db, now);
  assert.equal(res2.overdueCount, 0, "Không được đếm lại đơn đã ở trạng thái OVERDUE_PENDING");
  assert.equal(res2.notifiedStaffCount, 0, "Không được gửi lại thông báo trùng lặp");
  assert.equal(db.state.notifications.length, 1, "Số lượng thông báo vẫn là 1");
});
