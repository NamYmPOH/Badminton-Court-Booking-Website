import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { paymentErrorResponse, PaymentError } from "@/lib/sepay";
import {
  issueBookingTicket,
  generateSingleTicketSignature,
} from "@/services/ticket.service";
import { operatorVenueScope } from "@/lib/venue-operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const userId = await requirePaymentUser();
    const actor = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, status: true },
    });

    if (!actor || actor.status !== "ACTIVE") {
      throw new PaymentError(403, "Tài khoản của bạn không có quyền truy cập.");
    }

    const booking = await db.booking.findUnique({
      where: { code: params.code },
      include: {
        group: true,
        venue: { select: { id: true, name: true, address: true } },
        items: { include: { court: { select: { name: true } } } },
      },
    });

    if (!booking) {
      throw new PaymentError(404, "Không tìm thấy đơn đặt sân.");
    }

    // Kiểm tra phân quyền truy cập:
    // - Khách hàng sở hữu đơn
    // - Quản trị viên (ADMIN)
    // - Nhân viên / Chủ sân thuộc venue
    if (actor.role !== "ADMIN" && booking.userId !== actor.id) {
      const isStaffOrOwner = await db.venue.findFirst({
        where: {
          id: booking.venueId,
          ...operatorVenueScope(actor),
        },
        select: { id: true },
      });

      if (!isStaffOrOwner) {
        throw new PaymentError(403, "Bạn không có quyền truy cập vé của đơn này.");
      }
    }

    if (booking.group) throw new PaymentError(409, "Hãy lấy vé riêng của thành viên tại trang nhóm.");
    // Tìm vé hiện có
    let ticket = await db.ticket.findFirst({
      where: { bookingId: booking.id },
      orderBy: { createdAt: "desc" },
    });

    let qrPayload = "";

    // Nếu chưa có vé và đơn đã được xác nhận hoặc thanh toán -> tự động phát hành vé
    if (!ticket && (booking.status === "CONFIRMED" || booking.paymentStatus === "PAID")) {
      const res = await issueBookingTicket(db, {
        bookingId: booking.id,
        holderName: booking.customerName,
        holderPhone: booking.customerPhone,
      });
      ticket = res.ticket;
      qrPayload = res.qrPayload;
    } else if (ticket) {
      qrPayload = generateSingleTicketSignature(ticket.id, ticket.ticketNonce);
    }

    if (!ticket) {
      throw new PaymentError(404, "Chưa có vé cho đơn này (đơn chưa được xác nhận hoặc thanh toán).");
    }

    return Response.json(
      {
        success: true,
        ticket: {
          id: ticket.id,
          ticketCode: ticket.ticketCode,
          holderName: ticket.holderName,
          holderPhone: ticket.holderPhone,
          status: ticket.status,
          validFrom: ticket.validFrom.toISOString(),
          validTo: ticket.validTo.toISOString(),
          checkedInAt: ticket.checkedInAt?.toISOString() || null,
          venueName: booking.venue.name,
          venueAddress: booking.venue.address,
          bookingCode: booking.code,
          items: booking.items.map((it) => ({
            courtName: it.court.name,
            date: it.date instanceof Date ? it.date.toISOString().slice(0, 10) : String(it.date).slice(0, 10),
            startMin: it.startMin,
            endMin: it.endMin,
          })),
        },
        qrPayload,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
