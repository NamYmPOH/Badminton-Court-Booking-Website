import { db } from "@/lib/db";
import { PaymentError, paymentErrorResponse } from "@/lib/sepay";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const image = await db.reviewImage.findFirst({ where: { id: params.id, review: { venue: { status: "ACTIVE" } } }, select: { data: true, mimeType: true } });
    if (!image) throw new PaymentError(404, "Không tìm thấy ảnh đánh giá.");
    return new Response(new Uint8Array(image.data), { headers: { "Content-Type": image.mimeType, "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox", "Cache-Control": "private, max-age=300" } });
  } catch(error) { return paymentErrorResponse(error); }
}
