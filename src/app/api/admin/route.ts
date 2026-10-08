import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-session";
import { adminActionSchema, assertSameOrigin } from "@/lib/admin-policy";
import {
  paymentErrorResponse,
  PaymentError,
  readPaymentBody,
} from "@/lib/sepay";
import { performAdminAction } from "@/services/admin.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const querySchema = z.object({
  tab: z.enum([
    "overview",
    "venues",
    "bookings",
    "payments",
    "receipts",
    "users",
    "audit",
  ]),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  q: z.string().max(80).default(""),
  pending: z.enum(["true", "false"]).default("false"),
});
export async function GET(request: Request) {
  try {
    const actor = await requireAdmin();
    const parsed = querySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsed.success) throw new PaymentError(400, "Bộ lọc không hợp lệ.");
    const { tab, page, q, pending } = parsed.data;
    const search = { contains: q, mode: "insensitive" as const };
    const window = { skip: (page - 1) * 25, take: 26 };
    let rows: unknown[] = [];
    if (tab === "overview") {
      const [
        venues,
        pendingVenues,
        bookings,
        reviewPayments,
        refundPending,
        users,
        revenue,
      ] = await Promise.all([
        db.venue.count({ where: { status: "ACTIVE" } }),
        db.venue.count({ where: { status: "PENDING" } }),
        db.booking.count({
          where: {
            OR: [
              { status: { in: ["CONFIRMED", "CHECKED_IN"] } },
              { status: "PENDING_PAYMENT", expiresAt: { gt: new Date() } },
            ],
          },
        }),
        db.sepayReceipt.count({ where: { result: { startsWith: "REVIEW_" } } }),
        db.booking.count({ where: { paymentStatus: "REFUND_PENDING" } }),
        db.user.count(),
        db.payment.aggregate({
          where: { status: "PAID" },
          _sum: { amount: true },
        }),
      ]);
      return NextResponse.json(
        {
          actor,
          stats: {
            venues,
            pendingVenues,
            bookings,
            reviewPayments,
            refundPending,
            users,
            revenue: revenue._sum.amount || 0,
          },
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (tab === "venues")
      rows = await db.venue.findMany({
        ...window,
        where: {
          ...(pending === "true" ? { status: "PENDING" } : {}),
          OR: [{ name: search }, { slug: search }],
        },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          address: true,
          district: true,
          phone: true,
          paymentMode: true,
          owner: { select: { name: true } },
          _count: { select: { courts: true, pricing: true } },
        },
      });
    if (tab === "bookings")
      rows = await db.booking.findMany({
        ...window,
        where: {
          ...(pending === "true"
            ? { status: "PENDING_PAYMENT", expiresAt: { gt: new Date() } }
            : {}),
          OR: [
            { code: search },
            { customerName: search },
            { customerPhone: search },
          ],
        },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        select: {
          id: true,
          code: true,
          customerName: true,
          customerPhone: true,
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          total: true,
          expiresAt: true,
          createdAt: true,
          venue: { select: { name: true, paymentMode: true } },
          items: {
            select: {
              date: true,
              startMin: true,
              endMin: true,
              court: { select: { name: true } },
            },
          },
        },
      });
    if (tab === "payments")
      rows = await db.payment.findMany({
        ...window,
        where: {
          ...(pending === "true" ? { status: "REFUND_PENDING" } : {}),
          OR: [{ txnRef: search }, { booking: { code: search } }],
        },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        select: {
          id: true,
          txnRef: true,
          provider: true,
          status: true,
          amount: true,
          paidAt: true,
          booking: { select: { code: true, customerName: true } },
        },
      });
    if (tab === "receipts") {
      const receipts = await db.sepayReceipt.findMany({
        ...window,
        where: {
          ...(pending === "true" ? { result: { startsWith: "REVIEW_" } } : {}),
          OR: [{ transactionId: search }, { bookingCode: search }],
        },
        orderBy: [{ receivedAt: "desc" }, { transactionId: "asc" }],
      });
      rows = receipts.map((r) => {
        const payload = r.payload as Record<string, unknown>;
        return {
          id: r.transactionId,
          bookingCode: r.bookingCode,
          result: r.result,
          receivedAt: r.receivedAt,
          amount: payload.transferAmount,
          content: payload.content,
          gateway: payload.gateway,
          accountLast4: String(payload.accountNumber || "").slice(-4),
        };
      });
    }
    if (tab === "users")
      rows = await db.user.findMany({
        ...window,
        where: { OR: [{ name: search }, { email: search }, { phone: search }] },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });
    if (tab === "audit")
      rows = await db.adminAudit.findMany({
        ...window,
        where: {
          OR: [{ actorName: search }, { entityId: search }, { action: search }],
        },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      });
    return NextResponse.json(
      { actor, rows: rows.slice(0, 25), hasMore: rows.length > 25, page },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireAdmin();
    const raw = await readPaymentBody(request, 8192);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }
    const parsed = adminActionSchema.safeParse(body);
    if (!parsed.success)
      throw new PaymentError(
        400,
        parsed.error.issues[0]?.message || "Thao tác không hợp lệ.",
      );
    return NextResponse.json(
      await performAdminAction(db, actor.id, parsed.data),
    );
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
