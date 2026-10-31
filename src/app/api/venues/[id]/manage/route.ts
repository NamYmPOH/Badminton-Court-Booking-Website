import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { PaymentError, paymentErrorResponse } from "@/lib/sepay";
import { normalizeAmenities, AMENITIES, type Amenity } from "@/lib/config/constants";

export const dynamic = "force-dynamic";

const updateVenueSchema = z.object({
  name: z.string().trim().min(2, "Tên cơ sở tối thiểu 2 ký tự").max(100),
  description: z.string().trim().max(2000).optional().nullable(),
  address: z.string().trim().min(5, "Địa chỉ tối thiểu 5 ký tự").max(250),
  ward: z.string().trim().max(100).optional().nullable(),
  district: z.string().trim().min(2, "Vui lòng chọn quận/huyện").max(100),
  province: z.string().trim().min(2, "Vui lòng chọn tỉnh/thành phố").max(100),
  phone: z.string().trim().min(8, "Số điện thoại liên hệ không hợp lệ").max(20),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  openMin: z.number().int().min(0).max(1440),
  closeMin: z.number().int().min(0).max(1440),
  amenities: z.array(z.string()).max(20),
  images: z.array(z.string().url("Đường dẫn ảnh không hợp lệ")).max(10).optional(),
  courts: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().trim().min(1, "Tên sân không được để trống").max(50),
        surface: z.string().trim().max(50).optional().nullable(),
        status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]).optional(),
      })
    )
    .optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET: Lấy thông tin chi tiết cơ sở phục vụ quản lý (ADMIN & OWNER)
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
        amenities: normalizeAmenities(venue.amenities),
        images: venue.images,
        status: venue.status,
        courts: venue.courts,
      },
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

/**
 * PATCH: Cập nhật thông tin mô tả, liên hệ, tiện ích cơ sở và mặt sân con
 * Chỉ ADMIN và OWNER cơ sở mới có quyền cập nhật. STAFF bị chặn 403.
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
      throw new PaymentError(403, "Nhân viên không có quyền chỉnh sửa thông tin hoặc cấu hình cơ sở.");
    }

    // 2. Kiểm tra quyền sở hữu đối với OWNER
    const existingVenue = await db.venue.findUnique({
      where: { id: venueId },
      select: { id: true, ownerId: true, name: true },
    });

    if (!existingVenue) throw new PaymentError(404, "Không tìm thấy cơ sở.");

    if (actor.role !== "ADMIN" && existingVenue.ownerId !== actor.id) {
      throw new PaymentError(403, "Bạn không có quyền chỉnh sửa cơ sở này.");
    }

    // 3. Validation dữ liệu đầu vào với Zod
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

    // Chuẩn hóa danh mục tiện ích: map alias như AC -> AIRCON, loại bỏ duplicate
    const cleanAmenities = normalizeAmenities(data.amenities);

    // 4. Thực thi transaction cập nhật dữ liệu và ghi nhật ký AdminAudit
    const updated = await db.$transaction(async (tx) => {
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
          lat: data.lat,
          lng: data.lng,
          openMin: data.openMin,
          closeMin: data.closeMin,
          amenities: cleanAmenities,
          ...(data.images ? { images: data.images } : {}),
        },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          address: true,
          ward: true,
          district: true,
          province: true,
          phone: true,
          lat: true,
          lng: true,
          openMin: true,
          closeMin: true,
          amenities: true,
          images: true,
        },
      });

      // Cập nhật cấu hình từng sân con nếu có
      if (data.courts && data.courts.length > 0) {
        for (const courtData of data.courts) {
          await tx.court.updateMany({
            where: { id: courtData.id, venueId },
            data: {
              name: courtData.name,
              surface: courtData.surface,
              ...(courtData.status ? { status: courtData.status } : {}),
            },
          });
        }
      }

      // Ghi audit log người sửa/cơ sở/thời điểm/nội dung
      await tx.adminAudit.create({
        data: {
          actorId: actor.id,
          actorName: actor.name,
          action: "UPDATE_VENUE_INFO",
          entityId: venueId,
          reason: "Chỉnh sửa thông tin cơ sở, tiện ích và danh sách sân con",
          details: {
            actorRole: actor.role,
            updatedFields: Object.keys(data).filter((k) => k !== "courts"),
            amenitiesCount: cleanAmenities.length,
            courtsUpdatedCount: data.courts?.length ?? 0,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return venue;
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật thông tin cơ sở và tiện ích thành công.",
      data: updated,
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
