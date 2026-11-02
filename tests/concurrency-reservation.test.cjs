const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Tự động nạp .env.local nếu chưa có DATABASE_URL
if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.join(__dirname, "../.env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch {}
}

const Module = require("node:module");
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    request = path.join(__dirname, "../src", request.slice(2));
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

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

const { db } = require("../src/lib/db.ts");
const { HOLD_TTL_SECONDS, HOLD_DURATION_MINUTES } = require("../src/lib/config/constants.ts");
const { createReservation } = require("../src/services/reservation.service.ts");
const { createCounterBooking } = require("../src/services/venue-session.service.ts");
const { cleanupExpiredBookings } = require("../src/services/booking-cleanup.service.ts");

// Helper tạo ngày mai YYYY-MM-DD
function getTomorrowDateStr() {
  const tomorrow = new Date(Date.now() + 86400000 * 3); // 3 ngày sau tránh trùng lịch cũ
  return tomorrow.toISOString().slice(0, 10);
}

// Helper sinh các ô 30 phút liên tiếp hợp lệ
function makeSlots(courtId, startMin, endMin) {
  const result = [];
  for (let m = startMin; m < endMin; m += 30) {
    result.push({ courtId, startMin: m, endMin: m + 30 });
  }
  return result;
}

// Helper dọn dẹp đơn an toàn
async function cleanupBooking(bookingId) {
  if (!bookingId) return;
  try {
    await db.coachBooking.deleteMany({ where: { bookingItem: { bookingId } } });
    await db.bookingItem.deleteMany({ where: { bookingId } });
    if (db.bookingPriceLine) {
      await db.bookingPriceLine.deleteMany({ where: { bookingId } });
    }
    await db.payment.deleteMany({ where: { bookingId } });
    await db.booking.delete({ where: { id: bookingId } });
  } catch {}
}

test("1. Cấu hình thống nhất: HOLD_TTL_SECONDS = 300 (5 phút)", () => {
  assert.equal(HOLD_TTL_SECONDS, 300, "Thời gian giữ chỗ phải là 300 giây (5 phút)");
  assert.equal(HOLD_DURATION_MINUTES, 5, "HOLD_DURATION_MINUTES phải là 5");
});

test("2. Kiểm thử chống đặt trùng đồng thời (Concurrency) trên Database thật", async (t) => {
  const venue = await db.venue.findFirst({
    where: { status: "ACTIVE" },
    include: { courts: { where: { status: "ACTIVE" } } },
  });
  if (!venue || venue.courts.length < 2) {
    t.skip("Cơ sở không đủ 2 sân active để test concurrency");
    return;
  }

  const users = await db.user.findMany({
    where: { status: "ACTIVE" },
    take: 2,
  });
  if (users.length < 2) {
    t.skip("Không đủ 2 user active để test");
    return;
  }

  const court = venue.courts[0];
  const testDate = getTomorrowDateStr();
  const startMin = 600; // 10:00
  const endMin = 720;   // 12:00

  // Dọn dẹp trước nếu có booking test ở khung giờ này
  await db.bookingItem.deleteMany({
    where: {
      courtId: court.id,
      date: new Date(`${testDate}T00:00:00Z`),
      startMin: { lt: endMin },
      endMin: { gt: startMin },
    },
  });

  const slots = makeSlots(court.id, 600, 720);

  const req1 = {
    venueId: venue.id,
    date: testDate,
    slots,
    customerName: "Khách hàng Test A",
    customerPhone: "0912345678",
    requestId: `concur-req-a-${crypto.randomUUID()}`,
  };

  const req2 = {
    venueId: venue.id,
    date: testDate,
    slots,
    customerName: "Khách hàng Test B",
    customerPhone: "0987654321",
    requestId: `concur-req-b-${crypto.randomUUID()}`,
  };

  // Hai request độc lập gửi đồng thời
  const [res1, res2] = await Promise.allSettled([
    createReservation(db, users[0].id, req1),
    createReservation(db, users[1].id, req2),
  ]);

  const successes = [res1, res2].filter((r) => r.status === "fulfilled");
  const rejections = [res1, res2].filter((r) => r.status === "rejected");

  assert.equal(successes.length, 1, "Chính xác 1 request thành công khi đặt cùng lúc");
  assert.equal(rejections.length, 1, "Chính xác 1 request thất bại khi đặt cùng lúc");

  const rejectedError = rejections[0].reason;
  assert.equal(rejectedError.status, 409, "Yêu cầu bị từ chối phải trả mã lỗi HTTP 409");
  assert.match(
    rejectedError.message,
    /Khung giờ vừa được đặt hoặc đã khóa/i,
    "Thông báo lỗi phải rõ ràng bằng tiếng Việt"
  );

  // Kiểm tra tính nhất quán trong database
  const createdBooking = successes[0].value;
  assert.equal(createdBooking.status, "PENDING_PAYMENT");
  assert.equal(createdBooking.items.length, 4);
  assert.equal(createdBooking.items[0].status, "HELD");

  // Kiểm tra thời hạn expiresAt = tối đa 5 phút
  const expectedMaxExpiry = Date.now() + 301 * 1000;
  assert.ok(
    new Date(createdBooking.expiresAt).getTime() <= expectedMaxExpiry,
    "Thời hạn expiresAt không vượt quá 5 phút"
  );

  // Dọn dẹp booking test
  await cleanupBooking(createdBooking.id);
});

test("3. Tính Idempotency của requestId: gửi lại cùng request không tạo trùng và không gia hạn", async () => {
  const venue = await db.venue.findFirst({
    where: { status: "ACTIVE" },
    include: { courts: { where: { status: "ACTIVE" } } },
  });
  const user = await db.user.findFirst({ where: { status: "ACTIVE" } });
  if (!venue || !user || !venue.courts.length) return;

  const court = venue.courts[0];
  const testDate = getTomorrowDateStr();
  const requestId = `idempotent-test-${crypto.randomUUID()}`;

  const req = {
    venueId: venue.id,
    date: testDate,
    slots: makeSlots(court.id, 480, 540),
    customerName: "Khách Idempotent",
    customerPhone: "0912345678",
    requestId,
  };

  const booking1 = await createReservation(db, user.id, req);
  const booking2 = await createReservation(db, user.id, req);

  assert.equal(booking1.id, booking2.id, "Cùng requestId phải trả về cùng mã đơn đã tạo");
  assert.equal(
    new Date(booking1.expiresAt).getTime(),
    new Date(booking2.expiresAt).getTime(),
    "Gửi lại request không được gia hạn expiresAt"
  );

  await cleanupBooking(booking1.id);
});

test("4. Hai khoảng thời gian liền kề trên cùng sân không xung đột [10:00-12:00 vs 12:00-13:00]", async () => {
  const venue = await db.venue.findFirst({
    where: { status: "ACTIVE" },
    include: { courts: { where: { status: "ACTIVE" } } },
  });
  const users = await db.user.findMany({ where: { status: "ACTIVE" }, take: 2 });
  if (!venue || users.length < 2 || !venue.courts.length) return;

  const court = venue.courts[0];
  const testDate = getTomorrowDateStr();

  // Khoảng 1: 10:00 - 12:00 (600 - 720)
  const req1 = {
    venueId: venue.id,
    date: testDate,
    slots: makeSlots(court.id, 600, 720),
    customerName: "Khách Liền Kề 1",
    customerPhone: "0912345678",
    requestId: `adjacent-1-${crypto.randomUUID()}`,
  };

  // Khoảng 2: 12:00 - 13:00 (720 - 780)
  const req2 = {
    venueId: venue.id,
    date: testDate,
    slots: makeSlots(court.id, 720, 780),
    customerName: "Khách Liền Kề 2",
    customerPhone: "0987654321",
    requestId: `adjacent-2-${crypto.randomUUID()}`,
  };

  const b1 = await createReservation(db, users[0].id, req1);
  const b2 = await createReservation(db, users[1].id, req2);

  assert.ok(b1 && b1.id, "Đơn 10:00-12:00 thành công");
  assert.ok(b2 && b2.id, "Đơn 12:00-13:00 thành công mà không xung đột");

  await cleanupBooking(b1.id);
  await cleanupBooking(b2.id);
});

test("5. Khác sân đấu cùng khung giờ không xung đột", async () => {
  const venue = await db.venue.findFirst({
    where: { status: "ACTIVE" },
    include: { courts: { where: { status: "ACTIVE" } } },
  });
  const users = await db.user.findMany({ where: { status: "ACTIVE" }, take: 2 });
  if (!venue || users.length < 2 || venue.courts.length < 2) return;

  const court1 = venue.courts[0];
  const court2 = venue.courts[1];
  const testDate = getTomorrowDateStr();

  const req1 = {
    venueId: venue.id,
    date: testDate,
    slots: makeSlots(court1.id, 780, 840),
    customerName: "Khách Sân 1",
    customerPhone: "0912345678",
    requestId: `diffcourt-1-${crypto.randomUUID()}`,
  };

  const req2 = {
    venueId: venue.id,
    date: testDate,
    slots: makeSlots(court2.id, 780, 840),
    customerName: "Khách Sân 2",
    customerPhone: "0987654321",
    requestId: `diffcourt-2-${crypto.randomUUID()}`,
  };

  const b1 = await createReservation(db, users[0].id, req1);
  const b2 = await createReservation(db, users[1].id, req2);

  assert.ok(b1 && b2, "Hai đơn đặt khác sân cùng khung giờ đều thành công");

  await cleanupBooking(b1.id);
  await cleanupBooking(b2.id);
});

test("6. Đơn Online đang giữ chỗ chặn đặt tại quầy và ngược lại", async () => {
  const venue = await db.venue.findFirst({
    where: { status: "ACTIVE" },
    include: { courts: { where: { status: "ACTIVE" } } },
  });
  const user = await db.user.findFirst({ where: { status: "ACTIVE" } });
  const staffUser = await db.user.findFirst({ where: { role: { in: ["ADMIN", "STAFF", "OWNER"] } } });
  if (!venue || !user || !staffUser || !venue.courts.length) return;

  const court = venue.courts[0];
  const testDate = getTomorrowDateStr();

  // Tạo đơn online 14:00 - 15:00 (840 - 900)
  const onlineBooking = await createReservation(db, user.id, {
    venueId: venue.id,
    date: testDate,
    slots: makeSlots(court.id, 840, 900),
    customerName: "Khách Online",
    customerPhone: "0912345678",
    requestId: `cross-online-${crypto.randomUUID()}`,
  });

  // Nhân viên tại quầy cố gắng đặt trùng khung giờ này -> phải bị 409
  await assert.rejects(
    async () => {
      await createCounterBooking(
        db,
        { id: staffUser.id, role: staffUser.role, status: staffUser.status, name: staffUser.name },
        {
          venueId: venue.id,
          courtId: court.id,
          date: testDate,
          startMin: 840,
          endMin: 900,
          customerName: "Khách Vãng Lai",
          customerPhone: "0900000000",
          paymentMethod: "CASH",
        }
      );
    },
    (err) => {
      assert.equal(err.status, 409, "Đặt tại quầy phải bị chặn 409 khi có đơn online đang giữ chỗ");
      return true;
    }
  );

  await cleanupBooking(onlineBooking.id);
});

test("7. Cơ chế dọn dẹp đơn hết hạn và người khác đặt lại được ngay", async () => {
  const venue = await db.venue.findFirst({
    where: { status: "ACTIVE" },
    include: { courts: { where: { status: "ACTIVE" } } },
  });
  const users = await db.user.findMany({ where: { status: "ACTIVE" }, take: 2 });
  if (!venue || users.length < 2 || !venue.courts.length) return;

  const court = venue.courts[0];
  const testDate = getTomorrowDateStr();

  // Tạo đơn online 15:00 - 16:00 (900 - 960) và ép expiresAt thành quá khứ
  const oldBooking = await createReservation(db, users[0].id, {
    venueId: venue.id,
    date: testDate,
    slots: makeSlots(court.id, 900, 960),
    customerName: "Khách Hết Hạn",
    customerPhone: "0912345678",
    requestId: `expired-test-${crypto.randomUUID()}`,
  });

  const pastDate = new Date(Date.now() - 60000); // 1 phút trước
  await db.booking.update({
    where: { id: oldBooking.id },
    data: { expiresAt: pastDate },
  });

  // User 2 đặt lại đúng khung giờ này -> PHẢI THÀNH CÔNG ngay cả khi cron chưa dọn
  const newBooking = await createReservation(db, users[1].id, {
    venueId: venue.id,
    date: testDate,
    slots: makeSlots(court.id, 900, 960),
    customerName: "Khách Mới Đặt Lại",
    customerPhone: "0987654321",
    requestId: `new-after-expired-${crypto.randomUUID()}`,
  });

  assert.ok(newBooking && newBooking.id, "Người mới phải đặt được ngay khi đơn cũ đã hết hạn");

  // Chạy tác vụ dọn dẹp đơn hết hạn
  const cleanupResult = await cleanupExpiredBookings(db);
  assert.ok(cleanupResult.expiredBookingsCount >= 1, "Tác vụ dọn dẹp phải cập nhật đơn hết hạn sang EXPIRED");

  const verifiedOld = await db.booking.findUnique({ where: { id: oldBooking.id } });
  assert.equal(verifiedOld.status, "EXPIRED", "Đơn hết hạn phải có status = EXPIRED");

  await cleanupBooking(oldBooking.id);
  await cleanupBooking(newBooking.id);
});

test("8. Đơn CONFIRMED tại quầy (expiresAt: null) không bao giờ bị coi là hết hạn", async () => {
  const venue = await db.venue.findFirst({
    where: { status: "ACTIVE" },
    include: { courts: { where: { status: "ACTIVE" } } },
  });
  const staffUser = await db.user.findFirst({ where: { role: { in: ["ADMIN", "STAFF", "OWNER"] } } });
  if (!venue || !staffUser || !venue.courts.length) return;

  const court = venue.courts[0];
  const testDate = getTomorrowDateStr();

  // Tạo đơn tại quầy 16:00 - 17:00 (960 - 1020)
  const counterResult = await createCounterBooking(
    db,
    { id: staffUser.id, role: staffUser.role, status: staffUser.status, name: staffUser.name },
    {
      venueId: venue.id,
      courtId: court.id,
      date: testDate,
      startMin: 960,
      endMin: 1020,
      customerName: "Khách Tiền Mặt Tại Quầy",
      customerPhone: "0900112233",
      paymentMethod: "CASH",
    }
  );

  const counterBooking = counterResult.booking;
  assert.equal(counterBooking.status, "CONFIRMED");
  assert.equal(counterBooking.expiresAt, null);

  // Chạy cleanupExpiredBookings -> đơn tại quầy không được bị đổi status
  await cleanupExpiredBookings(db);

  const verifiedCounter = await db.booking.findUnique({ where: { id: counterBooking.id } });
  assert.equal(verifiedCounter.status, "CONFIRMED", "Đơn tại quầy không bao giờ bị dọn thành EXPIRED");

  await cleanupBooking(counterBooking.id);
});

test("9. API booking-catalog: phân biệt HELD / BOOKED / BLOCKED, serverTime và tuyệt đối không rò rỉ thông tin cá nhân", async () => {
  const { GET } = require("../src/app/api/booking-catalog/route.ts");

  const venue = await db.venue.findFirst({
    where: { status: "ACTIVE" },
    include: { courts: { where: { status: "ACTIVE" } } },
  });
  const user = await db.user.findFirst({ where: { status: "ACTIVE" } });
  if (!venue || !user || !venue.courts.length) return;

  const court = venue.courts[0];
  const testDate = getTomorrowDateStr();

  // 1. Tạo 1 đơn online HELD
  const heldBooking = await createReservation(db, user.id, {
    venueId: venue.id,
    date: testDate,
    slots: makeSlots(court.id, 600, 660),
    customerName: "Khách VIP Nhạy Cảm",
    customerPhone: "0912999888",
    requestId: `held-privacy-${crypto.randomUUID()}`,
  });

  // 2. Tạo 1 block BLOCKED
  const block = await db.courtBlock.create({
    data: {
      courtId: court.id,
      date: new Date(`${testDate}T00:00:00Z`),
      startMin: 660,
      endMin: 720,
      reason: "Bảo trì lưới",
      createdById: user.id,
    },
  });

  // Gọi trực tiếp route handler GET
  const req = new Request(`http://localhost:3000/api/booking-catalog?venueId=${venue.id}&date=${testDate}`);
  const res = await GET(req);
  assert.equal(res.status, 200);

  const json = await res.json();

  // Kiểm tra serverTime
  assert.ok(json.serverTime, "API phải trả về serverTime");
  assert.ok(!isNaN(new Date(json.serverTime).getTime()), "serverTime phải là ISO date hợp lệ");

  // Kiểm tra busy và busySlots
  assert.ok(Array.isArray(json.busy), "busy phải là mảng");
  assert.ok(Array.isArray(json.busySlots), "busySlots phải là mảng");

  const heldSlot = json.busySlots.find((s) => s.courtId === court.id && s.startMin === 600);
  assert.ok(heldSlot, "Phải tìm thấy ô HELD trong busySlots");
  assert.equal(heldSlot.status, "HELD", "Trạng thái ô phải là HELD");
  assert.ok(heldSlot.expiresAt, "Ô HELD phải có expiresAt");
  assert.ok(new Date(heldSlot.expiresAt).getTime() > Date.now(), "expiresAt của ô HELD phải nằm ở tương lai");

  const blockedSlot = json.busySlots.find((s) => s.courtId === court.id && s.startMin === 660);
  assert.ok(blockedSlot, "Phải tìm thấy ô BLOCKED trong busySlots");
  assert.equal(blockedSlot.status, "BLOCKED", "Trạng thái ô phải là BLOCKED");
  assert.equal(blockedSlot.expiresAt, null, "Ô BLOCKED không có expiresAt");

  // Kiểm tra BẢO MẬT: Chuỗi JSON trả về không được chứa thông tin người đặt
  const rawString = JSON.stringify(json);
  assert.ok(!rawString.includes("Khách VIP Nhạy Cảm"), "Tuyệt đối không rò rỉ tên người giữ chỗ");
  assert.ok(!rawString.includes("0912999888"), "Tuyệt đối không rò rỉ số điện thoại người giữ chỗ");
  assert.ok(!rawString.includes(heldBooking.code), "Tuyệt đối không rò rỉ mã đơn booking code");
  assert.ok(!rawString.includes(user.id), "Tuyệt đối không rò rỉ userId của người giữ chỗ");

  // Dọn dẹp
  await cleanupBooking(heldBooking.id);
  await db.courtBlock.delete({ where: { id: block.id } });
});

