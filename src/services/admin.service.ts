import { Prisma, type PrismaClient } from "@prisma/client";
import {
  assertAdmin,
  checkBookingAction,
  type AdminAction,
} from "../lib/admin-policy";
import { getSepayConfig, parseSepayEvent, PaymentError } from "../lib/sepay";
import { serializable } from "./sepay.service";

export async function performAdminAction(
  db: PrismaClient,
  actorId: string,
  input: AdminAction,
) {
  return serializable(db, async (tx) => {
    // Đọc lại quyền TRONG transaction: cookie không lưu hoặc quyết định quyền.
    const actor = await tx.user.findUnique({
      where: { id: actorId },
      select: { id: true, name: true, role: true, status: true },
    });
    assertAdmin(actor);
    let details: Prisma.InputJsonObject = {};
    const now = new Date();
    if (input.action === "USER_ACCESS") {
      const user = await tx.user.findUnique({ where: { id: input.id } });
      if (!user) throw new PaymentError(404, "Không tìm thấy tài khoản.");
      if (
        user.id === actorId &&
        (input.role !== "ADMIN" || input.status !== "ACTIVE")
      )
        throw new PaymentError(
          409,
          "Không thể tự khóa hoặc tự thu hồi quyền quản trị.",
        );
      if (
        user.role === "ADMIN" &&
        user.status === "ACTIVE" &&
        (input.role !== "ADMIN" || input.status !== "ACTIVE")
      ) {
        const count = await tx.user.count({
          where: { role: "ADMIN", status: "ACTIVE" },
        });
        if (count <= 1)
          throw new PaymentError(
            409,
            "Phải giữ ít nhất một quản trị viên hoạt động.",
          );
      }
      await tx.user.update({
        where: { id: user.id },
        data: { role: input.role, status: input.status },
      });
      details = {
        before: { role: user.role, status: user.status },
        after: { role: input.role, status: input.status },
      };
    } else if (input.action === "VENUE_STATUS") {
      const venue = await tx.venue.findUnique({
        where: { id: input.id },
        include: { courts: true, pricing: true, owner: true },
      });
      if (!venue) throw new PaymentError(404, "Không tìm thấy cơ sở.");
      if (input.status === "ACTIVE") {
        if (
          venue.owner.status !== "ACTIVE" ||
          !venue.courts.some((c) => c.status === "ACTIVE") ||
          !venue.pricing.length
        )
          throw new PaymentError(
            409,
            "Cơ sở cần chủ tài khoản hoạt động, sân hoạt động và bảng giá trước khi duyệt.",
          );
        if (venue.owner.role === "CUSTOMER")
          await tx.user.update({
            where: { id: venue.ownerId },
            data: { role: "OWNER" },
          });
      }
      await tx.venue.update({
        where: { id: venue.id },
        data: { status: input.status },
      });
      details = {
        before: venue.status,
        after: input.status,
        venue: venue.name,
        ownerId: venue.ownerId,
        ownerRoleBefore: venue.owner.role,
      };
    } else if (input.action === "MATCH_RECEIPT") {
      const receipt = await tx.sepayReceipt.findUnique({
        where: { transactionId: input.id },
      });
      if (!receipt || !receipt.result.startsWith("REVIEW_"))
        throw new PaymentError(
          409,
          "Giao dịch không còn ở trạng thái cần đối soát.",
        );
      const event = parseSepayEvent(
        Buffer.from(JSON.stringify(receipt.payload)),
      );
      const config = getSepayConfig();
      if (
        event.transferType !== "in" ||
        event.accountNumber !== config.BANK_ACCOUNT_NO ||
        event.gateway.toLowerCase() !==
          config.SEPAY_BANK_GATEWAY.toLowerCase() ||
        (config.SEPAY_SUB_ACCOUNT &&
          config.SEPAY_SUB_ACCOUNT !== event.subAccount)
      )
        throw new PaymentError(
          409,
          "Giao dịch không vào tài khoản ngân hàng đã cấu hình.",
        );
      const booking = await tx.booking.findUnique({
        where: { code: input.bookingCode },
        include: { items: true },
      });
      if (
        !booking ||
        booking.status !== "PENDING_PAYMENT" ||
        !["PENDING", "UNPAID"].includes(booking.paymentStatus) ||
        !booking.expiresAt ||
        booking.expiresAt <= now
      )
        throw new PaymentError(
          409,
          "Chỉ ghép với đơn đang chờ thanh toán và chưa hết hạn.",
        );
      if (
        event.transferAmount !== booking.total ||
        !booking.items.length ||
        booking.items.some((i) => i.status !== "HELD")
      )
        throw new PaymentError(
          409,
          "Số tiền không khớp hoặc sân không còn được giữ.",
        );
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          provider: "BANK_TRANSFER",
          amount: booking.total,
          status: "PAID",
          txnRef: `SEPAY-${receipt.transactionId}`,
          providerTxnNo: receipt.transactionId,
          paidAt: now,
          rawPayload: event as Prisma.InputJsonObject,
        },
      });
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "CONFIRMED", paymentStatus: "PAID", expiresAt: null },
      });
      await tx.bookingItem.updateMany({
        where: { bookingId: booking.id, status: "HELD" },
        data: { status: "CONFIRMED" },
      });
      await tx.sepayReceipt.update({
        where: { transactionId: receipt.transactionId },
        data: { result: "PAID_MANUAL_MATCH", bookingCode: booking.code },
      });
      details = {
        before: receipt.result,
        after: "PAID_MANUAL_MATCH",
        bookingCode: booking.code,
        amount: booking.total,
      };
    } else {
      const booking = await tx.booking.findUnique({
        where: { id: input.id },
        include: { venue: true, items: true },
      });
      if (!booking) throw new PaymentError(404, "Không tìm thấy đơn đặt sân.");
      checkBookingAction(booking, input.action, now);
      const update: Prisma.BookingUpdateInput = {};
      if (input.action === "CONFIRM") {
        if (
          !booking.items.length ||
          booking.items.some((i) => i.status !== "HELD")
        )
          throw new PaymentError(409, "Sân không còn được giữ.");
        update.status = "CONFIRMED";
        update.expiresAt = null;
        await tx.bookingItem.updateMany({
          where: { bookingId: booking.id, status: "HELD" },
          data: { status: "CONFIRMED" },
        });
      }
      if (input.action === "CHECK_IN") update.status = "CHECKED_IN";
      if (input.action === "COMPLETE") update.status = "COMPLETED";
      if (input.action === "CANCEL") {
        update.status = "CANCELLED";
        update.cancelledAt = now;
        update.cancelReason = input.reason;
        update.expiresAt = null;
        if (booking.paymentStatus === "PAID") {
          update.paymentStatus = "REFUND_PENDING";
          await tx.payment.updateMany({
            where: { bookingId: booking.id, status: "PAID" },
            data: { status: "REFUND_PENDING" },
          });
        }
        await tx.bookingItem.updateMany({
          where: {
            bookingId: booking.id,
            status: { in: ["HELD", "CONFIRMED"] },
          },
          data: { status: "CANCELLED" },
        });
      }
      if (input.action === "CASH_PAID") {
        await tx.payment.create({
          data: {
            bookingId: booking.id,
            provider: "CASH",
            amount: booking.total,
            status: "PAID",
            txnRef: `CASH-${booking.id}`,
            paidAt: now,
          },
        });
        update.paymentStatus = "PAID";
      }
      await tx.booking.update({ where: { id: booking.id }, data: update });
      details = {
        bookingCode: booking.code,
        before: {
          status: booking.status,
          paymentStatus: booking.paymentStatus,
        },
        after: {
          status: String(update.status || booking.status),
          paymentStatus: String(update.paymentStatus || booking.paymentStatus),
        },
      };
    }
    // Nếu ghi nhật ký thất bại, toàn bộ thao tác được rollback.
    await tx.adminAudit.create({
      data: {
        actorId,
        actorName: actor!.name,
        action: input.action,
        entityId: input.id,
        reason: input.reason,
        details,
      },
    });
    return { success: true };
  });
}
