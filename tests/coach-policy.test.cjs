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
  coachProfileInputSchema,
  coachAvailabilityInputSchema,
  coachStatusUpdateSchema,
  assertCoachActive,
  assertCoachOwner,
  assertNoOverlappingIntervals,
  MIN_HOURLY_RATE,
  MAX_HOURLY_RATE,
} = require("../src/lib/coach-policy.ts");

test("coachProfileInputSchema accepts valid profiles and validates bounds", () => {
  const valid = {
    bio: "HLV 5 năm kinh nghiệm đào tạo phong trào và bán chuyên",
    specialties: ["Cơ bản", "Đôi nam nữ"],
    experienceYears: 5,
    hourlyRate: 250000,
  };
  const parsed = coachProfileInputSchema.safeParse(valid);
  assert.equal(parsed.success, true);

  // Rate too low
  assert.equal(
    coachProfileInputSchema.safeParse({ ...valid, hourlyRate: MIN_HOURLY_RATE - 1000 }).success,
    false
  );
  // Rate too high
  assert.equal(
    coachProfileInputSchema.safeParse({ ...valid, hourlyRate: MAX_HOURLY_RATE + 1000 }).success,
    false
  );
  // Empty specialties
  assert.equal(
    coachProfileInputSchema.safeParse({ ...valid, specialties: [] }).success,
    false
  );
  // Negative experience
  assert.equal(
    coachProfileInputSchema.safeParse({ ...valid, experienceYears: -1 }).success,
    false
  );
});

test("coachAvailabilityInputSchema validates slot durations between 30m and 480m", () => {
  const validSlot = {
    venueId: "venue-1",
    startsAt: "2026-10-20T18:00:00.000Z",
    endsAt: "2026-10-20T20:00:00.000Z", // 2 hours
  };
  assert.equal(coachAvailabilityInputSchema.safeParse(validSlot).success, true);

  // Too short: 15 mins
  const tooShort = {
    venueId: "venue-1",
    startsAt: "2026-10-20T18:00:00.000Z",
    endsAt: "2026-10-20T18:15:00.000Z",
  };
  assert.equal(coachAvailabilityInputSchema.safeParse(tooShort).success, false);

  // Too long: 9 hours (540 mins)
  const tooLong = {
    venueId: "venue-1",
    startsAt: "2026-10-20T08:00:00.000Z",
    endsAt: "2026-10-20T17:00:00.000Z",
  };
  assert.equal(coachAvailabilityInputSchema.safeParse(tooLong).success, false);

  // Inverted times
  const inverted = {
    venueId: "venue-1",
    startsAt: "2026-10-20T20:00:00.000Z",
    endsAt: "2026-10-20T18:00:00.000Z",
  };
  assert.equal(coachAvailabilityInputSchema.safeParse(inverted).success, false);
});

test("coachStatusUpdateSchema requires audit reason with minimum 5 characters", () => {
  assert.equal(
    coachStatusUpdateSchema.safeParse({
      coachId: "coach-1",
      status: "ACTIVE",
      reason: "Đã xác minh đầy đủ chứng chỉ cầu lông cấp quốc gia",
    }).success,
    true
  );

  assert.equal(
    coachStatusUpdateSchema.safeParse({
      coachId: "coach-1",
      status: "ACTIVE",
      reason: "ok", // Too short
    }).success,
    false
  );

  assert.equal(
    coachStatusUpdateSchema.safeParse({
      coachId: "coach-1",
      status: "INVALID_STATUS",
      reason: "Hop le",
    }).success,
    false
  );
});

test("assertCoachActive and assertCoachOwner enforce access boundaries", () => {
  assert.doesNotThrow(() => assertCoachActive({ status: "ACTIVE" }));
  assert.throws(() => assertCoachActive({ status: "PENDING" }), (e) => e.status === 403);
  assert.throws(() => assertCoachActive({ status: "SUSPENDED" }), (e) => e.status === 403);
  assert.throws(() => assertCoachActive(null), (e) => e.status === 403);

  assert.doesNotThrow(() => assertCoachOwner({ userId: "user-123" }, "user-123"));
  assert.throws(() => assertCoachOwner({ userId: "user-123" }, "user-999"), (e) => e.status === 403);
  assert.throws(() => assertCoachOwner(null, "user-123"), (e) => e.status === 403);
});

test("assertNoOverlappingIntervals permits back-to-back slots but rejects overlaps", () => {
  // Back-to-back: [18:00, 19:00) and [19:00, 20:00) -> Allowed!
  const backToBack = [
    { startsAt: "2026-10-20T18:00:00.000Z", endsAt: "2026-10-20T19:00:00.000Z" },
    { startsAt: "2026-10-20T19:00:00.000Z", endsAt: "2026-10-20T20:00:00.000Z" },
  ];
  assert.doesNotThrow(() => assertNoOverlappingIntervals(backToBack));

  // Overlapping by 15 mins: [18:00, 19:30) and [19:15, 20:15) -> Rejected!
  const overlapping = [
    { startsAt: "2026-10-20T18:00:00.000Z", endsAt: "2026-10-20T19:30:00.000Z" },
    { startsAt: "2026-10-20T19:15:00.000Z", endsAt: "2026-10-20T20:15:00.000Z" },
  ];
  assert.throws(() => assertNoOverlappingIntervals(overlapping), (e) => e.status === 409);
});
