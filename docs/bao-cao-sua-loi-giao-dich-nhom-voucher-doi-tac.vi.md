# BÁO CÁO KỸ THUẬT: SỬA LỖI GIAO DỊCH NHÓM, BỘ ĐẾM VOUCHER VÀ HỒ SƠ ĐỐI TÁC
**Dự án:** SmashBook — Badminton Court Booking Platform  
**Vị trí làm việc:** `E:\Project Demo\Badminton Court Booking Website`  
**Checkout / Commit cơ sở:** `3de818b27de761488dcba914e608e948769cef40`  
**Nhánh Git:** `codex/group-payment-trial`  
**Thời gian thực hiện:** 17/10/2026  
**Trạng thái kiểm thử:** 133/133 tests PASS (100%), TypeScript 0 lỗi, ESLint 0 lỗi, Next.js Build 24/24 routes đạt  

---

## 1. TỔNG QUAN VÀ BỐI CẢNH KIỂM TRA

Đợt rà soát độc lập trên commit `3de818b` ghi nhận hệ thống đạt 126 test ban đầu và build thành công. Tuy nhiên, khi kiểm tra chuyên sâu các kịch bản biên trong giao dịch nhóm, bộ đếm voucher và hồ sơ đối tác, 6 ca hồi quy nghiệp vụ đã phát hiện lỗi:
1. **Ca 1 (Hủy HLV khi đã trả 3/4 phần):** Đơn 400k (Sân 200k + HLV 200k) chia 4 người x 100k, đã thu 300k. Sau khi hủy HLV, tổng đơn mới là 200k nhưng tổng các phần trong bảng chia bị giữ 300k (do phần chưa trả không được đưa về 0đ), gây lệch `booking.total` và crash khi `sync()`.
2. **Ca 2 (Hủy HLV khi còn 1 người chưa trả):** Đơn 400k (Sân 300k + HLV 100k) chia 2 người x 200k, đã thu 1 người 200k. Còn phải thu 100k từ 1 người duy nhất, hàm `splitAmounts(100000, 1)` ném lỗi 400 vì chặn `count < 2`.
3. **Ca 3 (Hủy HLV khi tiền thu vừa đủ tiền sân):** Đơn 400k (Sân 200k + HLV 200k) chia 4 x 100k, đã thu 2 người (200k). Số tiền còn phải thu bằng 0đ, nhưng các phần chưa trả vẫn giữ số tiền cũ 100k, khiến người chưa trả tiếp tục bị đòi tiền và tổng bảng chia bị lệch 400k != 200k.
4. **Ca 4 (Hủy HLV khi tiền thu vượt tổng mới):** Đơn 400k (Sân 150k + HLV 250k) chia 4 x 100k, đã thu 2 người (200k). Tổng mới 150k nhưng tổng các phần bị lệch thành 350k (do 2 phần chưa trả không được đưa về 0đ).
5. **Ca 5 (Bộ đếm voucher thường không tăng):** Đơn nhóm có gắn `voucherId` thông thường (không qua chiến dịch PartnerOffer). Sau khi nhóm thanh toán đủ, `voucher.usedCount` vẫn bằng 0 vì logic cập nhật bị lồng trong điều kiện `if (usages.length > 0)`.
6. **Ca 6 (Lệch hợp đồng hồ sơ đối tác):** `getMyPartners` trả `{ memberId, role, partner: { id, status, ... } }`. Portal Frontend (`partner/page.tsx`) đọc trực tiếp `p.id`, `p.status`, `p.myRole` dẫn đến `undefined`, khiến giao diện không nhận diện được đối tác `ACTIVE`, không tải được ưu đãi và báo cáo.

---

## 2. NGUYÊN NHÂN GỐC RỄ VÀ PHƯƠNG ÁN THIẾT KẾ

### 2.1. Phần A: Chia lại tiền khi HLV hủy đơn nhóm (`coach.service.ts` & `group-payment.ts`)
- **Nguyên nhân:**
  - `splitAmounts` quy định cứng `count < 2` ném lỗi 400, dẫn đến khi chỉ còn 1 người gánh phần tiền sân còn lại thì bị văng lỗi.
  - Thuật toán tái cân bằng cũ trong `cancelCoachBookingByCoach` chỉ cập nhật `unpaidShares` khi `remainingForCourt > 0`. Khi `remainingForCourt === 0` (vừa đủ) hoặc `totalPaid > nextTotal` (trả vượt), các `unpaidShares` hoàn toàn bị bỏ quên và vẫn giữ nguyên số tiền nợ cũ (`amount = 100k`).
  - Khi `totalPaid > nextTotal`, hệ thống điều chỉnh `paidShares` mà không gán các `unpaidShares` về 0đ, đồng thời chưa phân bổ khoản hoàn tiền `excess` trực tiếp vào từng giao dịch gốc `Payment` qua `GroupRefund`.
- **Thiết kế giải pháp:**
  - Cập nhật `splitAmounts`: Hỗ trợ `count = 1` an toàn (trả về `[total]`).
  - Xử lý phân bổ toàn diện 4 nhánh trạng thái tài chính:
    1. **Chưa ai trả (`totalPaid === 0`):** Chia đều `nextTotal` cho toàn bộ các phần chưa trả.
    2. **Trả một phần thiếu (`0 < totalPaid < nextTotal`):** Giữ nguyên số tiền các phần đã trả; chia phần còn lại `nextTotal - totalPaid` cho các phần chưa trả (nếu 1 người thì gán trực tiếp, nếu $\ge 2$ người thì dùng `splitAmounts`).
    3. **Vừa đủ (`totalPaid === nextTotal`):** Giữ nguyên số tiền các phần đã trả; gán toàn bộ các phần chưa trả về 0đ (`amount = 0`, `currentIntentId = null`, `cashRequested = false`). Đơn chuyển trạng thái `PAID` và `CONFIRMED`.
    4. **Trả vượt (`totalPaid > nextTotal`):** Gán toàn bộ các phần chưa trả về 0đ; tái phân bổ nghĩa vụ trên các phần đã trả bằng `splitAmounts(nextTotal, paidShares.length)`; phần vượt `excess = totalPaid - nextTotal` được phân bổ tỷ lệ chính xác từng đồng vào `GroupRefund` gắn với từng `Payment` đã thu để truy vết được giao dịch gốc và người nộp. Hủy toàn bộ intent thanh toán cũ.

### 2.2. Phần B: Bộ đếm Voucher thường trong giao dịch nhóm (`group-payment.service.ts`)
- **Nguyên nhân:**
  - Logic tăng `usedCount` phụ thuộc vào `usages.length > 0` (vốn chỉ có khi đơn có `OfferUsage` từ đối tác).
  - Nếu chỉ đơn giản bỏ điều kiện `usages.length > 0`, mỗi lần gọi `sync()` khi đơn đã `PAID` sẽ làm `usedCount` tăng lặp vô hạn.
- **Thiết kế giải pháp:**
  - Lưu trạng thái ban đầu `const wasAlreadyPaid = g.booking.paymentStatus === "PAID"` trước khi cập nhật.
  - Tách nhánh xử lý:
    - Nếu có `OfferUsage`: Tiêu thụ ưu đãi và tăng `usedCount` đồng bộ.
    - Nếu là voucher thường (`usages.length === 0`): Kiểm tra `!wasAlreadyPaid` và kiểm tra bằng chứng lưu DB trong bảng `AdminAudit` với marker `entityId = "VOUCHER_CONSUMED:<bookingId>:<voucherId>"`.
    - Chỉ tăng `voucher.usedCount` và tạo bản ghi chứng thực kiểm toán một lần duy nhất.
    - Khi webhook lặp, gọi `sync()` nhiều lần hoặc retry, marker DB ngăn chặn tuyệt đối việc tăng lặp.

### 2.3. Phần C: Hợp đồng dữ liệu hồ sơ đối tác (`partner.service.ts`, route & page)
- **Nguyên nhân:**
  - `getMyPartners` trả về mảng quan hệ lồng nhau `{ memberId, role, partner: { ... } }`, trong khi Frontend và API route mong muốn các trường phẳng đại diện cho hồ sơ đối tác của người dùng (`p.id`, `p.name`, `p.status`, `p.myRole`).
- **Thiết kế giải pháp:**
  - Chuẩn hóa hàm `getMyPartners` trả về cấu trúc phẳng chuẩn hóa:
    `id: m.partner.id`, `partnerId: m.partner.id`, `memberId: m.id`, `name: m.partner.name`, `slug: m.partner.slug`, `status: m.partner.status`, `role: m.role`, `myRole: m.role`, `createdAt: m.partner.createdAt.toISOString()`, `partner: m.partner`.
  - Cập nhật interface `PartnerProfile` tại `partner/page.tsx` hỗ trợ đầy đủ các trạng thái (`PENDING`, `ACTIVE`, `SUSPENDED`, `REJECTED`) và `offersCount?: number`.
  - Giữ vững kiểm tra bảo mật phía server tại `getMyPartnerOffers` và `getPartnerReport` qua `assertPartnerMemberRole`.

---

## 3. BẢNG TRƯỚC / SAU CỦA 6 CA HỒI QUY

| Mã ca | Kịch bản | Kết quả Trước khi sửa (Baseline) | Kết quả Sau khi sửa | Trạng thái |
|---|---|---|---|---|
| **Ca 1** | Đơn 400k, HLV 200k, 4 phần x 100k, đã trả 3 phần (300k). Hủy HLV -> tổng mới 200k. | **FAIL:** Tổng các phần = 300.000đ != 200.000đ. Phần chưa trả bị giữ 100k, lệch bảng chia. | **PASS:** Phần chưa trả về 0đ; 3 phần đã trả chia nghĩa vụ 200k (66.667đ, 66.667đ, 66.666đ); tạo `GroupRefund` 100k hoàn lại tiền thừa. Tổng các phần = 200.000đ. | **ĐẠT** |
| **Ca 2** | Đơn 400k, HLV 100k, 2 phần x 200k, đã trả 1 phần (200k). Hủy HLV -> còn thu 100k từ 1 người. | **FAIL:** `splitAmounts` ném lỗi 400: *"Số người hoặc tổng tiền không hợp lệ"* do `count = 1`. | **PASS:** `splitAmounts` hỗ trợ `count = 1`. Người chưa trả duy nhất được điều chỉnh phải trả đúng 100.000đ. Bảng chia khớp 300.000đ. | **ĐẠT** |
| **Ca 3** | Đơn 400k, HLV 200k, 4 phần x 100k, đã trả 2 phần (200k). Hủy HLV -> vừa đủ tiền sân (200k). | **FAIL:** Tổng các phần = 400.000đ != 200.000đ. Hai phần chưa trả vẫn giữ 100.000đ, khách tiếp tục bị đòi nợ. | **PASS:** Hai phần chưa trả được gán về 0đ; hai phần đã trả giữ nguyên 100k + 100k = 200k. Đơn chuyển `PAID` và `CONFIRMED`. | **ĐẠT** |
| **Ca 4** | Đơn 400k, HLV 250k, 4 phần x 100k, đã trả 2 phần (200k). Hủy HLV -> tổng mới 150k. | **FAIL:** Tổng các phần = 350.000đ != 150.000đ (hai phần đã trả giảm về 75k nhưng hai phần chưa trả vẫn 100k). | **PASS:** Hai phần chưa trả về 0đ; hai phần đã trả chia nghĩa vụ 150k (75k + 75k); tạo `GroupRefund` 50k hoàn tiền thừa. Tổng các phần = 150.000đ. | **ĐẠT** |
| **Ca 5** | Đơn nhóm có voucher thường (không có `OfferUsage`). Thanh toán đủ, gọi `sync()` 2 lần. | **FAIL:** `voucher.usedCount` = 0 (bị bỏ sót do `usages.length === 0`). | **PASS:** `voucher.usedCount` tăng đúng 1 lần khi trả đủ. Gọi `sync()` lần 2 giữ nguyên 1 lần (Idempotent với DB audit marker). | **ĐẠT** |
| **Ca 6** | `getMyPartners` trả danh sách đối tác. Portal đọc `p.id`, `p.status`, `p.myRole`. | **FAIL:** `p.id` là `undefined`, `p.status` là `undefined`, giao diện bị tê liệt, không tải được ưu đãi/báo cáo. | **PASS:** `p.id = "part-123"`, `p.status = "ACTIVE"`, `p.myRole = "OWNER"`. Portal hiển thị và thao tác chính xác theo quyền. | **ĐẠT** |

---

## 4. CHI TIẾT CÁC THAY ĐỔI MÃ NGUỒN

### 4.1. File `src/lib/group-payment.ts`
- Cập nhật hàm `splitAmounts`:
  - Hỗ trợ `count = 1`: trả về `[total]` nếu `custom` hợp lệ hoặc không có `custom`.
  - Kiểm tra `total >= count`, $1 \le \text{count} \le 30$.

### 4.2. File `src/services/coach.service.ts`
- Cập nhật hàm `cancelCoachBookingByCoach`:
  - Khi HLV hủy ca cho đơn nhóm, rà soát toàn bộ các `GroupShare`.
  - Phân định rõ 4 trường hợp: chưa ai trả, trả thiếu, vừa đủ và trả vượt.
  - Khi `totalPaid >= nextTotal`: đưa toàn bộ các phần chưa trả `unpaidShares` về $0$đ (`amount: 0`, `currentIntentId: null`, `cashRequested: false`).
  - Khi `totalPaid > nextTotal`: tái cân bằng các phần đã trả bằng `splitAmounts(nextTotal, paidShares.length)`; tạo bản ghi `GroupRefund` với trạng thái `PENDING` và cập nhật `Payment.status = "REFUND_PENDING"` cho từng khoản thanh toán gốc tương ứng theo tỷ lệ đóng góp thực tế.

### 4.3. File `src/services/group-payment.service.ts`
- Cập nhật hàm `sync()`:
  - Ghi nhận `const wasAlreadyPaid = g.booking.paymentStatus === "PAID"`.
  - Độc lập hóa việc tăng `usedCount` cho voucher thường khi `usages.length === 0`.
  - Tạo marker kiểm toán `VOUCHER_CONSUMED:<bookingId>:<voucherId>` trong bảng `AdminAudit` làm bằng chứng lưu bền vững trong cơ sở dữ liệu.

### 4.4. File `src/services/partner.service.ts`
- Cập nhật hàm `getMyPartners`:
  - Trả về cấu trúc phẳng chứa trực tiếp `id`, `partnerId`, `name`, `slug`, `status`, `myRole`, `memberId`, `createdAt`, đồng thời bảo toàn thuộc tính `partner` để tương thích ngược.

### 4.5. File `src/app/partner/page.tsx`
- Cập nhật interface `PartnerProfile`:
  - Hỗ trợ đầy đủ trạng thái `status: "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED"`.
  - Đặt `offersCount?: number` dạng tùy chọn.

### 4.6. File `scripts/audit-voucher-backfill.cjs` (Mới)
- Script kiểm toán và lập phương án bù (backfill) lượt dùng cho các đơn nhóm cũ:
  - Mặc định chạy ở chế độ **DRY-RUN** (chỉ đọc và thống kê, không ghi đè DB).
  - Tự động thống kê các đơn nhóm `PAID` có `voucherId` mà không có `OfferUsage`.
  - Chỉ áp dụng sửa đổi khi có cờ `--apply` rõ ràng từ quản trị viên.

### 4.7. File `tests/six-regression-cases.test.cjs` (Mới)
- Bộ 6 test hồi quy nghiệp vụ độc lập tương ứng với 6 ca lỗi đã nêu.

---

## 5. BẰNG CHỨNG KIỂM THỬ THỰC TẾ

### 5.1. Chạy 6 ca hồi quy độc lập
```bash
node --test tests/six-regression-cases.test.cjs
```
**Kết quả:**
```
✔ Hồi quy Ca 1: Tổng đơn 400k, phí HLV 200k, 4 phần x 100k, đã trả 3 phần -> Bảng chia phải khớp tổng mới 200k (7.7908ms)
✔ Hồi quy Ca 2: Tổng đơn 400k, phí HLV 100k, 2 phần x 200k, đã trả 1 phần -> Người còn lại phải trả 100k (không crash count=1) (0.3546ms)
✔ Hồi quy Ca 3: Tổng đơn 400k, phí HLV 200k, 4 phần x 100k, đã trả 2 phần -> Các phần chưa trả phải về 0đ, tổng khớp 200k (0.3097ms)
✔ Hồi quy Ca 4: Tổng đơn 400k, phí HLV 250k, 4 phần x 100k, đã trả 2 phần -> Tổng mới 150k, tổng bảng chia phải khớp 150k (0.4431ms)
✔ Hồi quy Ca 5: Đơn nhóm có voucher thường (không có OfferUsage) trả đủ -> Voucher.usedCount tăng đúng 1 lần sau nhiều lần sync (0.494ms)
✔ Hồi quy Ca 6: getMyPartners và GET /api/partner/profile phải cung cấp id, status, myRole trực tiếp khớp giao diện (0.8834ms)
ℹ tests 6
ℹ pass 6
ℹ fail 0
ℹ duration_ms 527.8303
```

### 5.2. Chạy toàn bộ Test Suite hiện có
```bash
npm test
```
**Kết quả:**
```
ℹ tests 133
ℹ suites 0
ℹ pass 133
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1150.4441
```

### 5.3. Kiểm tra kiểu TypeScript & ESLint
```bash
npx tsc --noEmit
npm run lint
```
**Kết quả:**
- `npx tsc --noEmit`: Thoát với mã `0`, không có lỗi Type nào.
- `npm run lint`: `✔ No ESLint warnings or errors`.

### 5.4. Xác minh Production Build Next.js
```bash
npm run build
```
**Kết quả:**
- Lệnh thoát với mã `0`.
- Tạo thành công 24/24 static & dynamic routes:
  - `/`, `/admin`, `/partner`, `/coach`, `/checkout`, `/venues`, `/groups/[token]`, `/offers`, v.v.

### 5.5. Phân định rõ phạm vi kiểm thử
- **Đã kiểm chứng bằng mã nguồn và test hồi quy nghiệp vụ:**
  - Logic toán học chia tiền, bảo toàn VND, phân bổ hoàn tiền `GroupRefund`.
  - Tính lũy thừa và cơ chế ghi nhận bằng chứng DB của `voucher.usedCount`.
  - Hợp đồng dữ liệu API và cấu trúc hồ sơ `getMyPartners`.
  - Quá trình biên dịch TypeScript và đóng gói Next.js Production Build.
- **Phần chưa kiểm chứng trên môi trường Production:**
  - Giao dịch chuyển tiền ngân hàng tự động ngoài đời thực (do tuân thủ quy tắc không dùng tiền thật).
  - Webhook live từ cổng thanh toán SePay (đã kiểm chứng qua HMAC mock và HTTP mock nội bộ).
  - Dữ liệu production chưa bị thay đổi; phương án backfill được giữ ở chế độ Dry-run an toàn.

---

## 6. PHƯƠNG ÁN BACKFILL & KẾ HOẠCH ROLLBACK

### 6.1. Phương án Backfill dữ liệu cũ
- Sử dụng công cụ [`scripts/audit-voucher-backfill.cjs`](file:///e:/Project%20Demo/Badminton%20Court%20Booking%20Website/scripts/audit-voucher-backfill.cjs).
- Quản trị viên chạy trước lệnh đối soát chỉ đọc:
  ```bash
  node scripts/audit-voucher-backfill.cjs
  ```
- Sau khi kiểm tra danh sách mã đơn mẫu và số lượng chênh lệch, nếu muốn áp dụng vào DB test/staging:
  ```bash
  node scripts/audit-voucher-backfill.cjs --apply
  ```

### 6.2. Kế hoạch Rollback
- Trong trường hợp cần hoàn tác, toàn bộ mã nguồn nằm trong commit trên nhánh `codex/group-payment-trial`.
- Do không có thay đổi DDL/schema phá vỡ cấu trúc cơ sở dữ liệu (tận dụng các bảng và trường có sẵn `AdminAudit`, `GroupRefund`, `GroupShare`), việc rollback mã nguồn bằng Git hoàn toàn không gây xung đột cơ sở dữ liệu.
