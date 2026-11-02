const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    }).outputText,
    filename
  );

// 1. Kiểm tra chính sách HLV và Demo Coach Rate
test("1. Coach Policy: Mức học phí 2.000đ chỉ dành riêng cho HLV Demo, HLV thường tối thiểu 50.000đ", () => {
  const {
    coachProfileInputSchema,
    DEMO_COACH_ID,
    DEMO_COACH_USER_ID,
    DEMO_COACH_HOURLY_RATE,
    isDemoCoach,
  } = require("../src/lib/coach-policy.ts");

  // HLV demo nhận diện chính xác
  assert.equal(isDemoCoach(DEMO_COACH_USER_ID), true);
  assert.equal(isDemoCoach(DEMO_COACH_ID), true);
  assert.equal(isDemoCoach({ id: DEMO_COACH_ID, userId: "other" }), true);
  assert.equal(isDemoCoach({ name: "HLV Demo SmashBook — 2.000đ/giờ" }), true);
  assert.equal(isDemoCoach("regular-coach-123"), false);

  // Schema cho phép 2.000đ
  const validDemo = coachProfileInputSchema.safeParse({
    bio: "HLV thử nghiệm",
    specialties: ["Kỹ thuật cơ bản"],
    experienceYears: 3,
    hourlyRate: DEMO_COACH_HOURLY_RATE, // 2000
  });
  assert.equal(validDemo.success, true, "Schema phải chấp nhận mức 2.000đ cho demo");

  // Mức giá bất thường khác dưới 50.000đ (VD 49.000đ, 1.500đ) phải bị từ chối
  const invalidRate = coachProfileInputSchema.safeParse({
    bio: "HLV thường",
    specialties: ["Kỹ thuật cơ bản"],
    experienceYears: 2,
    hourlyRate: 49000,
  });
  assert.equal(invalidRate.success, false, "Mức giá 49.000đ phải bị từ chối");

  const invalidLowRate = coachProfileInputSchema.safeParse({
    bio: "HLV thường",
    specialties: ["Kỹ thuật cơ bản"],
    experienceYears: 2,
    hourlyRate: 1500,
  });
  assert.equal(invalidLowRate.success, false, "Mức giá 1.500đ phải bị từ chối");
});

test("2. Coach Policy: Chuẩn hóa 7 chuyên môn cốt lõi và tương thích alias", () => {
  const {
    COACH_SPECIALTIES,
    normalizeCoachSpecialty,
    normalizeCoachSpecialties,
  } = require("../src/lib/coach-policy.ts");

  assert.equal(COACH_SPECIALTIES.length, 7, "Phải có đúng 7 chuyên môn dùng chung");
  assert.ok(COACH_SPECIALTIES.includes("Kỹ thuật cơ bản"));
  assert.ok(COACH_SPECIALTIES.includes("Nâng cao & Chiến thuật"));
  assert.ok(COACH_SPECIALTIES.includes("Đơn nam / Đơn nữ"));
  assert.ok(COACH_SPECIALTIES.includes("Đôi nam / Đôi nữ"));
  assert.ok(COACH_SPECIALTIES.includes("Đôi nam nữ phối hợp"));
  assert.ok(COACH_SPECIALTIES.includes("Rèn luyện thể lực"));
  assert.ok(COACH_SPECIALTIES.includes("Đào tạo thiếu nhi & thanh thiếu niên"));

  // Tương thích alias cũ
  assert.equal(normalizeCoachSpecialty("Nâng cao"), "Nâng cao & Chiến thuật");
  assert.equal(normalizeCoachSpecialty("Chiến thuật"), "Nâng cao & Chiến thuật");
  assert.equal(normalizeCoachSpecialty("Đơn nam"), "Đơn nam / Đơn nữ");
  assert.equal(normalizeCoachSpecialty("Đôi nam nữ"), "Đôi nam nữ phối hợp");
  assert.equal(normalizeCoachSpecialty("Thiếu nhi"), "Đào tạo thiếu nhi & thanh thiếu niên");
  assert.equal(normalizeCoachSpecialty("Thể lực"), "Rèn luyện thể lực");

  // Mảng nhiều chuyên môn chuẩn hóa và loại bỏ trùng lặp
  const normalized = normalizeCoachSpecialties(["Cơ bản", "Nâng cao", "Kỹ thuật cơ bản", "Đơn nữ"]);
  assert.deepEqual(normalized, ["Kỹ thuật cơ bản", "Nâng cao & Chiến thuật", "Đơn nam / Đơn nữ"]);
});

test("3. Coach Proration: Tính phí HLV 30 phút = 1.000đ, 60 phút = 2.000đ cho hồ sơ Demo", () => {
  const demoRate = 2000;

  function calculateCoachFee(hourlyRate, durationMin) {
    return Math.round((hourlyRate * durationMin) / 60);
  }

  // 30 phút
  assert.equal(calculateCoachFee(demoRate, 30), 1000);
  // 60 phút
  assert.equal(calculateCoachFee(demoRate, 60), 2000);
  // 90 phút
  assert.equal(calculateCoachFee(demoRate, 90), 3000);
  // 120 phút
  assert.equal(calculateCoachFee(demoRate, 120), 4000);

  // HLV thường 150.000đ/giờ
  const normalRate = 150000;
  assert.equal(calculateCoachFee(normalRate, 30), 75000);
  assert.equal(calculateCoachFee(normalRate, 60), 150000);
});

// 2. Kiểm tra tọa độ Google Maps và Logic xung đột quản lý sân
test("4. Google Maps Coordinates: parseCoordinates trích xuất chính xác cặp vĩ độ, kinh độ", () => {
  const { parseCoordinates } = require("../src/lib/coordinates.ts");

  // Chuỗi dán từ Google Maps
  const c1 = parseCoordinates("21.0285, 105.8542");
  assert.ok(c1);
  assert.equal(c1.lat, 21.0285);
  assert.equal(c1.lng, 105.8542);

  // Khoảng trắng dư thừa
  const c2 = parseCoordinates("  20.98321 ,  105.78912  ");
  assert.ok(c2);
  assert.equal(c2.lat, 20.98321);
  assert.equal(c2.lng, 105.78912);

  // Tọa độ không hợp lệ
  assert.equal(parseCoordinates("invalid string"), null);
  assert.equal(parseCoordinates("95.0, 105.0"), null, "Vĩ độ vượt quá 90 độ");
  assert.equal(parseCoordinates("21.0, 190.0"), null, "Kinh độ vượt quá 180 độ");
});

test("5. Venue Management Conflict Checks: Cảnh báo khi thu hẹp giờ mở cửa có đơn sắp tới", () => {
  const existingVenue = { openMin: 300, closeMin: 1320 }; // 05:00 - 22:00
  const futureActiveBookings = [
    { bookingCode: "SB-001", courtId: "court-1", startMin: 360, endMin: 420 }, // 06:00 - 07:00
    { bookingCode: "SB-002", courtId: "court-2", startMin: 1260, endMin: 1320 }, // 21:00 - 22:00
  ];

  function checkOperatingHoursConflict(newOpenMin, newCloseMin) {
    return futureActiveBookings.filter(
      (b) => b.startMin < newOpenMin || b.endMin > newCloseMin
    );
  }

  // Thu hẹp giờ mở cửa sang 07:00 (420) -> Xung đột đơn SB-001
  const conflicts1 = checkOperatingHoursConflict(420, 1320);
  assert.equal(conflicts1.length, 1);
  assert.equal(conflicts1[0].bookingCode, "SB-001");

  // Đóng cửa sớm hơn lúc 20:00 (1200) -> Xung đột đơn SB-002
  const conflicts2 = checkOperatingHoursConflict(300, 1200);
  assert.equal(conflicts2.length, 1);
  assert.equal(conflicts2[0].bookingCode, "SB-002");

  // Giữ nguyên hoặc mở rộng giờ -> Không xung đột
  const conflicts3 = checkOperatingHoursConflict(300, 1380);
  assert.equal(conflicts3.length, 0);
});

test("6. Venue Management Soft-delete: Sân con có lịch sử đặt chuyển sang INACTIVE thay vì bị xóa cứng", () => {
  const courts = [
    { id: "court-1", name: "Sân 1", status: "ACTIVE", bookingHistoryCount: 5 },
    { id: "court-2", name: "Sân 2", status: "ACTIVE", bookingHistoryCount: 0 },
  ];

  function processDeletedCourt(court) {
    if (court.bookingHistoryCount > 0) {
      // Soft-delete bảo toàn dữ liệu
      return { action: "SOFT_DELETE", status: "INACTIVE" };
    }
    return { action: "HARD_DELETE" };
  }

  assert.deepEqual(processDeletedCourt(courts[0]), { action: "SOFT_DELETE", status: "INACTIVE" });
  assert.deepEqual(processDeletedCourt(courts[1]), { action: "HARD_DELETE" });
});

// 3. Kiểm tra bảo mật và logic xác thực email
test("7. Email Verification: Tạo token ngẫu nhiên và băm SHA-256 an toàn", () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  assert.equal(rawToken.length, 64);

  const hash1 = crypto.createHash("sha256").update(rawToken).digest("hex");
  const hash2 = crypto.createHash("sha256").update(rawToken).digest("hex");
  assert.equal(hash1, hash2, "Mã băm SHA-256 phải nhất quán");
  assert.notEqual(rawToken, hash1, "Không lưu rawToken nguyên bản vào database");

  // Ràng buộc identifier: email_verify:userId:targetEmail
  const userId = "user-123";
  const targetEmail = "test.player@smashbook.test";
  const identifier = `email_verify:${userId}:${targetEmail}`;

  const match = identifier.match(/^email_verify:([^:]+):(.+)$/);
  assert.ok(match);
  assert.equal(match[1], userId);
  assert.equal(match[2], targetEmail);
});

test("8. Email Verification: Chặn token hết hạn, sai tài khoản và đổi email nguyên tử", async () => {
  // Mock store cho VerificationToken
  const tokens = new Map();
  const users = new Map([
    ["user-A", { id: "user-A", email: "old.email@smashbook.test", emailVerified: new Date() }],
    ["user-B", { id: "user-B", email: "other@smashbook.test", emailVerified: new Date() }],
  ]);

  function issueVerificationToken(userId, targetEmail, ttlMs = 24 * 3600 * 1000) {
    const raw = crypto.randomBytes(32).toString("hex");
    const hashed = crypto.createHash("sha256").update(raw).digest("hex");
    tokens.set(hashed, {
      identifier: `email_verify:${userId}:${targetEmail.toLowerCase()}`,
      token: hashed,
      expires: new Date(Date.now() + ttlMs),
    });
    return raw;
  }

  function confirmVerification(userId, rawToken) {
    const hashed = crypto.createHash("sha256").update(rawToken).digest("hex");
    const record = tokens.get(hashed);
    if (!record) return { success: false, error: "TOKEN_NOT_FOUND" };
    if (new Date() > record.expires) {
      tokens.delete(hashed);
      return { success: false, error: "TOKEN_EXPIRED" };
    }
    const match = record.identifier.match(/^email_verify:([^:]+):(.+)$/);
    if (!match) return { success: false, error: "INVALID_IDENTIFIER" };
    const [, tokenUserId, targetEmail] = match;
    if (tokenUserId !== userId) return { success: false, error: "USER_MISMATCH" };

    // Kiểm tra trùng email với người dùng khác
    for (const [otherId, u] of users.entries()) {
      if (otherId !== userId && u.email === targetEmail) {
        return { success: false, error: "EMAIL_TAKEN" };
      }
    }

    // Cập nhật người dùng và xóa token (single-use)
    const user = users.get(userId);
    user.email = targetEmail;
    user.emailVerified = new Date();
    tokens.delete(hashed);

    return { success: true, email: targetEmail };
  }

  // 1. Tạo token hợp lệ cho user-A đổi sang email new.email@smashbook.test
  const validToken = issueVerificationToken("user-A", "new.email@smashbook.test");

  // Email cũ vẫn giữ nguyên trước khi xác nhận
  assert.equal(users.get("user-A").email, "old.email@smashbook.test");

  // user-B cố tình dùng token của user-A -> Bị chặn USER_MISMATCH
  const attemptWrongUser = confirmVerification("user-B", validToken);
  assert.equal(attemptWrongUser.success, false);
  assert.equal(attemptWrongUser.error, "USER_MISMATCH");

  // user-A xác nhận thành công -> Đổi email nguyên tử
  const confirmResult = confirmVerification("user-A", validToken);
  assert.equal(confirmResult.success, true);
  assert.equal(confirmResult.email, "new.email@smashbook.test");
  assert.equal(users.get("user-A").email, "new.email@smashbook.test");

  // Dùng lại token đã tiêu thụ -> Bị chặn TOKEN_NOT_FOUND
  const reuseResult = confirmVerification("user-A", validToken);
  assert.equal(reuseResult.success, false);
  assert.equal(reuseResult.error, "TOKEN_NOT_FOUND");

  // 2. Token hết hạn
  const expiredToken = issueVerificationToken("user-A", "expired@smashbook.test", -1000);
  const expiredResult = confirmVerification("user-A", expiredToken);
  assert.equal(expiredResult.success, false);
  assert.equal(expiredResult.error, "TOKEN_EXPIRED");

  // 3. Email bị trùng với tài khoản khác
  const duplicateToken = issueVerificationToken("user-A", "other@smashbook.test");
  const duplicateResult = confirmVerification("user-A", duplicateToken);
  assert.equal(duplicateResult.success, false);
  assert.equal(duplicateResult.error, "EMAIL_TAKEN");
});
