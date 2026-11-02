const test = require("node:test");
const assert = require("node:assert/strict");

// 1. Kiểm tra chuẩn hóa Alias Tiện ích (Amenities) không mất dữ liệu
test("1. Tiện ích: Chuẩn hóa AC/AIRCON và loại bỏ trùng lặp không mất dữ liệu", () => {
  const AMENITY_ALIASES = {
    ac: "AIRCON",
    aircon: "AIRCON",
    air_conditioner: "AIRCON",
    dieu_hoa: "AIRCON",
    may_lanh: "AIRCON",
    parking: "PARKING",
    bai_xe: "PARKING",
    wifi: "WIFI",
    shower: "SHOWER",
    tam_nong_lanh: "SHOWER",
    canteen: "CANTEEN",
    cang_tin: "CANTEEN",
    racket_rental: "RACKET_RENTAL",
    thue_vot: "RACKET_RENTAL",
    shuttlecock_sale: "SHUTTLECOCK_SALE",
    ban_cau: "SHUTTLECOCK_SALE",
    locker: "LOCKER",
    tu_do: "LOCKER",
  };

  function normalizeAmenity(code) {
    if (!code || typeof code !== "string") return null;
    const clean = code.trim().toLowerCase();
    return AMENITY_ALIASES[clean] || (code.trim().toUpperCase());
  }

  function normalizeAmenities(rawList) {
    if (!Array.isArray(rawList)) return [];
    const set = new Set();
    for (const item of rawList) {
      const norm = normalizeAmenity(item);
      if (norm) set.add(norm);
    }
    return Array.from(set);
  }

  // Input có alias cũ "AC", "may_lanh", "bai_xe", trùng lặp
  const raw = ["AC", "may_lanh", "PARKING", "bai_xe", "WIFI", "wifi", "AC"];
  const normalized = normalizeAmenities(raw);

  assert.ok(normalized.includes("AIRCON"), "AC và may_lanh phải chuẩn hóa thành AIRCON");
  assert.ok(normalized.includes("PARKING"), "bai_xe phải chuẩn hóa thành PARKING");
  assert.ok(normalized.includes("WIFI"), "WIFI phải chuẩn hóa");
  assert.equal(normalized.filter(x => x === "AIRCON").length, 1, "Không được trùng lặp AIRCON");
  assert.equal(normalized.filter(x => x === "PARKING").length, 1, "Không được trùng lặp PARKING");
  assert.equal(normalized.filter(x => x === "WIFI").length, 1, "Không được trùng lặp WIFI");
});

// 2. Logic phân quyền STAFF trên timeline vận hành: Khóa cứng hôm nay theo Asia/Ho_Chi_Minh
test("2. Timeline Vận hành: STAFF bị khóa cứng hôm nay theo Asia/Ho_Chi_Minh; ADMIN/OWNER được chọn ngày", () => {
  function resolveScheduleDate(role, requestedDate) {
    const todayVietnam = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date());

    if (role === "STAFF") {
      // Bắt buộc hôm nay, bất kể query gửi lên ngày nào
      return { scheduleDateStr: todayVietnam, isLockedToday: true };
    }

    // ADMIN hoặc OWNER có thể xem ngày được chọn
    const validDate = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
      ? requestedDate
      : todayVietnam;
    return { scheduleDateStr: validDate, isLockedToday: false };
  }

  const todayVn = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());

  // STAFF yêu cầu ngày khác trong quá khứ hoặc tương lai -> vẫn bị ép về todayVn
  const staffResult = resolveScheduleDate("STAFF", "2026-11-15");
  assert.equal(staffResult.scheduleDateStr, todayVn, "STAFF bắt buộc phải nhận ngày hôm nay");
  assert.equal(staffResult.isLockedToday, true);

  // OWNER yêu cầu ngày tương lai -> được chấp nhận
  const ownerResult = resolveScheduleDate("OWNER", "2026-11-15");
  assert.equal(ownerResult.scheduleDateStr, "2026-11-15", "OWNER được phép xem ngày đã chọn");
  assert.equal(ownerResult.isLockedToday, false);

  // ADMIN yêu cầu ngày khác -> được chấp nhận
  const adminResult = resolveScheduleDate("ADMIN", "2026-11-20");
  assert.equal(adminResult.scheduleDateStr, "2026-11-20", "ADMIN được phép xem ngày đã chọn");
  assert.equal(adminResult.isLockedToday, false);
});

// 3. Logic sinh cột 30 phút khớp giờ mở/đóng cửa và kết thúc 24:00 (1440)
test("3. Timeline 30 phút: Sinh đủ các cột 30 phút từ openMin đến closeMin", () => {
  function generate30MinSlots(openMin, closeMin) {
    const slots = [];
    const step = 30;
    const start = Math.floor(openMin / step) * step;
    const end = Math.ceil(closeMin / step) * step;

    for (let m = start; m < end; m += step) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const nextM = m + step;
      const nextH = Math.floor(nextM / 60);
      const nextMin = nextM % 60;
      slots.push({
        startMin: m,
        endMin: nextM,
        label: `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
        timeRangeStr: `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")} - ${String(nextH).padStart(2, "0")}:${String(nextMin).padStart(2, "0")}`,
      });
    }
    return slots;
  }

  // Mở cửa lúc 05:30 (330) và đóng cửa lúc 24:00 (1440)
  const slots = generate30MinSlots(330, 1440);
  assert.equal(slots[0].startMin, 330);
  assert.equal(slots[0].label, "05:30");
  assert.equal(slots[slots.length - 1].endMin, 1440);
  assert.equal(slots[slots.length - 1].label, "23:30");
  assert.equal(slots[slots.length - 1].timeRangeStr, "23:30 - 24:00");
  assert.equal(slots.length, (1440 - 330) / 30, "Số lượng slot phải chính xác theo bước 30 phút");
});

// 4. Logic 7 trạng thái ô sân trên Timeline vận hành
test("4. Timeline Trạng thái: Phân biệt rõ 7 trạng thái: Trống, Giữ chỗ, Đã đặt, Đang sử dụng, Quá giờ/Chưa bàn giao, Khóa/Bảo trì, Đã qua", () => {
  function determineSlotStatus({
    isCourtActive,
    isCourtBlocked,
    isPastTime,
    bookingStatus,
    paymentStatus,
    isInUse,
    isOverdue,
    isHoldValid,
  }) {
    if (!isCourtActive || isCourtBlocked) {
      return { status: "MAINTENANCE", label: "Khóa / Bảo trì" };
    }
    if (bookingStatus === "CONFIRMED") {
      if (isOverdue) return { status: "OVERDUE", label: "Quá giờ / Chưa trả sân" };
      if (isInUse) return { status: "IN_USE", label: "Đang sử dụng" };
      return { status: "BOOKED", label: "Đã đặt" };
    }
    if (bookingStatus === "PENDING" && isHoldValid) {
      return { status: "HELD", label: "Đang giữ chỗ" };
    }
    if (isPastTime) {
      return { status: "PAST", label: "Đã qua giờ" };
    }
    return { status: "AVAILABLE", label: "Còn trống" };
  }

  // Khóa bảo trì
  assert.equal(determineSlotStatus({ isCourtActive: false }).status, "MAINTENANCE");
  // Quá giờ chưa trả sân
  assert.equal(determineSlotStatus({ isCourtActive: true, bookingStatus: "CONFIRMED", isOverdue: true }).status, "OVERDUE");
  // Đang sử dụng
  assert.equal(determineSlotStatus({ isCourtActive: true, bookingStatus: "CONFIRMED", isInUse: true }).status, "IN_USE");
  // Đã đặt
  assert.equal(determineSlotStatus({ isCourtActive: true, bookingStatus: "CONFIRMED" }).status, "BOOKED");
  // Đang giữ chỗ
  assert.equal(determineSlotStatus({ isCourtActive: true, bookingStatus: "PENDING", isHoldValid: true }).status, "HELD");
  // Đã qua giờ
  assert.equal(determineSlotStatus({ isCourtActive: true, isPastTime: true }).status, "PAST");
  // Trống
  assert.equal(determineSlotStatus({ isCourtActive: true, isPastTime: false }).status, "AVAILABLE");
});

// 5. Logic Chống trùng thông báo (Anti-Deduplication) theo (userId, bookingId, eventTag)
test("5. Thông báo: Chống trùng theo (userId, bookingId, eventTag); 2 sự kiện khác nhau trên cùng booking vẫn phát sinh riêng", () => {
  const notifStore = [];

  function sendVenueNotificationMock(notification) {
    const fiveMinutesAgo = Date.now() - 300000;
    const isDuplicate = notifStore.some(
      (n) =>
        n.userId === notification.userId &&
        n.bookingId === notification.bookingId &&
        n.eventTag === notification.eventTag &&
        n.createdAt >= fiveMinutesAgo
    );

    if (isDuplicate) {
      return { sent: false, reason: "DUPLICATE_SUPPRESSED" };
    }

    const created = { ...notification, createdAt: Date.now() };
    notifStore.push(created);
    return { sent: true, notification: created };
  }

  // Sự kiện 1: Tạo đơn tại quầy
  const event1 = sendVenueNotificationMock({
    userId: "staff_1",
    bookingId: "booking_100",
    eventTag: "COUNTER_BOOKING_CREATED",
    title: "Đơn mới tại quầy",
  });
  assert.equal(event1.sent, true, "Sự kiện 1 phải được gửi");

  // Sự kiện 2: Retry cùng sự kiện 1 trong vòng 5 phút -> bị chặn trùng
  const event1Retry = sendVenueNotificationMock({
    userId: "staff_1",
    bookingId: "booking_100",
    eventTag: "COUNTER_BOOKING_CREATED",
    title: "Đơn mới tại quầy",
  });
  assert.equal(event1Retry.sent, false, "Retry cùng sự kiện 1 phải bị chặn trùng");
  assert.equal(event1Retry.reason, "DUPLICATE_SUPPRESSED");

  // Sự kiện 3: Xác nhận thanh toán tiền mặt trên CÙNG booking_100 trong vòng 5 phút
  // CƠ CHẾ CŨ: Chỉ check bookingId -> Làm mất sự kiện thanh toán!
  // CƠ CHẾ MỚI: Check (userId, bookingId, eventTag) -> Ghi nhận riêng biệt thành công!
  const event2 = sendVenueNotificationMock({
    userId: "staff_1",
    bookingId: "booking_100",
    eventTag: "CASH_PAYMENT_CONFIRMED",
    title: "Xác nhận thu tiền mặt",
  });
  assert.equal(event2.sent, true, "Sự kiện 2 khác eventTag trên cùng booking phải được ghi nhận độc lập");
  assert.equal(notifStore.length, 2, "Hệ thống phải lưu đủ 2 thông báo khác loại sự kiện");
});

// 6. Phân quyền API Chỉnh sửa Thông tin Cơ sở (/api/venues/[id]/manage)
test("6. Quản lý Cơ sở: STAFF bị chặn 403; OWNER chỉ sửa sân sở hữu; ADMIN sửa mọi sân; cấm đổi ownerId", () => {
  function checkVenueManagePermission(user, targetVenue) {
    if (user.role === "STAFF") {
      return { allowed: false, status: 403, error: "STAFF không có quyền chỉnh sửa cấu hình cơ sở." };
    }
    if (user.role === "ADMIN") {
      return { allowed: true, status: 200 };
    }
    if (user.role === "OWNER") {
      if (targetVenue.ownerId === user.id) {
        return { allowed: true, status: 200 };
      }
      return { allowed: false, status: 403, error: "Bạn chỉ có thể chỉnh sửa cơ sở do mình sở hữu." };
    }
    return { allowed: false, status: 403, error: "Không có quyền truy cập." };
  }

  const staffUser = { id: "u_staff", role: "STAFF" };
  const ownerA = { id: "u_owner_a", role: "OWNER" };
  const ownerB = { id: "u_owner_b", role: "OWNER" };
  const adminUser = { id: "u_admin", role: "ADMIN" };

  const venueA = { id: "venue_a", ownerId: "u_owner_a", name: "Sân Cầu Lông A" };

  // STAFF bị chặn 403
  assert.equal(checkVenueManagePermission(staffUser, venueA).status, 403);

  // OWNER A sửa venue A -> Thành công 200
  assert.equal(checkVenueManagePermission(ownerA, venueA).status, 200);

  // OWNER B sửa venue A -> Bị chặn 403
  assert.equal(checkVenueManagePermission(ownerB, venueA).status, 403);

  // ADMIN sửa venue A -> Thành công 200
  assert.equal(checkVenueManagePermission(adminUser, venueA).status, 200);

  // Whitelist trường được phép sửa
  function filterEditableFields(rawPayload) {
    const ALLOWED = ["name", "description", "address", "ward", "district", "province", "phone", "lat", "lng", "openMin", "closeMin", "amenities", "images"];
    const filtered = {};
    for (const key of Object.keys(rawPayload)) {
      if (ALLOWED.includes(key)) {
        filtered[key] = rawPayload[key];
      }
    }
    return filtered;
  }

  const maliciousPayload = {
    name: "Tên sân mới",
    ownerId: "hacked_owner",
    status: "ACTIVE",
    role: "ADMIN",
    priceFrom: 1000,
  };
  const filtered = filterEditableFields(maliciousPayload);
  assert.equal(filtered.name, "Tên sân mới");
  assert.equal(filtered.ownerId, undefined, "Không cho phép client cập nhật ownerId");
  assert.equal(filtered.status, undefined, "Không cho phép cập nhật trạng thái duyệt");
  assert.equal(filtered.priceFrom, undefined, "Không được sửa đè đơn giá lịch sử");
});

// 7. Yêu thích: Phân lập dữ liệu khách vs tài khoản đăng nhập
test("7. Yêu thích: Cô lập dữ liệu giữa khách và tài khoản; không lẫn chéo tài khoản trên cùng trình duyệt", () => {
  function getFavoritesStorageKey(user) {
    if (!user || !user.id) {
      return "smashbook_guest_favorite_venues";
    }
    return `smashbook_user_favorites_${user.id}`;
  }

  const guestKey = getFavoritesStorageKey(null);
  const user1Key = getFavoritesStorageKey({ id: "user_1" });
  const user2Key = getFavoritesStorageKey({ id: "user_2" });

  assert.equal(guestKey, "smashbook_guest_favorite_venues");
  assert.equal(user1Key, "smashbook_user_favorites_user_1");
  assert.equal(user2Key, "smashbook_user_favorites_user_2");
  assert.notEqual(user1Key, user2Key, "Hai tài khoản khác nhau phải có key lưu trữ riêng biệt");
  assert.notEqual(guestKey, user1Key, "Khách và tài khoản đăng nhập không dùng chung key");
});
