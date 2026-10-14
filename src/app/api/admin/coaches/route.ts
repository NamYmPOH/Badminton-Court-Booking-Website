import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { paymentErrorResponse, PaymentError, readPaymentBody } from "@/lib/sepay";
import { performAdminAction } from "@/services/admin.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  status: z.enum(["ALL", "PENDING", "ACTIVE", "SUSPENDED", "REJECTED"]).default("ALL"),
  q: z.string().max(80).default(""),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const reviewBodySchema = z.object({
  id: z.string().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED", "REJECTED"]),
  reason: z.string().trim().min(5, "Lý do tối thiểu 5 ký tự.").max(500),
}).strict();

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) throw new PaymentError(400, "Bộ lọc không hợp lệ.");

    const { status, q, page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status !== "ALL") where.status = status;
    if (q.trim()) {
      where.OR = [
        { user: { name: { contains: q.trim(), mode: "insensitive" } } },
        { user: { phone: { contains: q.trim() } } },
        { bio: { contains: q.trim(), mode: "insensitive" } },
      ];
    }

    const [total, coaches] = await Promise.all([
      db.coachProfile.count({ where }),
      db.coachProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              image: true,
              status: true,
            },
          },
          certificates: true,
          venues: {
            include: {
              venue: {
                select: {
                  id: true,
                  name: true,
                  district: true,
                },
              },
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      coaches: coaches.map((c) => ({
        id: c.id,
        userId: c.userId,
        name: c.user.name,
        email: c.user.email,
        phone: c.user.phone,
        image: c.user.image,
        userStatus: c.user.status,
        bio: c.bio,
        specialties: c.specialties,
        experienceYears: c.experienceYears,
        hourlyRate: c.hourlyRate,
        status: c.status,
        reviewReason: c.reviewReason,
        reviewedAt: c.reviewedAt?.toISOString() || null,
        reviewedById: c.reviewedById,
        createdAt: c.createdAt.toISOString(),
        certificatesCount: c.certificates.length,
        venues: c.venues.map((v) => ({
          venueId: v.venueId,
          venueName: v.venue.name,
          district: v.venue.district,
          status: v.status,
        })),
      })),
      total,
      page,
      limit,
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireAdmin();
    const raw = await readPaymentBody(request, 4096);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = reviewBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, parsed.error.issues[0]?.message || "Thông tin phê duyệt không hợp lệ.");
    }

    await performAdminAction(db, actor.id, {
      id: parsed.data.id,
      action: "COACH_STATUS",
      status: parsed.data.status,
      reason: parsed.data.reason,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
