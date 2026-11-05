# Đánh giá sân và ảnh đính kèm

- Nút Đánh giá sân tại Lịch của tôi mở `/venues/[slug]/reviews?booking=...`.
- Trang đánh giá gộp phản hồi người chơi và dữ liệu mẫu. Điểm = tổng sao / tổng số đánh giá; luôn công bố số mẫu. Bộ lọc và phân trang không thay đổi điểm tổng hợp.
- Các trường ratingAvg/ratingCount lưu trong Venue vẫn là tổng hợp đánh giá người chơi. Lớp hiển thị cộng dữ liệu mẫu đúng một lần, không tạo Booking hay Payment giả.
- Chỉ chủ đơn COMPLETED đã qua giờ kết thúc được gửi. Mỗi đơn một đánh giá; retry cùng nội dung/ảnh không tạo trùng.
- Chấp nhận tối đa 3 ảnh JPEG/PNG/WebP, mỗi ảnh tối đa 2 MiB, tổng tối đa 3 MiB. Kiểm tra MIME và chữ ký file ở backend.
- Ảnh được lưu dạng BYTEA trong ReviewImage, cùng transaction tạo Review. Không cần cấu hình dịch vụ lưu trữ khác. Ảnh được phục vụ qua `/api/review-images/[id]` cho đánh giá thuộc sân đang hoạt động.

## Cập nhật môi trường khác

1. Áp dụng `prisma/patches/20261105_review_images.sql` vào đúng database của môi trường.
2. Chạy `npx prisma generate`. Nếu Windows khóa query_engine-windows.dll.node, dừng dev server trước rồi chạy lại.
3. Khởi động lại dev server để nạp Prisma Client mới.

Bản thay đổi này đã áp dụng bảng ReviewImage vào database được cấu hình cho local. Chưa push code hoặc triển khai website production.

## Kiểm tra

`npx tsc --noEmit`

`node --test tests/review.test.cjs tests/review-images.test.cjs tests/review-summary.test.cjs tests/venue-reviews-api.test.cjs`

`npm run lint`

Kiểm thử dịch vụ dùng database fixture có rollback; không tự ghi đánh giá thử vào tài khoản khách thật. Các kiểm tra HTTP local sử dụng GET và không thay đổi dữ liệu.
