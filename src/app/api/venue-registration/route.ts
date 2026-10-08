import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { venueRegistrationSchema } from "@/lib/venue-registration";
import {
  PaymentError,
  paymentErrorResponse,
  readPaymentBody,
} from "@/lib/sepay";
import { serializable } from "@/services/sepay.service";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();
    const raw = await readPaymentBody(request, 8192);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }
    const parsed = venueRegistrationSchema.safeParse(body);
    if (!parsed.success)
      throw new PaymentError(
        400,
        parsed.error.issues[0]?.message || "Thông tin không hợp lệ.",
      );
    const v = parsed.data;
    const result = await serializable(db, async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { status: true },
      });
      if (user?.status !== "ACTIVE")
        throw new PaymentError(403, "Tài khoản không hoạt động.");
      if (
        (await tx.venue.count({
          where: { ownerId: userId, status: "PENDING" },
        })) >= 3
      )
        throw new PaymentError(409, "Bạn đã có 3 hồ sơ đang chờ duyệt.");
      // Chủ sở hữu và trạng thái do server quyết định. Hồ sơ mới chưa nhận đặt sân.
      return tx.venue.create({
        data: {
          name: v.name,
          slug: `co-so-${randomUUID()}`,
          address: v.address,
          district: v.district,
          province: v.province,
          phone: v.phone,
          lat: v.lat,
          lng: v.lng,
          openMin: v.openMin,
          closeMin: v.closeMin,
          ownerId: userId,
          status: "PENDING",
          paymentMode: "AT_VENUE",
          priceFrom: v.hourlyPrice,
          images: ["/images/courts/court-1.svg"],
          amenities: [],
          courts: {
            create: Array.from({ length: v.courts }, (_, i) => ({
              name: `Sân ${i + 1}`,
              sortOrder: i,
              status: "ACTIVE",
            })),
          },
          pricing: {
            create: {
              daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
              startMin: v.openMin,
              endMin: v.closeMin,
              walkInPrice: v.hourlyPrice,
              fixedPrice: v.hourlyPrice,
            },
          },
        },
        select: { id: true, name: true, status: true },
      });
    });
    return NextResponse.json({ success: true, venue: result }, { status: 201 });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
