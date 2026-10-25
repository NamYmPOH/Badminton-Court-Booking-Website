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
  upsertMyCoachProfile,
  createCoachAvailability,
  deleteCoachAvailability,
  getPublicCoachAvailabilities,
  registerCoachVenue,
  reviewCoachVenue,
  cancelCoachBookingByCoach,
} = require("../src/services/coach.service.ts");
const { performAdminAction } = require("../src/services/admin.service.ts");
const { sync, closeGroup } = require("../src/services/group-payment.service.ts");

test("upsertMyCoachProfile creates PENDING profile and resets REJECTED profile on update", async () => {
  let storedProfile = null;
  const mockDb = {
    $transaction: async (work) =>
      work({
        user: {
          findUnique: async () => ({ id: "user-1", status: "ACTIVE" }),
        },
        coachProfile: {
          findUnique: async () => storedProfile,
          create: async ({ data }) => {
            storedProfile = { id: "coach-1", ...data, createdAt: new Date(), updatedAt: new Date() };
            return storedProfile;
          },
          update: async ({ data }) => {
            Object.assign(storedProfile, data);
            return storedProfile;
          },
        },
      }),
  };

  // 1. Initial creation -> status is PENDING
  const created = await upsertMyCoachProfile(mockDb, "user-1", {
    bio: "Huấn luyện viên cầu lông cơ bản và nâng cao",
    specialties: ["Cơ bản", "Nâng cao"],
    experienceYears: 4,
    hourlyRate: 200000,
  });
  assert.equal(created.status, "PENDING");
  assert.equal(created.hourlyRate, 200000);

  // 2. Admin rejects profile
  storedProfile.status = "REJECTED";
  storedProfile.reviewReason = "Thiếu bằng cấp chứng chỉ sư phạm thể thao";

  // 3. Coach updates profile -> status resets to PENDING for admin re-review
  const updated = await upsertMyCoachProfile(mockDb, "user-1", {
    bio: "Đã bổ sung chứng chỉ huấn luyện viên cấp 1",
    specialties: ["Cơ bản", "Nâng cao"],
    experienceYears: 4,
    hourlyRate: 250000,
  });
  assert.equal(updated.status, "PENDING");
  assert.equal(updated.reviewReason, null);
  assert.equal(updated.hourlyRate, 250000);
});

test("performAdminAction with COACH_STATUS approves, suspends, and records audit log", async () => {
  let auditRecord = null;
  const coach = {
    id: "coach-1",
    status: "PENDING",
    user: { id: "user-1", name: "Nguyễn Văn HLV", status: "ACTIVE" },
  };

  const mockDb = {
    $transaction: async (work) =>
      work({
        user: {
          findUnique: async () => ({
            id: "admin-1",
            name: "Tổng Quản Trị",
            role: "ADMIN",
            status: "ACTIVE",
          }),
        },
        coachProfile: {
          findUnique: async ({ where }) => (where.id === coach.id ? coach : null),
          update: async ({ data }) => Object.assign(coach, data),
        },
        adminAudit: {
          create: async ({ data }) => {
            auditRecord = data;
            return data;
          },
        },
      }),
  };

  // 1. Admin approves coach
  await performAdminAction(mockDb, "admin-1", {
    id: "coach-1",
    action: "COACH_STATUS",
    status: "ACTIVE",
    reason: "Đã kiểm tra chứng chỉ hợp lệ và phỏng vấn trực tiếp",
  });
  assert.equal(coach.status, "ACTIVE");
  assert.equal(auditRecord.action, "COACH_STATUS");
  assert.equal(auditRecord.entityId, "coach-1");
  assert.equal(auditRecord.actorName, "Tổng Quản Trị");

  // 2. Admin suspends coach
  await performAdminAction(mockDb, "admin-1", {
    id: "coach-1",
    action: "COACH_STATUS",
    status: "SUSPENDED",
    reason: "Tạm ngưng do phản ánh nghỉ dạy không báo trước",
  });
  assert.equal(coach.status, "SUSPENDED");
  assert.equal(coach.reviewReason, "Tạm ngưng do phản ánh nghỉ dạy không báo trước");

  // 3. Reject non-existent coach throws 404
  await assert.rejects(
    performAdminAction(mockDb, "admin-1", {
      id: "unknown-coach",
      action: "COACH_STATUS",
      status: "REJECTED",
      reason: "Hồ sơ giả mạo",
    }),
    (e) => e.status === 404
  );
});

test("createCoachAvailability prevents non-active coaches and detects overlapping slots", async () => {
  const profile = { id: "coach-1", userId: "user-1", status: "PENDING" };
  const mockDb = {
    $transaction: async (work) =>
      work({
        coachProfile: {
          findUnique: async () => profile,
        },
        coachVenue: {
          findUnique: async () => ({ id: "cv-1", status: "ACTIVE" }),
        },
        coachAvailability: {
          findFirst: async () => null,
          create: async ({ data }) => ({ id: "slot-1", ...data }),
        },
      }),
  };

  const futureSlot = {
    venueId: "venue-1",
    startsAt: new Date(Date.now() + 86400000).toISOString(),
    endsAt: new Date(Date.now() + 93600000).toISOString(),
  };

  // Coach is PENDING -> cannot create availability
  await assert.rejects(
    createCoachAvailability(mockDb, "user-1", futureSlot),
    (e) => e.status === 403
  );

  // Activate coach
  profile.status = "ACTIVE";

  // Coach has unapproved venue -> rejects 403
  const mockDbUnapprovedVenue = {
    $transaction: async (work) =>
      work({
        coachProfile: { findUnique: async () => profile },
        coachVenue: { findUnique: async () => null },
      }),
  };
  await assert.rejects(
    createCoachAvailability(mockDbUnapprovedVenue, "user-1", futureSlot),
    (e) => e.status === 403
  );

  // Overlapping slot in DB -> rejects 409
  const mockDbOverlap = {
    $transaction: async (work) =>
      work({
        coachProfile: { findUnique: async () => profile },
        coachVenue: { findUnique: async () => ({ status: "ACTIVE" }) },
        coachAvailability: {
          findFirst: async () => ({ id: "existing-slot" }), // conflict found
        },
      }),
  };
  await assert.rejects(
    createCoachAvailability(mockDbOverlap, "user-1", futureSlot),
    (e) => e.status === 409
  );
});

test("deleteCoachAvailability blocks deletion when active bookings exist", async () => {
  const profile = { id: "coach-1", userId: "user-1" };
  const slot = {
    id: "slot-1",
    coachId: "coach-1",
    startsAt: new Date("2026-10-25T18:00:00.000Z"),
    endsAt: new Date("2026-10-25T20:00:00.000Z"),
  };

  const mockDbWithBooking = {
    $transaction: async (work) =>
      work({
        coachProfile: { findUnique: async () => profile },
        coachAvailability: { findUnique: async () => slot },
        coachBooking: {
          findFirst: async () => ({ id: "booking-1", status: "CONFIRMED" }),
        },
      }),
  };

  // Active booking exists -> cannot delete slot
  await assert.rejects(
    deleteCoachAvailability(mockDbWithBooking, "user-1", "slot-1"),
    (e) => e.status === 409
  );

  // No active booking -> can delete slot
  let deleted = false;
  const mockDbFree = {
    $transaction: async (work) =>
      work({
        coachProfile: { findUnique: async () => profile },
        coachAvailability: {
          findUnique: async () => slot,
          delete: async () => {
            deleted = true;
          },
        },
        coachBooking: { findFirst: async () => null },
      }),
  };
  await deleteCoachAvailability(mockDbFree, "user-1", "slot-1");
  assert.equal(deleted, true);
});

test("getPublicCoachAvailabilities filters out booked slots", async () => {
  const slotA = {
    id: "slot-A",
    startsAt: new Date("2026-10-25T18:00:00.000Z"),
    endsAt: new Date("2026-10-25T19:00:00.000Z"),
  };
  const slotB = {
    id: "slot-B",
    startsAt: new Date("2026-10-25T19:00:00.000Z"),
    endsAt: new Date("2026-10-25T20:00:00.000Z"),
  };

  // slotA has a confirmed booking
  const mockDb = {
    coachAvailability: {
      findMany: async () => [slotA, slotB],
    },
    coachBooking: {
      findMany: async () => [
        {
          startsAt: new Date("2026-10-25T18:00:00.000Z"),
          endsAt: new Date("2026-10-25T19:00:00.000Z"),
        },
      ],
    },
  };

  const free = await getPublicCoachAvailabilities(mockDb, "coach-1", "venue-1", "2026-10-25");
  assert.equal(free.length, 1);
  assert.equal(free[0].id, "slot-B");
});

test("registerCoachVenue tạo liên kết PENDING và reset PENDING khi gửi lại sau từ chối", async () => {
  let createdLink = null;
  let updatedLink = null;
  const profile = { id: "coach-1", userId: "user-1" };
  const venue = { id: "v-1", status: "ACTIVE" };

  let existing = null;
  const mockDb = {
    coachProfile: { findUnique: async () => profile },
    venue: { findUnique: async () => venue },
    coachVenue: {
      findUnique: async () => existing,
      create: async ({ data }) => {
        createdLink = { id: "cv-1", ...data };
        existing = createdLink;
        return createdLink;
      },
      update: async ({ data }) => {
        updatedLink = Object.assign(existing, data);
        return updatedLink;
      },
    },
  };

  // 1. Đăng ký mới: luôn ở trạng thái PENDING
  const res1 = await registerCoachVenue(mockDb, "user-1", "v-1");
  assert.equal(res1.status, "PENDING");
  assert.equal(createdLink.status, "PENDING");

  // 2. Nếu đã được ACTIVE, đăng ký lại giữ nguyên ACTIVE
  existing.status = "ACTIVE";
  const res2 = await registerCoachVenue(mockDb, "user-1", "v-1");
  assert.equal(res2.status, "ACTIVE");

  // 3. Nếu bị REJECTED, đăng ký lại sẽ reset về PENDING
  existing.status = "REJECTED";
  existing.reviewReason = "Cơ sở đã đủ số lượng HLV";
  const res3 = await registerCoachVenue(mockDb, "user-1", "v-1");
  assert.equal(res3.status, "PENDING");
  assert.equal(res3.reviewReason, null);
});

test("HLV chưa duyệt hoặc bị tạm ngừng không thể mở ca rảnh", async () => {
  const profileSuspended = { id: "coach-1", userId: "user-suspended", status: "SUSPENDED" };
  const profileActive = { id: "coach-1", userId: "user-active", status: "ACTIVE" };

  const futureSlot = {
    venueId: "venue-1",
    startsAt: "2026-10-28T10:00:00.000Z",
    endsAt: "2026-10-28T12:00:00.000Z",
  };

  // HLV bị SUSPENDED -> 403
  const mockDbSuspended = {
    $transaction: async (work) =>
      work({
        coachProfile: { findUnique: async () => profileSuspended },
        coachVenue: { findUnique: async () => ({ status: "ACTIVE" }) },
      }),
  };
  await assert.rejects(
    createCoachAvailability(mockDbSuspended, "user-suspended", futureSlot),
    (e) => e.status === 403 && e.message.includes("tạm ngưng")
  );

  // Cơ sở đang ở trạng thái SUSPENDED -> 403
  const mockDbVenueSuspended = {
    $transaction: async (work) =>
      work({
        coachProfile: { findUnique: async () => profileActive },
        coachVenue: { findUnique: async () => ({ status: "SUSPENDED" }) },
      }),
  };
  await assert.rejects(
    createCoachAvailability(mockDbVenueSuspended, "user-active", futureSlot),
    (e) => e.status === 403 && e.message.includes("chưa được duyệt")
  );

  // Cơ sở đang ở trạng thái REJECTED -> 403
  const mockDbVenueRejected = {
    $transaction: async (work) =>
      work({
        coachProfile: { findUnique: async () => profileActive },
        coachVenue: { findUnique: async () => ({ status: "REJECTED" }) },
      }),
  };
  await assert.rejects(
    createCoachAvailability(mockDbVenueRejected, "user-active", futureSlot),
    (e) => e.status === 403
  );
});

test("Phân quyền duyệt liên kết cơ sở: người không có quyền bị từ chối (403), quản trị/chủ sân được duyệt", async () => {
  const customer = { id: "u-cust", name: "Khách hàng", role: "CUSTOMER", status: "ACTIVE" };
  const ownerOther = { id: "u-owner-other", name: "Chủ sân khác", role: "OWNER", status: "ACTIVE" };
  const ownerVenue = { id: "u-owner-1", name: "Chủ sân 1", role: "OWNER", status: "ACTIVE" };
  const admin = { id: "u-admin", name: "Quản trị viên", role: "ADMIN", status: "ACTIVE" };

  const coachVenueLink = {
    id: "cv-1",
    coachId: "coach-1",
    venueId: "venue-1",
    status: "PENDING",
    coach: { user: { name: "HLV Minh Đức" } },
    venue: { name: "Cơ sở Cầu Giấy" },
  };

  let auditCreated = null;
  const createMockDb = (currentUser, venueAllowed) => ({
    $transaction: async (work) =>
      work({
        user: { findUnique: async () => currentUser },
        venue: { findFirst: async () => (venueAllowed ? { id: "venue-1" } : null) },
        coachVenue: {
          findUnique: async () => coachVenueLink,
          update: async ({ data }) => Object.assign(coachVenueLink, data),
        },
        adminAudit: {
          create: async ({ data }) => {
            auditCreated = data;
            return data;
          },
        },
      }),
  });

  const payload = {
    coachId: "coach-1",
    venueId: "venue-1",
    status: "ACTIVE",
    reason: "Đã thẩm định hồ sơ đạt yêu cầu chuyên môn",
  };

  // 1. Khách hàng không có quyền -> 403
  await assert.rejects(
    reviewCoachVenue(createMockDb(customer, false), "u-cust", payload),
    (e) => e.status === 403
  );

  // 2. Chủ sân khác không có quyền tại venue-1 -> 403
  await assert.rejects(
    reviewCoachVenue(createMockDb(ownerOther, false), "u-owner-other", payload),
    (e) => e.status === 403
  );

  // 3. Chủ sân chính thức tại venue-1 -> Duyệt thành công ACTIVE kèm lưu vết
  const resOwner = await reviewCoachVenue(createMockDb(ownerVenue, true), "u-owner-1", payload);
  assert.equal(resOwner.status, "ACTIVE");
  assert.equal(coachVenueLink.status, "ACTIVE");
  assert.equal(coachVenueLink.reviewReason, "Đã thẩm định hồ sơ đạt yêu cầu chuyên môn");
  assert.equal(coachVenueLink.reviewedById, "u-owner-1");
  assert.equal(auditCreated.action, "COACH_VENUE_STATUS");
  assert.equal(auditCreated.actorName, "Chủ sân 1");

  // 4. Admin có thể tạm ngưng liên kết (SUSPENDED)
  const resAdmin = await reviewCoachVenue(createMockDb(admin, true), "u-admin", {
    coachId: "coach-1",
    venueId: "venue-1",
    status: "SUSPENDED",
    reason: "HLV vi phạm nội quy sân bãi",
  });
  assert.equal(resAdmin.status, "SUSPENDED");
  assert.equal(coachVenueLink.status, "SUSPENDED");
  assert.equal(coachVenueLink.reviewReason, "HLV vi phạm nội quy sân bãi");
});

test("Retry cancelCoachBookingByCoach không tạo khoản hoàn trùng (Idempotent)", async () => {
  let paymentCreatedCount = 0;
  const coachProfile = { id: "cp-1", userId: "user-coach" };
  const booking = {
    id: "b-paid",
    code: "DATSAN-IDEMPOTENT",
    userId: "cust-1",
    paymentStatus: "PAID",
    total: 300000,
    subtotal: 300000,
  };
  const coachBooking = {
    id: "cb-idem",
    coachId: "cp-1",
    fee: 150000,
    status: "CONFIRMED",
    bookingItem: { booking },
  };

  const payments = [];
  const mockDb = {
    $transaction: async (work) =>
      work({
        coachProfile: { findUnique: async () => coachProfile },
        coachBooking: {
          findUnique: async () => coachBooking,
          update: async ({ data }) => Object.assign(coachBooking, data),
        },
        payment: {
          findUnique: async ({ where }) => payments.find((p) => p.txnRef === where.txnRef) || null,
          create: async ({ data }) => {
            paymentCreatedCount++;
            payments.push(data);
            return { id: "p-1", ...data };
          },
        },
        booking: { update: async ({ data }) => Object.assign(booking, data) },
        bookingPriceLine: {
          findFirst: async () => null,
          create: async () => ({ id: "bpl-1" }),
        },
        notification: { create: async () => ({ id: "notif-1" }) },
      }),
  };

  // Lần gọi 1: hủy thành công, tạo 1 bản ghi hoàn tiền
  const res1 = await cancelCoachBookingByCoach(mockDb, "user-coach", "cb-idem", "HLV bận đột xuất");
  assert.equal(res1.success, true);
  assert.equal(res1.refundedFee, 150000);
  assert.equal(paymentCreatedCount, 1);
  assert.equal(booking.paymentStatus, "PAID", "Giữ nguyên PAID để nhận sân");

  // Lần gọi 2 (retry mạng): trả về thành công lũy thừa, KHÔNG tạo thêm bản ghi hoàn tiền
  const res2 = await cancelCoachBookingByCoach(mockDb, "user-coach", "cb-idem", "HLV bận đột xuất");
  assert.equal(res2.success, true);
  assert.equal(res2.alreadyCancelled, true);
  assert.equal(paymentCreatedCount, 1, "Không được tạo bản ghi hoàn tiền lần 2");
});

test("HLV hủy đơn nhóm đã trả một phần: bảo toàn tính nhất quán giữa booking.total, GroupShare và tiền thực trả", async () => {
  // Đơn nhóm: Sân 200k + HLV 200k = 400k. Chia 4 người (mỗi người 100k)
  const booking = {
    id: "b-group-1",
    code: "DATSAN-GROUP",
    userId: "leader-1",
    paymentStatus: "PARTIALLY_PAID",
    subtotal: 400000,
    total: 400000,
  };

  const shares = [
    { id: "s-1", position: 1, amount: 100000, paymentId: "p-share-1" }, // Đã trả 100k
    { id: "s-2", position: 2, amount: 100000, paymentId: null },        // Chưa trả
    { id: "s-3", position: 3, amount: 100000, paymentId: null },        // Chưa trả
    { id: "s-4", position: 4, amount: 100000, paymentId: null },        // Chưa trả
  ];

  const coachBooking = {
    id: "cb-grp",
    coachId: "coach-grp",
    fee: 200000,
    status: "CONFIRMED",
    bookingItem: { booking },
  };

  const mockDb = {
    $transaction: async (work) =>
      work({
        coachProfile: { findUnique: async () => ({ id: "coach-grp", userId: "coach-user" }) },
        coachBooking: {
          findUnique: async () => coachBooking,
          update: async ({ data }) => Object.assign(coachBooking, data),
        },
        booking: {
          update: async ({ data }) => Object.assign(booking, data),
        },
        bookingPriceLine: {
          deleteMany: async () => {},
        },
        bookingGroup: {
          findUnique: async () => ({ id: "grp-1", bookingId: booking.id, shares }),
        },
        groupShare: {
          update: async ({ where, data }) => {
            const s = shares.find((item) => item.id === where.id);
            if (s) Object.assign(s, data);
            return s;
          },
        },
        groupPaymentIntent: {
          updateMany: async () => ({ count: 1 }),
        },
        notification: { create: async () => ({ id: "n-1" }) },
      }),
  };

  // HLV hủy buổi dạy phí 200k
  const res = await cancelCoachBookingByCoach(mockDb, "coach-user", "cb-grp", "Lý do cá nhân");
  assert.equal(res.success, true);
  assert.equal(res.refundedFee, 200000);

  // 1. Tổng đơn mới = 400k - 200k = 200k
  assert.equal(booking.total, 200000);
  assert.equal(booking.subtotal, 200000);

  // 2. Bảng chia mới: Share 1 đã trả 100k giữ nguyên. 3 share còn lại chia 100k (34k, 33k, 33k)
  const sumShares = shares.reduce((sum, s) => sum + s.amount, 0);
  assert.equal(sumShares, 200000, "Tổng các phần trong bảng chia phải bằng chính xác booking.total");
  assert.equal(shares[0].amount, 100000);
  assert.equal(shares[1].amount, 33334);
  assert.equal(shares[2].amount, 33333);
  assert.equal(shares[3].amount, 33333);

  // 3. Tiến hành đồng bộ (sync): không bị văng lỗi 'Bảng chia không khớp tổng đơn'
  const groupPayload = {
    id: "grp-1",
    bookingId: booking.id,
    booking,
    shares,
    intents: [],
  };
  const mockSyncTx = {
    bookingGroup: { findUniqueOrThrow: async () => groupPayload },
    booking: { update: async ({ data }) => Object.assign(booking, data) },
    bookingItem: { updateMany: async () => ({ count: 1 }) },
    coachBooking: { updateMany: async () => ({ count: 1 }) },
  };

  // Gọi sync thành công
  await sync(mockSyncTx, "grp-1");
  assert.equal(booking.paymentStatus, "PARTIALLY_PAID");
});

test("Đơn nhóm trả đủ đồng bộ xác nhận lịch HLV và đơn hết hạn giải phóng cả sân và HLV", async () => {
  let coachBookingConfirmed = false;
  let coachBookingCancelled = false;

  const booking = { id: "b-g", total: 200000, paymentStatus: "PAID", status: "CONFIRMED", items: [] };
  const shares = [{ id: "s-1", amount: 200000, paymentId: "p-1", cashApprovedAt: null }];

  const mockTx = {
    bookingGroup: {
      findUniqueOrThrow: async () => ({
        id: "g-1",
        bookingId: "b-g",
        booking,
        shares,
        intents: [],
      }),
      update: async () => ({}),
    },
    booking: { update: async () => ({}) },
    bookingItem: { updateMany: async () => ({ count: 1 }) },
    coachBooking: {
      updateMany: async ({ data }) => {
        if (data.status === "CONFIRMED" && data.expiresAt === null) {
          coachBookingConfirmed = true;
        }
        if (data.status === "CANCELLED") {
          coachBookingCancelled = true;
        }
        return { count: 1 };
      },
    },
    payment: { findMany: async () => [] },
    groupPaymentIntent: { updateMany: async () => ({ count: 1 }) },
  };

  // 1. Trả đủ -> xác nhận HLV
  await sync(mockTx, "g-1");
  assert.equal(coachBookingConfirmed, true, "CoachBooking phải được CONFIRMED khi nhóm trả đủ");

  // 2. Nhóm hết hạn -> giải phóng HLV (CANCELLED)
  await closeGroup(mockTx, "g-1", true, "Hết hạn giữ chỗ");
  assert.equal(coachBookingCancelled, true, "CoachBooking phải được CANCELLED khi nhóm hết hạn");
});

