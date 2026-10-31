import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { PaymentError, paymentErrorResponse } from "@/lib/sepay";
import { getSession } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

/**
 * GET: Lấy danh sách thông báo thực tế của người dùng, phân quyền theo vai trò và cơ sở
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;

    if (!userId) {
      throw new PaymentError(401, "Vui lòng đăng nhập để xem thông báo.");
    }

    const actor = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, status: true },
    });

    if (!actor || actor.status !== "ACTIVE") {
      throw new PaymentError(403, "Tài khoản của bạn đã bị khóa hoặc không tồn tại.");
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get("pageSize") || "20", 10)));
    const venueId = url.searchParams.get("venueId");

    // Nếu người dùng yêu cầu lọc theo cơ sở, kiểm tra quyền hợp lệ tại cơ sở đó
    if (venueId) {
      if (actor.role === "STAFF") {
        const staff = await db.venueStaff.findFirst({
          where: { userId, venueId, isActive: true },
        });
        if (!staff) {
          throw new PaymentError(403, "Bạn không có quyền xem thông báo vận hành của cơ sở này.");
        }
      } else if (actor.role === "OWNER") {
        const owned = await db.venue.findFirst({
          where: { id: venueId, ownerId: userId },
        });
        if (!owned) {
          throw new PaymentError(403, "Bạn không phải chủ sở hữu của cơ sở này.");
        }
      }
    }

    // Xây dựng điều kiện lọc an toàn
    const whereCondition: any = {
      userId,
      ...(venueId
        ? {
            data: {
              path: ["venueId"],
              equals: venueId,
            },
          }
        : {}),
    };

    const [total, unreadCount, rawNotifications] = await Promise.all([
      db.notification.count({ where: whereCondition }),
      db.notification.count({
        where: {
          ...whereCondition,
          readAt: null,
        },
      }),
      db.notification.findMany({
        where: whereCondition,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // Rà soát quyền: Nếu nhân viên bị vô hiệu hóa quyền tại một sân, lọc bỏ các thông báo vận hành cũ của sân đó
    let sanitizedNotifications = rawNotifications;
    if (actor.role === "STAFF") {
      const activeVenueStaffs = await db.venueStaff.findMany({
        where: { userId, isActive: true },
        select: { venueId: true },
      });
      const activeVenueIds = new Set(activeVenueStaffs.map((s) => s.venueId));

      sanitizedNotifications = rawNotifications.filter((n) => {
        const notifData = n.data as Record<string, unknown> | null;
        const vId = notifData?.venueId as string | undefined;
        // Nếu là thông báo vận hành của cơ sở, chỉ giữ lại nếu nhân viên đang active tại cơ sở đó
        if (vId && !activeVenueIds.has(vId)) {
          return false;
        }
        return true;
      });
    }

    const items = sanitizedNotifications.map((n) => {
      const d = n.data as Record<string, unknown> | null;
      return {
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data,
        tag: (d?.tag || d?.eventType || n.type) as string,
        bookingId: d?.bookingId as string | undefined,
        bookingCode: d?.bookingCode as string | undefined,
        venueId: d?.venueId as string | undefined,
        url: (d?.url as string) || (d?.bookingId ? `/bookings` : undefined),
        read: !!n.readAt,
        readAt: n.readAt ? n.readAt.toISOString() : null,
        createdAt: n.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: items,
      unreadCount,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

const updateNotifSchema = z.union([
  z.object({
    id: z.string().min(1),
  }),
  z.object({
    all: z.literal(true),
    venueId: z.string().optional(),
  }),
]);

/**
 * PATCH: Đánh dấu thông báo đã đọc (từng thông báo hoặc toàn bộ)
 */
export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await getSession();
    const userId = session?.user?.id;

    if (!userId) {
      throw new PaymentError(401, "Vui lòng đăng nhập để thực hiện.");
    }

    const body: unknown = await request.json();
    const parse = updateNotifSchema.safeParse(body);
    if (!parse.success) {
      throw new PaymentError(400, "Yêu cầu không hợp lệ.");
    }

    const data = parse.data;

    if ("all" in data && data.all) {
      // Đánh dấu đọc tất cả
      await db.notification.updateMany({
        where: {
          userId,
          readAt: null,
          ...(data.venueId
            ? {
                data: {
                  path: ["venueId"],
                  equals: data.venueId,
                },
              }
            : {}),
        },
        data: {
          readAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Đã đánh dấu tất cả thông báo là đã đọc.",
      });
    }

    // Đánh dấu 1 thông báo
    const notif = await db.notification.findUnique({
      where: { id: (data as { id: string }).id },
      select: { id: true, userId: true },
    });

    if (!notif || notif.userId !== userId) {
      throw new PaymentError(404, "Không tìm thấy thông báo.");
    }

    await db.notification.update({
      where: { id: notif.id },
      data: { readAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Đã đánh dấu thông báo là đã đọc.",
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
