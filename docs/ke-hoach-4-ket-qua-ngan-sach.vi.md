# BÁO CÁO KẾT QUẢ QUẢN LÝ NGÂN SÁCH & LƯỢT DÙNG ƯU ĐÃI ĐỐI TÁC — SMASHBOOK

> **Dự án**: SmashBook - Nền tảng đặt sân & kết nối Đối tác Cầu lông  
> **Tài liệu**: Kế hoạch 4 — Quản lý ngân sách & lượt dùng ưu đãi, phòng chống cấp vượt ngân sách  
> **Thời điểm hoàn thành**: Tháng 10/2026  
> **Tác giả**: Senior Fullstack Engineer  

---

## 1. TỔNG QUAN VẤN ĐỀ & MỤC TIÊU CỐT LÕI

Trong các chương trình tài trợ thể thao, mỗi Đối tác (`Partner`) thiết lập các chiến dịch ưu đãi (`PartnerOffer`) với ngân sách tài trợ cố định (`budget`, ví dụ: 5.000.000 VND) và/hoặc giới hạn số lượt sử dụng tối đa (`maxUsage`, ví dụ: 100 lượt).

### Các lỗi và rủi ro đã xác minh:
1. **Bỏ sót suất giữ vô thời hạn khi duyệt tiền mặt**:
   - Khi nhân viên duyệt yêu cầu thanh toán tiền mặt (`CONFIRM`), hệ thống đặt `OfferUsage.expiresAt = null` để giữ suất cho khách đến khi thanh toán tại quầy.
   - Các truy vấn tính ngân sách trước đây chỉ lọc:
     `{ state: "RESERVED", expiresAt: { gt: now } }`
   - Điều này làm SQL/Prisma tự động loại bỏ các bản ghi có `expiresAt: null`. Kết quả là các suất giữ tiền mặt bị bỏ qua, dẫn đến việc cấp vượt quá hạn mức ngân sách của đối tác.
2. **Sai lệch giữa bộ đếm và sổ chi tiết (Usage Ledger)**:
   - Nếu trường `PartnerOffer.usedBudget` bị lệch so với tổng số tiền các bản ghi `CONSUMED` trong sổ `OfferUsage`, hệ thống có thể tính toán sai ngân sách còn lại.
3. **Tranh chấp ngân sách cuối (Race Condition)**:
   - Khi ngân sách chỉ còn đủ cho 1 đơn, 2 khách cùng bấm đặt chỗ cùng lúc có thể vượt qua bước báo giá và cùng tạo đơn, gây bội chi ngân sách tài trợ.

---

## 2. NGUỒN DỮ LIỆU CHUẨN VÀ BẤT BIẾN TOÀN VẸN (INVARIANTS)

### 2.1. Nguồn dữ liệu chuẩn (Single Source of Truth)
Hệ thống xác định trạng thái của suất ưu đãi dựa trên sổ giao dịch `OfferUsage`:
- **`CONSUMED` (Đã sử dụng)**: Đơn đặt sân đã thanh toán thành công (`PAID`). Chiếm dụng ngân sách thực tế vĩnh viễn.
- **`RESERVED` (Đang giữ chỗ)**:
  - Trường hợp 1: `expiresAt > now` (Đang giữ chỗ tạm thời trong thời hạn 5 phút chờ thanh toán online).
  - Trường hợp 2: `expiresAt === null` (Đang giữ chỗ vô thời hạn do đã được duyệt hình thức tiền mặt).
  - Cả hai trường hợp đều bắt buộc phải chiếm dụng ngân sách và lượt dùng.
- **`RELEASED` (Đã giải phóng)**: Đơn đặt sân bị hủy hoặc hết hạn giữ chỗ mà chưa thanh toán. Không chiếm dụng ngân sách hay lượt dùng.

### 2.2. Công thức và Bất biến toàn vẹn
Mỗi khi báo giá (`validateAndQuoteOffer`) hoặc tạo đơn đặt sân (`createReservation`), hệ thống áp dụng công thức bất biến:

$$\text{effectiveUsedBudget} = \max(\text{PartnerOffer.usedBudget}, \sum \text{OfferUsage}_{\text{CONSUMED}})$$

$$\text{reservedBudget} = \sum \text{OfferUsage}_{\text{RESERVED (active)}}$$

$$\text{totalCommittedBudget} = \text{effectiveUsedBudget} + \text{reservedBudget}$$

**Bất biến ngân sách (Budget Invariant)**:
$$\text{totalCommittedBudget} + \text{discountAmount} \le \text{PartnerOffer.budget}$$
*Nếu vi phạm: Lập tức từ chối với mã lỗi `409: Chương trình ưu đãi đã đạt hạn mức ngân sách tài trợ.`*

**Bất biến lượt sử dụng (Usage Count Invariant)**:
$$\text{effectiveUsageCount} = \max(\text{PartnerOffer.currentUsage}, \text{count}(\text{OfferUsage}_{\text{CONSUMED}}))$$
$$\text{totalCommittedUsage} = \text{effectiveUsageCount} + \text{count}(\text{OfferUsage}_{\text{RESERVED (active)}})$$
$$\text{totalCommittedUsage} + 1 \le \text{PartnerOffer.maxUsage}$$
*Nếu vi phạm: Lập tức từ chối với mã lỗi `409: Chương trình ưu đãi đã hết lượt sử dụng.`*

---

## 3. CÁC NÂNG CẤP VÀ GIẢI PHÁP KỸ THUẬT

### 3.1. Truy vấn tính toán đầy đủ `expiresAt: null`
Trong cả `src/services/partner.service.ts` và `src/services/reservation.service.ts`:
```typescript
const activeUsages = await tx.offerUsage.findMany({
  where: {
    offerId: po.id,
    OR: [
      { state: "CONSUMED" },
      {
        state: "RESERVED",
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    ],
  },
  select: { state: true, discountAmount: true },
});
```

### 3.2. Serializable Transaction chống tranh chấp ngân sách cuối
- Khâu tạo đơn đặt sân (`createReservation`) được thực thi trong một `serializable transaction` cấp độ cao nhất.
- Báo giá trước đó (`validateAndQuoteOffer`) chỉ là ước tính tạm thời cho khách hàng xem trước. Quyết định giữ suất thực sự diễn ra bên trong Transaction tạo đơn.
- Khi 2 khách cùng tranh phần ngân sách cuối cùng, khách thứ nhất tạo đơn thành công, khách thứ hai sẽ đọc lại dữ liệu committed mới nhất và bị từ chối `409 Conflict`.

### 3.3. Chính sách hoàn ngân sách khi hủy đơn
- **Đơn chưa thanh toán (`PENDING_PAYMENT`) bị hủy hoặc hết hạn**: Bản ghi `OfferUsage` chuyển ngay sang `RELEASED`. Ngân sách đang giữ được giải phóng lập tức 100% cho người chơi khác sử dụng.
- **Đơn đã thanh toán (`PAID`) sau đó yêu cầu hủy/hoàn tiền**:
  - Tiền sân/HLV được xem xét hoàn theo chính sách hoàn hủy thời gian.
  - Suất ưu đãi đã ở trạng thái `CONSUMED`. Để phòng chống gian lận lạm dụng voucher (tạo đơn nhận ưu đãi rồi hủy để trục lợi), suất ưu đãi của đối tác **không tự động tái cấp** lại vào ví người dùng nếu không có quyết định kiểm toán đặc biệt từ Quản trị viên.

### 3.4. Hàm kiểm toán đối soát chỉ đọc (Read-only Audit)
Bổ sung hàm `auditOfferLedger(database, offerId)` trong `src/services/partner.service.ts`:
- So sánh `PartnerOffer.usedBudget` với tổng `OfferUsage` `CONSUMED`.
- So sánh `PartnerOffer.currentUsage` với số lượng `OfferUsage` `CONSUMED`.
- Báo cáo số tiền đang giữ `activeReservedBudget` và ngân sách thực sự còn khả dụng `availableBudget`.
- Báo cáo cờ `isConsistent: boolean`. Tuyệt đối không tự động sửa/ghi đè dữ liệu cơ sở dữ liệu thật.

---

## 4. KẾT QUẢ KIỂM THỬ THỰC TẾ

Toàn bộ các test cases đã được xác minh thành công 100%:

```bash
npm test
# Kết quả các test case quản lý ngân sách:
# ✔ Quản lý ngân sách: Suất giữ tiền mặt (expiresAt = null) chiếm ngân sách, người sau xin giảm vượt phần còn lại bị từ chối 409
# ✔ Quản lý ngân sách: Suất giữ hết hạn (expiresAt < now) không chiếm ngân sách
# ✔ createReservation rejects voucher when offer budget is exhausted
# ✔ Đối soát chỉ đọc: auditOfferLedger phát hiện sự không đồng nhất giữa usedBudget và sổ OfferUsage mà không sửa dữ liệu
```

---

## 5. PHẦN CHƯA KIỂM CHỨNG & GIỚI HẠN

1. **Đối soát hàng loạt toàn bộ các đối tác (Batch Reconciliation)**: Hàm `auditOfferLedger` hiện chạy theo từng `offerId` đơn lẻ theo yêu cầu. Báo cáo đối soát tổng thể toàn sàn định kỳ cho kế toán chưa được gắn vào cron job tự động.
2. **Dữ liệu phân mảnh lớn trên môi trường live**: Đã kiểm chứng logic với mô phỏng đầy đủ; hiệu năng truy vấn trên bảng `OfferUsage` khi đạt hàng triệu bản ghi sẽ cần index composite `(offer_id, state, expires_at)` đã được thiết kế sẵn trong schema.
