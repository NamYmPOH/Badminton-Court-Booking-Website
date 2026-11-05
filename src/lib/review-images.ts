import { createHash } from "node:crypto";
import { PaymentError } from "./payment-error";

export type ReviewPhotoInput = { data: Buffer; mimeType: string };
export function validateReviewPhotos(photos: ReviewPhotoInput[]) {
  if (photos.length > 3) throw new PaymentError(400, "Tối đa 3 ảnh cho mỗi đánh giá.");
  if (photos.reduce((sum, p) => sum + p.data.length, 0) > 3 * 1024 * 1024) throw new PaymentError(400, "Tổng dung lượng ảnh tối đa 3 MB.");
  return photos.map(photo => {
    const bytes = photo.data;
    if (!bytes.length || bytes.length > 2 * 1024 * 1024) throw new PaymentError(400, "Mỗi ảnh phải có dung lượng từ 1 byte đến 2 MB.");
    const jpeg = bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
    const png = bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && bytes.subarray(12,16).toString() === "IHDR";
    const webp = bytes.length >= 16 && bytes.subarray(0,4).toString() === "RIFF" && bytes.subarray(8,12).toString() === "WEBP" && bytes.readUInt32LE(4) + 8 === bytes.length;
    if (!(photo.mimeType === "image/jpeg" && jpeg || photo.mimeType === "image/png" && png || photo.mimeType === "image/webp" && webp)) throw new PaymentError(400, "Chỉ nhận ảnh JPEG, PNG hoặc WebP hợp lệ. Không hỗ trợ SVG, GIF, HEIC.");
    return { ...photo, sha256: createHash("sha256").update(bytes).digest("hex") };
  });
}
