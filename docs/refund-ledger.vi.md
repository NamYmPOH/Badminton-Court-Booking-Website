# Hoàn tiền khi hủy HLV và sân — 29/10/2026

## Quy tắc ghi sổ

- `Payment` giữ số tiền thực thu và mã giao dịch gốc. Không tạo `REFUND-COACH-*` như một khoản thu mới.
- `GroupRefund` dùng chung cho đơn cá nhân và đơn nhóm. `amount` là tổng nghĩa vụ hoàn đã duyệt trên một Payment; `completedAmount` là tổng đã chi.
- `RefundDisbursement` lưu từng lần chi: khoản hoàn, số tiền nguyên VND, mã chứng từ riêng, người ghi nhận và thời điểm. Mã được trim và chuyển chữ hoa; UNIQUE toàn hệ thống. Với phiếu chi tiền mặt, dùng mã có tiền tố cơ sở và số phiếu duy nhất.
- Tiền còn được duyệt hoàn = tiền thực thu − tổng đã duyệt; tiền còn phải chi = tổng đã duyệt − tổng đã chi. Không lấy `Booking.total` thay chứng từ thu bị thiếu.
- Tổng chi phải khớp chứng từ chi; mỗi khoản hoàn không vượt Payment gốc. Dữ liệu không khớp bị chặn để đối soát.
- Phê duyệt, chi tiền, cập nhật tài nguyên và nhật ký chạy cùng transaction Serializable. Retry cùng mã chứng từ và cùng số tiền không ghi thêm; mã trùng với nội dung khác bị từ chối.

## Các luồng đã thống nhất

1. HLV hủy trước giờ dạy: bỏ đúng phí HLV khỏi tổng đơn; duyệt hoàn phần tiền thực thu vượt tổng mới. Quyền nhận sân vẫn giữ nếu sân đã được trả đủ. Nhóm được chia lại theo Payment của từng người thực trả, kể cả trả thay nhiều phần, bảo toàn VND lẻ.
2. Hủy sân sau hủy HLV: cộng thêm nghĩa vụ hoàn trên tiền chưa được duyệt hoàn; giữ nguyên số đã chi. Khoản từng hoàn xong được mở lại khi có nghĩa vụ mới.
3. Hủy sân từ vận hành hoặc admin: hủy cả giữ sân, ca HLV, ưu đãi RESERVED; đóng nhóm và QR đang mở. Khách/nhân viên gửi yêu cầu; chủ sân/admin duyệt. Trưởng nhóm vẫn dùng chính sách hủy nhóm hiện có, tính trên phần tiền còn giữ sau hoàn HLV.
4. Ghi nhận hoàn: chọn Payment gốc, nhập tiền đã chi và chứng từ. Có thể chi từng phần; chỉ hết số dư mới đóng khoản hoàn. Màn hình nhóm và vận hành dùng cùng sổ chi.
5. Không thu tiền mặt vào đơn đã hủy/hết hạn hoặc thu đơn nhóm qua đường thu tổng đơn. Webhook đến sau hủy được lưu trong `SepayReceipt` chờ đối soát, không mở lại đơn.

Đây là ghi nhận chi thủ công sau khi thực tế chuyển khoản/trả tiền mặt. Hệ thống không gọi API chuyển tiền ngân hàng và không xác minh tự động người nhận của giao dịch chi. Nhân viên cần đối chiếu người thực trả của Payment gốc; tiền chuyển tới sau hủy phải được xử lý tại hàng đợi đối soát, không tự tạo khoản hoàn từ webhook chưa khớp.

## Migration và dữ liệu cũ

File chính: `supabase/migrations/20261028191729_refund_ledger.sql` (tên UTC do Supabase CLI sinh). Bản tương đương: `prisma/patches/20261029_refund_ledger.sql`.

Migration đã kiểm tra trong PostgreSQL WASM cục bộ, gồm chạy lại hai lần. Chưa áp dụng lên database thật.

Thứ tự triển khai:

1. Sao lưu, tạm ngừng các thao tác hủy/ghi nhận hoàn của phiên bản cũ để tránh chạy lẫn hai cách ghi sổ.
2. Áp dụng migration qua quy trình triển khai của dự án. Chọn một đường migration, không cần chạy cả hai bản.
3. Sinh Prisma Client và triển khai mã mới đồng bộ. Kiểm tra trên staging với dữ liệu giả trước khi mở lại thao tác tiền thật.
4. Đối soát các khoản cũ bị chặn trước khi cho phép tiếp tục chi. Không xóa chứng từ cũ để bỏ chặn.

Các khoản `GroupRefund` cũ đã `COMPLETED` nhưng chưa có sổ chi được chuyển sang `REVIEW_REQUIRED`, giữ nguyên `reference` và `completedAt`. Không suy ra đã chi toàn bộ từ trạng thái cũ, vì logic trước đây có thể đóng sớm hoặc tăng số duyệt sau khi đã đóng. Giá trị `completedAmount = 0` ở bản ghi cần đối soát chưa chứng minh khách chưa nhận tiền.

Các Payment `REFUND-*`, hoặc Payment đã chuyển REFUND_PENDING/REFUNDED nhưng thiếu GroupRefund, cũng bị chặn. Người đối soát cần đối chiếu chứng từ thu, chứng từ chi thực tế và nhật ký hủy; xác định số đã duyệt và đã chi, gắn khoản hoàn vào Payment thu gốc và bổ sung từng chứng từ chi có thật. Thao tác chuyển dữ liệu cũ phải có bản ghi kiểm toán và bảo toàn hồ sơ gốc. Bản sửa này không tự đoán hoặc tự chuyển những khoản này.

Bảng `RefundDisbursement` bật RLS và thu hồi quyền PUBLIC/anon/authenticated; ứng dụng truy cập bằng kết nối backend theo mô hình auth hiện có. Tham chiếu: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Kiểm tra

- `npm test`: kiểm tra dịch vụ với fixture có commit/rollback; gồm hủy HLV rồi hủy sân, hoàn một phần, trả thay, số lẻ, quyền thao tác, mã trùng, webhook đến muộn và retry P2034. Nhánh database ghi nhận voucher dựa trên VoucherUsage đã commit, không dùng dấu ghi nhớ trước commit.
- Fixture tuần tự hóa writer để kiểm tra kết quả các lời gọi đồng thời. Đây không phải kiểm thử tranh chấp trên một PostgreSQL server nhiều kết nối.
- `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- Kiểm tra SQL độc lập, không đọc `.env` hoặc kết nối database thật:

```powershell
npm install --prefix node_modules/.refund-validation --no-save --package-lock=false --ignore-scripts @electric-sql/pglite@0.5.13
node scripts/verify-refund-migration.cjs
```

Script kiểm tra migration lặp lại, dữ liệu cũ cần đối soát, phần chia 0 đồng, giới hạn tiền, khóa ngoại, mã chứng từ trùng/không chuẩn hóa, RLS và quyền SELECT/INSERT/UPDATE/DELETE của anon/authenticated. Không thêm package này vào dependency chạy ứng dụng.

Kết quả xác minh cục bộ: 197/197 kiểm thử dịch vụ đạt; migration PostgreSQL WASM đạt; build production đạt. Lint còn một cảnh báo đã có sẵn về dependency `courtId` của useEffect trong `CounterBookingModal.tsx`. Chưa kiểm thử giao dịch ngân hàng thật hoặc tranh chấp nhiều kết nối trên staging.
