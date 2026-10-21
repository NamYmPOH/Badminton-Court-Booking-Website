import type { InternalInvoice } from "@prisma/client";
import { serializable } from "../lib/transaction";
import { Prisma, type PrismaClient } from "@prisma/client";
import { randomInt } from "node:crypto";
import { PaymentError } from "../lib/sepay";
import { operatorVenueScope } from "../lib/venue-operations";

export interface InvoiceSnapshotItem {
  courtName: string;
  date: string;
  startMin: number;
  endMin: number;
  price: number;
}

export interface InvoiceSnapshotPayment {
  id: string;
  provider: string;
  amount: number;
  status: string;
  paidAt: string | null;
}

export interface InvoiceSnapshot {
  bookingCode: string;
  issuedAt: string;
  venue: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };
  customer: {
    name: string;
    phone: string;
    email: string | null;
  };
  items: InvoiceSnapshotItem[];
  coach: {
    coachName: string;
    fee: number;
  } | null;
  pricing: {
    subtotal: number;
    discount: number;
    total: number;
    paidAmount: number;
  };
  voucherCode: string | null;
  payments: InvoiceSnapshotPayment[];
  disclaimer: string;
}

/**
 * Sinh số hóa đơn/biên lai nội bộ duy nhất theo định dạng: INV-YYYYMMDD-XXXXXX
 */
export function generateInvoiceNumber(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const rand = randomInt(100000, 999999);
  return `INV-${yyyy}${mm}${dd}-${rand}`;
}

/**
 * Phát hành hóa đơn/biên lai nội bộ (Idempotent).
 * Nếu đơn đã có hóa đơn phát hành trước đó, trả về hóa đơn hiện tại để bảo toàn snapshot lịch sử.
 */
export async function issueInternalInvoice(
  tx: Prisma.TransactionClient | PrismaClient,
  bookingId: string,
  issuedById: string = "SYSTEM"
): Promise<InternalInvoice> {
  if ("$transaction" in tx) return serializable(tx, inner => issueInternalInvoice(inner, bookingId, issuedById));
  // 1. Kiểm tra hóa đơn đã tồn tại (Idempotency)
  const existing = await tx.internalInvoice.findFirst({
    where: { bookingId, status: "ISSUED" },
  });
  if (existing) {
    return existing;
  }

  // 2. Đọc dữ liệu chi tiết của Booking
  const booking = await tx.booking.findUnique({
    where: { id: bookingId },
    include: {
      venue: true,
      user: { select: { id: true, email: true, name: true, phone: true } },
      voucher: { select: { code: true } },
      items: {
        include: {
          court: { select: { name: true } },
          coachBooking: {
            include: {
              coach: { include: { user: { select: { name: true } } } },
            },
          },
        },
      },
      payments: {
        where: { status: "PAID" },
        select: { id: true, provider: true, amount: true, status: true, paidAt: true },
      },
    },
  });

  if (!booking) {
    throw new PaymentError(404, "Không tìm thấy đơn đặt sân để phát hành chứng từ.");
  }

  if (booking.paymentStatus !== "PAID") throw new PaymentError(409, "Chỉ phát hành biên lai khi đơn đã thanh toán đủ.");
  const coachItem = booking.items.find((i) => i.coachBooking);
  const coachData = coachItem?.coachBooking
    ? {
        coachName: coachItem.coachBooking.coach.user.name,
        fee: coachItem.coachBooking.fee,
      }
    : null;

  const totalPaid = booking.payments.reduce((sum, p) => sum + p.amount, 0);

  // 3. Tạo snapshot bất biến
  const snapshot: InvoiceSnapshot = {
    bookingCode: booking.code,
    issuedAt: new Date().toISOString(),
    venue: {
      id: booking.venue.id,
      name: booking.venue.name,
      address: booking.venue.address,
      phone: booking.venue.phone,
    },
    customer: {
      name: booking.customerName,
      phone: booking.customerPhone,
      email: booking.user?.email || null,
    },
    items: booking.items.map((it) => ({
      courtName: it.court.name,
      date: it.date instanceof Date ? it.date.toISOString().slice(0, 10) : String(it.date).slice(0, 10),
      startMin: it.startMin,
      endMin: it.endMin,
      price: it.price,
    })),
    coach: coachData,
    pricing: {
      subtotal: booking.subtotal,
      discount: booking.discount,
      total: booking.total,
      paidAmount: totalPaid,
    },
    voucherCode: booking.voucher?.code || null,
    payments: booking.payments.map((p) => ({
      id: p.id,
      provider: p.provider,
      amount: p.amount,
      status: p.status,
      paidAt: p.paidAt?.toISOString() || null,
    })),
    disclaimer:
      "Đây là chứng từ nội bộ / biên lai thanh toán dịch vụ của SmashBook. Chứng từ này không thay thế hóa đơn điện tử GTGT theo quy định của cơ quan thuế.",
  };

  const invoiceNumber = generateInvoiceNumber();

  return tx.internalInvoice.create({
    data: {
      invoiceNumber,
      bookingId: booking.id,
      venueId: booking.venueId,
      issuedById,
      subtotal: booking.subtotal,
      discount: booking.discount,
      totalAmount: booking.total,
      paidAmount: totalPaid,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.user?.email || null,
      venueName: booking.venue.name,
      venueAddress: booking.venue.address,
      snapshot: snapshot as unknown as Prisma.InputJsonValue,
      status: "ISSUED",
    },
  });
}

/**
 * Lấy chứng từ nội bộ theo mã đơn đặt sân, có kiểm tra quyền truy cập nghiêm ngặt.
 */
export async function getInvoiceByBookingCode(
  db: PrismaClient,
  bookingCode: string,
  actor: { id: string; role: string; status: string }
) {
  const booking = await db.booking.findUnique({
    where: { code: bookingCode },
    select: { id: true, userId: true, venueId: true, code: true, status: true, paymentStatus: true },
  });

  if (!booking) {
    throw new PaymentError(404, "Không tìm thấy đơn đặt sân.");
  }

  // Kiểm tra phân quyền truy cập:
  // - Khách hàng sở hữu đơn
  // - Quản trị viên hệ thống (ADMIN)
  // - Nhân viên / Chủ sân thuộc venue này
  if (actor.role !== "ADMIN" && booking.userId !== actor.id) {
    const isStaffOrOwner = await db.venue.findFirst({
      where: {
        id: booking.venueId,
        ...operatorVenueScope(actor),
      },
      select: { id: true },
    });

    if (!isStaffOrOwner) {
      throw new PaymentError(403, "Bạn không có quyền truy cập chứng từ của đơn này.");
    }
  }

  // Tìm hóa đơn hiện có
  let invoice = await db.internalInvoice.findFirst({
    where: { bookingId: booking.id, status: "ISSUED" },
  });

  // Nếu đơn đã thanh toán hoặc xác nhận mà chưa có chứng từ -> tự động phát hành on-demand
  if (!invoice && booking.paymentStatus === "PAID") {
    invoice = await issueInternalInvoice(db, booking.id, actor.id);
  }

  if (!invoice) {
    throw new PaymentError(404, "Chưa có chứng từ cho đơn đặt sân này (đơn chưa hoàn tất thanh toán).");
  }

  return invoice;
}
