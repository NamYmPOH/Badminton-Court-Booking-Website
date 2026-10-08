# Quản trị SmashBook

Trang `/admin` và API `/api/admin` chỉ dành cho `User.role = ADMIN`, `status = ACTIVE`.
Đăng nhập bằng tài khoản quản trị, mở menu tài khoản → **Quản trị hệ thống**.
Nếu vừa cấp quyền, tải lại website để menu lấy quyền mới.

## Chức năng

- Tổng quan cơ sở, hồ sơ chờ duyệt, đơn, giao dịch cần đối soát và chờ hoàn tiền.
- Duyệt / từ chối đăng ký, kích hoạt / tạm ngưng cơ sở.
- Xác nhận đơn đủ điều kiện, ghi nhận tiền mặt cho đơn trả tại sân, nhận sân, hoàn tất và hủy đơn.
- Xem thanh toán; ghép giao dịch SePay cần đối soát với đơn còn giữ sân, đúng số tiền và tài khoản ngân hàng.
- Cấp / thu hồi vai trò và khóa / mở tài khoản; không tự khóa hoặc tự thu hồi quyền admin.
- Nhật ký lưu lý do và trạng thái trước / sau trong cùng transaction với thay đổi.
- Khách đăng nhập gửi hồ sơ tại `/venues/register`. Hồ sơ tạo ở `PENDING`, trả tại sân; chỉ ADMIN được duyệt.

OWNER và STAFF là nhãn vai trò hiện có, chưa có cổng vận hành riêng. Hai vai trò này không có quyền API quản trị. Việc nâng CUSTOMER thành OWNER khi duyệt cơ sở không cấp quyền quản trị.

## Database và triển khai

1. Chạy `prisma/patches/20261008_admin.sql` sau schema hiện có. Với database mới, chạy `prisma/setup/empty-database.sql` rồi patch này.
2. Cấp ADMIN cho đúng tài khoản chủ dự án bằng một thao tác database được người vận hành cho phép. Không có API công khai cấp admin ban đầu, không dùng mật khẩu mặc định.
3. Nhập catalogue khi được chủ dự án yêu cầu:
   `node scripts/import-catalog.cjs <id-admin-hien-co> import.sql`
   Kiểm tra SQL rồi chạy trong database tương ứng. Script yêu cầu admin hoạt động, giữ dữ liệu đã tồn tại, tách slug trùng và không nhập đánh giá mẫu.
4. `npm run build`, commit và triển khai bản mới lên Vercel. Cần AUTH_SECRET tối thiểu 32 ký tự cùng DATABASE_URL / DIRECT_URL hiện có.

Catalogue tại thời điểm triển khai gồm 98 cơ sở, 587 sân và 295 khung giá. Tài khoản quản trị quản lý danh sách nhập. Số điện thoại cơ sở chưa có trong dữ liệu nguồn được để trống; đánh giá bắt đầu từ 0. Kích hoạt dữ liệu trong website không xác minh hoạt động kinh doanh thực tế của các tên/địa chỉ minh họa.

## Quy tắc thanh toán và bảo mật

- Đơn online chưa trả tiền không thể được xác nhận bằng nút quản trị.
- Ghi nhận tiền mặt chỉ dành cho đơn trả tại sân, chưa trả tiền, đã xác nhận.
- Nhận sân và hoàn tất đòi hỏi đơn đã thanh toán.
- Hủy đơn đã trả tiền chuyển sang `REFUND_PENDING`; không tự chuyển tiền hoàn hoặc đánh dấu đã hoàn tiền.
- Giao dịch sai số tiền, sai ngân hàng, đơn hết hạn / đã hủy phải xử lý nghiệp vụ bên ngoài; không có nút ép thanh toán.
- Các thao tác nhạy cảm đọc lại quyền trong transaction SERIALIZABLE; unique txnRef ngăn ghi tiền trùng. Tranh chấp được thử lại có giới hạn.
- API đọc quyền từ DB mỗi lần, không tin role từ trình duyệt. Chặn origin khác, chỉ nhận JSON có giới hạn kích thước.
- Bỏ xác thực fallback `users.json` và secret mặc định. Database lỗi thì từ chối xác thực.
- AdminAudit bật RLS và thu hồi quyền Data API anon/authenticated. Prisma server truy cập bằng kết nối riêng; không tạo policy công khai. Thông báo Supabase `RLS Enabled No Policy` là chủ ý cho mô hình backend này: [giải thích](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Kiểm tra

### Lỗi PostgreSQL 42P05: prepared statement already exists

Với Prisma 5.18 và Supabase transaction pooler (host `*.pooler.supabase.com`, cổng `6543`), `DATABASE_URL` phải có `pgbouncer=true`.
Trong Vercel → Environment Variables → DATABASE_URL → Production, thêm `?pgbouncer=true` nếu URL chưa có tham số; nếu đã có `?`, thêm `&pgbouncer=true`. Nếu đã có `pgbouncer=false`, đổi thành `true`, không thêm bản trùng. Giữ nguyên tài khoản, mật khẩu, host, SSL và các tham số khác. Lưu rồi redeploy bản Production hiện tại để cấu hình mới có hiệu lực.

`src/lib/database-url.ts` cũng chuẩn hóa tham số này khi tạo Prisma Client cho đúng host/cổng transaction pooler. Code không sửa biến môi trường trên Vercel, không đổi kết nối direct/session, và không ghi mật khẩu vào log. DIRECT_URL dành cho migration được giữ nguyên.

Tham khảo: [Supabase — Prepared statement already exists](https://supabase.com/docs/guides/database/prisma/prisma-troubleshooting#prepared-statement-already-exists).

`npm test`, `npm run lint`, `npm run build`.
Test quản trị kiểm tra vai trò, CSRF, chuyển trạng thái, tự khóa admin, rollback nhật ký, thu tiền trùng và đối soát sai / trùng / hết hạn. Transaction double không thay thế stress test tranh chấp trên PostgreSQL.

Sau deploy: đăng nhập admin → `/admin`, xem cơ sở; mở trang đặt sân Trung Văn Arena; đăng nhập khách để kiểm tra không vào được admin. Không cần chuyển tiền thật để kiểm tra quyền.
