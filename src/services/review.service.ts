import type { PrismaClient } from "@prisma/client";
import { PaymentError } from "../lib/payment-error";
import { serializable } from "../lib/transaction";
import { validateReviewPhotos, type ReviewPhotoInput } from "../lib/review-images";
import { hasFinishedPlaying, reviewInputSchema } from "../lib/review-policy";

export async function submitBookingReview(db: PrismaClient, userId: string, code: string, raw: unknown, now = new Date(), photos: ReviewPhotoInput[] = []) {
  const validatedPhotos = validateReviewPhotos(photos);
  const parsed = reviewInputSchema.safeParse(raw);
  if (!parsed.success) throw new PaymentError(400, parsed.error.issues[0]?.message || "Đánh giá không hợp lệ.");
  const input = parsed.data;
  return serializable(db, async tx => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { status: true } });
    if (user?.status !== "ACTIVE") throw new PaymentError(403, "Tài khoản không hoạt động.");
    const booking = await tx.booking.findFirst({
      where: { code, userId }, include: { items: true, review: { include: { images: { select: { id: true, sha256: true }, orderBy: { position: "asc" } } } } },
    });
    if (!booking) throw new PaymentError(404, "Không tìm thấy đơn đặt sân của bạn.");
    if (!hasFinishedPlaying(booking, now)) throw new PaymentError(409, "Bạn chỉ được đánh giá sau khi đã chơi xong và đơn được hoàn tất.");
    if (booking.review) {
      if (booking.review.rating === input.rating && (booking.review.comment || "") === input.comment && (booking.review.images || []).length === validatedPhotos.length && validatedPhotos.every((p, i) => booking.review!.images[i].sha256 === p.sha256)) return booking.review;
      throw new PaymentError(409, "Đơn này đã được đánh giá. Mỗi đơn chỉ được gửi một đánh giá.");
    }
    const review = await tx.review.create({ data: {
      bookingId: booking.id, venueId: booking.venueId, userId, ...input,
      ...(validatedPhotos.length ? { images: { create: validatedPhotos.map((p, position) => ({ ...p, position })) } } : {}),
    } });
    const totals = await tx.review.aggregate({ where: { venueId: booking.venueId }, _avg: { rating: true }, _count: { _all: true } });
    await tx.venue.update({ where: { id: booking.venueId }, data: {
      ratingAvg: totals._avg.rating || 0, ratingCount: totals._count._all,
    } });
    return review;
  });
}
