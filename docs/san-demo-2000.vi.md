# Sân demo 2.000 VND/giờ

1. Mở `prisma/seeds/demo-court-2000.sql`, sao chép toàn bộ vào Supabase SQL Editor của database ứng dụng đang dùng.
2. Chạy toàn bộ script một lần. Script ưu tiên chủ sân ACTIVE của cơ sở `group-trial`; nếu không có thì chỉ tự chọn khi có duy nhất một User ACTIVE mang role OWNER/ADMIN. Nếu báo không xác định được chủ sân, lấy ID từ bảng User và điền vào `demo_owner_id`, rồi chạy lại toàn bộ.
3. Kết quả mong đợi: hai dòng bảng giá cho cùng một sân, giá 2000 mỗi giờ, 1000 mỗi 30 phút.
4. Mở https://badminton-court-booking-website-five.vercel.app/venues/san-demo-2000/book .
5. Chọn ngày và hai ô 30 phút liên tiếp trong tương lai trên Sân 1. Không áp dụng voucher/HLV nếu muốn tổng đúng 2.000đ. Tiếp tục thanh toán bằng luồng hiện có.

## Phạm vi

- Một Venue ACTIVE và một Court ACTIVE riêng, 06:00–24:00, giá 2.000 VND/giờ cả tuần, tối thiểu 60 phút.
- Không sửa giá sân khác, không tạo tài khoản/mật khẩu, không đổi quyền người dùng.
- Không tạo giao dịch hoặc giả lập thanh toán thành công. Chuyển khoản qua mã QR thật vẫn là giao dịch tiền thật.
- Chạy lại không tạo bản ghi trùng; cập nhật lại giá/giờ/trạng thái demo, giữ lịch sử đơn và thanh toán.
- Nếu cơ sở demo đã được bổ sung sân/biểu giá, script dừng để người vận hành kiểm tra, không xóa dữ liệu.
- Tương thích các trường cơ bản của schema main tại thời điểm tạo. Không yêu cầu các cột bố cục; nếu database đã mở rộng, các trường tùy chọn/default được database xử lý.
- Dữ liệu này đánh dấu rõ là cơ sở thử nghiệm, không phải địa chỉ sân phục vụ thực tế.
- Nếu không thấy trong ba thẻ trang chủ, tìm “Sân Demo SmashBook” ở danh sách hoặc dùng link đặt trực tiếp.

## Kiểm chứng và giới hạn

Đã đối chiếu các cột, enum, trường bắt buộc với Prisma schema trên main; đối chiếu API booking-catalog và cách tính giá 30 phút. Hai biểu giá bao phủ ngày 1–7, không trùng ngày, cùng giá 2000/giờ.

Chưa thực thi SQL trên PostgreSQL, chưa kiểm thử thanh toán thật hoặc xác minh cấu hình webhook. Người dùng tự chạy SQL theo yêu cầu. Merge mã nguồn không tự tạo dữ liệu trong Supabase.

Khi kết thúc demo, có thể ngừng cơ sở bằng trang quản trị. Giữ lại lịch sử giao dịch; không xóa dữ liệu khi còn đơn cần xử lý.
