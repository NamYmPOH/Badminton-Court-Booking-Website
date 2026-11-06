import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { PaymentError, paymentErrorResponse } from "@/lib/sepay";
import { normalizeAmenities } from "@/lib/config/constants";
import { parseCoordinates } from "@/lib/coordinates";
import { invalidatePublicVenueCache } from "@/lib/public-cache";

export const dynamic = "force-dynamic";

const courtItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Tên sân không được để trống").max(50),
  surface: z.string().trim().max(100).optional().nullable(),
  status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]).default("ACTIVE"),
  sortOrder: z.number().int().default(0),
});

const pricingRuleItemSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().max(100).optional().nullable(),
  daysOfWeek: z.array(z.number().int().min(1).max(7)).min(1, "Chọn ít nhất 1 ngày trong tuần"),
  startMin: z.number().int().min(0).max(1440),
  endMin: z.number().int().min(0).max(1440),
  walkInPrice: z.number().int().min(0, "Giá vãng lai không được âm"),
  fixedPrice: z.number().int().min(0, "Giá cố định không được âm"),
});

const updateVenueSchema = z.object({
  name: z.string().trim().min(2, "Tên cơ sở tối thiểu 2 ký tự").max(100),
  description: z.string().trim().max(3000).optional().nullable(),
  address: z.string().trim().min(5, "Địa chỉ tối thiểu 5 ký tự").max(250),
  ward: z.string().trim().max(100).optional().nullable(),
  district: z.string().trim().min(2, "Vui lòng chọn quận/huyện").max(100),
  province: z.string().trim().min(2, "Vui lòng chọn tỉnh/thành phố").max(100),
  phone: z.string().trim().min(8, "Số điện thoại liên hệ không hợp lệ").max(20),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  coordinates: z.string().trim().optional(), // Hỗ trợ dán trực tiếp vĩ độ, kinh độ từ Google Maps
  openMin: z.number().int().min(0).max(1440),
  closeMin: z.number().int().min(0).max(1440),
  cancelBeforeHours: z.number().int().min(0).max(168).default(4),
  slotMinutes: z.number().int().min(15).max(120).default(30),
  minBookingMin: z.number().int().min(15).max(480).default(60),
  maxBookingMin: z.number().int().min(30).max(1440).default(240),
  advanceDays: z.number().int().min(1).max(90).default(30),
  amenities: z.array(z.string()).max(30),
  images: z.array(z.string().url("Đường dẫn ảnh không hợp lệ")).max(20).optional(),
  courts: z.array(courtItemSchema).optional(),
  pricingRules: z.array(pricingRuleItemSchema).optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET: Lấy thông tin chi tiết toàn bộ nghiệp vụ cơ sở phục vụ quản lý (ADMIN & OWNER)
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const venueId = params.id;
    if (!venueId) throw new PaymentError(400, "Thiếu mã cơ sở sân.");

    const userId = await requirePaymentUser();
    const actor = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, role: true, status: true, name: true },
    });

    if (actor.status !== "ACTIVE") {
      throw new PaymentError(403, "Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt.");
    }

    if (actor.role === "STAFF") {
      throw new PaymentError(403, "Nhân viên không có quyền xem thông tin cấu hình quản trị cơ sở.");
    }

    const venue = await db.venue.findUnique({
      where: { id: venueId },
      include: {
        courts: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, name: true, surface: true, status: true, sortOrder: true },
        },
        pricing: {
          orderBy: [{ startMin: "asc" }],
          select: {
            id: true,
            label: true,
            daysOfWeek: true,
            startMin: true,
            endMin: true,
            walkInPrice: true,
            fixedPrice: true,
          },
        },
      },
    });

    if (!venue) throw new PaymentError(404, "Không tìm thấy cơ sở.");

    if (actor.role !== "ADMIN" && venue.ownerId !== actor.id) {
      throw new PaymentError(403, "Bạn không có quyền quản lý cơ sở này.");
    }

    return NextResponse.json({
      success: true,
      data: {
        id: venue.id,
        slug: venue.slug,
        name: venue.name,
        description: venue.description || "",
        address: venue.address,
        ward: venue.ward || "",
        district: venue.district,
        province: venue.province,
        phone: venue.phone,
        lat: venue.lat,
        lng: venue.lng,
        openMin: venue.openMin,
        closeMin: venue.closeMin,
        cancelBeforeHours: venue.cancelBeforeHours,
        slotMinutes: venue.slotMinutes,
        minBookingMin: venue.minBookingMin,
        maxBookingMin: venue.maxBookingMin,
        advanceDays: venue.advanceDays,
        priceFrom: venue.priceFrom,
        amenities: normalizeAmenities(venue.amenities),
        images: venue.images,
        status: venue.status,
        courts: venue.courts,
        pricingRules: venue.pricing,
      },
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

/**
 * PATCH: Cập nhật thông tin nghiệp vụ toàn bộ cơ sở:
 * - Thông tin liên hệ, mô tả, ảnh, tọa độ Google Maps
 * - Giờ đóng/mở cửa, chính sách đặt/hủy (cancelBeforeHours, slotMinutes...)
 * - Danh sách sân con (thêm/sửa, trạng thái hoạt động/bảo trì)
 * - Bảng giá (pricing rules) và tự động cập nhật giá từ (priceFrom)
 * Kiểm tra xung đột với các đơn đặt sân đang có hiệu lực.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    assertSameOrigin(request);
    const venueId = params.id;
    if (!venueId) throw new PaymentError(400, "Thiếu mã cơ sở sân.");

    const userId = await requirePaymentUser();
    const actor = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, role: true, status: true, name: true },
    });

    if (actor.status !== "ACTIVE") {
      throw new PaymentError(403, "Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt.");
    }

    // 1. Phân quyền: STAFF bị chặn tuyệt đối
    if (actor.role === "STAFF") {
      throw new PaymentError(403, "Nhân viên không có quyền chỉnh sửa cấu hình cơ sở.");
    }

    // 2. Kiểm tra quyền sở hữu đối với OWNER
    const existingVenue = await db.venue.findUnique({
      where: { id: venueId },
      include: {
        courts: true,
        pricing: true,
      },
    });

    if (!existingVenue) throw new PaymentError(404, "Không tìm thấy cơ sở.");

    if (actor.role !== "ADMIN" && existingVenue.ownerId !== actor.id) {
      throw new PaymentError(403, "Bạn không có quyền chỉnh sửa cơ sở này.");
    }

    // 3. Validation dữ liệu đầu vào
    const body: unknown = await request.json();
    const parseResult = updateVenueSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      throw new PaymentError(400, firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Dữ liệu không hợp lệ.");
    }

    const data = parseResult.data;

    if (data.openMin >= data.closeMin) {
      throw new PaymentError(400, "Giờ mở cửa phải trước giờ đóng cửa.");
    }

    // Xử lý tọa độ: ưu tiên ô coordinates nếu dán từ Google Maps
    let finalLat = data.lat ?? existingVenue.lat;
    let finalLng = data.lng ?? existingVenue.lng;

    if (data.coordinates && data.coordinates.trim()) {
      const parsed = parseCoordinates(data.coordinates.trim());
      if (!parsed) {
        throw new PaymentError(
          400,
          "Tọa độ không hợp lệ. Vui lòng dán theo định dạng 'vĩ độ, kinh độ' từ Google Maps (VD: 21.0285, 105.8542)."
        );
      }
      finalLat = parsed.lat;
      finalLng = parsed.lng;
    }

    // 4. KIỂM TRA XUNG ĐỘT ĐƠN ĐẶT SÂN CÒN HIỆU LỰC (Conflict Checks)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Lấy tất cả booking items tương lai đang giữ chỗ hoặc đã xác nhận tại cơ sở này
    const futureActiveItems = await db.bookingItem.findMany({
      where: {
        date: { gte: today },
        status: { in: ["HELD", "CONFIRMED"] },
        booking: {
          venueId,
          status: { in: ["PENDING_PAYMENT", "CONFIRMED"] },
        },
      },
      include: {
        court: { select: { id: true, name: true } },
        booking: { select: { code: true } },
      },
    });

    // 4.1 Kiểm tra thu hẹp giờ hoạt động (mở muộn hơn hoặc đóng sớm hơn)
    if (data.openMin > existingVenue.openMin || data.closeMin < existingVenue.closeMin) {
      const conflictingHours = futureActiveItems.filter(
        (item) => item.startMin < data.openMin || item.endMin > data.closeMin
      );

      if (conflictingHours.length > 0) {
        const affectedCodes = Array.from(new Set(conflictingHours.map((i) => i.booking.code)));
        throw new PaymentError(
          409,
          `Không thể thu hẹp giờ hoạt động vì có ${conflictingHours.length} lượt đặt sân sắp tới nằm ngoài khung giờ mới (Đơn: ${affectedCodes.slice(0, 3).join(", ")}${affectedCodes.length > 3 ? "..." : ""}). Vui lòng xử lý dời lịch cho khách trước.`
        );
      }
    }

    // 4.2 Kiểm tra trạng thái sân con bị chuyển sang MAINTENANCE hoặc INACTIVE
    if (data.courts && data.courts.length > 0) {
      for (const courtData of data.courts) {
        if (courtData.id && (courtData.status === "MAINTENANCE" || courtData.status === "INACTIVE")) {
          const conflictingCourtItems = futureActiveItems.filter(
            (item) => item.courtId === courtData.id
          );
          if (conflictingCourtItems.length > 0) {
            const affectedCodes = Array.from(new Set(conflictingCourtItems.map((i) => i.booking.code)));
            throw new PaymentError(
              409,
              `Không thể chuyển sân "${courtData.name}" sang ${courtData.status === "MAINTENANCE" ? "bảo trì" : "tạm ngưng"} vì còn ${conflictingCourtItems.length} lượt đặt sân sắp tới (Đơn: ${affectedCodes.slice(0, 3).join(", ")}${affectedCodes.length > 3 ? "..." : ""}).`
            );
          }
        }
      }
    }

    // Chuẩn hóa danh mục tiện ích
    const cleanAmenities = normalizeAmenities(data.amenities);

    // Tính toán priceFrom tự động nếu có pricing rules
    let newPriceFrom = existingVenue.priceFrom;
    if (data.pricingRules && data.pricingRules.length > 0) {
      const validWalkInPrices = data.pricingRules
        .map((r) => r.walkInPrice)
        .filter((p) => p > 0);
      if (validWalkInPrices.length > 0) {
        newPriceFrom = Math.min(...validWalkInPrices);
      }
    }

    // 5. THỰC THI TRANSACTION CẬP NHẬT NGUYÊN TỬ
    const updated = await db.$transaction(async (tx) => {
      // 5.1 Cập nhật thông tin cơ sở
      const venue = await tx.venue.update({
        where: { id: venueId },
        data: {
          name: data.name,
          description: data.description,
          address: data.address,
          ward: data.ward,
          district: data.district,
          province: data.province,
          phone: data.phone,
          lat: finalLat,
          lng: finalLng,
          openMin: data.openMin,
          closeMin: data.closeMin,
          cancelBeforeHours: data.cancelBeforeHours,
          slotMinutes: data.slotMinutes,
          minBookingMin: data.minBookingMin,
          maxBookingMin: data.maxBookingMin,
          advanceDays: data.advanceDays,
          priceFrom: newPriceFrom,
          amenities: cleanAmenities,
          ...(data.images ? { images: data.images } : {}),
        },
      });

      // 5.2 Xử lý danh sách sân con
      if (data.courts) {
        const inputCourtIds = new Set(data.courts.filter((c) => !!c.id).map((c) => c.id!));

        // Kiểm tra các sân cũ không còn trong danh sách gửi lên
        for (const oldCourt of existingVenue.courts) {
          if (!inputCourtIds.has(oldCourt.id)) {
            // Kiểm tra xem sân có lịch sử đặt hay không
            const bookingCount = await tx.bookingItem.count({
              where: { courtId: oldCourt.id },
            });

            if (bookingCount > 0) {
              // Có lịch sử đặt: SOFT DELETE (chuyển sang INACTIVE) để bảo toàn liên kết dữ liệu
              await tx.court.update({
                where: { id: oldCourt.id },
                data: { status: "INACTIVE" },
              });
            } else {
              // Không có lịch sử: được phép xóa an toàn
              await tx.courtBlock.deleteMany({ where: { courtId: oldCourt.id } });
              await tx.court.delete({ where: { id: oldCourt.id } });
            }
          }
        }

        // Cập nhật hoặc thêm mới sân con
        let sortIdx = 1;
        for (const courtData of data.courts) {
          if (courtData.id) {
            await tx.court.updateMany({
              where: { id: courtData.id, venueId },
              data: {
                name: courtData.name,
                surface: courtData.surface,
                status: courtData.status,
                sortOrder: courtData.sortOrder || sortIdx++,
              },
            });
          } else {
            // Thêm mới sân con
            await tx.court.create({
              data: {
                venueId,
                name: courtData.name,
                surface: courtData.surface,
                status: courtData.status,
                sortOrder: courtData.sortOrder || sortIdx++,
              },
            });
          }
        }
      }

      // 5.3 Xử lý bảng giá (Pricing Rules)
      if (data.pricingRules) {
        // Thay thế bảng giá mới
        await tx.pricingRule.deleteMany({ where: { venueId } });

        if (data.pricingRules.length > 0) {
          await tx.pricingRule.createMany({
            data: data.pricingRules.map((rule) => ({
              venueId,
              label: rule.label,
              daysOfWeek: rule.daysOfWeek,
              startMin: rule.startMin,
              endMin: rule.endMin,
              walkInPrice: rule.walkInPrice,
              fixedPrice: rule.fixedPrice,
            })),
          });
        }
      }

      // 5.4 Ghi nhật ký quản trị AdminAudit
      await tx.adminAudit.create({
        data: {
          actorId: actor.id,
          actorName: actor.name,
          action: "UPDATE_VENUE_FULL",
          entityId: venueId,
          reason: "Chủ sân/Quản trị viên cập nhật thông tin nghiệp vụ cơ sở, sân con và bảng giá",
          details: {
            actorRole: actor.role,
            openMin: data.openMin,
            closeMin: data.closeMin,
            cancelBeforeHours: data.cancelBeforeHours,
            courtsCount: data.courts?.length ?? existingVenue.courts.length,
            pricingRulesCount: data.pricingRules?.length ?? existingVenue.pricing.length,
            priceFrom: newPriceFrom,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return venue;
    });

    await invalidatePublicVenueCache();
    return NextResponse.json({
      success: true,
      message: "Cập nhật toàn bộ thông tin cơ sở và cấu hình thành công.",
      data: updated,
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
