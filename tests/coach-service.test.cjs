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
    startsAt: new Date(Date.now() + 86400000).toISOString(),
    endsAt: new Date(Date.now() + 93600000).toISOString(),
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
  const db = fixture({ total: 300000, fee: 150000, amounts: [300000] });
  await cancelCoachBookingByCoach(db, "coach-user", "cb", "Bận việc đột xuất");
  const second = await cancelCoachBookingByCoach(db, "coach-user", "cb", "Bận việc đột xuất");
  assert.equal(second.alreadyCancelled, true);
  assert.equal(db.state.refunds.length, 1);
  assert.equal(db.state.refunds[0].amount, 150000);
  assert.equal(db.state.payments.length, 1);
  assert.equal(db.state.booking.paymentStatus, 'PAID');
});

test("HLV hủy đơn nhóm đã trả một phần: bảo toàn tính nhất quán giữa booking.total, GroupShare và tiền thực trả", async () => {
  const db = fixture({ total: 400000, fee: 200000, status: 'PENDING_PAYMENT', paymentStatus: 'PARTIALLY_PAID', amounts: Array(1).fill(100000), shares: Array.from({ length: 4 }, (_, i) => ({ amount: 100000, paymentId: i < 1 ? 'p' + i : null })) });
  await cancelCoachBookingByCoach(db, "coach-user", "cb", "Bận việc đột xuất");
  assert.equal(db.state.booking.total, 200000);
  assert.deepEqual(db.state.shares.map((s) => s.amount), [100000, 33334, 33333, 33333]);
  await db.$transaction((tx) => sync(tx, 'g'), { isolationLevel: 'Serializable' });
  assert.equal(db.state.booking.paymentStatus, 'PARTIALLY_PAID');
});

test("Đơn nhóm trả đủ đồng bộ xác nhận lịch HLV và đơn hết hạn giải phóng cả sân và HLV", async () => {
  const paid = fixture({ total: 200000, amounts: [200000], shares: [{ amount: 200000, paymentId: 'p0' }] });
  paid.state.coaches[0].status = 'HELD';
  await paid.$transaction((tx) => sync(tx, 'g'), { isolationLevel: 'Serializable' });
  assert.equal(paid.state.coaches[0].status, 'CONFIRMED');
  const unpaid = fixture({ amounts: [], status: 'PENDING_PAYMENT', paymentStatus: 'PENDING', shares: [{ amount: 400000, paymentId: null }] });
  await unpaid.$transaction((tx) => closeGroup(tx, 'g', true, 'Hết hạn giữ chỗ'), { isolationLevel: 'Serializable' });
  assert.equal(unpaid.state.coaches[0].status, 'CANCELLED');
  assert.equal(unpaid.state.items[0].status, 'EXPIRED');
});

