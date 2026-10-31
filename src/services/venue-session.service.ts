import { Prisma, type PrismaClient, type SessionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { PaymentError } from "../lib/sepay";
import { serializable } from "../lib/transaction";
import { formatHour, vietnamDate } from "../lib/booking";
import { approveCancellationInTransaction, completeRefund, refundLedger } from "./refund.service";
import { recordVoucherConsumption } from "./settlement.service";

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
  let freshUser = actor;
  if (typeof tx.user?.findUnique === "function") {
    const dbUser = await tx.user.findUnique({
      where: { id: actor.id },
      select: { id: true, role: true, status: true },
    });
    if (dbUser && dbUser.id === actor.id) {
      freshUser = dbUser;
    }
  }

  if (freshUser.status !== "ACTIVE") {
    throw new PaymentError(403, "Tài khoản của bạn đang bị khóa hoặc không hoạt động.");
  }

  if (freshUser.role === "ADMIN") {
    return { isOwnerOrAdmin: true, isStaff: false };
  }

  // 1. Kiểm tra vai trò chủ sở hữu cơ sở
  const ownedVenue = await tx.venue.findFirst({
    where: { id: venueId, ownerId: freshUser.id },
    select: { id: true, status: true },
  });
  if (ownedVenue) {
    return { isOwnerOrAdmin: true, isStaff: false };
  }

  // 2. Kiểm tra vai trò nhân viên tại cơ sở (áp dụng cả khi role hệ thống là STAFF hoặc OWNER của sân khác)
  const staff = await tx.venueStaff.findFirst({
    where: {
      userId: freshUser.id,
      venueId,
      isActive: true,
      venue: { status: "ACTIVE" },
    },
    select: { role: true, isActive: true },
  });

  if (staff && staff.isActive) {
    if (requireActiveShift) {
      const activeShift = await tx.staffShift.findFirst({
        where: {
          userId: freshUser.id,
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

  throw new PaymentError(403, "Bạn không có quyền quản lý hoặc làm việc tại cơ sở sân này.");
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
        group: true,
        payments: {
          where: { status: "PAID" },
          select: { amount: true, status: true, provider: true },
        },
      },
    });

    if (!booking) throw new PaymentError(404, "Không tìm thấy đơn đặt sân.");

    // Kiểm tra quyền của nhân viên/chủ sân: nhân viên bắt buộc có ca trực đang mở
    await assertVenueOperatorAccess(tx, actor, booking.venueId, true);

    if (!["CONFIRMED", "CHECKED_IN"].includes(booking.status) || booking.cancelApprovedAt) {
      throw new PaymentError(409, "Đơn không còn cho phép thu tiền.");
    }
    if (booking.group) throw new PaymentError(409, "Đơn nhóm phải thu theo từng phần tại màn hình nhóm.");
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

    // Tiêu thụ voucher / PartnerOffer nếu có trong cùng transaction
    await recordVoucherConsumption(
      tx,
      booking.id,
      booking.voucherId,
      booking.userId || actor.id,
      booking.customerName || actor.name
    );

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

    // Kiểm tra quyền của nhân viên/chủ sân: nhân viên bắt buộc có ca trực đang mở
    await assertVenueOperatorAccess(tx, actor, booking.venueId, true);

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
  let venue: {
    id: string;
    name: string;
    status: string;
    ownerId: string;
    owner: { name: string; phone: string | null; email: string | null; status: string };
  } | null = null;

  // ADMIN hoặc OWNER của cơ sở này (hỗ trợ cả id lẫn slug)
  if (actor.role === "ADMIN") {
    venue = await db.venue.findFirst({
      where: { OR: [{ id: venueId }, { slug: venueId }] },
      select: {
        id: true,
        name: true,
        status: true,
        ownerId: true,
        owner: { select: { name: true, phone: true, email: true, status: true } },
      },
    });
    if (!venue) throw new PaymentError(404, "Không tìm thấy cơ sở.");
  } else {
    venue = await db.venue.findFirst({
      where: {
        OR: [{ id: venueId }, { slug: venueId }],
        ownerId: actor.id,
      },
      select: {
        id: true,
        name: true,
        status: true,
        ownerId: true,
        owner: { select: { name: true, phone: true, email: true, status: true } },
      },
    });
    if (!venue) throw new PaymentError(403, "Bạn không có quyền quản lý nhân viên của cơ sở này.");
  }

  const staff = await db.venueStaff.findMany({
    where: { venueId: venue.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const activeShifts = await db.staffShift.findMany({
    where: {
      venueId: venue.id,
      endedAt: null,
    },
    select: { userId: true, startedAt: true },
  });

  const shiftUserIds = new Set(activeShifts.map((s) => s.userId));

  return {
    venue: {
      id: venue.id,
      name: venue.name,
      status: venue.status,
      ownerId: venue.ownerId,
      owner: venue.owner,
    },
    staff: staff.map((s) => ({
      userId: s.userId,
      venueId: s.venueId,
      name: s.user.name,
      phone: s.user.phone,
      email: s.user.email,
      userRole: s.user.role,
      userStatus: s.user.status,
      role: s.role,
      isActive: s.isActive,
      isOnShift: shiftUserIds.has(s.userId),
      createdAt: s.createdAt,
    })),
  };
}

export async function addVenueStaff(
  db: PrismaClient,
  actor: { id: string; role: string; status: string; name: string },
  venueId: string,
  identifier: string,
  role = "RECEPTIONIST"
) {
  if (role === "ADMIN" || role === "OWNER") {
    throw new PaymentError(400, "Không thể cấp vai trò Quản trị viên hoặc Chủ sân qua quan hệ nhân viên.");
  }

  return serializable(db, async (tx) => {
    const venue = await tx.venue.findFirst({
      where: {
        OR: [{ id: venueId }, { slug: venueId }],
        ...(actor.role === "ADMIN" ? {} : { ownerId: actor.id }),
        status: "ACTIVE",
      },
      select: { id: true },
    });
    if (!venue) {
      throw new PaymentError(403, "Cơ sở sân cần được duyệt và đang hoạt động để phân công nhân viên.");
    }
    const actualVenueId = venue.id;

    const cleanIdentifier = identifier.trim();
    const user = await tx.user.findFirst({
      where: {
        OR: [{ phone: cleanIdentifier }, { email: cleanIdentifier.toLowerCase() }],
      },
    });

    if (!user) {
      throw new PaymentError(
        404,
        "Không tìm thấy tài khoản với số điện thoại hoặc email này. Nhân viên cần đăng ký tài khoản trước hoặc dùng tính năng Tạo tài khoản nhân viên mới."
      );
    }

    // Không hạ quyền của OWNER hoặc ADMIN nếu người đó được thêm làm nhân viên sân khác
    if (user.role === "CUSTOMER") {
      await tx.user.update({
        where: { id: user.id },
        data: { role: "STAFF" },
      });
    }

    const staff = await tx.venueStaff.upsert({
      where: { userId_venueId: { userId: user.id, venueId: actualVenueId } },
      create: {
        userId: user.id,
        venueId: actualVenueId,
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
        details: { venueId: actualVenueId, role, userRole: user.role },
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

export async function createVenueStaffAccount(
  db: PrismaClient,
  actor: { id: string; role: string; status: string; name: string },
  venueId: string,
  input: {
    name: string;
    phone: string;
    email?: string | null;
    password: string;
    role?: string;
  }
) {
  const role = input.role || "RECEPTIONIST";
  if (role === "ADMIN" || role === "OWNER") {
    throw new PaymentError(400, "Không thể cấp vai trò Quản trị viên hoặc Chủ sân qua API nhân viên.");
  }

  return serializable(db, async (tx) => {
    const venue = await tx.venue.findFirst({
      where: {
        OR: [{ id: venueId }, { slug: venueId }],
        ...(actor.role === "ADMIN" ? {} : { ownerId: actor.id }),
        status: "ACTIVE",
      },
      select: { id: true },
    });
    if (!venue) {
      throw new PaymentError(403, "Cơ sở sân cần được duyệt và đang hoạt động trước khi tạo tài khoản nhân viên.");
    }
    const actualVenueId = venue.id;

    const cleanPhone = input.phone.trim();
    const cleanEmail = input.email ? input.email.trim().toLowerCase() : null;

    // Kiểm tra trùng tài khoản
    const existing = await tx.user.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
        ],
      },
      select: { id: true, phone: true, email: true },
    });
    if (existing) {
      throw new PaymentError(
        409,
        "Số điện thoại hoặc email này đã tồn tại trên hệ thống. Vui lòng dùng tính năng Thêm nhân viên có sẵn."
      );
    }

    if (!input.password || input.password.length < 6) {
      throw new PaymentError(400, "Mật khẩu ban đầu phải có ít nhất 6 ký tự.");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const newUser = await tx.user.create({
      data: {
        name: input.name.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        passwordHash,
        role: "STAFF",
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        status: true,
      },
    });

    const staff = await tx.venueStaff.create({
      data: {
        userId: newUser.id,
        venueId: actualVenueId,
        role,
        isActive: true,
      },
    });

    await tx.adminAudit.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        action: "CREATE_STAFF_ACCOUNT",
        entityId: newUser.id,
        reason: `Tạo tài khoản nhân viên mới ${newUser.name} tại cơ sở`,
        details: { venueId: actualVenueId, role, phone: newUser.phone, email: newUser.email },
      },
    });

    return {
      success: true,
      staff: {
        userId: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
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
  isActive: boolean,
  reason?: string
) {
  return serializable(db, async (tx) => {
    const venue = await tx.venue.findFirst({
      where: {
        OR: [{ id: venueId }, { slug: venueId }],
        ...(actor.role === "ADMIN" ? {} : { ownerId: actor.id }),
        status: "ACTIVE",
      },
      select: { id: true },
    });
    if (!venue) throw new PaymentError(403, "Bạn không có quyền quản lý nhân viên cơ sở này hoặc cơ sở chưa hoạt động.");
    const actualVenueId = venue.id;

    const staff = await tx.venueStaff.findUnique({
      where: { userId_venueId: { userId: targetUserId, venueId: actualVenueId } },
      include: { user: { select: { name: true, phone: true } } },
    });

    if (!staff) {
      throw new PaymentError(404, "Nhân viên không thuộc cơ sở này.");
    }

    const beforeStatus = staff.isActive;

    await tx.venueStaff.update({
      where: { userId_venueId: { userId: targetUserId, venueId: actualVenueId } },
      data: { isActive },
    });

    // Nếu vô hiệu hóa/sa thải: đóng ngay lập tức bất kỳ ca làm nào đang mở tại cơ sở này
    if (!isActive) {
      await tx.staffShift.updateMany({
        where: {
          userId: targetUserId,
          venueId: actualVenueId,
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
        reason: reason || (isActive ? "Kích hoạt lại quyền nhân viên tại cơ sở" : "Vô hiệu hóa/sa thải nhân viên tại cơ sở"),
        details: {
          venueId,
          before: beforeStatus,
          after: isActive,
          targetName: staff.user.name,
        },
      },
    });

    return { success: true, isActive };
  });
}

// ───────────── Thông Báo Nghiệp Vụ Tại Cơ Sở ─────────────

export async function sendVenueNotification(
  tx: Prisma.TransactionClient,
  venueId: string,
  title: string,
  body: string,
  data: Record<string, unknown>,
  excludeUserId?: string
) {
  const venue = await tx.venue.findUnique({
    where: { id: venueId },
    select: { ownerId: true, owner: { select: { status: true } } },
  });
  if (!venue) return;

  const recipientIds = new Set<string>();
  if (venue.owner?.status === "ACTIVE") {
    recipientIds.add(venue.ownerId);
  }

  const staffMembers = await tx.venueStaff.findMany({
    where: {
      venueId,
      isActive: true,
      user: { status: "ACTIVE" },
    },
    select: { userId: true },
  });

  for (const s of staffMembers) {
    recipientIds.add(s.userId);
  }

  if (excludeUserId) {
    recipientIds.delete(excludeUserId);
  }

  const eventTag = (data.tag || data.eventType || "SYSTEM") as string;
  const bookingId = data.bookingId as string | undefined;

  const idList = Array.from(recipientIds);
  for (const userId of idList) {
    // Chống gửi trùng lặp thông minh: CHỈ bỏ qua nếu CÙNG bookingId và CÙNG eventTag trong 5 phút (chống retry)
    // Các sự kiện khác nhau trên cùng đơn (ví dụ COUNTER_BOOKING -> CASH_PAID -> CANCEL_REQUEST) vẫn được ghi nhận riêng
    if (bookingId && eventTag) {
      const existing = await tx.notification.findFirst({
        where: {
          userId,
          data: {
            path: ["bookingId"],
            equals: bookingId,
          },
        },
        select: { id: true, createdAt: true, data: true },
        orderBy: { createdAt: "desc" },
      });

      if (existing) {
        const existingData = existing.data as Record<string, unknown> | null;
        const existingTag = (existingData?.tag || existingData?.eventType) as string | undefined;
        if (existingTag === eventTag && Date.now() - existing.createdAt.getTime() < 300000) {
          continue;
        }
      }
    }

    const payloadData = {
      ...data,
      venueId,
      tag: eventTag,
      url: data.url || (bookingId ? `/venue-operations?bookingId=${bookingId}&venueId=${venueId}` : `/venue-operations?venueId=${venueId}`),
    };

    await tx.notification.create({
      data: {
        userId,
        type: "SYSTEM",
        title,
        body,
        data: payloadData as Prisma.InputJsonValue,
      },
    });
  }
}

// ───────────── Tạo Đơn Tại Quầy (Counter Booking) ─────────────

export interface CounterBookingInput {
  venueId: string;
  courtId: string;
  date: string; // YYYY-MM-DD
  startMin: number;
  endMin: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  note?: string | null;
  paymentMethod: "CASH" | "BANK_TRANSFER";
  requestId?: string;
}

export async function createCounterBooking(
  db: PrismaClient,
  actor: { id: string; role: string; status: string; name: string },
  input: CounterBookingInput,
  now = new Date()
) {
  return serializable(db, async (tx) => {
    // 1. Phân quyền và ca trực: nhân viên cơ sở bắt buộc có ca trực đang mở
    await assertVenueOperatorAccess(tx, actor, input.venueId, true);

    // 2. Chống gửi trùng request và bảo vệ dữ liệu chéo cơ sở
    if (input.requestId) {
      const existing = await tx.booking.findUnique({
        where: { requestId: input.requestId },
        include: {
          items: { include: { court: true } },
          venue: { select: { id: true, name: true, paymentMode: true } },
          payments: true,
        },
      });
      if (existing) {
        // 1. Kiểm tra quyền của operator hiện tại trên chính existing.venueId (ngăn tiết lộ dữ liệu cơ sở khác)
        await assertVenueOperatorAccess(tx, actor, existing.venueId, true);

        // 2. Ràng buộc ngữ cảnh tạo đơn tại quầy:
        if (existing.venueId !== input.venueId || existing.source !== "COUNTER") {
          throw new PaymentError(409, "Mã yêu cầu (requestId) này đã được sử dụng cho một đơn đặt khác.");
        }

        // 3. So khớp payload chuẩn hóa:
        const existingItem = existing.items[0];
        if (!existingItem) {
          throw new PaymentError(409, "Dữ liệu đơn đặt sân trước đó không hoàn chỉnh. Cần đối soát.");
        }

        const existingDateStr = existingItem.date instanceof Date
          ? existingItem.date.toISOString().slice(0, 10)
          : String(existingItem.date).slice(0, 10);
        const reqDateStr = input.date.trim();

        const courtMatch = existingItem.courtId === input.courtId;
        const dateMatch = existingDateStr === reqDateStr;
        const timeMatch = existingItem.startMin === input.startMin && existingItem.endMin === input.endMin;
        const customerNameMatch = existing.customerName.trim().toLowerCase() === input.customerName.trim().toLowerCase();
        const customerPhoneMatch = existing.customerPhone.trim() === input.customerPhone.trim();
        const paymentMethodMatch = existing.paymentMethod === input.paymentMethod;

        if (!courtMatch || !dateMatch || !timeMatch || !customerNameMatch || !customerPhoneMatch || !paymentMethodMatch) {
          throw new PaymentError(409, "Mã yêu cầu (requestId) bị trùng lặp với thông tin đặt sân khác.");
        }

        return { success: true, booking: existing, alreadyCreated: true };
      }
    }

    // 3. Cơ sở
    const venue = await tx.venue.findUnique({
      where: { id: input.venueId },
      include: { pricing: true },
    });
    if (!venue || venue.status !== "ACTIVE") {
      throw new PaymentError(400, "Cơ sở này hiện không thể nhận đặt sân.");
    }

    // Kiểm tra định dạng ngày và tính hợp lệ trên lịch thực
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
      throw new PaymentError(400, "Định dạng ngày đặt sân không hợp lệ (YYYY-MM-DD).");
    }
    const dateObj = new Date(`${input.date}T00:00:00.000Z`);
    if (isNaN(dateObj.getTime()) || dateObj.toISOString().slice(0, 10) !== input.date) {
      throw new PaymentError(400, "Ngày đặt sân không tồn tại trên lịch thực.");
    }

    if (input.startMin < 0 || input.endMin > 1440 || input.startMin >= input.endMin) {
      throw new PaymentError(400, "Khung giờ đặt sân không hợp lệ.");
    }

    if (input.startMin < venue.openMin || input.endMin > venue.closeMin) {
      throw new PaymentError(400, "Khung giờ nằm ngoài thời gian hoạt động của cơ sở.");
    }
    const durationMin = input.endMin - input.startMin;
    if (durationMin < venue.minBookingMin || durationMin > venue.maxBookingMin) {
      throw new PaymentError(400, `Thời gian đặt sân phải từ ${venue.minBookingMin} đến ${venue.maxBookingMin} phút.`);
    }

    // Kiểm tra ngày quá khứ
    const todayStr = vietnamDate(now);
    if (input.date < todayStr) {
      throw new PaymentError(400, "Không thể đặt sân cho ngày trong quá khứ.");
    }

    // 4. Sân con
    const court = await tx.court.findFirst({
      where: { id: input.courtId, venueId: input.venueId, status: "ACTIVE" },
    });
    if (!court) {
      throw new PaymentError(404, "Sân không tồn tại hoặc đang bảo trì.");
    }

    // 5. Kiểm tra trùng lịch
    const blocked = await tx.courtBlock.findFirst({
      where: {
        courtId: input.courtId,
        date: dateObj,
        startMin: { lt: input.endMin },
        endMin: { gt: input.startMin },
      },
    });
    if (blocked) {
      throw new PaymentError(409, "Khung giờ này đã bị khóa. Vui lòng chọn giờ khác.");
    }

    const conflict = await tx.bookingItem.findFirst({
      where: {
        courtId: input.courtId,
        date: dateObj,
        startMin: { lt: input.endMin },
        endMin: { gt: input.startMin },
        status: { in: ["HELD", "CONFIRMED"] },
        booking: {
          OR: [
            { status: { in: ["CONFIRMED", "CHECKED_IN", "COMPLETED", "NO_SHOW"] } },
            { status: "PENDING_PAYMENT", expiresAt: { gt: now } },
          ],
        },
      },
    });
    if (conflict) {
      throw new PaymentError(409, "Khung giờ này đã có người đặt. Vui lòng chọn khung giờ khác.");
    }

    // 6. Tính giá backend theo từng khung giờ thực tế
    const dayOfWeek = dateObj.getUTCDay() === 0 ? 7 : dateObj.getUTCDay();
    const applicableRules = (venue.pricing || []).filter((p) => p.daysOfWeek.includes(dayOfWeek));

    let price = 0;
    if (applicableRules.length > 0) {
      let totalMinutesPrice = 0;
      for (let m = input.startMin; m < input.endMin; m++) {
        const matchingRules = applicableRules.filter((r) => m >= r.startMin && m < r.endMin);
        if (matchingRules.length === 0) {
          throw new PaymentError(
            400,
            `Cơ sở thiếu cấu hình giá cho khung giờ ${formatHour(m)} - ${formatHour(m + 1)}.`
          );
        }
        if (matchingRules.length > 1) {
          const prices = new Set(matchingRules.map((r) => r.walkInPrice));
          if (prices.size > 1) {
            throw new PaymentError(
              400,
              `Cấu hình giá bị chồng lấn không rõ ràng tại khung giờ ${formatHour(m)}.`
            );
          }
        }
        totalMinutesPrice += matchingRules[0].walkInPrice / 60;
      }
      price = Math.round(totalMinutesPrice);
    } else {
      const hourlyRate = venue.priceFrom ?? 100000;
      price = Math.round((hourlyRate * durationMin) / 60);
    }

    if (!Number.isSafeInteger(price) || price <= 0 || price > 2147483647) {
      throw new PaymentError(400, "Số tiền tính toán vượt quá giới hạn cho phép.");
    }

    const isCash = input.paymentMethod === "CASH";
    const code = `DATSAN${randomInt(1000000000, 10000000000)}`;

    // 7. Tạo Booking tách biệt dữ liệu: userId = null (khách vãng lai), createdByStaffId = actor.id
    const booking = await tx.booking.create({
      data: {
        requestId: input.requestId,
        code,
        userId: null,
        venueId: venue.id,
        source: "COUNTER",
        status: "CONFIRMED",
        paymentStatus: isCash ? "UNPAID" : "PENDING",
        paymentMethod: isCash ? "CASH" : "BANK_TRANSFER",
        customerName: input.customerName.trim(),
        customerPhone: input.customerPhone.trim(),
        note: input.note ? input.note.trim() : null,
        subtotal: price,
        discount: 0,
        total: price,
        hasCashPayment: isCash,
        manualHandoverRequired: true,
        createdByStaffId: actor.id,
        expiresAt: null, // Đơn tại quầy không hết hạn giữ chỗ như đơn online
        sessionStatus: "UPCOMING",
        items: {
          create: {
            courtId: court.id,
            date: dateObj,
            startMin: input.startMin,
            endMin: input.endMin,
            price,
            status: "CONFIRMED",
          },
        },
        priceLines: {
          create: {
            type: "COURT",
            amount: price,
            label: `Tiền thuê ${court.name} (${durationMin} phút - tại quầy)`,
            beneficiaryId: venue.ownerId,
          },
        },
      },
      include: {
        items: { include: { court: true } },
        venue: { select: { id: true, name: true, paymentMode: true } },
      },
    });

    // 8. Nhật ký và thông báo
    await tx.adminAudit.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        action: "COUNTER_BOOKING",
        entityId: booking.id,
        reason: `Nhân viên ${actor.name} tạo đơn tại quầy cho khách ${booking.customerName}`,
        details: {
          code: booking.code,
          venueId: venue.id,
          courtName: court.name,
          date: input.date,
          startMin: input.startMin,
          endMin: input.endMin,
          price,
          paymentMethod: input.paymentMethod,
        },
      },
    });

    await sendVenueNotification(
      tx,
      venue.id,
      `Đơn tại quầy mới · ${booking.code}`,
      `Nhân viên ${actor.name} vừa tạo đơn tại quầy cho khách ${booking.customerName} (${court.name}, ${formatHour(input.startMin)} - ${formatHour(input.endMin)}).`,
      {
        tag: "COUNTER_BOOKING",
        bookingId: booking.id,
        bookingCode: booking.code,
        venueId: venue.id,
        staffName: actor.name,
      },
      actor.id
    );

    return { success: true, booking };
  });
}

// ───────────── Hủy Đơn & Hoàn Tiền ─────────────

export async function requestBookingCancellation(
  db: PrismaClient,
  actor: { id: string; role: string; status: string; name: string },
  bookingId: string,
  reason: string,
  now = new Date()
) {
  return serializable(db, async (tx) => {
    const currentActor = await tx.user.findUnique({ where: { id: actor.id }, select: { id: true, role: true, status: true, name: true } });
    if (!currentActor || currentActor.status !== "ACTIVE") throw new PaymentError(403, "Tài khoản không hoạt động.");
    actor = currentActor;
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        venue: true,
        items: true,
        payments: { where: { status: "PAID" } },
      },
    });
    if (!booking) throw new PaymentError(404, "Không tìm thấy đơn đặt sân.");

    const isCustomer = booking.userId === actor.id;
    let isOwnerOrAdmin = actor.role === "ADMIN" || booking.venue.ownerId === actor.id;

    if (!isCustomer && !isOwnerOrAdmin) {
      const staff = await tx.venueStaff.findFirst({
        where: { userId: actor.id, venueId: booking.venueId, isActive: true },
      });
      if (!staff) throw new PaymentError(403, "Bạn không có quyền thao tác trên đơn này.");
    }

    if (actor.status !== "ACTIVE") throw new PaymentError(403, "Tài khoản không hoạt động.");
    if (!["PENDING_PAYMENT", "CONFIRMED"].includes(booking.status)) {
      throw new PaymentError(409, "Đơn đã kết thúc, đang sử dụng hoặc đã bị hủy.");
    }
    const ledger = await refundLedger(tx, booking.id);
    const isPaid = ledger.received > 0 || ["PAID", "PARTIALLY_PAID", "REFUND_PENDING", "REFUNDED"].includes(booking.paymentStatus);
    if (!isPaid || isOwnerOrAdmin) {
      const after = await approveCancellationInTransaction(tx, booking, ledger.available, reason, now);
      await tx.adminAudit.create({ data: {
        actorId: actor.id, actorName: actor.name, action: isPaid ? "APPROVE_CANCEL" : "CANCEL_UNPAID",
        entityId: booking.id, reason,
        details: { bookingCode: booking.code, received: ledger.received, additionalRefund: ledger.available, approvedAmount: after.approved },
      } });
      return { success: true, status: "CANCELLED", requiresApproval: false, refundApproved: after.approved };
    }

    // Nếu là STAFF hoặc CUSTOMER: chỉ được gửi yêu cầu hủy (chờ duyệt)
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        cancelRequestedAt: now,
        cancelReason: reason,
      },
    });

    await tx.adminAudit.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        action: "REQUEST_CANCEL",
        entityId: booking.id,
        reason,
        details: {
          bookingCode: booking.code,
          requesterRole: isCustomer ? "CUSTOMER" : "STAFF",
        },
      },
    });

    await sendVenueNotification(
      tx,
      booking.venueId,
      `Yêu cầu hủy đơn · ${booking.code}`,
      `${isCustomer ? "Khách hàng" : "Nhân viên"} đã gửi yêu cầu hủy đơn đã thanh toán ${booking.code}. Lý do: ${reason}`,
      { tag: "CANCEL_REQUEST", bookingId: booking.id, bookingCode: booking.code }
    );

    return { success: true, status: booking.status, requiresApproval: true };
  });
}

export async function approveBookingCancellation(
  db: PrismaClient,
  actor: { id: string; role: string; status: string; name: string },
  bookingId: string,
  refundAmount: number,
  reason: string,
  now = new Date()
) {
  return serializable(db, async (tx) => {
    const currentActor = await tx.user.findUnique({ where: { id: actor.id }, select: { id: true, role: true, status: true, name: true } });
    if (!currentActor || currentActor.status !== "ACTIVE") throw new PaymentError(403, "Tài khoản không hoạt động.");
    actor = currentActor;
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        venue: true,
        payments: { where: { status: "PAID" } },
      },
    });
    if (!booking) throw new PaymentError(404, "Không tìm thấy đơn đặt sân.");

    const isOwnerOrAdmin = actor.role === "ADMIN" || booking.venue.ownerId === actor.id;
    if (!isOwnerOrAdmin) {
      throw new PaymentError(403, "Chỉ chủ sân hoặc quản trị viên mới có quyền phê duyệt hủy đơn và hoàn tiền.");
    }

    if (actor.status !== "ACTIVE") throw new PaymentError(403, "Tài khoản không hoạt động.");
    const ledger = await approveCancellationInTransaction(tx, booking, refundAmount, reason, now);

    await tx.adminAudit.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        action: "APPROVE_CANCEL",
        entityId: booking.id,
        reason,
        details: {
          bookingCode: booking.code,
          refundAmountApproved: refundAmount,
          approvedBy: actor.name,
        },
      },
    });

    return { success: true, refundAmountApproved: ledger.approved };
  });
}

export async function recordManualRefund(
  db: PrismaClient,
  actor: { id: string; role: string; status: string; name: string },
  bookingId: string,
  amount: number,
  reason: string,
  refundId: string,
  reference: string,
  now = new Date()
) {
  return serializable(db, async (tx) => {
    const currentActor = await tx.user.findUnique({ where: { id: actor.id }, select: { id: true, role: true, status: true, name: true } });
    if (!currentActor || currentActor.status !== "ACTIVE") throw new PaymentError(403, "Tài khoản không hoạt động.");
    actor = currentActor;
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        venue: true,
      },
    });
    if (!booking) throw new PaymentError(404, "Không tìm thấy đơn đặt sân.");

    // Kiểm tra quyền: nhân viên hoặc chủ sân hoặc admin
    await assertVenueOperatorAccess(tx, actor, booking.venueId, false);

    const result = await completeRefund(tx, booking.id, refundId, amount, reference, actor.id, now);
    if (!result.duplicate) await tx.adminAudit.create({ data: {
      actorId: actor.id, actorName: actor.name, action: "RECORD_REFUND", entityId: booking.id, reason,
      details: { bookingCode: booking.code, refundId, amount, reference: reference.trim().toUpperCase() },
    } });
    const updated = await tx.booking.findUniqueOrThrow({ where: { id: booking.id } });
    return { success: true, ...result, paymentStatus: updated.paymentStatus };
  });
}
