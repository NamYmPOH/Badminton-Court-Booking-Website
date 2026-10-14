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
  status: z.enum(["ALL", "DRAFT", "PENDING_REVIEW", "ACTIVE", "PAUSED", "REJECTED", "EXPIRED"]).default("ALL"),
  q: z.string().max(80).default(""),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const reviewBodySchema = z.object({
  id: z.string().min(1),
  status: z.enum(["ACTIVE", "PAUSED", "REJECTED"]),
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
        { title: { contains: q.trim(), mode: "insensitive" } },
        { partner: { name: { contains: q.trim(), mode: "insensitive" } } },
        { voucher: { code: { contains: q.trim(), mode: "insensitive" } } },
      ];
    }

    const [total, offers] = await Promise.all([
      db.partnerOffer.count({ where }),
      db.partnerOffer.findMany({
        where,
        include: {
          partner: {
            select: { id: true, name: true, slug: true, status: true },
          },
          voucher: true,
        },
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      offers: offers.map((o) => ({
        id: o.id,
        partnerId: o.partnerId,
        partnerName: o.partner.name,
        partnerStatus: o.partner.status,
        title: o.title,
        description: o.description,
        sponsor: o.sponsor,
        budget: o.budget,
        usedBudget: o.usedBudget,
        maxUsage: o.maxUsage,
        currentUsage: o.currentUsage,
        status: o.status,
        voucherCode: o.voucher.code,
        voucherType: o.voucher.type,
        voucherValue: o.voucher.value,
        maxDiscount: o.voucher.maxDiscount,
        minAmount: o.voucher.minAmount,
        validFrom: o.voucher.validFrom.toISOString(),
        validTo: o.voucher.validTo.toISOString(),
        createdAt: o.createdAt.toISOString(),
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
      action: "OFFER_STATUS",
      status: parsed.data.status,
      reason: parsed.data.reason,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
