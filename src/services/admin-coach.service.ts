import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { coachAvailabilityInputSchema, coachProfileInputSchema } from "../lib/coach-policy";
import { PaymentError } from "../lib/payment-error";
import { serializable } from "../lib/transaction";
import { invalidatePublicCoachCache } from "../lib/public-cache";

export const coachManagementSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("profile"), profile: coachProfileInputSchema }).strict(),
  z.object({ action: z.literal("venue"), venueId: z.string().min(1), status: z.enum(["ACTIVE", "SUSPENDED"]) }).strict(),
  z.object({ action: z.literal("slot"), id: z.string().min(1).optional(), slot: coachAvailabilityInputSchema }).strict(),
  z.object({ action: z.literal("deleteSlot"), id: z.string().min(1) }).strict(),
]);

export async function manageCoach(database: PrismaClient, actorId: string, coachId: string, raw: unknown) {
  const parsed = coachManagementSchema.safeParse(raw);
  if (!parsed.success) throw new PaymentError(400, parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ.");
  const input = parsed.data;
  const result = await serializable(database, async (tx) => {
    const actor = await tx.user.findUnique({ where: { id: actorId } });
    if (!actor || actor.role !== "ADMIN" || actor.status !== "ACTIVE") throw new PaymentError(403, "Chỉ quản trị viên được quản lý HLV.");
    const coach = await tx.coachProfile.findUnique({ where: { id: coachId } });
    if (!coach) throw new PaymentError(404, "Không tìm thấy huấn luyện viên.");
    const now = new Date();
    const activeBookings = { coachId, OR: [{ status: "CONFIRMED" as const }, { status: "HELD" as const, expiresAt: { gt: now } }] };
    if (input.action === "profile") {
      await tx.coachProfile.update({ where: { id: coachId }, data: input.profile });
    } else if (input.action === "venue") {
      const venue = await tx.venue.findUnique({ where: { id: input.venueId } });
      if (!venue || (input.status === "ACTIVE" && venue.status !== "ACTIVE")) throw new PaymentError(400, "Cơ sở chưa hoạt động hoặc không tồn tại.");
      await tx.coachVenue.upsert({
        where: { coachId_venueId: { coachId, venueId: input.venueId } },
        create: { coachId, venueId: input.venueId, status: input.status, reviewedAt: now, reviewedById: actorId },
        update: { status: input.status, reviewedAt: now, reviewedById: actorId },
      });
    } else {
      if (input.id) {
        const old = await tx.coachAvailability.findUnique({ where: { id: input.id } });
        if (!old || old.coachId !== coachId) throw new PaymentError(404, "Không tìm thấy ca rảnh của HLV này.");
        if (await tx.coachBooking.findFirst({ where: { ...activeBookings, startsAt: { lt: old.endsAt }, endsAt: { gt: old.startsAt } } })) throw new PaymentError(409, "Ca này đã có khách đặt, không thể sửa hoặc xóa.");
      }
      if (input.action === "deleteSlot") {
        await tx.coachAvailability.delete({ where: { id: input.id } });
      } else {
        const startsAt = new Date(input.slot.startsAt);
        const endsAt = new Date(input.slot.endsAt);
        if (startsAt <= now) throw new PaymentError(400, "Ca rảnh phải bắt đầu trong tương lai.");
        if (coach.status !== "ACTIVE") throw new PaymentError(400, "Cần kích hoạt HLV trước khi mở ca rảnh.");
        const link = await tx.coachVenue.findUnique({ where: { coachId_venueId: { coachId, venueId: input.slot.venueId } }, include: { venue: true } });
        if (link?.status !== "ACTIVE" || link.venue.status !== "ACTIVE") throw new PaymentError(400, "Hãy liên kết và duyệt cơ sở trước khi mở ca rảnh.");
        const overlap = { coachId, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } };
        if (await tx.coachAvailability.findFirst({ where: { ...overlap, ...(input.id ? { id: { not: input.id } } : {}) } }) || await tx.coachBooking.findFirst({ where: { ...activeBookings, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } } })) throw new PaymentError(409, "Khung giờ trùng với ca rảnh hoặc lịch đã đặt tại một cơ sở.");
        const data = { coachId, venueId: input.slot.venueId, startsAt, endsAt };
        if (input.id) await tx.coachAvailability.update({ where: { id: input.id }, data });
        else await tx.coachAvailability.create({ data });
      }
    }
    await tx.adminAudit.create({ data: { actorId, actorName: actor.name || "Quản trị viên", action: "COACH_MANAGE", entityId: coachId, reason: "Quản lý hồ sơ, cơ sở và ca rảnh HLV", details: input } });
    return { success: true };
  });
  if (input.action === "profile" || input.action === "venue") await invalidatePublicCoachCache();
  return result;
}
