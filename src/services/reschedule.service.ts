import { Prisma, type PrismaClient } from "@prisma/client";
import { PaymentError } from "../lib/sepay";
import { serializable } from "../lib/transaction";
import { checkRescheduleEligibility } from "../lib/cancellation-policy";
import { priceBooking, type BookingRequest } from "../lib/booking-request";
import { reserveRefund, refundLedger } from "./refund.service";

export interface RescheduleInput {
  bookingCode: string;
  actorId: string;
  newDate: string; // YYYY-MM-DD
  newSlots: Array<{ courtId: string; startMin: number; endMin: number }>;
  reason?: string;
}

export async function rescheduleBooking(
  db: PrismaClient,
  input: RescheduleInput,
  now = new Date()
) {
  return serializable(db, async (tx) => {
    // 1. Xác thực người thao tác
    const actor = await tx.user.findUnique({
      where: { id: input.actorId },
      select: { id: true, name: true, role: true, status: true },
    });
    if (!actor || actor.status !== "ACTIVE") {
      throw new PaymentError(403, "Tài khoản của bạn đã bị khóa hoặc không tồn tại.");
    }

    // 2. Tải thông tin đơn đặt sân hiện tại kèm các slot
    const booking = await tx.booking.findUnique({
      where: { code: input.bookingCode },
      include: {
        venue: {
          include: {
            courts: true,
            pricing: true,
          },
        },
        items: {
          where: { status: { in: ["HELD", "CONFIRMED"] } },
          include: { court: true },
        },
      },
    });

    if (!booking) {
      throw new PaymentError(404, "Không tìm thấy đơn đặt sân.");
    }

    // Phân quyền: chủ đơn, chủ sân, nhân viên cơ sở hoặc admin
    const isOwnerOrAdmin = actor.role === "ADMIN" || booking.venue.ownerId === actor.id;
    const isCustomer = booking.userId === actor.id;
    if (!isCustomer && !isOwnerOrAdmin) {
      const staff = await tx.venueStaff.findFirst({
        where: { userId: actor.id, venueId: booking.venueId, isActive: true },
      });
      if (!staff) {
        throw new PaymentError(403, "Bạn không có quyền đổi lịch cho đơn đặt sân này.");
      }
    }

    // Trạng thái cho phép: CONFIRMED hoặc PENDING_PAYMENT
    if (!["CONFIRMED", "PENDING_PAYMENT"].includes(booking.status)) {
      throw new PaymentError(409, "Chỉ có thể đổi lịch cho đơn đang giữ chỗ hoặc đã xác nhận.");
    }

    if (booking.status === "CANCELLED" || booking.cancelRequestedAt) {
      throw new PaymentError(409, "Đơn đang yêu cầu hủy hoặc đã bị hủy, không thể đổi lịch.");
    }

    // 3. Kiểm tra hạn tối thiểu 6 giờ trước giờ chơi đầu tiên
    const eligibility = checkRescheduleEligibility(booking.items, now);
    if (!eligibility.eligible && !isOwnerOrAdmin) {
      throw new PaymentError(400, eligibility.reason || "Đã quá hạn cho phép đổi lịch (cần trước ít nhất 6 giờ).");
    }

    // 4. Kiểm tra và định giá lịch mới theo quy tắc hiện có
    const dummyRequest: BookingRequest = {
      requestId: `reschedule-${booking.code}-${now.getTime()}`,
      venueId: booking.venueId,
      date: input.newDate,
      slots: input.newSlots,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      note: input.reason || "",
      coachId: null,
      voucherCode: null,
    };

    const priced = priceBooking(dummyRequest, booking.venue, now);
    const newCourtId = priced.slots[0].courtId;
    const newStartMin = priced.slots[0].startMin;
    const newEndMin = priced.slots[priced.slots.length - 1].endMin;

    // 5. Kiểm tra tình trạng sân mới: không vướng CourtBlock
    const blocked = await tx.courtBlock.findFirst({
      where: {
        courtId: newCourtId,
        date: priced.date,
        startMin: { lt: newEndMin },
        endMin: { gt: newStartMin },
      },
    });
    if (blocked) {
      throw new PaymentError(409, "Khung giờ mới đã bị khóa để bảo trì hoặc sự kiện. Vui lòng chọn giờ khác.");
    }

    // 6. Kiểm tra tình trạng sân mới: không xung đột với đơn khác đang hoạt động
    // Lưu ý: loại trừ chính các bookingItem thuộc đơn này
    const oldItemIds = booking.items.map((i) => i.id);
    const conflict = await tx.bookingItem.findFirst({
      where: {
        id: { notIn: oldItemIds },
        courtId: newCourtId,
        date: priced.date,
        startMin: { lt: newEndMin },
        endMin: { gt: newStartMin },
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
      throw new PaymentError(409, "Khung giờ mới vừa có khách khác đặt hoặc giữ chỗ. Vui lòng chọn giờ khác.");
    }

    // 7. Lưu lại snapshot lịch cũ và lịch mới
    const oldItemsSnapshot = booking.items.map((i) => ({
      id: i.id,
      courtId: i.courtId,
      courtName: i.court.name,
      date: i.date instanceof Date ? i.date.toISOString().slice(0, 10) : String(i.date).slice(0, 10),
      startMin: i.startMin,
      endMin: i.endMin,
      price: i.price,
    }));

    const newItemsSnapshot = priced.slots.map((s) => ({
      courtId: s.courtId,
      courtName: s.courtName,
      date: input.newDate,
      startMin: s.startMin,
      endMin: s.endMin,
      price: s.price,
    }));

    // 8. Đổi lịch nguyên tử: tạo items mới trước, rồi mới giải phóng items cũ
    const newItemRecords = await Promise.all(
      priced.slots.map((slot) =>
        tx.bookingItem.create({
          data: {
            bookingId: booking.id,
            courtId: slot.courtId,
            date: priced.date,
            startMin: slot.startMin,
            endMin: slot.endMin,
            price: slot.price,
            status: booking.status === "CONFIRMED" ? "CONFIRMED" : "HELD",
          },
        })
      )
    );

    // Giải phóng các slot cũ
    await tx.bookingItem.updateMany({
      where: { id: { in: oldItemIds } },
      data: { status: "CANCELLED" },
    });

    // 9. Tính toán chênh lệch giá và cập nhật tài chính
    const oldSubtotal = booking.subtotal;
    const newSubtotal = priced.total;
    const newTotal = Math.max(0, newSubtotal - booking.discount);
    const oldTotal = booking.total;
    const priceDifference = newTotal - oldTotal;

    const ledger = await refundLedger(tx, booking.id);
    let updatedPaymentStatus = booking.paymentStatus;

    if (priceDifference > 0) {
      // Giá mới cao hơn: khách cần thanh toán thêm phần chênh lệch
      if (booking.paymentStatus === "PAID") {
        updatedPaymentStatus = "PARTIALLY_PAID";
      }
    } else if (priceDifference < 0) {
      // Giá mới thấp hơn: nếu đơn đã thu tiền, tạo nghĩa vụ hoàn tiền cho phần thừa
      const refundSurplus = Math.abs(priceDifference);
      if (ledger.received > 0 && ledger.available >= refundSurplus) {
        await reserveRefund(tx, booking.id, refundSurplus, `Hoàn tiền chênh lệch đổi lịch đơn ${booking.code}`);
        updatedPaymentStatus = "REFUND_PENDING";
      }
    }

    // Cập nhật đơn
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        subtotal: newSubtotal,
        total: newTotal,
        paymentStatus: updatedPaymentStatus,
      },
    });

    // 10. Ghi nhật ký đổi lịch BookingRescheduleHistory
    const history = await tx.bookingRescheduleHistory.create({
      data: {
        bookingId: booking.id,
        actorId: actor.id,
        actorName: actor.name,
        oldItemsSnapshot: oldItemsSnapshot as unknown as Prisma.InputJsonValue,
        newItemsSnapshot: newItemsSnapshot as unknown as Prisma.InputJsonValue,
        oldTotal,
        newTotal,
        priceDifference,
        reason: input.reason || null,
        createdAt: now,
      },
    });

    // Ghi AdminAudit
    await tx.adminAudit.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        action: "RESCHEDULE_BOOKING",
        entityId: booking.id,
        reason: input.reason || "Đổi lịch theo yêu cầu",
        details: {
          bookingCode: booking.code,
          oldTotal,
          newTotal,
          priceDifference,
          newDate: input.newDate,
        },
      },
    });

    return {
      success: true,
      bookingCode: booking.code,
      oldTotal,
      newTotal,
      priceDifference,
      paymentStatus: updatedPaymentStatus,
      newSlots: newItemsSnapshot,
      historyId: history.id,
    };
  });
}

