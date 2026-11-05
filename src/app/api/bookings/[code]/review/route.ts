import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { PaymentError, paymentErrorResponse, readPaymentBody } from "@/lib/sepay";
import type { ReviewPhotoInput } from "@/lib/review-images";
import { submitBookingReview } from "@/services/review.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { code: string } }) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();
    const raw = await readPaymentBody(request, 4 * 1024 * 1024);
    const photos: ReviewPhotoInput[] = [];
    let input: unknown;
    if (request.headers.get("content-type")?.startsWith("multipart/form-data")) {
      let form: FormData;
      try { form = await new Response(new Uint8Array(raw), { headers: { "Content-Type": request.headers.get("content-type")! } }).formData(); } catch { throw new PaymentError(400, "Dữ liệu ảnh không hợp lệ."); }
      input = { rating: Number(form.get("rating")), comment: String(form.get("comment") || "") };
      for (const file of form.getAll("photos")) {
        if (typeof file === "string") throw new PaymentError(400, "Ảnh đính kèm không hợp lệ.");
        photos.push({ mimeType: file.type, data: Buffer.from(await file.arrayBuffer()) });
      }
    } else {
      try { input = JSON.parse(raw.toString("utf8")); } catch { throw new PaymentError(400, "JSON không hợp lệ."); }
    }
    const review = await submitBookingReview(db, userId, params.code, input, new Date(), photos);
    return Response.json({ success: true, review: { id: review.id, rating: review.rating, comment: review.comment } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return paymentErrorResponse(error); }
}
