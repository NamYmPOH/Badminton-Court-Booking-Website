import { type PrismaClient } from "@prisma/client";
import { PaymentError } from "../lib/sepay";
import { serializable } from "../lib/transaction";
import { sendVenueNotification } from "./venue-session.service";

export interface TransferInput {
  bookingCode: string;
  actorId: string;
  receiverName: string;
  receiverPhone: string;
  note?: string;
}

export async function transferBooking(
  db: PrismaClient,
  input: TransferInput,
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

    // 2. Tìm đơn đặt sân
    const booking = await tx.booking.findUnique({
      where: { code: input.bookingCode },
      include: {
        venue: { select: { id: true, name: true, ownerId: true } },
      },
    });

    if (!booking) {
      throw new PaymentError(404, "Không tìm thấy đơn đặt sân.");
    }

    // Phân quyền: chỉ chủ đơn đặt ban đầu hoặc admin hệ thống mới được chuyển nhượng
    const isOwnerOrAdmin = actor.role === "ADMIN";
    const isOriginalBooker = booking.userId === actor.id;

    if (!isOriginalBooker && !isOwnerOrAdmin) {
      throw new PaymentError(403, "Chỉ chủ đặt đơn ban đầu mới có quyền chuyển nhượng lịch chơi.");
    }

    // Chặn chuyển nhượng trên đơn đã kết thúc, đã nhận sân, hết hạn hoặc đã hủy
    if (["CANCELLED", "EXPIRED", "CHECKED_IN", "COMPLETED", "NO_SHOW"].includes(booking.status)) {
      throw new PaymentError(
        409,
        `Không thể chuyển nhượng đơn đang ở trạng thái: ${booking.status}. Đơn phải còn hiệu lực trước giờ chơi.`
      );
    }

    if (booking.cancelRequestedAt) {
      throw new PaymentError(409, "Đơn đang trong quy trình chờ duyệt hủy, không thể chuyển nhượng.");
    }

    // 3. Chuẩn hóa thông tin người nhận
    const cleanName = input.receiverName.trim();
    const cleanPhone = input.receiverPhone.trim();
    if (cleanName.length < 2 || cleanName.length > 100) {
      throw new PaymentError(400, "Họ và tên người nhận phải từ 2 đến 100 ký tự.");
    }
    if (!/^(0[35789]\d{8}|\+84[35789]\d{8})$/.test(cleanPhone)) {
      throw new PaymentError(400, "Số điện thoại người nhận không đúng định dạng (0xxxxxxxxx).");
    }

    // 4. Cập nhật thông tin người nhận chuyển nhượng lên Booking mà KHÔNG ghi đè thông tin người đặt ban đầu
    // Người trả tiền và quyền hoàn tiền vẫn thuộc về người đặt/thanh toán ban đầu
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        transfereeName: cleanName,
        transfereePhone: cleanPhone,
        transfereeNote: input.note?.trim() || null,
        transferredAt: now,
      },
    });

    // 5. Lưu vết lịch sử chuyển nhượng BookingTransferHistory
    const history = await tx.bookingTransferHistory.create({
      data: {
        bookingId: booking.id,
        senderId: actor.id,
        senderName: actor.name,
        receiverName: cleanName,
        receiverPhone: cleanPhone,
        note: input.note?.trim() || null,
        transferredAt: now,
      },
    });

    // 6. Gửi thông báo đến ban quản lý / nhân viên cơ sở sân
    await sendVenueNotification(
      tx,
      booking.venue.id,
      `Chuyển nhượng lịch chơi · ${booking.code}`,
      `Đơn ${booking.code} đã được chuyển nhượng cho: ${cleanName} (${cleanPhone}). Lưu ý: người nhận sân không tự động nhận quyền hoàn tiền.`,
      {
        tag: "BOOKING_TRANSFERRED",
        bookingId: booking.id,
        bookingCode: booking.code,
        receiverName: cleanName,
        receiverPhone: cleanPhone,
      }
    );

    // 7. Ghi nhật ký quản trị AdminAudit
    await tx.adminAudit.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        action: "TRANSFER_BOOKING",
        entityId: booking.id,
        reason: input.note || "Khách hàng chuyển nhượng lịch chơi",
        details: {
          bookingCode: booking.code,
          originalBooker: booking.customerName,
          originalPhone: booking.customerPhone,
          transfereeName: cleanName,
          transfereePhone: cleanPhone,
        },
      },
    });

    return {
      success: true,
      bookingCode: booking.code,
      transfereeName: cleanName,
      transfereePhone: cleanPhone,
      transferredAt: now.toISOString(),
      historyId: history.id,
    };
  });
}

