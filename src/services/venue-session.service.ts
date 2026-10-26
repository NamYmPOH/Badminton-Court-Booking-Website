import { Prisma, type PrismaClient, type SessionStatus } from "@prisma/client";
import { PaymentError } from "../lib/sepay";
import { serializable } from "../lib/transaction";

export interface BookingTimeSlot {
  date: Date | string;
  startMin: number;
  endMin: number;
}

export function getSlotTimestamp(item: { date: Date | string; startMin?: number }, minute: number): number {
  const dateStr = (typeof item.date === "string" ? item.date : item.date.toISOString()).slice(0, 10);
  return new Date(`${dateStr}T00:00:00+07:00`).getTime() + minute * 60000;
}

export function getBookingStartTimestamp(items: BookingTimeSlot[]): number {
  if (!items.length) return 0;
  return Math.min(...items.map((i) => getSlotTimestamp(i, i.startMin)));
}

export function getBookingEndTimestamp(items: BookingTimeSlot[]): number {
  if (!items.length) return 0;
  return Math.max(...items.map((i) => getSlotTimestamp(i, i.endMin)));
}

export interface PaymentDetails {
  total: number;
  totalPaid: number;
  remaining: number;
  isFullyPaid: boolean;
  hasCashPayment: boolean;
}

export function calculateBookingPaymentDetails(booking: {
  total: number;
  paymentStatus: string;
  paymentMethod?: string | null;
  hasCashPayment?: boolean;
  payments?: Array<{ amount: number; status: string; provider: string }>;
}): PaymentDetails {
  const payments = booking.payments || [];
  let totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  // Xử lý đơn thanh toán cũ không có bảng ghi payment nhưng paymentStatus = PAID
  if (totalPaid === 0 && booking.paymentStatus === "PAID") {
    totalPaid = booking.total;
  }

  const remaining = Math.max(0, booking.total - totalPaid);
  const isFullyPaid = remaining === 0 && (booking.paymentStatus === "PAID" || totalPaid >= booking.total);
  const hasCash =
    !!booking.hasCashPayment ||
    booking.paymentMethod === "CASH" ||
    payments.some((p) => p.provider === "CASH" && p.status === "PAID");

  return {
    total: booking.total,
    totalPaid,
    remaining,
    isFullyPaid,
    hasCashPayment: hasCash,
  };
}

export async function hasActiveStaffShift(
  tx: Prisma.TransactionClient | PrismaClient,
  venueId: string
): Promise<boolean> {
  const activeShift = await tx.staffShift.findFirst({
    where: {
      venueId,
      endedAt: null,
      user: { status: "ACTIVE" },
      venue: { staff: { some: { isActive: true } } },
    },
    select: { id: true, userId: true },
  });

  if (!activeShift) return false;

  // Xác thực lại staff có isActive = true
  const staff = await tx.venueStaff.findFirst({
    where: {
      userId: activeShift.userId,
      venueId,
      isActive: true,
      user: { status: "ACTIVE" },
    },
    select: { userId: true },
  });

  return !!staff;
}

export async function assertVenueOperatorAccess(
  tx: Prisma.TransactionClient | PrismaClient,
  actor: { id: string; role: string; status: string },
  venueId: string,
  requireActiveShift = false
): Promise<{ isOwnerOrAdmin: boolean; isStaff: boolean }> {
  if (actor.status !== "ACTIVE") {
    throw new PaymentError(403, "Tài khoản của bạn đang bị khóa hoặc không hoạt động.");
  }

  if (actor.role === "ADMIN") {
    return { isOwnerOrAdmin: true, isStaff: false };
  }

  if (actor.role === "OWNER") {
    const venue = await tx.venue.findFirst({
      where: { id: venueId, ownerId: actor.id },
      select: { id: true },
    });
    if (!venue) {
      throw new PaymentError(403, "Bạn không có quyền quản lý cơ sở sân này.");
    }
    return { isOwnerOrAdmin: true, isStaff: false };
  }

  if (actor.role === "STAFF") {
    const staff = await tx.venueStaff.findFirst({
      where: {
        userId: actor.id,
        venueId,
        isActive: true,
      },
      select: { role: true, isActive: true },
    });

    if (!staff || !staff.isActive) {
      throw new PaymentError(403, "Bạn không có quyền hoặc đã bị vô hiệu hóa quyền làm việc tại cơ sở này.");
    }

    if (requireActiveShift) {
      const activeShift = await tx.staffShift.findFirst({
        where: {
          userId: actor.id,
          venueId,
          endedAt: null,
        },
        select: { id: true },
      });
      if (!activeShift) {
        throw new PaymentError(403, "Bạn cần bắt đầu ca trực để thực hiện thao tác này tại sân.");
      }
    }

    return { isOwnerOrAdmin: false, isStaff: true };
  }

  throw new PaymentError(403, "Bạn không có quyền truy cập quản lý sân.");
}

export interface CourtLiveStatus {
  id: string;
  name: string;
  sortOrder: number;
  status: "AVAILABLE" | "IN_USE" | "OVERDUE";
  currentBooking?: {
    id: string;
    code: string;
    customerName: string;
    customerPhone: string;
    startMin: number;
    endMin: number;
    remainingMin: number;
    isOverdue: boolean;
    total: number;
    remainingAmount: number;
    paymentStatus: string;
    sessionStatus: SessionStatus;
  };
  conflictWarning?: string;
}

export async function getVenueCourtsLiveStatus(
  db: PrismaClient,
  venueId: string,
  now = new Date()
): Promise<CourtLiveStatus[]> {
  const courts = await db.court.findMany({
    where: { venueId },
    orderBy: { sortOrder: "asc" },
  });

  const nowVN = new Date(now.getTime() + 7 * 3600000);
  const currentMin = nowVN.getUTCHours() * 60 + nowVN.getUTCMinutes();
  const dateStr = nowVN.toISOString().slice(0, 10);
  const todayDate = new Date(`${dateStr}T00:00:00.000Z`);

  const items = await db.bookingItem.findMany({
    where: {
      courtId: { in: courts.map((c) => c.id) },
      date: todayDate,
      booking: {
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
      },
    },
    include: {
      court: true,
      booking: {
        include: {
          payments: {
            where: { status: "PAID" },
            select: { amount: true, status: true, provider: true },
          },
        },
      },
    },
    orderBy: { startMin: "asc" },
  });

  return courts.map((court) => {
    const courtItems = items.filter((i) => i.courtId === court.id);

    // 1. Kiểm tra xem có phiên trước đã quá giờ nhưng chưa bàn giao (COMPLETED) không
    const overdueItem = courtItems.find(
      (i) => currentMin >= i.endMin && i.booking.status !== "COMPLETED"
    );

    let occupyingItem = overdueItem;
    let isOverdue = !!overdueItem;

    if (!occupyingItem) {
      // 2. Nếu không có phiên trễ giờ, kiểm tra phiên đang trong khung giờ sử dụng
      occupyingItem = courtItems.find(
        (i) =>
          currentMin >= i.startMin &&
          currentMin < i.endMin &&
          i.booking.status !== "COMPLETED"
      );
    }

    // 3. Kiểm tra xung đột lịch tiếp theo nếu phiên trước chưa bàn giao mà lịch tiếp theo đã đến giờ
    let conflictWarning: string | undefined;
    if (isOverdue && occupyingItem) {
      const nextItem = courtItems.find(
        (i) =>
          i.startMin >= occupyingItem!.startMin &&
          currentMin >= i.startMin &&
          i.booking.id !== occupyingItem!.booking.id
      );
      if (nextItem) {
        conflictWarning = `Lịch tiếp theo của khách ${nextItem.booking.customerName} (${nextItem.booking.code}) đã đến giờ nhận sân nhưng phiên trước chưa bàn giao!`;
      }
    }

    if (!occupyingItem) {
      return {
        id: court.id,
        name: court.name,
        sortOrder: court.sortOrder,
        status: "AVAILABLE",
        conflictWarning,
      };
    }

    const paymentDetails = calculateBookingPaymentDetails(occupyingItem.booking);
    const remainingMin = Math.max(0, occupyingItem.endMin - currentMin);

    return {
      id: court.id,
      name: court.name,
      sortOrder: court.sortOrder,
      status: isOverdue ? "OVERDUE" : "IN_USE",
      currentBooking: {
        id: occupyingItem.booking.id,
        code: occupyingItem.booking.code,
        customerName: occupyingItem.booking.customerName,
        customerPhone: occupyingItem.booking.customerPhone,
        startMin: occupyingItem.startMin,
        endMin: occupyingItem.endMin,
        remainingMin,
        isOverdue,
        total: occupyingItem.booking.total,
        remainingAmount: paymentDetails.remaining,
        paymentStatus: occupyingItem.booking.paymentStatus,
        sessionStatus: occupyingItem.booking.sessionStatus,
      },
      conflictWarning,
    };
  });
}

export async function processOverdueAndCompletions(
  db: PrismaClient,
  now = new Date()
): Promise<{
  overdueCount: number;
  autoCompletedCount: number;
  notifiedStaffCount: number;
}> {
  return serializable(db, async (tx) => {
    let overdueCount = 0;
    let autoCompletedCount = 0;
    let notifiedStaffCount = 0;

    // Tìm tất cả các booking đang CONFIRMED hoặc CHECKED_IN
    const activeBookings = await tx.booking.findMany({
      where: {
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
      },
      include: {
        items: {
          select: { date: true, startMin: true, endMin: true, court: { select: { name: true } } },
        },
        payments: {
          where: { status: "PAID" },
          select: { amount: true, status: true, provider: true },
        },
      },
      take: 200,
    });

    for (const booking of activeBookings) {
      if (!booking.items.length) continue;
      const endTimestamp = getBookingEndTimestamp(booking.items);
      if (endTimestamp === 0) continue;

      const isOverdue = now.getTime() >= endTimestamp;
      if (!isOverdue) continue;

      const payment = calculateBookingPaymentDetails(booking);
      const courtNames = booking.items.map((i) => i.court.name).join(", ");
      const hasShift = await hasActiveStaffShift(tx, booking.venueId);

      // A. Chuyển trạng thái sang OVERDUE_PENDING nếu chưa chuyển
      if (booking.sessionStatus !== "OVERDUE_PENDING" && booking.sessionStatus !== "COMPLETED") {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            sessionStatus: "OVERDUE_PENDING",
            manualHandoverRequired: hasShift || booking.manualHandoverRequired || payment.hasCashPayment,
          },
        });
        overdueCount++;

        // Gửi thông báo đến tài khoản nhân viên lễ tân trực thuộc cụm sân (chống gửi lặp)
        if (!booking.overdueNotifiedAt) {
          const staffMembers = await tx.venueStaff.findMany({
            where: {
              venueId: booking.venueId,
              isActive: true,
              user: { status: "ACTIVE" },
            },
            select: { userId: true },
          });

          const endTimeStr = new Date(endTimestamp).toLocaleTimeString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            hour: "2-digit",
            minute: "2-digit",
          });

          for (const staff of staffMembers) {
            // Kiểm tra thông báo trùng lặp cho booking này
            const existingNotification = await tx.notification.findFirst({
              where: {
                userId: staff.userId,
                type: "SYSTEM",
                data: {
                  path: ["bookingId"],
                  equals: booking.id,
                },
              },
              select: { id: true },
            });

            if (!existingNotification) {
              await tx.notification.create({
                data: {
                  userId: staff.userId,
                  type: "SYSTEM",
                  title: `Hết giờ sân ${courtNames} · ${booking.code}`,
                  body: `Khách: ${booking.customerName}. Giờ kết thúc: ${endTimeStr}. Còn thiếu: ${payment.remaining.toLocaleString("vi-VN")} đ. Vui lòng kiểm tra và bàn giao sân.`,
                  data: {
                    tag: "SESSION_OVERDUE",
                    bookingId: booking.id,
                    bookingCode: booking.code,
                    venueId: booking.venueId,
                    courtNames,
                    customerName: booking.customerName,
                    total: booking.total,
                    paid: payment.totalPaid,
                    remaining: payment.remaining,
                    endTime: endTimeStr,
                  },
                },
              });
              notifiedStaffCount++;
            }
          }

          await tx.booking.update({
            where: { id: booking.id },
            data: { overdueNotifiedAt: now },
          });

          await tx.adminAudit.create({
            data: {
              actorId: "SYSTEM",
              actorName: "Hệ thống tự động",
              action: "SESSION_OVERDUE",
              entityId: booking.id,
              reason: "Hết giờ sử dụng sân, chuyển phiên sang Hết giờ – chờ hoàn tất",
              details: {
                bookingCode: booking.code,
                courtNames,
                endTimestamp,
                remaining: payment.remaining,
                hasActiveShift: hasShift,
              },
            },
          });
        }
      }

      // B. Đánh giá điều kiện Tự Động Hoàn Tất sau 1 phút
      // Điều kiện nghiêm ngặt:
      // 1. Quá ít nhất 1 phút kể từ lúc hết giờ
      // 2. Đã thanh toán đủ 100%
      // 3. Không có thanh toán tiền mặt (hoàn toàn online)
      // 4. Không có nhân viên đang đứng ca tại cụm sân
      // 5. Không bị đánh dấu bắt buộc bàn giao thủ công
      const pastOneMinute = now.getTime() >= endTimestamp + 60000;
      const canAutoComplete =
        pastOneMinute &&
        booking.status !== "COMPLETED" &&
        payment.isFullyPaid &&
        !payment.hasCashPayment &&
        !hasShift &&
        !booking.manualHandoverRequired;

      if (canAutoComplete) {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: "COMPLETED",
            sessionStatus: "COMPLETED",
          },
        });

        if (tx.coachBooking) {
          await tx.coachBooking.updateMany({
            where: {
              bookingItem: { bookingId: booking.id },
              status: "CONFIRMED",
            },
            data: { status: "COMPLETED" },
          });
        }

        await tx.adminAudit.create({
          data: {
            actorId: "SYSTEM",
            actorName: "Hệ thống tự động",
            action: "AUTO_COMPLETE",
            entityId: booking.id,
            reason: "Tự động hoàn tất sau 1 phút hết giờ khi đã thanh toán đủ online và không có nhân viên đứng ca",
            details: {
              bookingCode: booking.code,
              endTimestamp,
              totalPaid: payment.totalPaid,
              total: booking.total,
            },
          },
        });

        autoCompletedCount++;
      }
    }

    return {
      overdueCount,
      autoCompletedCount,
      notifiedStaffCount,
    };
  });
}

export async function confirmCashPayment(
  db: PrismaClient,
  actor: { id: string; role: string; status: string; name: string },
  bookingId: string,
  expectedAmount: number,
  reason: string,
  now = new Date()
): Promise<{ success: boolean; paidAmount: number; remaining: number }> {
  return serializable(db, async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        payments: {
          where: { status: "PAID" },
          select: { amount: true, status: true, provider: true },
        },
      },
    });

    if (!booking) throw new PaymentError(404, "Không tìm thấy đơn đặt sân.");

    // Kiểm tra quyền của nhân viên/chủ sân
    await assertVenueOperatorAccess(tx, actor, booking.venueId, actor.role === "STAFF");

    const payment = calculateBookingPaymentDetails(booking);

    if (payment.remaining <= 0) {
      throw new PaymentError(409, "Đơn đặt sân này đã thanh toán đủ.");
    }

    // Bảo đảm số tiền khớp chính xác với số tiền hiển thị trên hộp thoại
    if (expectedAmount !== payment.remaining) {
      throw new PaymentError(
        409,
        `Số tiền cần thu đã thay đổi (${payment.remaining.toLocaleString("vi-VN")} đ so với ${expectedAmount.toLocaleString("vi-VN")} đ). Vui lòng cập nhật và xác nhận lại.`
      );
    }

    // Tạo bản ghi Payment tiền mặt
    await tx.payment.create({
      data: {
        bookingId: booking.id,
        provider: "CASH",
        amount: payment.remaining,
        status: "PAID",
        txnRef: `CASH-${booking.id}-${Date.now()}`,
        paidAt: now,
      },
    });

    // Cập nhật trạng thái thanh toán và đánh dấu đơn có tiền mặt (bắt buộc hoàn tất thủ công)
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: "PAID",
        paymentMethod: "CASH",
        hasCashPayment: true,
        manualHandoverRequired: true,
      },
    });

    await tx.adminAudit.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        action: "CASH_PAID",
        entityId: booking.id,
        reason: reason || "Thu tiền mặt trực tiếp tại quầy",
        details: {
          bookingCode: booking.code,
          amount: payment.remaining,
          total: booking.total,
        },
      },
    });

    return {
      success: true,
      paidAmount: payment.remaining,
      remaining: 0,
    };
  });
}

export async function completeBookingSession(
  db: PrismaClient,
  actor: { id: string; role: string; status: string; name: string },
  bookingId: string,
  reason: string,
  now = new Date()
): Promise<{ success: boolean }> {
  return serializable(db, async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        items: {
          select: { date: true, startMin: true, endMin: true, court: { select: { name: true } } },
        },
        payments: {
          where: { status: "PAID" },
          select: { amount: true, status: true, provider: true },
        },
      },
    });

    if (!booking) throw new PaymentError(404, "Không tìm thấy đơn đặt sân.");

    // Kiểm tra quyền của nhân viên/chủ sân
    await assertVenueOperatorAccess(tx, actor, booking.venueId, actor.role === "STAFF");

    if (booking.status === "COMPLETED") {
      // Idempotent: đã hoàn tất trước đó
      return { success: true };
    }

    if (!["CONFIRMED", "CHECKED_IN"].includes(booking.status)) {
      throw new PaymentError(409, "Chỉ có thể hoàn tất đơn đang trong phiên sử dụng.");
    }

    const endTimestamp = getBookingEndTimestamp(booking.items);
    if (now.getTime() < endTimestamp) {
      throw new PaymentError(
        409,
        "Phiên sử dụng sân chưa hết giờ thực tế. Không thể bàn giao trước giờ."
      );
    }

    const payment = calculateBookingPaymentDetails(booking);
    if (!payment.isFullyPaid) {
      throw new PaymentError(
        409,
        `Đơn đặt sân còn thiếu ${payment.remaining.toLocaleString("vi-VN")} đ. Vui lòng thu đủ tiền trước khi hoàn tất.`
      );
    }

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: "COMPLETED",
        sessionStatus: "COMPLETED",
      },
    });

    if (tx.coachBooking) {
      await tx.coachBooking.updateMany({
        where: {
          bookingItem: { bookingId: booking.id },
          status: "CONFIRMED",
        },
        data: { status: "COMPLETED" },
      });
    }

    await tx.adminAudit.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        action: "COMPLETE",
        entityId: booking.id,
        reason: reason || "Nhân viên xác nhận hoàn tất và bàn giao sân",
        details: {
          bookingCode: booking.code,
          completedAt: now.toISOString(),
        },
      },
    });

    return { success: true };
  });
}

// ───────────── Quản lý Ca Trực (StaffShift) ─────────────

export async function startStaffShift(
  db: PrismaClient,
  actor: { id: string; role: string; status: string; name: string },
  venueId: string,
  note?: string,
  now = new Date()
) {
  return serializable(db, async (tx) => {
    await assertVenueOperatorAccess(tx, actor, venueId, false);

    const openShift = await tx.staffShift.findFirst({
      where: {
        userId: actor.id,
        venueId,
        endedAt: null,
      },
    });

    if (openShift) {
      return { success: true, shift: openShift, alreadyStarted: true };
    }

    const shift = await tx.staffShift.create({
      data: {
        userId: actor.id,
        venueId,
        startedAt: now,
        note,
      },
    });

    // Khi nhân viên vào ca trực, bất kỳ đơn nào đang chờ bàn giao tại sân đều chuyển sang bắt buộc xử lý thủ công
    await tx.booking.updateMany({
      where: {
        venueId,
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
        sessionStatus: "OVERDUE_PENDING",
      },
      data: {
        manualHandoverRequired: true,
      },
    });

    await tx.adminAudit.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        action: "START_SHIFT",
        entityId: shift.id,
        reason: note || "Bắt đầu ca trực tại sân",
        details: { venueId, startedAt: now.toISOString() },
      },
    });

    return { success: true, shift };
  });
}

export async function endStaffShift(
  db: PrismaClient,
  actor: { id: string; role: string; status: string; name: string },
  venueId: string,
  note?: string,
  now = new Date()
) {
  return serializable(db, async (tx) => {
    const shift = await tx.staffShift.findFirst({
      where: {
        userId: actor.id,
        venueId,
        endedAt: null,
      },
    });

    if (!shift) {
      throw new PaymentError(404, "Không có ca trực nào đang hoạt động.");
    }

    const updated = await tx.staffShift.update({
      where: { id: shift.id },
      data: {
        endedAt: now,
        note: note ? (shift.note ? `${shift.note}; ${note}` : note) : shift.note,
      },
    });

    await tx.adminAudit.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        action: "END_SHIFT",
        entityId: shift.id,
        reason: note || "Kết thúc ca trực tại sân",
        details: { venueId, endedAt: now.toISOString() },
      },
    });

    return { success: true, shift: updated };
  });
}

export async function getCurrentStaffShift(
  db: PrismaClient,
  userId: string,
  venueId: string
) {
  return db.staffShift.findFirst({
    where: {
      userId,
      venueId,
      endedAt: null,
    },
    orderBy: { startedAt: "desc" },
  });
}

// ───────────── Quản lý Nhân Viên Cơ Sở (VenueStaff) ─────────────

export async function getVenueStaffList(
  db: PrismaClient,
  actor: { id: string; role: string; status: string },
  venueId: string
) {
  // Chỉ OWNER của cơ sở này hoặc ADMIN
  if (actor.role !== "ADMIN") {
    const venue = await db.venue.findFirst({
      where: { id: venueId, ownerId: actor.id },
      select: { id: true },
    });
    if (!venue) throw new PaymentError(403, "Bạn không có quyền quản lý nhân viên của cơ sở này.");
  }

  const staff = await db.venueStaff.findMany({
    where: { venueId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const activeShifts = await db.staffShift.findMany({
    where: {
      venueId,
      endedAt: null,
    },
    select: { userId: true, startedAt: true },
  });

  const shiftUserIds = new Set(activeShifts.map((s) => s.userId));

  return staff.map((s) => ({
    userId: s.userId,
    venueId: s.venueId,
    name: s.user.name,
    phone: s.user.phone,
    email: s.user.email,
    userStatus: s.user.status,
    role: s.role,
    isActive: s.isActive,
    isOnShift: shiftUserIds.has(s.userId),
    createdAt: s.createdAt,
  }));
}

export async function addVenueStaff(
  db: PrismaClient,
  actor: { id: string; role: string; status: string; name: string },
  venueId: string,
  identifier: string,
  role = "RECEPTIONIST"
) {
  return serializable(db, async (tx) => {
    if (actor.role !== "ADMIN") {
      const venue = await tx.venue.findFirst({
        where: { id: venueId, ownerId: actor.id },
        select: { id: true },
      });
      if (!venue) throw new PaymentError(403, "Bạn không có quyền quản lý nhân viên cơ sở này.");
    }

    const cleanIdentifier = identifier.trim();
    const user = await tx.user.findFirst({
      where: {
        OR: [{ phone: cleanIdentifier }, { email: cleanIdentifier.toLowerCase() }],
      },
    });

    if (!user) {
      throw new PaymentError(
        404,
        "Không tìm thấy tài khoản với số điện thoại hoặc email này. Nhân viên cần đăng ký tài khoản trước."
      );
    }

    if (user.role === "CUSTOMER") {
      await tx.user.update({
        where: { id: user.id },
        data: { role: "STAFF" },
      });
    }

    const staff = await tx.venueStaff.upsert({
      where: { userId_venueId: { userId: user.id, venueId } },
      create: {
        userId: user.id,
        venueId,
        role,
        isActive: true,
      },
      update: {
        role,
        isActive: true,
      },
    });

    await tx.adminAudit.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        action: "ADD_STAFF",
        entityId: staff.userId,
        reason: `Gán nhân viên ${user.name} vào cơ sở`,
        details: { venueId, role },
      },
    });

    return {
      success: true,
      staff: {
        userId: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: staff.role,
        isActive: staff.isActive,
      },
    };
  });
}

export async function setVenueStaffActive(
  db: PrismaClient,
  actor: { id: string; role: string; status: string; name: string },
  venueId: string,
  targetUserId: string,
  isActive: boolean
) {
  return serializable(db, async (tx) => {
    if (actor.role !== "ADMIN") {
      const venue = await tx.venue.findFirst({
        where: { id: venueId, ownerId: actor.id },
        select: { id: true },
      });
      if (!venue) throw new PaymentError(403, "Bạn không có quyền quản lý nhân viên cơ sở này.");
    }

    const staff = await tx.venueStaff.findUnique({
      where: { userId_venueId: { userId: targetUserId, venueId } },
    });

    if (!staff) {
      throw new PaymentError(404, "Nhân viên không thuộc cơ sở này.");
    }

    await tx.venueStaff.update({
      where: { userId_venueId: { userId: targetUserId, venueId } },
      data: { isActive },
    });

    // Nếu vô hiệu hóa nhân viên: đóng ngay lập tức bất kỳ ca làm nào đang mở
    if (!isActive) {
      await tx.staffShift.updateMany({
        where: {
          userId: targetUserId,
          venueId,
          endedAt: null,
        },
        data: {
          endedAt: new Date(),
          note: "Tự động kết thúc ca do tài khoản bị vô hiệu hóa quyền tại cơ sở",
        },
      });
    }

    await tx.adminAudit.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        action: "SET_STAFF_STATUS",
        entityId: targetUserId,
        reason: isActive ? "Kích hoạt lại nhân viên" : "Vô hiệu hóa quyền nhân viên tại cơ sở",
        details: { venueId, isActive },
      },
    });

    return { success: true, isActive };
  });
}
