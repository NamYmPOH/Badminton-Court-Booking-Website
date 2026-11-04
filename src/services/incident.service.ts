import { type PrismaClient, Prisma } from "@prisma/client";
import { PaymentError } from "../lib/sepay";
import { serializable } from "../lib/transaction";
import { refundLedger, approveCancellationInTransaction } from "./refund.service";
import { sendVenueNotification } from "./venue-session.service";

export type IncidentType =
  | "HEAVY_RAIN"
  | "POWER_OUTAGE"
  | "COURT_MAINTENANCE"
  | "SYSTEM_ERROR"
  | "OTHER";

export type IncidentRequestType = "REFUND" | "RESCHEDULE";

export interface ReportIncidentInput {
  bookingCode: string;
  actorId: string;
  incidentType: IncidentType;
  requestType: IncidentRequestType;
  description: string;
}

export interface ConfirmIncidentInput {
  incidentId: string;
  actorId: string;
  action: "APPROVE" | "REJECT" | "MANUAL_REVIEW";
  resolution?: IncidentRequestType;
  adminNote: string;
}

export const INCIDENT_LABELS: Record<IncidentType, string> = {
  HEAVY_RAIN: "Mưa lớn / Ngập lụt",
  POWER_OUTAGE: "Mất điện tại sân",
  COURT_MAINTENANCE: "Bảo trì sân đột xuất",
  SYSTEM_ERROR: "Lỗi hệ thống",
  OTHER: "Lý do bất khả kháng khác",
};

/**
 * Khách hàng hoặc người vận hành gửi báo cáo sự cố bất khả kháng.
 * Không tự động áp dụng ngoại lệ hay tự hoàn 100%; luôn ở trạng thái PENDING chờ xác nhận.
 */
export async function reportBookingIncident(
  db: PrismaClient,
  input: ReportIncidentInput,
  now = new Date()
) {
  return serializable(db, async (tx) => {
    const actor = await tx.user.findUnique({
      where: { id: input.actorId },
      select: { id: true, name: true, role: true, status: true },
    });
    if (!actor || actor.status !== "ACTIVE") {
      throw new PaymentError(403, "Tài khoản của bạn đã bị khóa hoặc không tồn tại.");
    }

    const booking = await tx.booking.findUnique({
      where: { code: input.bookingCode },
      include: {
        venue: { select: { id: true, name: true, ownerId: true } },
      },
    });

    if (!booking) {
      throw new PaymentError(404, "Không tìm thấy đơn đặt sân.");
    }

    // Chỉ chủ đơn hoặc quản trị viên/chủ sân mới được gửi báo cáo
    const isOwnerOrAdmin = actor.role === "ADMIN" || booking.venue.ownerId === actor.id;
    const isBooker = booking.userId === actor.id;
    if (!isBooker && !isOwnerOrAdmin) {
      throw new PaymentError(403, "Bạn không có quyền báo cáo sự cố cho đơn đặt sân này.");
    }

    if (["CANCELLED", "EXPIRED"].includes(booking.status)) {
      throw new PaymentError(409, "Đơn đặt sân đã bị hủy hoặc hết hạn.");
    }

    const cleanDesc = input.description.trim();
    if (cleanDesc.length < 5 || cleanDesc.length > 1000) {
      throw new PaymentError(400, "Vui lòng mô tả chi tiết sự cố từ 5 đến 1000 ký tự.");
    }

    // Tạo bản ghi yêu cầu sự cố ở trạng thái PENDING
    const incident = await tx.bookingIncidentRequest.create({
      data: {
        bookingId: booking.id,
        venueId: booking.venue.id,
        requestedById: actor.id,
        requestedByName: actor.name,
        incidentType: input.incidentType,
        requestType: input.requestType,
        description: cleanDesc,
        status: "PENDING",
        createdAt: now,
      },
    });

    // Thông báo cho chủ sân / quản lý cơ sở
    await sendVenueNotification(
      tx,
      booking.venue.id,
      `Báo cáo sự cố · ${INCIDENT_LABELS[input.incidentType]}`,
      `Khách hàng ${actor.name} đã báo cáo sự cố cho đơn ${booking.code}. Yêu cầu: ${input.requestType === "REFUND" ? "Hoàn tiền" : "Đổi lịch"}. Cần xác nhận trước khi áp dụng ngoại lệ.`,
      {
        tag: "INCIDENT_REPORTED",
        incidentId: incident.id,
        bookingCode: booking.code,
        incidentType: input.incidentType,
      }
    );

    // Ghi nhật ký
    await tx.adminAudit.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        action: "REPORT_INCIDENT",
        entityId: booking.id,
        reason: cleanDesc,
        details: {
          bookingCode: booking.code,
          incidentType: input.incidentType,
          requestType: input.requestType,
        },
      },
    });

    return {
      success: true,
      incidentId: incident.id,
      status: "PENDING",
      message: "Báo cáo sự cố đã được gửi. Quản lý sân sẽ kiểm tra thực tế và xác nhận giải quyết.",
    };
  });
}

/**
 * Chủ sân hoặc Quản trị viên thẩm định và xác nhận sự cố bất khả kháng.
 * Mức hoàn căn cứ cấu hình sự cố của sân; nếu thiếu cấu hình thì đưa vào xử lý thủ công.
 */
export async function confirmBookingIncident(
  db: PrismaClient,
  input: ConfirmIncidentInput,
  now = new Date()
) {
  return serializable(db, async (tx) => {
    const actor = await tx.user.findUnique({
      where: { id: input.actorId },
      select: { id: true, name: true, role: true, status: true },
    });
    if (!actor || actor.status !== "ACTIVE") {
      throw new PaymentError(403, "Tài khoản của bạn đã bị khóa hoặc không hoạt động.");
    }

    const incident = await tx.bookingIncidentRequest.findUnique({
      where: { id: input.incidentId },
      include: {
        booking: {
          include: {
            venue: true,
            payments: { where: { status: "PAID" } },
          },
        },
      },
    });

    if (!incident) {
      throw new PaymentError(404, "Không tìm thấy yêu cầu sự cố.");
    }

    if (incident.status !== "PENDING" && incident.status !== "MANUAL_REVIEW") {
      throw new PaymentError(409, "Yêu cầu sự cố này đã được xử lý trước đó.");
    }

    const isOwnerOrAdmin = actor.role === "ADMIN" || incident.booking.venue.ownerId === actor.id;
    if (!isOwnerOrAdmin) {
      throw new PaymentError(403, "Chỉ chủ sân hoặc quản trị viên mới có quyền thẩm định và xác nhận sự cố.");
    }

    const cleanNote = input.adminNote.trim();
    if (cleanNote.length < 5) {
      throw new PaymentError(400, "Vui lòng nhập ghi chú thẩm định ít nhất 5 ký tự.");
    }

    // 1. Trường hợp từ chối (Không công nhận sự cố)
    if (input.action === "REJECT") {
      await tx.bookingIncidentRequest.update({
        where: { id: incident.id },
        data: {
          status: "REJECTED",
          confirmedById: actor.id,
          confirmedByName: actor.name,
          confirmedAt: now,
          adminNote: cleanNote,
        },
      });

      await tx.adminAudit.create({
        data: {
          actorId: actor.id,
          actorName: actor.name,
          action: "REJECT_INCIDENT",
          entityId: incident.booking.id,
          reason: cleanNote,
          details: {
            incidentId: incident.id,
            bookingCode: incident.booking.code,
            incidentType: incident.incidentType,
          },
        },
      });

      return {
        success: true,
        status: "REJECTED",
        message: "Đã từ chối áp dụng ngoại lệ sự cố bất khả kháng cho đơn này.",
      };
    }

    // 2. Trường hợp đưa vào xử lý thủ công (thương lượng trực tiếp)
    if (input.action === "MANUAL_REVIEW") {
      await tx.bookingIncidentRequest.update({
        where: { id: incident.id },
        data: {
          status: "MANUAL_REVIEW",
          confirmedById: actor.id,
          confirmedByName: actor.name,
          confirmedAt: now,
          adminNote: cleanNote,
        },
      });

      return {
        success: true,
        status: "MANUAL_REVIEW",
        message: "Đã chuyển yêu cầu sang trạng thái chờ xử lý thỏa thuận thủ công.",
      };
    }

    // 3. Trường hợp xác nhận sự cố (APPROVE):
    // Kiểm tra cấu hình chính sách sự cố của cơ sở sân (venue.forceMajeurePolicy)
    const policyMap = incident.booking.venue.forceMajeurePolicy as Record<string, number> | null;
    const configuredRate = policyMap && typeof policyMap[incident.incidentType] === "number"
      ? policyMap[incident.incidentType]
      : null;

    // Nếu cơ sở sân chưa cấu hình tỷ lệ cho loại sự cố này -> không mặc định 100%, chuyển sang chờ xử lý thủ công
    if (configuredRate === null) {
      await tx.bookingIncidentRequest.update({
        where: { id: incident.id },
        data: {
          status: "MANUAL_REVIEW",
          confirmedById: actor.id,
          confirmedByName: actor.name,
          confirmedAt: now,
          adminNote: `${cleanNote} (Cơ sở chưa cấu hình tỷ lệ hoàn cho sự cố ${incident.incidentType}, chuyển sang xử lý thỏa thuận thủ công).`,
        },
      });

      return {
        success: true,
        status: "MANUAL_REVIEW",
        message: "Cơ sở chưa cấu hình tỷ lệ hoàn cho sự cố này. Yêu cầu đã được chuyển sang xử lý thủ công.",
      };
    }

    // Có cấu hình tỷ lệ hợp lệ:
    const resolution = input.resolution || incident.requestType;
    const ledger = await refundLedger(tx, incident.booking.id);
    const refundAmount = Math.floor(ledger.available * (configuredRate / 100));

    if (resolution === "REFUND") {
      // Hủy đơn và duyệt hoàn tiền theo tỷ lệ cấu hình sự cố
      if (incident.booking.status !== "CANCELLED" || !incident.booking.cancelApprovedAt) {
        await approveCancellationInTransaction(
          tx,
          incident.booking,
          refundAmount,
          `Xác nhận sự cố: ${INCIDENT_LABELS[incident.incidentType as IncidentType]} (${configuredRate}%) - ${cleanNote}`,
          now
        );
      }
    }

    await tx.bookingIncidentRequest.update({
      where: { id: incident.id },
      data: {
        status: "APPROVED",
        resolution,
        refundRate: configuredRate,
        refundAmount: resolution === "REFUND" ? refundAmount : 0,
        confirmedById: actor.id,
        confirmedByName: actor.name,
        confirmedAt: now,
        adminNote: cleanNote,
      },
    });

    await tx.adminAudit.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        action: "CONFIRM_INCIDENT",
        entityId: incident.booking.id,
        reason: cleanNote,
        details: {
          incidentId: incident.id,
          bookingCode: incident.booking.code,
          incidentType: incident.incidentType,
          resolution,
          refundRate: configuredRate,
          refundAmount,
        },
      },
    });

    return {
      success: true,
      status: "APPROVED",
      resolution,
      refundRate: configuredRate,
      refundAmount,
      message: `Đã xác nhận sự cố thành công theo cấu hình cơ sở (${configuredRate}%).`,
    };
  });
}
