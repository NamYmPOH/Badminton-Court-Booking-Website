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
} = require("../src/services/coach.service.ts");
const { performAdminAction } = require("../src/services/admin.service.ts");

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
    startsAt: "2026-10-25T18:00:00.000Z",
    endsAt: "2026-10-25T20:00:00.000Z",
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
