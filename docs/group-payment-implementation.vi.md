# Triển khai thử chia tiền nhóm

Ngày: 11/10/2026. Thiết kế: [group-payment-flow.vi.md](group-payment-flow.vi.md).

## Cách dùng

1. Tạo đơn như bình thường. Trên màn hình QR chọn **Chia tiền với nhóm** trước khi có khoản thu.
2. Chọn 2–30 người, chia đều hoặc nhập từng phần. Chốt bảng chia, sao chép link/QR mời.
3. Thành viên đăng nhập và mở link sẽ tự nhận ô trống đầu tiên sau trưởng nhóm. Tên tài khoản được hiển thị cho nhóm; “(Bạn)” chỉ đánh dấu người đang xem. Phần đã thanh toán được làm mờ và không thể chọn trả lại.
4. Trưởng nhóm có thể chọn các phần chưa trả để tạo QR trả thay, hoặc yêu cầu trả phần còn lại tại sân.
5. Chủ sân/nhân viên được phân quyền tại sân mở nhóm từ **Vận hành sân**. Nút **Xác nhận thu tiền mặt** ở từng ô ghi nhận khoản thực thu và nhật ký, kể cả khi các phần khác chưa trả. Duyệt trả sau vẫn là thao tác riêng, không tính là đã thu. Thu 1/4 phần không tự duyệt 3 phần còn lại hay kéo dài hạn giữ sân.
6. Cả đơn đủ tiền mới kích hoạt vé QR cá nhân. Nhân viên kiểm tra từng vé trong khung giờ nhận sân; mỗi vé chỉ dùng một lần.

Một nhóm vẫn dùng một đơn và hạn giữ sân cũ. Tổng các phần phải bằng tổng đơn. QR tổng đơn cũ ngừng tự đối soát khi đã chia nhóm. Mã cũ, tiền sai, chuyển trễ hoặc trùng phần được giữ để đối soát, không tự cộng thêm vào đơn.

## Dữ liệu và triển khai

Áp dụng lần lượt hai migration trong `supabase/migrations`: `group_payment_shares`, rồi `group_payment_expiry`. Bốn bảng mới chỉ được truy cập từ máy chủ, bật RLS và thu hồi quyền anon/authenticated. Cron mỗi phút xử lý nhóm hết hạn dù khách đóng trình duyệt.

Webhook SePay phải chạy **cùng phiên bản hỗ trợ mã GP** với giao diện nhóm. Không dùng QR của bản preview để chuyển tiền thật nếu webhook còn trỏ về bản production cũ. Các khóa SePay và tài khoản ngân hàng lấy từ cấu hình máy chủ hiện có.

Hủy/hết hạn tạo yêu cầu hoàn từ tiền thực nhận. Hoàn tiền vẫn do người vận hành thực hiện và nhập mã tham chiếu; hệ thống không tự chuyển tiền ra ngân hàng. Phần tiền đã chốt chưa hỗ trợ thay đổi số người/số tiền.

## Kiểm thử

- `npm test`: bộ kiểm thử đơn vị và hồi quy.
- `node scripts/test-group-integration.cjs`: tạo schema PostgreSQL ngẫu nhiên riêng, kiểm tra phân quyền, webhook trùng, đồng thời trả thay/tiền mặt, check-in, hoàn tiền, hết hạn nền; dọn schema trong finally.
- `node scripts/serve-group-trial.cjs`: chạy bản build tại `http://localhost:3102` với schema riêng, ngân hàng giả. Tài khoản leader/member/owner@example.test, mật khẩu thử `GroupTrial123!`. Dừng bằng Ctrl+C để dọn dữ liệu thử.
- `npx tsc --noEmit`, `npm run lint`, `npm run build`.

Đã kiểm thử xử lý thông báo SePay giả lập; chưa thực hiện chuyển khoản ngân hàng thật. Không chuyển tiền vào các QR ở môi trường thử độc lập.

## Preview độc lập

Nhánh codex/group-payment-trial dùng schema thử riêng và ngân hàng giả. Biến GROUP_TRIAL_MODE hiển thị nhãn không chuyển tiền thật. Đăng nhập các tài khoản thử ở trên, mở /venues/group-trial/book để tạo đơn mới và chọn chia tiền. Không dùng tài khoản thật ở preview này.

Các tab cùng trình duyệt dùng chung phiên đăng nhập. Dùng các hồ sơ trình duyệt khác nhau để thử nhiều tài khoản đồng thời. Thanh điều hướng đồng bộ khi đổi phiên hoặc quay lại tab; màn hình nhóm lấy danh tính và trạng thái thanh toán từ máy chủ.

Lệnh node scripts/serve-group-trial.cjs --prepare-preview chuẩn bị fixture tồn tại lâu hơn phiên local và lưu cấu hình vào .env.group-preview.json đã bị Git bỏ qua. Không commit hoặc chia sẻ tệp này. Các biến Vercel phải giới hạn target preview và đúng gitBranch.
