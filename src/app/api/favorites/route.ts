import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { PaymentError, paymentErrorResponse } from "@/lib/sepay";
import { getSession } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

const favoriteActionSchema = z.object({
  venueId: z.string().min(1, "Thiếu mã cơ sở sân (venueId)"),
});

/**
 * GET: Lấy danh sách sân yêu thích của người dùng đã đăng nhập từ model Favorite
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;

    if (!userId) {
      // Người dùng chưa đăng nhập: trả về danh sách rỗng để client fallback sang lưu cục bộ
      return NextResponse.json({
        success: true,
        data: [],
        favoriteVenueIds: [],
        isGuest: true,
      });
    }

    const favorites = await db.favorite.findMany({
      where: { userId },
      include: {
        venue: {
          include: {
            courts: {
              where: { status: "ACTIVE" },
              select: { id: true, name: true, surface: true, status: true },
              orderBy: { sortOrder: "asc" },
            },
            pricing: {
              orderBy: { walkInPrice: "asc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const venues = favorites.map((f) => ({
      id: f.venue.id,
      slug: f.venue.slug,
      name: f.venue.name,
      description: f.venue.description || "",
      address: f.venue.address,
      district: f.venue.district,
      city: f.venue.province,
      lat: f.venue.lat,
      lng: f.venue.lng,
      openMin: f.venue.openMin,
      closeMin: f.venue.closeMin,
      priceFrom: f.venue.priceFrom,
      ratingAvg: f.venue.ratingAvg,
      ratingCount: f.venue.ratingCount,
      images: f.venue.images && f.venue.images.length ? f.venue.images : ["/images/courts/court-1.svg"],
      amenities: f.venue.amenities,
      cancelBeforeHours: f.venue.cancelBeforeHours,
      paymentMode: f.venue.paymentMode,
      hasSlotTonight: f.venue.courts.length > 0,
      courts: f.venue.courts.map((c) => ({
        id: c.id,
        name: c.name,
        surface: c.surface || "",
        isActive: c.status === "ACTIVE",
      })),
      pricingRules: f.venue.pricing,
      reviews: [],
      ownerId: f.venue.ownerId,
      status: f.venue.status,
    }));

    return NextResponse.json({
      success: true,
      data: venues,
      favoriteVenueIds: favorites.map((f) => f.venueId),
      isGuest: false,
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

/**
 * POST: Thêm sân vào danh sách yêu thích (Idempotent - không trùng lặp)
 */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();

    const body: unknown = await request.json();
    const parse = favoriteActionSchema.safeParse(body);
    if (!parse.success) {
      throw new PaymentError(400, "Mã cơ sở sân không hợp lệ.");
    }

    const { venueId } = parse.data;

    // Kiểm tra cơ sở tồn tại
    const venueExists = await db.venue.findUnique({
      where: { id: venueId },
      select: { id: true, name: true },
    });

    if (!venueExists) {
      throw new PaymentError(404, "Không tìm thấy cơ sở sân.");
    }

    // Upsert để đảm bảo gọi lặp lại không bao giờ sinh duplicate hay lỗi DB
    await db.favorite.upsert({
      where: {
        userId_venueId: { userId, venueId },
      },
      create: {
        userId,
        venueId,
      },
      update: {},
    });

    return NextResponse.json({
      success: true,
      message: `Đã lưu ${venueExists.name} vào danh sách yêu thích.`,
      venueId,
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

/**
 * DELETE: Xóa sân khỏi danh sách yêu thích
 */
export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();

    const url = new URL(request.url);
    const venueId = url.searchParams.get("venueId");
    if (!venueId) {
      throw new PaymentError(400, "Thiếu mã cơ sở sân cần xóa.");
    }

    await db.favorite.deleteMany({
      where: {
        userId,
        venueId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đã xóa cơ sở khỏi danh sách yêu thích.",
      venueId,
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
