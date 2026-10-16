# BÁO CÁO KẾT QUẢ HOÀN THIỆN PORTAL ĐỐI TÁC & HỢP ĐỒNG DỮ LIỆU — SMASHBOOK

> **Dự án**: SmashBook - Nền tảng đặt sân & kết nối Đối tác Cầu lông  
> **Tài liệu**: Kế hoạch 2 — Kết quả rà soát, chuẩn hóa hợp đồng dữ liệu và hoàn thiện Portal Đối tác  
> **Thời điểm hoàn thành**: Tháng 10/2026  
> **Tác giả**: Senior Fullstack Engineer  

---

## 1. TỔNG QUAN YÊU CẦU & MỤC TIÊU

Portal Đối tác là phân hệ dành riêng cho các nhãn hàng, thương hiệu thể thao và nhà tài trợ (như Yonex, Victor, Lining...) tạo lập chiến dịch voucher ưu đãi, quản lý ngân sách tài trợ và theo dõi hiệu quả tiếp cận người chơi trên toàn hệ thống SmashBook.

Mục tiêu cốt lõi của Kế hoạch 2:
1. Thống nhất hợp đồng dữ liệu (API Data Contract) giữa Frontend (`src/app/partner/page.tsx`), các API routes (`/api/partner/*`), tầng nghiệp vụ (`partner.service.ts`) và Schema Prisma.
2. Sửa lỗi không truyền `partnerId` trong các yêu cầu tải danh sách ưu đãi và báo cáo.
3. Hỗ trợ tài khoản thành viên thuộc nhiều đối tác khác nhau, cho phép chuyển đổi thương hiệu mượt mà mà không làm trộn lẫn dữ liệu.
4. Chuẩn hóa form đăng ký thương hiệu:
   - Loại bỏ trường `website` không có trong Schema Prisma và không hợp lệ với Zod `.strict()`.
   - Xử lý các chuỗi rỗng `""` ở các trường tùy chọn thành `undefined` để không vi phạm validation format (URL, email, phone).
5. Sửa form tạo ưu đãi gửi đúng cấu trúc Zod `partnerOfferInputSchema`: bọc voucher trong object `voucher: { ... }`, truyền đúng enum `sponsor: "PARTNER"`, và gửi `partnerId`.
6. Hoàn thiện vòng đời ưu đãi: `DRAFT` -> `PENDING_REVIEW` -> `ACTIVE` / `REJECTED`, ngăn chặn gửi duyệt lặp.
7. Phân quyền chặt chẽ trên Server: Chỉ `OWNER` và `MANAGER` được tạo ưu đãi và gửi duyệt; vai trò `STAFF` chỉ có quyền xem.
8. Báo cáo hiệu quả tài trợ: Chuẩn hóa thuật ngữ tài chính, không gọi ngân sách tài trợ là tiền đã thanh toán cho đối tác mà là "Ngân sách tài trợ đã sử dụng".

---

## 2. CHI TIẾT CÁC SAI KHÁC ĐÃ ĐƯỢC KHẮC PHỤC

### 2.1. Lệch cấu trúc `GET /api/partner/profile`
- **Trước khi sửa**: Backend `GET /api/partner/profile` trả về `{ success: true, partners: PartnerProfile[] }`, nhưng frontend lại đọc `data.partner`. Kết quả là `profile` luôn nhận giá trị `undefined`, trang bị kẹt ở trạng thái chưa có hồ sơ.
- **Sau khi sửa**: Frontend đọc `data.partners` (hoặc fallback `data.partner`). Hỗ trợ lưu danh sách `partners`, cho phép chọn đối tác đang quản lý qua dropdown chọn thương hiệu, và cung cấp nút "+ Đăng ký thêm thương hiệu" cho người dùng quản lý nhiều thương hiệu.

### 2.2. Thiếu `partnerId` khi tải danh sách ưu đãi và báo cáo
- **Trước khi sửa**: `fetchOffers` gọi `/api/partner/offers` và `fetchReport` gọi `/api/partner/reports` không truyền query param `partnerId`. Backend kiểm tra `!partnerId` và trả về lỗi `400: Vui lòng chỉ định mã đối tác (partnerId)`.
- **Sau khi sửa**: Frontend tự động truyền `?partnerId=${currentPartnerId}`. Khi người dùng chuyển đổi giữa các thương hiệu trong danh sách, hệ thống tự động tải lại ưu đãi và báo cáo của thương hiệu đó, đảm bảo cách ly dữ liệu tuyệt đối.

### 2.3. Form đăng ký gửi `website` và chuỗi rỗng gây lỗi validation
- **Trước khi sửa**:
  - Model `Partner` trong Prisma Schema và `partnerProfileInputSchema` (có `.strict()`) không có trường `website`. Việc gửi `website` khiến Zod từ chối ngay lập tức.
  - Các trường tùy chọn `logoUrl`, `description`, `contactEmail`, `contactPhone` nếu người dùng để trống sẽ gửi chuỗi rỗng `""`, làm văng lỗi regex số điện thoại và format email/URL.
- **Sau khi sửa**:
  - Loại bỏ trường `website` khỏi form FE.
  - Chuẩn hóa dữ liệu trước khi gửi: `val.trim() || undefined`. Nếu không nhập, trường sẽ là `undefined` và vượt qua Zod validation an toàn.

### 2.4. Form tạo ưu đãi gửi sai cấu trúc Schema
- **Trước khi sửa**:
  - FE gửi các trường voucher ở cấp root: `voucherCode`, `voucherType`, `voucherValue`, `validFrom`, `validTo`.
  - Thiếu `partnerId`.
  - Gửi tên thương hiệu vào trường `sponsor` (ví dụ `"Yonex VN"` thay vì enum `"PARTNER"`).
- **Sau khi sửa**:
  - Payload được đóng gói đúng chuẩn `partnerOfferInputSchema`:
    ```typescript
    {
      partnerId: currentPartner.id,
      title: offerForm.title.trim(),
      description: offerForm.description.trim() || undefined,
      sponsor: "PARTNER",
      budget: Number(offerForm.budget),
      maxUsage: offerForm.maxUsage ? Number(offerForm.maxUsage) : undefined,
      voucher: {
        code: offerForm.voucherCode.trim().toUpperCase(),
        type: offerForm.type,
        value: Number(offerForm.value),
        maxDiscount: offerForm.maxDiscount ? Number(offerForm.maxDiscount) : undefined,
        minAmount: Number(offerForm.minAmount) || 0,
        validFrom: new Date(offerForm.validFrom).toISOString(),
        validTo: new Date(offerForm.validTo).toISOString(),
      }
    }
    ```

### 2.5. Sai lệch cấu trúc `getMyPartnerOffers` và `getPartnerReport`
- **Trước khi sửa**:
  - `getMyPartnerOffers` trả về các trường phẳng (`voucherCode`, `voucherType`), trong khi FE đọc `offer.voucher.code`, `offer.voucher.type`.
  - `getPartnerReport` trả về `metrics` và `recentUsages`, trong khi FE đọc `summary` và `offers`.
- **Sau khi sửa**:
  - `getMyPartnerOffers` trả về đồng thời cả object `voucher: { code, type, value, maxDiscount, minAmount, validFrom, validTo, isActive }` và các trường phẳng dự phòng.
  - `getPartnerReport` trả về cấu trúc hợp đồng đầy đủ: `partner`, `summary`, `offers`, `metrics`, `recentUsages`.

### 2.6. Đồng bộ vai trò thành viên
- Khắc phục nhầm lẫn vai trò `ANALYST` (không tồn tại trong Prisma enum `PartnerMemberRole`): Hệ thống dùng chuẩn 3 vai trò: `OWNER` (Chủ sở hữu), `MANAGER` (Quản lý), `STAFF` (Nhân viên).
- Frontend hiển thị tiếng Việt rõ ràng và ẩn/vô hiệu hóa các nút tạo ưu đãi/gửi duyệt đối với vai trò `STAFF`.

---

## 3. DANH SÁCH FILE THAY ĐỔI

1. [`src/app/partner/page.tsx`](file:///e:/Project%20Demo/Badminton%20Court%20Booking%20Website/src/app/partner/page.tsx):
   - Hỗ trợ quản lý nhiều đối tác, dropdown chuyển thương hiệu.
   - Sửa form đăng ký (bỏ website, làm sạch chuỗi rỗng).
   - Sửa form tạo ưu đãi (gửi đúng voucher object, sponsor enum, partnerId).
   - Thống nhất vai trò `OWNER`/`MANAGER`/`STAFF`.
2. [`src/services/partner.service.ts`](file:///e:/Project%20Demo/Badminton%20Court%20Booking%20Website/src/services/partner.service.ts):
   - Cập nhật `getMyPartnerOffers` trả về object `voucher`.
   - Cập nhật `getPartnerReport` trả về `summary` và `offers` chuẩn hợp đồng FE.
3. [`tests/partner-service.test.cjs`](file:///e:/Project%20Demo/Badminton%20Court%20Booking%20Website/tests/partner-service.test.cjs):
   - Thêm 4 test case kiểm thử hợp đồng dữ liệu, phân quyền `STAFF`, vòng đời `DRAFT`/`PENDING_REVIEW`, và kiểm tra form đăng ký.

---

## 4. KẾT QUẢ KIỂM THỬ THỰC TẾ

```bash
npm test
# Tất cả các test cases của partner portal đều PASS:
# ✔ Form đăng ký: chấp nhận bỏ trống các trường tùy chọn và từ chối sai định dạng email/phone
# ✔ Phân quyền: thành viên STAFF hoặc người không thuộc đối tác bị từ chối tạo ưu đãi (403)
# ✔ Vòng đời ưu đãi: Đối tác chưa ACTIVE không được tạo ưu đãi, gửi duyệt lặp bị từ chối 409
# ✔ Hợp đồng dữ liệu getMyPartnerOffers và getPartnerReport: cấu trúc chuẩn có voucher object, phân tách theo partnerId
```

- **Kiểm tra TypeScript & Linter**:
  - `npx tsc --noEmit`: Exit Code `0`.
  - `npm run lint`: `✔ No ESLint warnings or errors`.
- **Kiểm tra Production Build**:
  - `npm run build`: Route `/partner` build static thành công (7.7 kB, First Load JS 121 kB).

---

## 5. PHẦN CHƯA KIỂM CHỨNG & GIỚI HẠN

1. **Upload Logo ảnh thực tế**: Form hiện tại hỗ trợ nhập `logoUrl` dạng link trực tiếp. Tính năng upload file nhị phân qua presigned URL lên S3/Cloudflare R2 dành cho logo đối tác chưa được cấu hình bucket live.
2. **Giao diện đa thiết bị thực tế**: Đã kiểm tra responsive trên mã nguồn Tailwind CSS; chưa thực hiện kiểm thử tự động trên nhiều thiết bị thực tế bằng browser testing matrix.
