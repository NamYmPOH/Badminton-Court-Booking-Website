import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { operatorVenueScope } from "@/lib/venue-operations";
import { assertSameOrigin } from "@/lib/admin-policy";
import { PaymentError, paymentErrorResponse, readPaymentBody } from "@/lib/sepay";
import { performAdminAction } from "@/services/admin.service";
import {
  processOverdueAndCompletions,
  getVenueCourtsLiveStatus,
  getCurrentStaffShift,
  hasActiveStaffShift,
  confirmCashPayment,
  completeBookingSession,
  startStaffShift,
  endStaffShift,
  calculateBookingPaymentDetails,
  getBookingEndTimestamp,
  type CourtLiveStatus,
} from "@/services/venue-session.service";

export const dynamic = "force-dynamic";

const venueOpActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("CASH_PAID"),
    id: z.string().min(1),
    reason: z.string().trim().min(5, "Ghi lý do ít nhất 5 ký tự.").max(500),
    expectedAmount: z.number().int().positive().optional(),
  }),
  z.object({
    action: z.literal("COMPLETE"),
    id: z.string().min(1),
    reason: z.string().trim().min(5, "Ghi lý do ít nhất 5 ký tự.").max(500),
  }),
  z.object({
    action: z.enum(["CONFIRM", "CHECK_IN", "CANCEL"]),
    id: z.string().min(1),
    reason: z.string().trim().min(5, "Ghi lý do ít nhất 5 ký tự.").max(500),
  }),
  z.object({
    action: z.literal("START_SHIFT"),
    venueId: z.string().min(1),
    note: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal("END_SHIFT"),
    venueId: z.string().min(1),
    note: z.string().max(500).optional(),
  }),
]);

export async function GET(request: Request) {
  try {
    const id = await requirePaymentUser();
    const actor = await db.user.findUniqueOrThrow({
      where: { id },
      select: { id: true, role: true, status: true, name: true },
    });

    // Chạy xử lý nền bù đắp (Catch-up opportunistic) để cập nhật trạng thái mới nhất
    try {
      await processOverdueAndCompletions(db);
    } catch (e) {
      console.error("Auto overdue processor catchup error:", e);
    }

    const q = (new URL(request.url).searchParams.get("q") || "").slice(0, 80);
    const scope = operatorVenueScope(actor);

    // Lấy danh sách cơ sở sân được phân quyền
    const venues = await db.venue.findMany({
      where: scope,
      select: { id: true, name: true, slug: true, paymentMode: true, ownerId: true },
    });

    const now = new Date();

    // Lấy thông tin sân con và ca làm theo từng cơ sở
    const courtsByVenue: Record<string, CourtLiveStatus[]> = {};
    const shiftsByVenue: Record<string, { myShiftId: string | null; hasActiveShift: boolean }> = {};

    for (const v of venues) {
      courtsByVenue[v.id] = await getVenueCourtsLiveStatus(db, v.id, now);
      const myShift = await getCurrentStaffShift(db, actor.id, v.id);
      const venueHasShift = await hasActiveStaffShift(db, v.id);
      shiftsByVenue[v.id] = {
        myShiftId: myShift ? myShift.id : null,
        hasActiveShift: venueHasShift,
      };
    }

    const rawBookings = await db.booking.findMany({
      where: {
        venue: scope,
        ...(q ? { code: { contains: q, mode: "insensitive" } } : {}),
        OR: [
          { group: { isNot: null }, paymentStatus: "REFUND_PENDING" },
          { status: { in: ["CONFIRMED", "CHECKED_IN"] } },
          { status: "PENDING_PAYMENT", expiresAt: { gt: now } },
        ],
      },
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          select: { date: true, startMin: true, endMin: true, court: { select: { id: true, name: true } } },
        },
        venue: { select: { id: true, name: true, paymentMode: true } },
        payments: {
          where: { status: "PAID" },
          select: { id: true, amount: true, status: true, provider: true, paidAt: true },
        },
        group: {
          select: {
            inviteToken: true,
            shares: { select: { id: true, position: true, amount: true, cashRequested: true, paymentId: true } },
          },
        },
      },
    });

    const bookings = rawBookings.map((b) => {
      const paymentDetails = calculateBookingPaymentDetails(b);
      const endTimestamp = getBookingEndTimestamp(b.items);
      const isOverdue = endTimestamp > 0 && now.getTime() >= endTimestamp;

      return {
        id: b.id,
        code: b.code,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        total: b.total,
        status: b.status,
        sessionStatus: b.sessionStatus,
        paymentStatus: b.paymentStatus,
        paymentMethod: b.paymentMethod,
        hasCashPayment: paymentDetails.hasCashPayment,
        totalPaid: paymentDetails.totalPaid,
        remaining: paymentDetails.remaining,
        isFullyPaid: paymentDetails.isFullyPaid,
        isOverdue,
        endTimestamp,
        expiresAt: b.expiresAt ? b.expiresAt.toISOString() : null,
        venue: b.venue,
        items: b.items.map((i) => ({
          date: i.date.toISOString(),
          startMin: i.startMin,
          endMin: i.endMin,
          court: i.court,
        })),
        group: b.group,
      };
    });

    return NextResponse.json(
      {
        bookings,
        venues,
        courtsByVenue,
        shiftsByVenue,
        userRole: actor.role,
        userId: actor.id,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const id = await requirePaymentUser();
    const actor = await db.user.findUniqueOrThrow({
      where: { id },
      select: { id: true, role: true, status: true, name: true },
    });

    const raw = await readPaymentBody(request, 4096);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = venueOpActionSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, parsed.error.issues[0]?.message || "Thao tác không hợp lệ.");
    }

    const data = parsed.data;

    // 1. Thao tác ca trực
    if (data.action === "START_SHIFT") {
      return NextResponse.json(await startStaffShift(db, actor, data.venueId, data.note));
    }
    if (data.action === "END_SHIFT") {
      return NextResponse.json(await endStaffShift(db, actor, data.venueId, data.note));
    }

    // 2. Thao tác thu tiền mặt (Bước 1)
    if (data.action === "CASH_PAID") {
      if (typeof data.expectedAmount === "number") {
        return NextResponse.json(
          await confirmCashPayment(db, actor, data.id, data.expectedAmount, data.reason)
        );
      }
      // Tương thích ngược nếu không truyền expectedAmount
      return NextResponse.json(
        await performAdminAction(db, actor.id, {
          action: "CASH_PAID",
          id: data.id,
          reason: data.reason,
        })
      );
    }

    // 3. Thao tác hoàn tất và bàn giao sân (Bước 2)
    if (data.action === "COMPLETE") {
      return NextResponse.json(await completeBookingSession(db, actor, data.id, data.reason));
    }

    // 4. Các thao tác khác: CONFIRM, CHECK_IN, CANCEL
    return NextResponse.json(
      await performAdminAction(db, actor.id, {
        action: data.action,
        id: data.id,
        reason: data.reason,
      })
    );
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
