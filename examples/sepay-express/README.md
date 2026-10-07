# Ví dụ thanh toán SePay + VietQR với Express

Ví dụ ES Modules (ES6+) chạy độc lập bằng Node.js 22+, dành cho người mới. Dự án cha hiện dùng Next.js; ví dụ này chưa nối vào giao diện hay Prisma của dự án cha. Tất cả số tài khoản, tên và giao dịch mẫu đều là dữ liệu minh họa.

Luồng: tạo booking `PENDING` → hiển thị `qrUrl` → nhận webhook đã xác thực → đối soát → `PAID` → frontend đọc trạng thái.

## 1. Cấu trúc

```text
examples/sepay-express/
├── .env                         # cấu hình local, bị Git bỏ qua
├── .env.example                 # mẫu được phép commit
├── .gitignore
├── package.json
├── package-lock.json
├── src/
│   ├── config.js                # đọc/kiểm tra biến môi trường
│   ├── app.js                   # routes + middleware + error handler
│   ├── server.js
│   ├── controllers/payment.controller.js
│   ├── middleware/payment-auth.js
│   ├── services/payment.service.js
│   ├── db/mock.db.js
│   └── utils/qr.util.js
├── postman/
│   ├── sepay-webhook.sample.json
│   └── hmac.pre-request.js
└── test/payment.test.js
```

## 2. Cấu hình và chạy

Mở terminal ở thư mục ví dụ:

```powershell
cd "E:\Project Demo\Badminton Court Booking Website\examples\sepay-express"
npm install
# Chỉ tạo .env nếu chưa có để tránh ghi đè cấu hình của bạn.
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Mở `.env`, điền `SEPAY_WEBHOOK_SECRET` và thông tin tài khoản nhận. Tên/mã đơn vị dùng quản lý nội bộ; chúng không tham gia công thức ký webhook này. Nếu Secret Key bạn có thuộc sản phẩm Cổng thanh toán/merchant của SePay, hãy lấy đúng secret tại cấu hình **Webhooks → Bảo mật** cho luồng biến động số dư trong ví dụ, không mặc định hai loại khóa giống nhau.

```dotenv
NODE_ENV=development
HOST=127.0.0.1
PORT=4000
SEPAY_UNIT_NAME="San cau long cua ban"
SEPAY_UNIT_CODE="MA_DON_VI_CUA_BAN"
SEPAY_AUTH_MODE=hmac
SEPAY_WEBHOOK_SECRET=DIEN_SECRET_WEBHOOK_CUA_BAN
SEPAY_WEBHOOK_API_KEY=
BANK_BIN=970436
BANK_ACCOUNT_NO=0123456789
BANK_ACCOUNT_NAME="NGUYEN VAN A"
SEPAY_BANK_GATEWAY=Vietcombank
SEPAY_SUB_ACCOUNT=
```

Không dùng chuỗi `DIEN_SECRET_WEBHOOK_CUA_BAN` làm khóa thật. `.env` thực tế đã để trống khóa để buộc bạn cấu hình. Không đưa secret vào QR, frontend, biến `NEXT_PUBLIC_*`, log hay Git. File `.env` ở thư mục gốc của ứng dụng Next.js không phải file cấu hình của ví dụ này.

```powershell
npm start
# Terminal khác, cùng thư mục:
npm test
```

Ứng dụng lắng nghe tại `http://127.0.0.1:4000`. Mỗi lần restart sẽ xóa Mock DB và bắt đầu lại với mã `DATSAN123`.

## 3. Xác thực đúng loại webhook

Với HMAC, chọn **HMAC-SHA256** trên SePay và cấu hình cùng secret ở backend. Công thức:

```text
X-SePay-Timestamp: <Unix timestamp tính bằng giây>
X-SePay-Signature: sha256=<HMAC_SHA256(secret, timestamp + "." + rawBody) dạng hex>
```

Code giữ raw body bằng `express.raw()` trước `express.json()`, kiểm tra timestamp trong ±300 giây và so sánh bằng `timingSafeEqual`. Đồng hồ server cần chính xác. Không ký lại `JSON.stringify(req.body)` vì bytes có thể thay đổi.

Nếu muốn test đơn giản với **API Key**, đổi `.env` rồi restart:

```dotenv
SEPAY_AUTH_MODE=apikey
SEPAY_WEBHOOK_API_KEY=DIEN_KEY_WEBHOOK_CUA_BAN
```

Gửi header `Authorization: Apikey <key>`. `Authorization: Bearer <token>` dành cho OAuth; không dùng Secret Key như một Bearer token. Ví dụ chỉ chấp nhận phương thức được cấu hình. Xem [tài liệu xác thực chính thức SePay](https://developer.sepay.vn/vi/sepay-webhooks/xac-thuc).

## 4. Tạo booking bằng Postman

Tạo request `POST http://127.0.0.1:4000/api/bookings`. Chọn **Body → raw → JSON**:

```json
{ "slotId": "COURT1-1800" }
```

Response HTTP `201` có `code: "DATSAN123"`, `totalAmount: 150000`, `status: "PENDING"`, `readToken` và `qrUrl`. Lưu `readToken` để đọc trạng thái. Giá lấy từ danh mục khung giờ trên server, không lấy từ số tiền client gửi. Demo có thêm `COURT1-1900` giá 180.000 VND. Đặt lại cùng khung giờ nhận `409`.

`qr.util.js` nhận `(amount, bookingCode, bank)`; `bank` là cấu hình tài khoản đã đọc từ `.env`. Địa chỉ ảnh có dạng:

```text
https://img.vietqr.io/image/970436-0123456789-compact2.png?amount=150000&addInfo=DATSAN123&accountName=NGUYEN+VAN+A
```

Hàm dùng `URLSearchParams` để encode nội dung đúng. Dùng URL đó cho thuộc tính `src` của ảnh. Ảnh QR chứa chỉ dẫn chuyển khoản; trạng thái thanh toán vẫn lấy từ backend. Cú pháp theo [VietQR Quick Link](https://vietqr.io/intro/); tài liệu VietQR yêu cầu tạo template riêng khi sử dụng Quick Link trong dự án chính thức.

## 5. Giả lập webhook bằng Postman

Tạo request `POST http://127.0.0.1:4000/api/payment/webhook`, chọn **Authorization → No Auth** để Postman không chèn Bearer. Chọn **Body → raw → JSON**, dán nội dung sau (cũng có trong `postman/sepay-webhook.sample.json`):

```json
{
  "id": 92704,
  "gateway": "Vietcombank",
  "transactionDate": "2026-10-08 11:08:33",
  "accountNumber": "0123456789",
  "subAccount": "",
  "code": "DATSAN123",
  "content": "NGUYEN VAN A chuyen tien DATSAN123",
  "transferType": "in",
  "description": "Thanh toan dat san cau long",
  "transferAmount": 150000,
  "accumulated": 1000000,
  "referenceCode": "FT2628192704"
}
```

Thay `accountNumber`, `gateway` và `subAccount` cho khớp `.env`; mã và tiền phải khớp booking vừa tạo. `transactionDate` là thời điểm giao dịch, khác timestamp ký request. Schema dựa trên [payload webhook SePay](https://developer.sepay.vn/vi/sepay-webhooks/tich-hop-webhook).

**Nếu dùng HMAC:** tạo một Postman Environment, thêm biến `sepayWebhookSecret` chứa cùng secret như `.env`, chỉ lưu cục bộ và chọn environment đó. Dán toàn bộ file `postman/hmac.pre-request.js` vào **Scripts → Pre-request**. Script tự tạo hai header HMAC mới ở mỗi lần Send và ký chính body sẽ gửi. Script dùng [Web Crypto trong Postman Sandbox](https://learning.postman.com/latest-v-12/docs/tests-and-scripts/write-scripts/postman-sandbox-reference/pm-require).

**Nếu dùng API Key:** không cần script HMAC; thêm các header:

```text
Content-Type: application/json
Authorization: Apikey <giá trị SEPAY_WEBHOOK_API_KEY>
```

Lần đầu đúng thông tin nhận HTTP `200`:

```json
{ "success": true, "result": "PAID" }
```

Gửi lại cùng body, cùng `id` nhận:

```json
{ "success": true, "result": "DUPLICATE", "originalResult": "PAID" }
```

Đọc trạng thái bằng `GET http://127.0.0.1:4000/api/bookings/DATSAN123`, header `X-Booking-Token: <readToken nhận khi tạo booking>`. Kết quả có `status: "PAID"`.

## 6. Logic và các ca test

Regex `/(?<![A-Z0-9])DATSAN(\d{1,10})(?![A-Z0-9])/gi` lấy phần số ở nhóm 1. Ví dụ `DATSAN123` cho `123`; giữ dạng chuỗi để không mất số 0 đầu. Code đọc `content` theo yêu cầu, không phụ thuộc `code` SePay đã trích sẵn. Nhiều mã khác nhau hoặc mã bị dính chữ/số khác sẽ chuyển đối soát thủ công.

Sau xác thực, backend kiểm tra lần lượt dữ liệu, ID giao dịch trùng, chiều tiền, tài khoản/ngân hàng/VA (nếu cấu hình), mã booking, trạng thái và số tiền. Chỉ `PENDING` với số tiền bằng chính xác mới thành `PAID`.

| Tình huống | HTTP | Kết quả |
| --- | --- | --- |
| Đúng đơn, đúng tiền | 200 | `PAID` |
| Gửi lại cùng giao dịch | 200 | `DUPLICATE` |
| Tiền ra | 200 | `IGNORED_OUTGOING` |
| Sai tài khoản/ngân hàng/VA | 200 | `REVIEW_WRONG_ACCOUNT` |
| Thiếu hoặc nhiều mã booking | 200 | `REVIEW_BOOKING_CODE` |
| Không tìm thấy đơn | 200 | `REVIEW_BOOKING_NOT_FOUND` |
| Thiếu/thừa tiền | 200 | `REVIEW_AMOUNT_MISMATCH` |
| Một giao dịch mới gửi vào đơn đã thanh toán | 200 | `REVIEW_BOOKING_NOT_PENDING` |
| Cùng ID nhưng dữ liệu đối soát khác | 409 | Không ghi nhận lại |
| Sai secret, thiếu chữ ký, timestamp hết hạn | 401 | Không xử lý |
| JSON hoặc dữ liệu sai định dạng | 400 | Không xử lý |
| Lỗi lưu dữ liệu | 500 | Để SePay gửi lại |

`success: true` nghĩa là đã nhận và lưu kết quả xử lý, không đồng nghĩa tiền luôn khớp đơn. Các kết quả `REVIEW_*` được giữ trong `receipts` để thể hiện luồng cần nhân viên đối soát; demo chưa có màn hình quản lý chúng. Với DB thật phải lưu bền vững và có tác vụ/màn hình xử lý các mục này trước khi ACK.

Để test thiếu/thừa tiền, restart demo, tạo lại booking rồi gửi số tiền sai. Khi thay thông tin để giả lập giao dịch khác, dùng `id` mới; không sửa nội dung một giao dịch đã ghi nhận. Demo không cộng dồn nhiều lần chuyển và không tự hoàn tiền. Sau khi đã ACK một giao dịch cần đối soát, việc gửi lại cùng ID vẫn trả `DUPLICATE`, không tự thử ghép đơn lần nữa.

SePay nhận phản hồi thành công khi HTTP 200/201, JSON `success: true`, trong thời gian quy định; ví dụ này luôn dùng 200 khi đã xử lý. Xem [quy định ACK và retry](https://docs.sepay.vn/tich-hop-webhooks.html).

## 7. Polling ở frontend

Đoạn mẫu dưới dùng API cùng origin (hoặc đã được reverse proxy). Nếu frontend Next.js dùng cổng 3000, cần proxy `/api/bookings` sang Express cổng 4000 hoặc cấu hình CORS cho đúng origin trước. Demo chưa cấu hình proxy/CORS.

```js
async function waitForPayment(booking, signal) {
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    signal?.throwIfAborted();
    const response = await fetch(`/api/bookings/${booking.code}`, {
      headers: { 'X-Booking-Token': booking.readToken },
      cache: 'no-store', signal,
    });
    if (!response.ok) throw new Error('Không đọc được trạng thái thanh toán');
    const current = await response.json();
    if (current.status === 'PAID') {
      // Đổi đường dẫn này thành trang thành công của ứng dụng bạn.
      window.location.assign(`/payment/success?booking=${encodeURIComponent(current.code)}`);
      return;
    }
    if (['CANCELLED', 'EXPIRED'].includes(current.status)) {
      throw new Error('Đơn đã hủy hoặc hết hạn; cần kiểm tra với chủ sân nếu đã chuyển tiền');
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  // Hết thời gian chờ UI không có nghĩa là giao dịch ngân hàng thất bại.
  throw new Error('Chưa có xác nhận. Hãy kiểm tra lại trạng thái đơn trước khi chuyển thêm tiền.');
}

// Sau khi tạo booking và hiển thị ảnh QR:
const controller = new AbortController();
// waitForPayment(booking, controller.signal).catch((error) => {
//   if (error.name !== 'AbortError') showMessage(error.message);
// });
// Khi component unmount: controller.abort();
```

Frontend chỉ đọc trạng thái. Trang thành công cũng cần đọc lại booking từ backend, không tin query string hoặc tín hiệu từ trình duyệt làm bằng chứng đã thanh toán.

## 8. Nhận webhook từ SePay khi chạy local

Postman có thể gọi trực tiếp localhost. SePay cần URL công khai. Nếu đã cài và cấu hình ngrok, chạy ở terminal khác:

```powershell
ngrok http 4000
```

Dùng URL HTTPS ngrok cấp, thêm `/api/payment/webhook`. Tại SePay **Test Mode**, tạo webhook với sự kiện tiền vào, đúng tài khoản thử nghiệm, body JSON và phương thức xác thực tương ứng. Cấu hình tiền tố `DATSAN` với hậu tố số dài 1–10 ký tự nếu bật bộ lọc mã thanh toán. Tạo booking trước khi mô phỏng giao dịch. Kiểm tra nhật ký webhook và API đọc trạng thái. Hướng dẫn: [SePay Test Mode](https://developer.sepay.vn/vi/sepay-webhooks/test-mode/bat-dau-nhanh).

Chỉ dùng tunnel này để thử nghiệm: route tạo booking chưa có đăng nhập, giới hạn tần suất hay thời hạn giữ sân. Không chuyển tiền thật vào số tài khoản minh họa.

## 9. Thay Mock DB trước khi nhận tiền thật

Code chặn `NODE_ENV=production` vì toàn bộ dữ liệu đang nằm trong RAM. Không chỉ đổi biến môi trường để vượt chặn. Khi tích hợp DB thật:

1. Booking có mã duy nhất không tái sử dụng, `userId`, số tiền VND nguyên, trạng thái và thời hạn giữ sân. Giá tính trên server, quyền đọc kiểm tra theo người dùng đăng nhập. Giữ khung giờ bằng ràng buộc/transaction để hai người không đặt trùng.
2. Bảng giao dịch có `sepayTransactionId UNIQUE`, số tiền, tài khoản, mã booking, kết quả và dữ liệu cần đối soát. Đảm bảo ID SePay được lưu bằng kiểu đủ lớn.
3. Trong **cùng một DB transaction**, chèn giao dịch và cập nhật booking có điều kiện `status = PENDING AND totalAmount = transferAmount`, đồng thời kiểm tra thời hạn/quyền giữ sân. Nếu số dòng cập nhật là 0, ghi kết quả cần đối soát. Commit xong mới trả 200.
4. Khi gặp ID đã có, kiểm tra bản ghi đã commit rồi ACK giao dịch trùng; lỗi DB khác phải trả 500. Ràng buộc UNIQUE và cập nhật có điều kiện bảo vệ cả trường hợp nhiều tiến trình nhận webhook đồng thời.
5. Tiền đến sau khi đơn hết hạn/hủy hoặc sân đã được giải phóng cần đối soát thủ công; không tự chuyển sang `PAID`. Các giao dịch thiếu/thừa/không tìm thấy đơn phải có hàng đợi và giao diện/tác vụ xử lý. Lưu dữ liệu đối soát theo chính sách truy cập phù hợp.

Phần đồng bộ trong `mock.db.js` chỉ chống ghi nhận lặp trong một process đang chạy; restart/mở nhiều process sẽ không bảo đảm này. Các kiểm thử local không thay thế việc thử sandbox SePay và kiểm tra DB thật khi tích hợp.
