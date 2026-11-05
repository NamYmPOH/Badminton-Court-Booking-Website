import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { PaymentError, paymentErrorResponse } from "@/lib/sepay";
import type { ReviewPhotoInput } from "@/lib/review-images";
import { submitBookingReview } from "@/services/review.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REVIEW_PAYLOAD_BYTES = 4 * 1024 * 1024; // 4 MB tối đa cho toàn bộ payload đánh giá kèm ảnh

/**
 * Đọc toàn bộ stream body và kiểm tra giới hạn kích thước trước khi xử lý,
 * hỗ trợ cả multipart/form-data và application/json mà không ép cứng Content-Type.
 */
async function readRawStreamBody(request: Request, limit = MAX_REVIEW_PAYLOAD_BYTES): Promise<Buffer> {
  const reader = request.body?.getReader();
  if (!reader) throw new PaymentError(400, "Thiếu dữ liệu gửi lên.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw new PaymentError(413, "Dung lượng dữ liệu vượt quá giới hạn 4 MB.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock?.();
  }
  return Buffer.concat(chunks);
}

export async function POST(request: Request, { params }: { params: { code: string } }) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();
    const contentType = request.headers.get("content-type") || "";
    const raw = await readRawStreamBody(request, MAX_REVIEW_PAYLOAD_BYTES);
    const photos: ReviewPhotoInput[] = [];
    let input: unknown;

    if (contentType.startsWith("multipart/form-data")) {
      let form: FormData;
      try {
        form = await new Response(new Uint8Array(raw), {
          headers: { "Content-Type": contentType },
        }).formData();
      } catch {
        throw new PaymentError(400, "Dữ liệu form hoặc ảnh không hợp lệ.");
      }

      input = {
        rating: Number(form.get("rating")),
        comment: String(form.get("comment") || ""),
      };

      for (const file of form.getAll("photos")) {
        if (typeof file === "string") {
          throw new PaymentError(400, "Ảnh đính kèm không hợp lệ.");
        }
        // Bỏ qua nếu là file rỗng từ input file không chọn ảnh
        if (file.size === 0 && !file.name) {
          continue;
        }
        photos.push({
          mimeType: file.type,
          data: Buffer.from(await file.arrayBuffer()),
        });
      }
    } else if (contentType.split(";")[0].trim() === "application/json") {
      try {
        input = JSON.parse(raw.toString("utf8"));
      } catch {
        throw new PaymentError(400, "JSON không hợp lệ.");
      }
    } else {
      throw new PaymentError(415, "Yêu cầu Content-Type application/json hoặc multipart/form-data.");
    }

    const review = await submitBookingReview(db, userId, params.code, input, new Date(), photos);
    return Response.json(
      {
        success: true,
        review: { id: review.id, rating: review.rating, comment: review.comment },
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

