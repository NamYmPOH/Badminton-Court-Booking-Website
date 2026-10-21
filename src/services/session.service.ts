import { slotTime } from "../lib/group-payment";
import { Prisma, type PrismaClient } from "@prisma/client";
import { PaymentError } from "../lib/sepay";

export interface StartSessionInput {
  bookingItemId: string;
  operatorId: string;
  note?: string;
}

export interface CompleteSessionInput {
  sessionId: string;
  operatorId: string;
  note?: string;
  checkOutAt?: Date;
}

export interface AddSurchargeInput {
  requestId: string;
  sessionId: string;
  createdById: string;
  type: "OVERTIME" | "SERVICE" | "DAMAGE" | "OTHER";
  amount: number;
  reason: string;
  paymentMethod?: string;
  isPaid?: boolean;
}

/**
 * Bắt đầu phiên nhận sân thực tế cho một BookingItem (Idempotent).
 * Nhận sân lặp lại sẽ trả về phiên đang hoạt động, không tạo trùng.
 */
export async function startCourtSession(
  tx: Prisma.TransactionClient | PrismaClient,
  input: StartSessionInput
) {
  // 1. Kiểm tra session hiện có
  const existing = await tx.courtSession.findUnique({
    where: { bookingItemId: input.bookingItemId },
    include: { surcharges: true },
  });

  if (existing) {
    if (existing.status === "ACTIVE") {
      return existing; // Idempotent
    }
    throw new PaymentError(409, "Khung giờ sân này đã hoàn tất phiên sử dụng trước đó.");
  }

  // 2. Kiểm tra BookingItem
  const item = await tx.bookingItem.findUnique({
    where: { id: input.bookingItemId },
    include: { booking: true },
  });

  if (!item) {
    throw new PaymentError(404, "Không tìm thấy sân đặt.");
  }

  if (!["HELD", "CONFIRMED"].includes(item.status)) {
    throw new PaymentError(409, `Không thể nhận sân ở trạng thái: ${item.status}`);
  }

  const now = new Date();
  if (item.status !== "CONFIRMED" || item.booking.paymentStatus !== "PAID" || !["CONFIRMED", "CHECKED_IN"].includes(item.booking.status)) throw new PaymentError(409, "Đơn chưa đủ điều kiện nhận sân.");
  if (now.getTime() < slotTime(item) - 15 * 60000 || now.getTime() >= slotTime(item, item.endMin)) throw new PaymentError(409, "Chưa đến hoặc đã hết thời gian nhận sân.");

  // 3. Cập nhật Booking sang CHECKED_IN nếu đang CONFIRMED
  if (item.booking.status === "CONFIRMED") {
    await tx.booking.update({
      where: { id: item.bookingId },
      data: { status: "CHECKED_IN" },
    });
  }

  // 4. Tạo CourtSession
  return tx.courtSession.create({
    data: {
      bookingItemId: item.id,
      bookingId: item.bookingId,
      courtId: item.courtId,
      operatorId: input.operatorId,
      checkInAt: now,
      status: "ACTIVE",
      note: input.note,
    },
    include: { surcharges: true },
  });
}

/**
 * Kết thúc phiên trả sân thực tế
 */
export async function completeCourtSession(
  tx: Prisma.TransactionClient | PrismaClient,
  input: CompleteSessionInput
) {
  const session = await tx.courtSession.findUnique({
    where: { id: input.sessionId },
    include: { surcharges: true },
  });

  if (!session) {
    throw new PaymentError(404, "Không tìm thấy phiên sân.");
  }

  if (session.status === "COMPLETED") {
    return session; // Idempotent
  }

  const checkOutAt = input.checkOutAt || new Date();

  const updatedSession = await tx.courtSession.update({
    where: { id: session.id },
    data: {
      status: "COMPLETED",
      checkOutAt,
      note: input.note ? `${session.note ? session.note + "; " : ""}${input.note}` : session.note,
    },
    include: { surcharges: true },
  });

  // Kiểm tra nếu tất cả items của booking đã có session COMPLETED thì chuyển Booking sang COMPLETED
  const allItems = await tx.bookingItem.findMany({
    where: { bookingId: session.bookingId },
    include: { session: true },
  });

  const allCompleted = allItems.every(
    (it) => it.session && it.session.status === "COMPLETED"
  );

  if (allCompleted) {
    await tx.booking.update({
      where: { id: session.bookingId },
      data: { status: "COMPLETED" },
    });
  }

  return updatedSession;
}

/**
 * Ghi nhận phụ thu phát sinh trong phiên (quá giờ, nước uống, thuê vợt, hỏng hóc...)
 * Không làm thay đổi Payment gốc đã thanh toán để bảo đảm đối soát kế toán.
 */
export async function addCourtSurcharge(
  tx: Prisma.TransactionClient | PrismaClient,
  input: AddSurchargeInput
) {
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
    throw new PaymentError(400, "Số tiền phụ thu không hợp lệ.");
  }

  const existing = await tx.courtSurcharge.findUnique({ where: { requestId: input.requestId } });
  if (existing) {
    if (existing.sessionId !== input.sessionId || existing.amount !== input.amount || existing.type !== input.type || existing.reason !== input.reason.trim()) throw new PaymentError(409, "Mã yêu cầu phụ thu đã được dùng với nội dung khác.");
    return existing;
  }
  const session = await tx.courtSession.findUnique({
    where: { id: input.sessionId },
    include: { booking: true },
  });

  if (!session) {
    throw new PaymentError(404, "Không tìm thấy phiên sân để ghi nhận phụ thu.");
  }

  const now = new Date();

  return tx.courtSurcharge.create({
    data: {
      requestId: input.requestId,
      sessionId: session.id,
      bookingId: session.bookingId,
      venueId: session.booking.venueId,
      createdById: input.createdById,
      type: input.type,
      amount: input.amount,
      reason: input.reason.trim(),
      status: input.isPaid ? "PAID" : "UNPAID",
      paymentMethod: input.paymentMethod || (input.isPaid ? "CASH" : null),
      paidAt: input.isPaid ? now : null,
    },
  });
}

/**
 * Thu tiền / Cập nhật trạng thái phụ thu sang PAID
 */
export async function payCourtSurcharge(
  tx: Prisma.TransactionClient | PrismaClient,
  surchargeId: string,
  paymentMethod: string = "CASH"
) {
  const surcharge = await tx.courtSurcharge.findUnique({
    where: { id: surchargeId },
  });

  if (!surcharge) {
    throw new PaymentError(404, "Không tìm thấy khoản phụ thu.");
  }

  if (surcharge.status === "PAID") {
    return surcharge; // Idempotent
  }

  return tx.courtSurcharge.update({
    where: { id: surcharge.id },
    data: {
      status: "PAID",
      paymentMethod,
      paidAt: new Date(),
    },
  });
}
