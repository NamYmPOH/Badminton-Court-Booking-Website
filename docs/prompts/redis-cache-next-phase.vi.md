# Prompt kiểm tra setup và mở rộng Redis cache

Sao chép nội dung sau vào chat khi muốn kiểm tra môi trường hoặc triển khai giai đoạn kế tiếp:

```text
BƯỚC ĐẦU TIÊN
1. Đọc graphify-out/GRAPH_REPORT.md để định hướng, sau đó đọc AGENTS.md.
2. So sánh commit graph với HEAD; đối chiếu mã nguồn hiện tại nếu graph cũ.
3. Đọc docs/redis-cache.vi.md, src/lib/public-cache.ts,
   src/services/venue.service.ts và các test Redis cache trước khi sửa.

MỤC TIÊU
Kiểm tra Redis cache catalog sân đã hoạt động trên môi trường của tôi.
Nếu đã hoạt động ổn, khảo sát cache hồ sơ/danh sách HLV công khai và
đề xuất hoặc triển khai phạm vi nhỏ có thể kiểm chứng dựa trên source hiện tại.

YÊU CẦU
- Kiểm tra môi trường có Redis endpoint TCP/TLS và quyền GET/SET/DEL/EVAL.
  Không in URL có credentials hoặc nội dung .env ra log/chat.
  Không thay các cấu hình database/auth/thanh toán đang có.
  Không tạo tài nguyên trả phí hay deploy production nếu chưa được yêu cầu.
- Chạy npm run cache:check bằng namespace tạm. Fallback DB không được
  coi là kết quả kiểm tra Redis thành công. Nếu thiếu Redis, hướng dẫn setup
  cụ thể và báo rõ phần chưa kiểm chứng.
- Với cache HLV, liệt kê DTO công khai, consumer, mọi luồng ghi có ảnh hưởng:
  profile, tên/ảnh và trạng thái tài khoản, chứng chỉ, trạng thái HLV,
  liên kết sân và trạng thái sân. Invalidate sau commit.
- Cache dữ liệu công khai trước khi cá nhân hóa; không cache response chứa
  email/số điện thoại riêng tư, token, quyền hay dữ liệu tài khoản.
- Không cache lịch trống/giữ chỗ, giá chốt thanh toán, ngân sách/quota ưu đãi,
  booking-catalog có resumePaymentUrl, xác nhận đặt sân hay thanh toán.
- Giữ singleflight, distributed lock có TTL/token ownership, publish fencing,
  bounded wait, timeout ngắn, cooldown khi Redis lỗi và giới hạn loader DB.
  Không bắt lỗi DB như lỗi Redis để gọi loader lần hai.
- Key phải chuẩn hóa, có namespace theo môi trường và giới hạn cardinality.
  Nếu cache danh sách theo bộ lọc, key chứa mọi tham số ảnh hưởng dữ liệu.
- Khi mở rộng allowlist, cập nhật invalidation tương ứng từng loại cache;
  không chỉ xóa catalog sân rồi bỏ sót cache HLV phụ thuộc sân.
- Đo hit/miss/coalesced, DB query, latency, fallback và rejected bằng log
  tổng hợp; không tạo endpoint metrics công khai lộ dữ liệu.
- Viết test hành vi cho cache hit/miss, TTL, nhiều request đồng thời,
  Redis timeout/mất kết nối, loader error, race ghi/đọc, invalidate lỗi,
  chống trộn dữ liệu người dùng và rollback transaction.
- Chạy test phù hợp, TypeScript và lint. Ghi rõ test giả lập và test Redis thật.
  Nếu commit, tiêu đề và nội dung commit phải bằng tiếng Việt.

ĐẦU RA
1. Phạm vi cache đã chạy, phạm vi mới nếu có, TTL và invalidation.
2. Kết quả kiểm chứng thực tế, giới hạn nhất quán và phần còn thiếu.
3. File đã đổi và hướng dẫn setup/restart/rollback ngắn gọn.
```
