# BÁO CÁO KẾT QUẢ ĐỒNG BỘ GIAO DỊCH NHÓM VỚI HLV VÀ ƯU ĐÃI (P1) — SMASHBOOK

> **Dự án**: SmashBook - Nền tảng đặt sân & kết nối Huấn luyện viên Cầu lông  
> **Tài liệu**: Kế hoạch 3 (Ưu tiên P1) — Kết quả sửa đồng bộ thanh toán nhóm với HLV và ưu đãi  
> **Thời điểm hoàn thành**: Tháng 10/2026  
> **Tác giả**: Senior Fullstack Engineer  

---

## 1. TỔNG QUAN VẤN ĐỀ & MỤC TIÊU CỐT LÕI

Tính năng thanh toán nhóm (`BookingGroup`) cho phép nhiều người chơi cùng chia sẻ chi phí một buổi chơi cầu lông (tiền thuê sân + phí HLV - ưu đãi voucher nếu có).

### Lỗi nghiêm trọng đã tái hiện (P1):
Trước đây, trong `src/services/group-payment.service.ts`:
1. **Lịch HLV bị treo HELD**: Khi nhóm trả đủ tiền (`totals.remaining === 0`), hàm `sync()` cập nhật `Booking.paymentStatus = "PAID"` và `BookingItem.status = "CONFIRMED"`, nhưng `CoachBooking` vẫn giữ nguyên trạng thái `HELD` kèm hạn giữ chỗ `expiresAt`. Khi hết hạn, cron job quét có thể hủy nhầm ca học của HLV mặc dù nhóm đã trả đủ tiền.
2. **Ưu đãi bị treo RESERVED và thất thoát số liệu**: Đơn nhóm có áp dụng voucher ưu đãi đối tác khi trả đủ tiền không chuyển `OfferUsage` sang `CONSUMED`, không tăng `usedBudget` và `currentUsage` của `PartnerOffer`, và không tăng `usedCount` của `Voucher`. Ngược lại, khi nhóm bị hủy hoặc hết hạn, `OfferUsage` không được giải phóng sang `RELEASED`, gây chiếm giữ ngân sách tài trợ vô lý của đối tác.
3. **Lệch bảng chia khi HLV hủy ca**: Khi HLV hủy ca dạy cho đơn nhóm đã trả một phần, nếu chỉ giảm `booking.total` mà không phân bổ lại `GroupShare`, tổng chia không khớp tổng đơn làm hàm `sync()` văng lỗi `409` tê liệt đơn.

---

## 2. BẢNG MA TRẬN CHUYỂN TRẠNG THÁI NGUYÊN TỬ (STATE MACHINE)

| Sự kiện / Kịch bản | Booking | BookingItem | CoachBooking | OfferUsage | PartnerOffer & Voucher | GroupPaymentIntent |
|---|---|---|---|---|---|---|
| **Khởi tạo đơn nhóm** | `PENDING_PAYMENT`<br>`UNPAID` | `HELD` (5p) | `HELD` (5p) | `RESERVED` (5p) | Chưa tăng bộ đếm | `OPEN` |
| **Một phần trả online/tiền mặt** | `PENDING_PAYMENT`<br>`PARTIALLY_PAID` | `HELD` | `HELD` | `RESERVED` | Chưa tăng bộ đếm | Intent tương ứng `CLOSED` |
| **Duyệt toàn bộ tiền mặt còn thiếu (`canConfirm`)** | `CONFIRMED`<br>`PARTIALLY_PAID` | `CONFIRMED` | `CONFIRMED`<br>`expiresAt: null` | `RESERVED`<br>`expiresAt: null` | Giữ suất vô thời hạn, chưa tăng bộ đếm | Giữ nguyên |
| **Nhóm trả đủ 100% tiền (`paid`)** | `CONFIRMED`<br>`PAID` | `CONFIRMED` | `CONFIRMED`<br>`expiresAt: null` | `CONSUMED`<br>`expiresAt: null` | `usedBudget` + discount<br>`currentUsage` + 1<br>`usedCount` + 1 | Toàn bộ `CLOSED` |
| **Nhóm hết hạn giữ chỗ (`closeGroup` expired)** | `EXPIRED`<br>`expiresAt: null` | `EXPIRED` | `CANCELLED` | `RELEASED` | Giải phóng ngân sách đang giữ | Toàn bộ `CLOSED` |
| **Hủy đơn nhóm (`closeGroup` cancelled)** | `CANCELLED` | `CANCELLED` | `CANCELLED` | `RELEASED` | Giải phóng ngân sách đang giữ | Toàn bộ `CLOSED` |
| **Hoàn thành buổi chơi tại quầy (`COMPLETE`)** | `COMPLETED` | `COMPLETED` | `COMPLETED` | `CONSUMED` | Không đổi | Không đổi |

---

## 3. CÁC GIẢI PHÁP KỸ THUẬT & BẢO ĐẢM TOÀN VẸN DỮ LIỆU

### 3.1. Đồng bộ nguyên tử trong cùng Database Transaction (`sync`)
Toàn bộ các cập nhật được thực thi bên trong transaction duy nhất:
```typescript
if (confirm) {
  await tx.bookingItem.updateMany({
    where: { bookingId: g.bookingId, status: "HELD" },
    data: { status: "CONFIRMED" },
  });
  if (tx.coachBooking) {
    await tx.coachBooking.updateMany({
      where: { bookingItem: { bookingId: g.bookingId }, status: "HELD" },
      data: { status: "CONFIRMED", expiresAt: null },
    });
  }
  if (tx.offerUsage) {
    // Duyệt tiền mặt: giữ suất ưu đãi vô thời hạn cho tới khi thu đủ
    await tx.offerUsage.updateMany({
      where: { bookingId: g.bookingId, state: "RESERVED" },
      data: { expiresAt: null },
    });
  }
}

if (paid) {
  if (tx.offerUsage) {
    const usages = await tx.offerUsage.findMany({
      where: { bookingId: g.bookingId, state: "RESERVED" },
    });
    for (const usage of usages) {
      await tx.offerUsage.update({
        where: { id: usage.id },
        data: { state: "CONSUMED", expiresAt: null },
      });
      if (tx.partnerOffer) {
        await tx.partnerOffer.update({
          where: { id: usage.offerId },
          data: {
            usedBudget: { increment: usage.discountAmount },
            currentUsage: { increment: 1 },
          },
        });
      }
    }
    if (usages.length > 0 && tx.voucher && g.booking.voucherId) {
      await tx.voucher.update({
        where: { id: g.booking.voucherId },
        data: { usedCount: { increment: 1 } },
      });
    }
  }
  await tx.groupPaymentIntent.updateMany({
    where: { groupId, status: "OPEN" },
    data: { status: "CLOSED" },
  });
}
```

### 3.2. Tính Lũy Thừa (Idempotency) khi Webhook lặp hoặc Retry
- Hàm `sync()` chỉ tìm các bản ghi `OfferUsage` có `state: "RESERVED"`.
- Khi webhook gọi lại lần 2 (hoặc khi retry giao dịch), các bản ghi `OfferUsage` đã ở trạng thái `CONSUMED`, do đó mảng truy vấn trả về rỗng `[]`.
- Hệ thống tuyệt đối không thực hiện `increment` lần thứ 2 lên `usedBudget`, `currentUsage` hay `usedCount`.

### 3.3. Giải quyết các cuộc đua tranh chấp (Race Conditions)
1. **Thành viên tự trả cùng lúc trưởng nhóm trả thay (COVER)**:
   - Các thao tác thanh toán và cập nhật intent đều chạy qua Serializable Transaction với `share.paymentId === null` làm điều kiện then chốt.
   - Khi một bên thanh toán trước, `paymentId` được gán ngay lập tức, bên còn lại khi đọc lại sẽ nhận lỗi `409: Phần tiền đã được trả hoặc không thuộc nhóm`.
2. **Thu tiền mặt tại quầy cùng lúc nhận chuyển khoản SePay**:
   - Giao dịch thu tiền mặt cập nhật `paymentId` và gọi `sync()`. Chuyển khoản ngân hàng đến sau cùng intent đó sẽ được ghi nhận vào `SepayReceipt` với trạng thái `DUPLICATE` hoặc đối soát kiểm toán, không làm tăng tiền trùng.
3. **Thanh toán đồng thời với lúc hết hạn / hủy nhóm**:
   - Nếu tiến trình `closeGroup` chạy trước, `group.closedAt` được đánh dấu và `booking.status = "EXPIRED"`. Khi webhook thanh toán chạy sau, hàm `live(group)` kiểm tra và từ chối xử lý, chuyển giao dịch sang diện đối soát hoàn tiền tự động `REVIEW_BOOKING_NOT_PENDING`.

### 3.4. Tái cân bằng bảng chia khi HLV hủy đơn nhóm trả một phần
- Khi HLV hủy ca dạy trong đơn nhóm:
  1. `nextTotal = Math.max(0, booking.total - coachFee)`.
  2. Số tiền các thành viên đã thực trả giữ nguyên (`paidAmount`).
  3. Phần tiền còn thiếu `unpaidTarget = Math.max(0, nextTotal - paidAmount)` được chia đều cho các thành viên chưa trả bằng hàm chia tiền nguyên VND `splitAmounts(unpaidTarget, unpaidShares.length)`.
  4. Hủy các mã QR cũ đang mở (`OPEN` -> `CANCELLED`) để các thành viên tạo mã mới với số tiền đã được giảm trừ.
  5. Bảo đảm `sum(GroupShare.amount) === booking.total`, không bao giờ xảy ra lỗi 409 lệch bảng chia.

---

## 4. KẾT QUẢ KIỂM THỬ THỰC TẾ

Tất cả các tổ hợp kiểm thử đã được chạy và xác nhận 100% trong `tests/group-voucher-regression.test.cjs`:

| STT | Kịch bản kiểm thử tổ hợp | Kết quả thực tế |
|---|---|---|
| 1 | Nhóm chỉ có sân: thanh toán online đủ -> `Booking: PAID`, `BookingItem: CONFIRMED` | **ĐẠT (PASS)** |
| 2 | Nhóm có HLV: trả đủ xác nhận `CoachBooking: CONFIRMED` và xóa hạn giữ chỗ `expiresAt: null` | **ĐẠT (PASS)** |
| 3 | Nhóm có Voucher: trả đủ chuyển `OfferUsage: CONSUMED`, tăng `usedBudget` và `currentUsage` đúng 1 lần | **ĐẠT (PASS)** |
| 4 | Nhóm có cả HLV và Voucher: trả đủ đồng bộ nguyên tử tất cả các bảng trong 1 transaction | **ĐẠT (PASS)** |
| 5 | Duyệt tiền mặt toàn bộ phần thiếu: xác nhận sân/HLV, `OfferUsage` giữ vô thời hạn (`expiresAt: null`) | **ĐẠT (PASS)** |
| 6 | Hết hạn hoặc Hủy nhóm: giải phóng cả sân (`EXPIRED`), HLV (`CANCELLED`) và Voucher (`RELEASED`) | **ĐẠT (PASS)** |
| 7 | Retry webhook hoặc gọi lặp lại: không tiêu thụ thêm ưu đãi hoặc tăng trùng ngân sách (Idempotent) | **ĐẠT (PASS)** |
| 8 | HLV hủy ca khi nhóm trả một phần: bảng chia tái cân bằng chính xác từng đồng VND, `sync()` thành công | **ĐẠT (PASS)** |

---

## 5. PHẦN CHƯA KIỂM CHỨNG & GIỚI HẠN

1. **Webhook SePay Live thực tế**: Các kiểm thử được xác minh tự động trên môi trường test runner thông qua hàm `receiveSepayPayment` và `sync`. Việc nhận webhook thực tế từ cổng chuyển khoản ngân hàng SePay thật với tài khoản ngân hàng thật chưa được kích hoạt để đảm bảo an toàn tài chính.
2. **Khôi phục ưu đãi sau khi hoàn tiền**: Khi nhóm đã thanh toán đủ (`PAID`), sau đó hủy đơn và được hoàn tiền, hiện tại voucher đã ở trạng thái `CONSUMED` và không tự động hoàn lại lượt dùng cho khách (theo đúng chính sách bảo vệ voucher tránh lạm dụng tái sử dụng).
