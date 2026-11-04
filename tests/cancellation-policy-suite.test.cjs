const assert = require("node:assert/strict");
const { test } = require("node:test");
const { fixture, actors } = require("./helpers/refund-db.cjs");
const {
  determineRefundRate,
  evaluateCancellationPolicy,
  checkRescheduleEligibility,
} = require("../src/lib/cancellation-policy.ts");
const {
  requestBookingCancellation,
  approveBookingCancellation,
  recordManualRefund,
} = require("../src/services/venue-session.service.ts");
const { cancelCoachBookingByCoach } = require("../src/services/coach.service.ts");
const { transferBooking } = require("../src/services/transfer.service.ts");
const { reportBookingIncident, confirmBookingIncident } = require("../src/services/incident.service.ts");
const { rescheduleBooking } = require("../src/services/reschedule.service.ts");

// ───────────── 1. Kiểm thử ranh giới thời gian ─────────────

test("Ranh giới thời gian hủy lịch: đúng 24h được 100%, đúng 6h được 50%, dưới 6h được 0%", () => {
  // >= 24 giờ: 100%
  assert.equal(determineRefundRate(30.0, false), 100);
  assert.equal(determineRefundRate(24.0, false), 100); // Đúng 24 giờ
  assert.equal(determineRefundRate(24.001, false), 100);

  // Sát dưới 24 giờ: 50%
  assert.equal(determineRefundRate(23.999, false), 50);
  assert.equal(determineRefundRate(23.5, false), 50);
  assert.equal(determineRefundRate(12.0, false), 50);

  // Đúng 6 giờ: 50%
  assert.equal(determineRefundRate(6.0, false), 50); // Đúng 6 giờ
  assert.equal(determineRefundRate(6.001, false), 50);

  // Sát dưới 6 giờ: 0%
  assert.equal(determineRefundRate(5.999, false), 0);
  assert.equal(determineRefundRate(3.0, false), 0);
  assert.equal(determineRefundRate(0.5, false), 0);

  // Đã đến hoặc qua giờ bắt đầu chơi / no-show: 0%
  assert.equal(determineRefundRate(0, false), 0);
  assert.equal(determineRefundRate(-1.0, false), 0);
  assert.equal(determineRefundRate(25.0, true), 0); // isPastOrStarted = true
});

// ───────────── 2. Tính số tiền hoàn chính xác ─────────────

test("Ví dụ đơn chỉ có tiền sân, thực thu 200.000đ: hủy trước 30h (200k), trước 12h (100k), trước 3h (0k)", () => {
  const items = [{ date: "2026-11-10", startMin: 600 }];
  const now = new Date("2026-11-09T00:00:00+07:00"); // Trước hơn 30h

  // 1. Trước 30h -> hoàn 200.000đ (100%)
  const res30h = evaluateCancellationPolicy(items, 200000, now);
  assert.equal(res30h.refundRate, 100);
  assert.equal(res30h.expectedRefundAmount, 200000);
  assert.equal(res30h.nonRefundableAmount, 0);

  // 2. Trước 12h -> hoàn 100.000đ (50%)
  const now12h = new Date(res30h.firstSlotStartsAt.getTime() - 12 * 3600000);
  const res12h = evaluateCancellationPolicy(items, 200000, now12h);
  assert.equal(res12h.refundRate, 50);
  assert.equal(res12h.expectedRefundAmount, 100000);
  assert.equal(res12h.nonRefundableAmount, 100000);

  // 3. Trước 3h -> hoàn 0đ (0%)
  const now3h = new Date(res30h.firstSlotStartsAt.getTime() - 3 * 3600000);
  const res3h = evaluateCancellationPolicy(items, 200000, now3h);
  assert.equal(res3h.refundRate, 0);
  assert.equal(res3h.expectedRefundAmount, 0);
  assert.equal(res3h.nonRefundableAmount, 200000);
});

test("Số tiền là số nguyên VND, làm tròn nhất quán bảo toàn tài chính", () => {
  const items = [{ date: "2026-11-10", startMin: 600 }];
  const now12h = new Date(new Date("2026-11-10T10:00:00+07:00").getTime() - 12 * 3600000);

  // Số lẻ 105.000đ khi hoàn 50%: 52.500đ
  const resOdd = evaluateCancellationPolicy(items, 105000, now12h);
  assert.equal(resOdd.refundRate, 50);
  assert.equal(resOdd.expectedRefundAmount, 52500);
  assert.equal(resOdd.nonRefundableAmount, 52500);
  assert.equal(resOdd.expectedRefundAmount + resOdd.nonRefundableAmount, 105000);

  // Số lẻ không chia hết 105.001đ: làm tròn xuống số nguyên VND
  const resIndivisible = evaluateCancellationPolicy(items, 105001, now12h);
  assert.equal(resIndivisible.expectedRefundAmount, 52500);
  assert.equal(resIndivisible.nonRefundableAmount, 52501);
  assert.equal(resIndivisible.expectedRefundAmount + resIndivisible.nonRefundableAmount, 105001);
});

// ───────────── 3. Luồng hủy đơn & phê duyệt của Admin ─────────────

test("Khách hủy đơn trước 30h: lưu snapshot 100%, admin duyệt sau 24h không làm thay đổi tỷ lệ đã xác định", async () => {
  const db = fixture({ total: 200000, amounts: [200000] });
  db.state.items[0].date = "2026-11-10";
  db.state.items[0].startMin = 600; // 10:00 ngày 10/11
  const playTime = new Date("2026-11-10T10:00:00+07:00");
  const requestTime = new Date(playTime.getTime() - 30 * 3600000); // Trước đúng 30 giờ

  // Khách gửi yêu cầu hủy lúc còn 30 giờ
  const reqRes = await requestBookingCancellation(db, actors.customer, "b", "Khách bận đột xuất", requestTime);
  assert.equal(reqRes.success, true);
  assert.equal(reqRes.requiresApproval, true);
  assert.equal(reqRes.expectedRefundRate, 100);
  assert.equal(reqRes.expectedRefundAmount, 200000);

  // Kiểm tra đơn đã chuyển sang CANCELLED và nhả sân
  assert.equal(db.state.booking.status, "CANCELLED");
  assert.equal(db.state.items[0].status, "CANCELLED");
  assert.equal(db.state.booking.cancelExpectedRate, 100);
  assert.equal(db.state.booking.cancelExpectedAmount, 200000);

  // Admin duyệt muộn sau 28 giờ (lúc này chỉ còn 2 giờ trước giờ chơi):
  const lateAdminTime = new Date(requestTime.getTime() + 28 * 3600000);
  const approveRes = await approveBookingCancellation(
    db,
    actors.owner,
    "b",
    200000,
    "Duyệt hủy theo chính sách",
    false,
    undefined,
    lateAdminTime
  );

  // Vẫn phải duyệt hoàn 100% (200.000đ), không bị giảm về 0% do admin duyệt muộn
  assert.equal(approveRes.refundAmountApproved, 200000);
  assert.equal(db.state.booking.refundAmountApproved, 200000);
  assert.equal(db.state.booking.paymentStatus, "REFUND_PENDING"); // Đã duyệt, chờ hoàn tiền
});

test("Gửi yêu cầu hủy lặp lại không làm thay đổi tỷ lệ hoặc thời điểm đã xác định", async () => {
  const db = fixture({ total: 200000, amounts: [200000] });
  db.state.items[0].date = "2026-11-10";
  db.state.items[0].startMin = 600;
  const playTime = new Date("2026-11-10T10:00:00+07:00");
  const requestTime = new Date(playTime.getTime() - 30 * 3600000);

  // Lần 1: gửi lúc 30h
  const res1 = await requestBookingCancellation(db, actors.customer, "b", "Khách bận lần 1", requestTime);
  assert.equal(res1.expectedRefundRate, 100);
  const initialRequestedAt = db.state.booking.cancelRequestedAt;

  // Lần 2: khách bấm gửi lại sau đó
  const res2 = await requestBookingCancellation(db, actors.customer, "b", "Khách bấm gửi lại", new Date(requestTime.getTime() + 3600000));
  assert.equal(res2.expectedRefundRate, 100);
  assert.equal(db.state.booking.cancelRequestedAt.getTime(), initialRequestedAt.getTime()); // Không bị ghi đè thời điểm
});

test("Admin không được tùy ý sửa số tiền trái chính sách trừ khi có quyền ADMIN và lý do ngoại lệ", async () => {
  const db = fixture({ total: 200000, amounts: [200000] });
  db.state.items[0].date = "2026-11-10";
  db.state.items[0].startMin = 600;
  const playTime = new Date("2026-11-10T10:00:00+07:00");
  const requestTime = new Date(playTime.getTime() - 10 * 3600000); // 10 giờ -> tỷ lệ 50% = 100.000đ

  await requestBookingCancellation(db, actors.customer, "b", "Khách bận", requestTime);
  assert.equal(db.state.booking.cancelExpectedAmount, 100000);

  // Chủ sân (OWNER) cố tình duyệt 150.000đ mà không override -> bị chặn 400
  await assert.rejects(
    approveBookingCancellation(db, actors.owner, "b", 150000, "Tự ý sửa tiền", false),
    { status: 400 }
  );

  // Nhân viên (STAFF) cố tình duyệt ngoại lệ -> bị chặn 403 (chỉ ADMIN)
  await assert.rejects(
    approveBookingCancellation(db, actors.staff, "b", 150000, "Ngoại lệ", true, "Lý do ngoại lệ"),
    { status: 403 }
  );

  // Quản trị viên (ADMIN) duyệt ngoại lệ kèm lý do -> thành công và ghi nhật ký
  const adminActor = actors.admin;
  const adminRes = await approveBookingCancellation(
    db,
    adminActor,
    "b",
    150000,
    "Duyệt đặc cách cho khách VIP",
    true,
    "Khách VIP lâu năm gặp hoàn cảnh đặc biệt",
    new Date()
  );
  assert.equal(adminRes.refundAmountApproved, 150000);
  assert.ok(db.state.audits.some((a) => a.action === "APPROVE_CANCEL_OVERRIDE"));
});

test("Duyệt lặp bị chặn 409, phân biệt rõ Đã duyệt chờ hoàn vs Đã hoàn tiền", async () => {
  const db = fixture({ total: 200000, amounts: [200000] });
  await requestBookingCancellation(db, actors.customer, "b", "Khách bận");
  await approveBookingCancellation(db, actors.owner, "b", 200000, "Duyệt lần 1");

  // Đơn ở trạng thái: Đã duyệt, chờ hoàn tiền
  assert.equal(db.state.booking.paymentStatus, "REFUND_PENDING");

  // Duyệt lặp lại -> chặn 409
  await assert.rejects(
    approveBookingCancellation(db, actors.owner, "b", 200000, "Duyệt lần 2"),
    { status: 409 }
  );

  // Thực hiện chi tiền thủ công bên ngoài website
  const refundId = db.state.refunds[0].id;
  await recordManualRefund(db, actors.staff, "b", 200000, "Đã chuyển khoản Vietcombank", refundId, "FT241105001");

  // Lúc này mới chuyển sang: Đã hoàn tiền
  assert.equal(db.state.booking.paymentStatus, "REFUNDED");
  assert.ok(db.state.booking.refundCompletedAt);
});

test("Đơn chưa thu tiền được hủy tức thì mà không tạo nghĩa vụ hoàn tiền", async () => {
  const db = fixture({ total: 200000, amounts: [], paymentStatus: "UNPAID", status: "PENDING_PAYMENT" });
  const cancelRes = await requestBookingCancellation(db, actors.customer, "b", "Khách đổi ý");
  assert.equal(cancelRes.requiresApproval, false);
  assert.equal(cancelRes.refundApproved, 0);
  assert.equal(db.state.booking.status, "CANCELLED");
  assert.equal(db.state.booking.refundAmountApproved, 0);
  assert.equal(db.state.refunds.length, 0);
});

test("Khách hàng thông thường không được hủy đơn sau giờ bắt đầu chơi hoặc đã hoàn tất", async () => {
  const db = fixture({ total: 200000, amounts: [200000] });
  // Giờ chơi là 2 giờ trước (đã qua giờ chơi)
  const pastTime = new Date(Date.now() - 2 * 3600000);
  db.state.items[0].date = pastTime;

  await assert.rejects(
    requestBookingCancellation(db, actors.customer, "b", "Hủy sau giờ chơi"),
    { status: 409 }
  );

  // Đơn COMPLETED không được hủy
  db.state.booking.status = "COMPLETED";
  await assert.rejects(
    requestBookingCancellation(db, actors.customer, "b", "Hủy đơn đã hoàn tất"),
    { status: 409 }
  );
});

// ───────────── 4. Đơn có HLV đã hủy riêng ─────────────

test("Không áp dụng tỷ lệ hủy sân lần nữa lên khoản phí HLV đã được xử lý hoàn riêng", async () => {
  const db = fixture({ total: 400000, fee: 200000, amounts: [400000] }); // 200k sân + 200k HLV
  // 1. Hủy HLV trước
  await cancelCoachBookingByCoach(db, "coach-user", "cb", "HLV ốm đột xuất");
  assert.equal(db.state.refunds[0].amount, 200000); // 200k HLV đã vào nghĩa vụ hoàn

  // 2. Khách hủy sân lúc còn 12 giờ (tỷ lệ 50%)
  const playTime = new Date(Date.now() + 12 * 3600000);
  db.state.items[0].date = playTime;

  const cancelRes = await requestBookingCancellation(db, actors.customer, "b", "Khách hủy sân");
  assert.equal(cancelRes.expectedRefundRate, 50);

  // Tiền sân còn lại là 200.000đ -> hoàn 50% = 100.000đ (tuyệt đối không tính lại 50% lên 200k HLV)
  assert.equal(cancelRes.expectedRefundAmount, 100000);
});

// ───────────── 5. Kiểm thử Đổi lịch (Reschedule) ─────────────

test("Đổi lịch: chỉ cho phép khi còn ít nhất 6 giờ trước giờ chơi", () => {
  const items = [{ date: "2026-11-10", startMin: 600 }];
  const validTime = new Date(new Date("2026-11-10T10:00:00+07:00").getTime() - 8 * 3600000); // Còn 8 giờ
  const invalidTime = new Date(new Date("2026-11-10T10:00:00+07:00").getTime() - 4 * 3600000); // Còn 4 giờ

  assert.equal(checkRescheduleEligibility(items, validTime).eligible, true);
  assert.equal(checkRescheduleEligibility(items, invalidTime).eligible, false);
});

// ───────────── 6. Kiểm thử Chuyển nhượng (Transfer) ─────────────

test("Chuyển nhượng: chỉ chủ đơn được chuyển, không ghi đè người đặt ban đầu", async () => {
  const db = fixture({ total: 200000, amounts: [200000] });

  // Khách lạ cố tình chuyển nhượng -> bị chặn 403
  const stranger = { id: "stranger", name: "Người lạ", role: "CUSTOMER", status: "ACTIVE" };
  await assert.rejects(
    transferBooking(db, {
      bookingCode: "DATSAN123",
      actorId: stranger.id,
      receiverName: "Trần Văn B",
      receiverPhone: "0987654321",
    }),
    { status: 403 }
  );

  // Chủ đơn chuyển nhượng hợp lệ
  const transferRes = await transferBooking(db, {
    bookingCode: "DATSAN123",
    actorId: actors.customer.id,
    receiverName: "Trần Văn B",
    receiverPhone: "0987654321",
    note: "Nhờ B đi thay",
  });

  assert.equal(transferRes.success, true);
  assert.equal(transferRes.transfereeName, "Trần Văn B");
  assert.equal(db.state.booking.transfereeName, "Trần Văn B");
  // Thông tin người đặt ban đầu vẫn được bảo toàn nguyên vẹn
  assert.equal(db.state.booking.userId, "customer");
  assert.ok(db.state.transferHistories.length > 0);

  // Chuyển nhượng trên đơn đã hủy -> bị chặn 409
  db.state.booking.status = "CANCELLED";
  await assert.rejects(
    transferBooking(db, {
      bookingCode: "DATSAN123",
      actorId: actors.customer.id,
      receiverName: "Lê Văn C",
      receiverPhone: "0912345678",
    }),
    { status: 409 }
  );
});

// ───────────── 7. Kiểm thử Sự cố bất khả kháng (Incident) ─────────────

test("Sự cố bất khả kháng: khách báo cáo PENDING, xác nhận áp dụng chính sách sân hoặc xử lý thủ công", async () => {
  const db = fixture({ total: 200000, amounts: [200000] });
  // Sân chưa cấu hình chính sách sự cố
  db.state.venue.forceMajeurePolicy = null;

  // 1. Khách báo cáo sự cố mưa lớn
  const reportRes = await reportBookingIncident(db, {
    bookingCode: "DATSAN123",
    actorId: actors.customer.id,
    incidentType: "HEAVY_RAIN",
    requestType: "REFUND",
    description: "Mưa ngập đường không thể tới sân",
  });
  assert.equal(reportRes.status, "PENDING");
  const incidentId = reportRes.incidentId;

  // 2. Chủ sân xác nhận khi sân CHƯA có cấu hình -> chuyển MANUAL_REVIEW (không tự động 100%)
  const confirmRes1 = await confirmBookingIncident(db, {
    incidentId,
    actorId: actors.owner.id,
    action: "APPROVE",
    adminNote: "Đã xác nhận mưa ngập, chờ thống nhất",
  });
  assert.equal(confirmRes1.status, "MANUAL_REVIEW");

  // 3. Khi sân ĐÃ cấu hình hoàn 100% cho mưa lớn
  db.state.venue.forceMajeurePolicy = { HEAVY_RAIN: 100 };
  const confirmRes2 = await confirmBookingIncident(db, {
    incidentId,
    actorId: actors.owner.id,
    action: "APPROVE",
    resolution: "REFUND",
    adminNote: "Đã xác minh và áp dụng mức hoàn 100% theo quy định sân",
  });
  assert.equal(confirmRes2.status, "APPROVED");
  assert.equal(confirmRes2.refundRate, 100);
  assert.equal(confirmRes2.refundAmount, 200000);
});

// ───────────── 8. Kiểm thử Đổi lịch trong Transaction & Rollback ─────────────

test("Đổi lịch: thành công khi giờ trống, lưu vết BookingRescheduleHistory", async () => {
  const db = fixture({ total: 100000, amounts: [100000] });
  db.state.items[0].date = "2026-11-10";
  db.state.items[0].court = { name: "Sân 1" };
  db.state.items[0].courtId = "court-1";
  db.state.venue.courts = [{ id: "court-1", name: "Sân 1", status: "ACTIVE" }];
  db.state.venue.pricing = [{ daysOfWeek: [1, 2, 3, 4, 5, 6, 7], startMin: 300, endMin: 1320, walkInPrice: 100000 }];
  db.state.venue.openMin = 300;
  db.state.venue.closeMin = 1320;
  db.state.venue.advanceDays = 30;
  db.state.venue.minBookingMin = 60;
  db.state.venue.maxBookingMin = 240;

  const res = await rescheduleBooking(
    db,
    {
      bookingCode: "DATSAN123",
      actorId: actors.customer.id,
      newDate: "2026-11-12",
      newSlots: [
        { courtId: "court-1", startMin: 600, endMin: 630 },
        { courtId: "court-1", startMin: 630, endMin: 660 },
      ],
      reason: "Bận đột xuất ngày 10, xin dời sang ngày 12",
    },
    new Date("2026-11-09T00:00:00+07:00") // Đổi trước 34 giờ
  );

  assert.equal(res.success, true);
  assert.equal(res.bookingCode, "DATSAN123");
  assert.ok(db.state.rescheduleHistories.length > 0);
  // Các slot cũ bị hủy
  assert.equal(db.state.items[0].status, "CANCELLED");
  // Slot mới được tạo và xác nhận
  const newItems = db.state.items.filter((i) => i.status === "CONFIRMED");
  assert.equal(newItems.length, 2);
});

test("Đổi lịch gặp xung đột CourtBlock: rollback transaction, giữ nguyên đơn và lịch cũ", async () => {
  const db = fixture({ total: 100000, amounts: [100000] });
  db.state.items[0].date = "2026-11-10";
  db.state.items[0].court = { name: "Sân 1" };
  db.state.items[0].courtId = "court-1";
  db.state.venue.courts = [{ id: "court-1", name: "Sân 1", status: "ACTIVE" }];
  db.state.venue.pricing = [{ daysOfWeek: [1, 2, 3, 4, 5, 6, 7], startMin: 300, endMin: 1320, walkInPrice: 100000 }];
  db.state.venue.openMin = 300;
  db.state.venue.closeMin = 1320;
  db.state.venue.advanceDays = 30;
  db.state.venue.minBookingMin = 60;
  db.state.venue.maxBookingMin = 240;

  // Đặt trước 1 CourtBlock trên khung giờ mới
  db.state.courtBlocks.push({
    id: "block-1",
    courtId: "court-1",
    date: new Date("2026-11-12T00:00:00Z"),
    startMin: 600,
    endMin: 660,
  });

  const stateBefore = structuredClone(db.state);

  await assert.rejects(
    rescheduleBooking(
      db,
      {
        bookingCode: "DATSAN123",
        actorId: actors.customer.id,
        newDate: "2026-11-12",
        newSlots: [
          { courtId: "court-1", startMin: 600, endMin: 630 },
          { courtId: "court-1", startMin: 630, endMin: 660 },
        ],
      },
      new Date("2026-11-09T00:00:00+07:00")
    ),
    { status: 409 }
  );

  // Sau khi rollback, lịch cũ và đơn hoàn toàn không bị thay đổi
  assert.equal(db.state.items[0].status, "CONFIRMED");
  assert.equal(db.state.booking.total, 100000);
  assert.equal(db.state.rescheduleHistories.length, 0);
});

