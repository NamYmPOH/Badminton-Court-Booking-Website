import { Prisma, type PrismaClient } from "@prisma/client";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { PaymentError } from "../lib/sepay";
import { operatorVenueScope } from "../lib/venue-operations";
import { startCourtSession } from "./session.service";

export interface GenerateTicketInput {
  bookingId: string;
  bookingItemId?: string;
  groupShareId?: string;
  holderName: string;
  holderPhone: string;
}

export function generateSingleTicketSignature(
  ticketId: string,
  ticketNonce: string,
  secret = process.env.AUTH_SECRET || "smashbook-fallback-secret-for-testing-only-12345"
): string {
  const digest = createHmac("sha256", secret)
    .update(`single-ticket:${ticketId}:${ticketNonce}`)
    .digest("hex");
  return `ST.${ticketId}.${digest}`;
}

export function verifyTicketSignature(
  qrPayload: string,
  ticket: { id: string; ticketNonce: string },
  secret = process.env.AUTH_SECRET || "smashbook-fallback-secret-for-testing-only-12345"
): boolean {
  try {
    const expected = Buffer.from(generateSingleTicketSignature(ticket.id, ticket.ticketNonce, secret));
    const actual = Buffer.from(qrPayload);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

/**
 * Phát hành vé điện tử cho đơn đặt sân (Idempotent).
 * Nếu đơn đã có vé UNUSED, trả về vé hiện tại.
 */
export async function issueBookingTicket(
  tx: Prisma.TransactionClient | PrismaClient,
  input: GenerateTicketInput
) {
  // 1. Kiểm tra đơn đặt sân
  const booking = await tx.booking.findUnique({
    where: { id: input.bookingId },
    include: { items: true },
  });

  if (!booking) {
    throw new PaymentError(404, "Không tìm thấy đơn đặt sân để phát hành vé.");
  }

  if (["CANCELLED", "EXPIRED"].includes(booking.status)) {
    throw new PaymentError(409, `Không thể phát hành vé cho đơn ở trạng thái: ${booking.status}`);
  }

  // 2. Tìm vé chưa sử dụng hiện có (Idempotency)
  const existing = await tx.ticket.findFirst({
    where: { bookingId: booking.id, status: "UNUSED" },
  });

  if (existing) {
    return {
      ticket: existing,
      qrPayload: generateSingleTicketSignature(existing.id, existing.ticketNonce),
    };
  }

  // 3. Tính khoảng thời gian hiệu lực
  if (!booking.items.length) {
    throw new PaymentError(400, "Đơn không có sân đặt.");
  }

  const sortedItems = [...booking.items].sort((a, b) => {
    const dA = a.date instanceof Date ? a.date.toISOString().slice(0, 10) : String(a.date).slice(0, 10);
    const dB = b.date instanceof Date ? b.date.toISOString().slice(0, 10) : String(b.date).slice(0, 10);
    if (dA !== dB) return dA.localeCompare(dB);
    return a.startMin - b.startMin;
  });

  const firstItem = sortedItems[0];
  const lastItem = sortedItems[sortedItems.length - 1];

  const firstDateStr =
    firstItem.date instanceof Date ? firstItem.date.toISOString().slice(0, 10) : String(firstItem.date).slice(0, 10);
  const lastDateStr =
    lastItem.date instanceof Date ? lastItem.date.toISOString().slice(0, 10) : String(lastItem.date).slice(0, 10);

  const startHourStr = String(Math.floor(firstItem.startMin / 60)).padStart(2, "0");
  const startMinStr = String(firstItem.startMin % 60).padStart(2, "0");
  const endHourStr = String(Math.floor(lastItem.endMin / 60)).padStart(2, "0");
  const endMinStr = String(lastItem.endMin % 60).padStart(2, "0");

  const gameStart = new Date(`${firstDateStr}T${startHourStr}:${startMinStr}:00+07:00`);
  const gameEnd = new Date(`${lastDateStr}T${endHourStr}:${endMinStr}:00+07:00`);

  // Có hiệu lực từ trước 60 phút đến sau giờ chơi 60 phút
  const validFrom = new Date(gameStart.getTime() - 60 * 60 * 1000);
  const validTo = new Date(gameEnd.getTime() + 60 * 60 * 1000);

  const ticketCode = `TKT-${firstDateStr.replace(/-/g, "")}-${randomBytes(4).toString("hex").toUpperCase()}`;
  const ticketNonce = randomBytes(16).toString("hex");

  const ticket = await tx.ticket.create({
    data: {
      ticketCode,
      ticketNonce,
      bookingId: booking.id,
      bookingItemId: input.bookingItemId,
      groupShareId: input.groupShareId,
      holderName: input.holderName,
      holderPhone: input.holderPhone,
      status: "UNUSED",
      validFrom,
      validTo,
    },
  });

  const qrPayload = generateSingleTicketSignature(ticket.id, ticket.ticketNonce);

  return { ticket, qrPayload };
}

/**
 * Quét vé và check-in vào sân (Atomic & Idempotent).
 * Bảo đảm 2 request quét đồng thời chỉ 1 request thành công duy nhất.
 */
export async function checkInWithTicket(
  tx: Prisma.TransactionClient | PrismaClient,
  input: {
    qrPayload: string;
    operator: { id: string; role: string; status: string };
    now?: Date;
  }
) {
  const now = input.now || new Date();

  // 1. Phân tách payload: ST.<ticketId>.<hmac>
  const parts = input.qrPayload.split(".");
  if (parts.length !== 3 || parts[0] !== "ST") {
    throw new PaymentError(400, "Mã vé QR không đúng định dạng của SmashBook.");
  }

  const ticketId = parts[1];

  const ticket = await tx.ticket.findUnique({
    where: { id: ticketId },
    include: {
      booking: {
        include: {
          items: true,
          venue: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!ticket) {
    throw new PaymentError(404, "Không tìm thấy thông tin vé.");
  }

  // 2. Kiểm tra phân quyền người quét (Staff / Owner của cơ sở hoặc Admin)
  if (input.operator.role !== "ADMIN") {
    const isAllowed = await tx.venue.findFirst({
      where: {
        id: ticket.booking.venueId,
        ...operatorVenueScope(input.operator),
      },
      select: { id: true },
    });

    if (!isAllowed) {
      throw new PaymentError(403, "Bạn không được phân quyền quét vé tại cơ sở này.");
    }
  }

  // 3. Kiểm tra chữ ký HMAC
  const isSignatureValid = verifyTicketSignature(input.qrPayload, ticket);
  if (!isSignatureValid) {
    throw new PaymentError(400, "Chữ ký bảo mật của vé không hợp lệ hoặc đã bị can thiệp.");
  }

  // 4. Kiểm tra trạng thái đơn đặt sân
  if (["CANCELLED", "EXPIRED"].includes(ticket.booking.status)) {
    throw new PaymentError(409, `Đơn đặt sân đã bị ${ticket.booking.status === "CANCELLED" ? "hủy" : "hết hạn"}.`);
  }

  // 5. Kiểm tra khoảng thời gian hiệu lực
  if (now < ticket.validFrom) {
    throw new PaymentError(400, "Vé chưa đến thời gian có hiệu lực nhận sân.");
  }

  if (now > ticket.validTo) {
    // Tự động đánh dấu EXPIRED nếu quá giờ
    await tx.ticket.update({
      where: { id: ticket.id },
      data: { status: "EXPIRED" },
    });
    throw new PaymentError(400, "Vé đã hết hạn sử dụng.");
  }

  // 6. Kiểm tra trạng thái vé với điều kiện Atomic Update (Chống Race Condition)
  // Chỉ cập nhật nếu status === "UNUSED"
  const updateResult = await tx.ticket.updateMany({
    where: {
      id: ticket.id,
      status: "UNUSED",
    },
    data: {
      status: "CHECKED_IN",
      checkedInAt: now,
      checkedInById: input.operator.id,
    },
  });

  if (updateResult.count === 0) {
    throw new PaymentError(409, "Vé này đã được quét và sử dụng trước đó.");
  }

  // 7. Cập nhật trạng thái đơn sang CHECKED_IN nếu đang CONFIRMED
  if (ticket.booking.status === "CONFIRMED") {
    await tx.booking.update({
      where: { id: ticket.bookingId },
      data: { status: "CHECKED_IN" },
    });
  }

  // 8. Tự động khởi tạo phiên sân (CourtSession) cho các sân trong booking
  const sessions = [];
  for (const item of ticket.booking.items) {
    try {
      const session = await startCourtSession(tx, {
        bookingItemId: item.id,
        operatorId: input.operator.id,
        note: `Check-in qua vé điện tử ${ticket.ticketCode}`,
      });
      sessions.push(session);
    } catch {
      // Nếu session đã tạo rồi thì bỏ qua
    }
  }

  return {
    success: true,
    ticket: {
      ...ticket,
      status: "CHECKED_IN",
      checkedInAt: now,
      checkedInById: input.operator.id,
    },
    sessions,
  };
}
