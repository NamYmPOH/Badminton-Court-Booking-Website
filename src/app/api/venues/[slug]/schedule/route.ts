import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { paymentErrorResponse, PaymentError, readPaymentBody } from "@/lib/sepay";
import {
  getVenueEffectiveHours,
  setWeeklySchedule,
  setDateException,
} from "@/services/schedule.service";
import { logAuditEvent } from "@/services/audit-log.service";
import { assertSameOrigin } from "@/lib/admin-policy";
import { operatorVenueScope } from "@/lib/venue-operations";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const scheduleUpdateSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("WEEKLY"),
    schedules: z.array(
      z.object({
        dayOfWeek: z.number().int().min(1).max(7),
        openMin: z.number().int().min(0).max(1440),
        closeMin: z.number().int().min(0).max(1440),
        isClosed: z.boolean().default(false),
      })
    ).min(1).max(7),
  }).strict(),
  z.object({
    type: z.literal("EXCEPTION"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    isClosed: z.boolean(),
    openMin: z.number().int().min(0).max(1440).optional(),
    closeMin: z.number().int().min(0).max(1440).optional(),
    reason: z.string().trim().max(500).optional(),
  }).strict(),
]);

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const venue = await db.venue.findUnique({
      where: { slug: params.slug },
      include: {
        weeklySchedules: { orderBy: { dayOfWeek: "asc" } },
        dateExceptions: { orderBy: { date: "asc" } },
      },
    });

    if (!venue) {
      throw new PaymentError(404, "Không tìm thấy cơ sở thể thao.");
    }

    const url = new URL(request.url);
    const checkDate = url.searchParams.get("date");

    let effectiveHours = null;
    if (checkDate) {
      effectiveHours = await getVenueEffectiveHours(db, venue.id, checkDate);
    }

    return Response.json(
      {
        success: true,
        venueId: venue.id,
        venueName: venue.name,
        defaultOpenMin: venue.openMin,
        defaultCloseMin: venue.closeMin,
        weeklySchedules: venue.weeklySchedules,
        dateExceptions: venue.dateExceptions,
        effectiveHours,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();
    const actor = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, status: true },
    });

    if (!actor || actor.status !== "ACTIVE" || actor.role === "CUSTOMER") {
      throw new PaymentError(403, "Bạn không có quyền quản lý lịch của cơ sở này.");
    }

    const venue = await db.venue.findFirst({
      where: {
        slug: params.slug,
        ...operatorVenueScope(actor),
      },
    });

    if (!venue) {
      throw new PaymentError(403, "Bạn không được phân quyền quản lý tại cơ sở này.");
    }

    const raw = await readPaymentBody(request, 4096);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = scheduleUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, "Dữ liệu cấu hình lịch không hợp lệ.");
    }

    const input = parsed.data;

    if (input.type === "WEEKLY") {
      const res = await setWeeklySchedule(db, venue.id, input.schedules);
      await logAuditEvent(db, {
        actorId: actor.id,
        action: "UPDATE_WEEKLY_SCHEDULE",
        entityType: "Venue",
        entityId: venue.id,
        details: { count: input.schedules.length },
      });
      return Response.json({ success: true, schedules: res });
    }

    if (input.type === "EXCEPTION") {
      const res = await setDateException(db, venue.id, {
        date: input.date,
        isClosed: input.isClosed,
        openMin: input.openMin,
        closeMin: input.closeMin,
        reason: input.reason,
      });
      await logAuditEvent(db, {
        actorId: actor.id,
        action: "SET_DATE_EXCEPTION",
        entityType: "VenueDateException",
        entityId: res.id,
        details: { date: input.date, isClosed: input.isClosed, reason: input.reason },
      });
      return Response.json({ success: true, exception: res });
    }

    throw new PaymentError(400, "Yêu cầu không được hỗ trợ.");
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
