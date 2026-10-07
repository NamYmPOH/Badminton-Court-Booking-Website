# Kết nối website Next.js với SePay

## Những phần đã có trong source

- `POST /api/bookings`: yêu cầu đăng nhập, tính giá từ PostgreSQL, kiểm tra sân đang hoạt động, khóa sân và trùng giờ. Booking chuyển khoản giữ tối đa 10 phút; thanh toán tại sân xác nhận ngay nhưng vẫn UNPAID.
- `GET /api/bookings` và `GET /api/bookings/[code]`: chỉ chủ đơn đọc được. Trang QR polling 3 giây/lần, tự hiển thị thành công sau webhook.
- `POST /api/payment/webhook`: kiểm tra HMAC trên bytes body gốc và timestamp ±300 giây. Chỉ ghi PAID khi tiền vào đúng ngân hàng/tài khoản, đúng số tiền, đúng mã, đơn còn hạn và các ô sân vẫn HELD.
- `SepayReceipt.transactionId` là khóa chính chống nhận trùng. Receipt, Payment và trạng thái booking được commit trong cùng transaction Serializable, có retry khi tranh chấp. Lỗi DB trả 500; ACK HTTP 200 chỉ sau commit.
- `Booking.status` dùng `PENDING_PAYMENT → CONFIRMED`; `Booking.paymentStatus` dùng `PENDING → PAID`. Đây là hai trạng thái riêng theo schema hiện tại.
- Các kết quả `REVIEW_*` được lưu để đối soát thủ công, không tự hoàn tiền, cộng dồn hay mở lại đơn hết hạn. `success: true` xác nhận đã tiếp nhận webhook, không luôn đồng nghĩa booking PAID.

## Biến môi trường Production trên Vercel

Bạn đã cấu hình `SEPAY_AUTH_MODE=hmac`, `SEPAY_WEBHOOK_SECRET`, `BANK_BIN`, `BANK_ACCOUNT_NO`, `BANK_ACCOUNT_NAME`, `SEPAY_BANK_GATEWAY` và `DATABASE_URL`.

Cần thêm/kiểm tra:

- `AUTH_SECRET`: khóa ngẫu nhiên ít nhất 32 ký tự, dùng chung cho đăng nhập và đặt sân. Nếu thay khóa thì người dùng phải đăng nhập lại.
- `DIRECT_URL`: connection string trực tiếp (hoặc session pooler phù hợp) của cùng DB, dùng cho công cụ quản lý schema. Không dùng cổng transaction pooler để thay đổi schema. Lấy đúng giá trị từ nhà cung cấp.
- `SEPAY_SUB_ACCOUNT`: chỉ cần nếu cấu hình nhận vào một VA cụ thể.

Không gửi các giá trị bí mật qua chat. Khi chạy local, lưu khóa vào `.env.local`; file `.env` gốc hiện đã được Git theo dõi từ trước nên không thêm khóa thật vào đó. Không dùng `NEXT_PUBLIC_` cho các biến trên.

## Chuẩn bị database trước khi deploy

Kiểm tra chỉ đọc ngày 08/10/2026 qua kết nối Supabase: project `Badminton-Court-Booking-Website` (`jojqhavyavqallkvtaxx`) có schema public trống. Chưa chạy SQL thay đổi schema. Khi DATABASE_URL của Vercel trỏ đúng project này, sử dụng nhánh DB trống dưới đây.

Việc có `DATABASE_URL` chưa đảm bảo DB đã có bảng và dữ liệu sân. Dùng SQL editor của nhà cung cấp kiểm tra:

```sql
SELECT to_regclass('public."Booking"') AS booking_table,
       to_regclass('public."Venue"') AS venue_table,
       to_regclass('public."SepayReceipt"') AS receipt_table;
```

**Nếu đã có schema ứng dụng:** chạy file `prisma/patches/20261008_sepay.sql`. File chỉ thêm cột requestId, bảng receipt và index, không xóa bảng cũ. Sau khi chạy, kiểm tra các bảng/cột đúng kiểu dữ liệu; IF NOT EXISTS không sửa một bảng đã có nhưng cấu trúc sai.

**Nếu DB mới hoàn toàn, chưa có schema ứng dụng:** dùng `prisma/setup/empty-database.sql`, được sinh từ schema đầy đủ. Chỉ dùng trên DB trống. Không chạy file khởi tạo lên DB đã có bảng. File này không tạo sân, tài khoản người dùng hay giao dịch mẫu.

Các file SQL chưa được chạy vào database trên Vercel. Không tự động chạy thay đổi database trong lệnh build. Role backend cần quyền truy cập các bảng; `SepayReceipt` có RLS, kết nối backend phải dùng role server có quyền thích hợp (chủ bảng/BYPASSRLS), không dùng anon key. Không mở quyền đọc receipt cho trình duyệt.

## Dữ liệu cơ sở cần có

Danh sách giới thiệu hiện có dữ liệu mẫu. Trang chọn giờ và checkout đọc dữ liệu DB thật. Một cơ sở phải có:

1. `Venue` với `status=ACTIVE`, thông tin cơ sở thật, ownerId tham chiếu User hợp lệ, slug khớp đường dẫn trang cơ sở.
2. `Court` thuộc Venue, trạng thái ACTIVE.
3. `PricingRule` đầy đủ cho ngày và giờ mở cửa, giá VND theo giờ. Luồng này dùng ô 30 phút; thời lượng phải trong minBookingMin/maxBookingMin.
4. User của khách đăng nhập tồn tại trong PostgreSQL, trạng thái ACTIVE. Tài khoản chỉ lưu trong file demo không dùng để đặt sân thật.

Không tự import 100 sân minh họa và kích hoạt thu tiền cho chúng. Cấu hình hiện dùng một tài khoản ngân hàng chung cho website; chỉ kích hoạt ONLINE_FULL cho cơ sở thực sự nhận tiền qua tài khoản này. Các mã ưu đãi demo không được áp dụng trong checkout thật.

## Triển khai

1. Cập nhật schema DB theo nhánh phù hợp ở trên, xác nhận cơ sở/sân/giá đã tồn tại.
2. Commit/push source mới lên nhánh Vercel theo dõi. Lệnh build đã có `prisma generate` để Prisma Client trên Vercel khớp schema mới.
3. Đợi deployment Production thành công. Biến môi trường mới chỉ áp dụng cho deployment mới.
4. Trong SePay, URL phải là:
   `https://badminton-court-booking-website-five.vercel.app/api/payment/webhook`
5. Chọn sự kiện tiền vào, JSON, HMAC-SHA256 và đúng tài khoản ngân hàng. Nội dung chuyển khoản là `DATSAN` + 10 chữ số; cấu hình bộ lọc tiền tố DATSAN/hậu tố 10 số nếu sử dụng lọc mã.

Không đổi URL thành `/hooks/sepay-payment`. Mở URL webhook bằng trình duyệt gửi GET và nhận 405 là bình thường; điều đó không chứng minh webhook POST hoạt động.

## Thử luồng thanh toán

Nên dùng một deployment/database thử nghiệm và SePay Test Mode trước; không gửi webhook giả vào Production để đánh dấu đơn thật đã trả tiền.

1. Đăng ký/đăng nhập tài khoản đã lưu trong DB thử nghiệm.
2. Chọn cơ sở ACTIVE, chọn giờ rồi tạo đơn. Kiểm tra mã DATSAN, số tiền, tên và tài khoản trên ảnh QR.
3. Dùng payload trong `examples/sepay-express/postman/sepay-webhook.sample.json` nhưng thay id (mới mỗi giao dịch), content, code, transferAmount, accountNumber, gateway bằng giá trị của đơn vừa tạo. `code` chỉ là thông tin phụ; backend trích mã từ content.
4. Dùng `examples/sepay-express/postman/hmac.pre-request.js` để ký request bằng secret của môi trường thử nghiệm. Không chỉnh JSON sau khi ký.
5. Gửi POST: response `200 { success: true, result: "PAID" }`; trang QR tự báo thành công. Gửi lại cùng giao dịch nhận DUPLICATE, không ghi Payment lần hai.
6. Giao dịch mới nhưng thiếu/thừa tiền, sai tài khoản, mã lạ hoặc hết hạn nhận REVIEW_* và không đánh dấu PAID. Sai chữ ký nhận 401. DB lỗi nhận 500 để SePay gửi lại.
7. Chỉ sau khi sandbox thành công mới thử một giao dịch ngân hàng thực tế có kiểm soát.

## Đối soát

Chưa có màn hình quản trị giao dịch cần xử lý. Người quản trị DB có thể kiểm tra danh sách tối thiểu:

```sql
SELECT "transactionId", "bookingCode", "result", "receivedAt"
FROM "SepayReceipt"
WHERE "result" LIKE 'REVIEW_%'
ORDER BY "receivedAt" DESC;
```

Không tự sửa trạng thái PAID chỉ để làm biến mất cảnh báo. Cần kiểm tra giao dịch ngân hàng, tình trạng giữ sân và phương án xử lý với khách. Trạng thái EXPIRED có thể được tính từ expiresAt khi đọc, nên booking hết hạn vẫn có giá trị PENDING_PAYMENT trong DB; điều kiện kiểm tra expiresAt luôn loại nó khỏi giữ chỗ và thanh toán tự động.

## Kiểm tra source

```powershell
npm test
npm run lint
npm run build
node scripts/test-sepay-http.cjs
```

38 kiểm thử đạt; production build và kiểm tra HTTP local đạt (HMAC sai: 401, payload sai: 400, lỗi DB: 500 không ACK). Kiểm thử dùng transaction giả để kiểm tra logic và rollback; cần chạy sandbox với PostgreSQL thật để xác nhận khóa/Serializable trong môi trường triển khai. Kiểm tra HTTP dùng secret giả và DB không tồn tại, không tác động đơn thật. Chưa kiểm thử thanh toán với DB Vercel hoặc webhook ngân hàng thật.

Tham khảo: [SePay HMAC](https://developer.sepay.vn/vi/sepay-webhooks/xac-thuc), [Prisma transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions), [VietQR](https://vietqr.io/danh-sach-api/link-tao-ma-nhanh/).
