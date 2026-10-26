# SmashBook: tìm sân, đặt lịch và theo dõi thanh toán

## 1. Mục đích

Cải thiện giao diện và hành trình đặt sân cầu lông hiện có để người chơi tìm được cơ sở phù hợp, chọn đúng sân và giờ, hiểu tổng tiền, rồi biết lịch đã được xác nhận hay vẫn chờ xử lý. Sức hấp dẫn của giao diện đến từ ảnh sân có ích, bố cục dễ đọc và hành động rõ ràng, đồng thời giữ thông tin đặt chỗ chính xác.

Tài liệu là đầu vào cho OpenDesign dựng prototype, không phải kế hoạch triển khai. Phạm vi chính là trải nghiệm người chơi trên web desktop và điện thoại, gồm nhánh chia tiền nhóm đã tồn tại. Công cụ quản trị, chủ sân, nhân viên, đối tác và HLV chỉ được nhắc đến khi ảnh hưởng hành trình này.

**Cơ sở bằng chứng, ngày 26/10/2026:** người dùng đã cho phép tiếp tục không cần Mobbin. Không có ảnh Mobbin được trả về hoặc kiểm tra. Không có nghiên cứu đối thủ, phỏng vấn hay kiểm thử người dùng trong tài liệu. Quan sát hiện trạng đến từ mã nguồn; chưa kiểm chứng giao diện chạy thực tế.

Quy ước:

- **[HT] Hiện trạng:** được xác nhận trong repository.
- **[ĐX] Đề xuất:** yêu cầu cho prototype, chưa được kiểm chứng bằng nghiên cứu bên ngoài.
- **[GĐ] Giả định:** lựa chọn tạm để dựng prototype.
- **[CH] Câu hỏi:** cần xác nhận, chưa phải chính sách đã chốt.

Các mục 3 đến 10 mô tả trải nghiệm đích [ĐX], trừ nội dung có nhãn khác. Không được hiểu các yêu cầu này là chức năng hiện tại đã hoàn thiện.

## 2. Bối cảnh sản phẩm hiện có

### Điều hướng, thuật ngữ và hành trình

[HT] Thương hiệu tạm là SmashBook. Nội dung bằng tiếng Việt, tiền VNĐ. Desktop có Sân cầu lông, Bản đồ, Ưu đãi, tìm kiếm, thông báo và tài khoản. Mobile có Trang chủ, Bản đồ, Ưu đãi, Lịch của tôi và Tài khoản/Đăng nhập.

[HT] Hành trình chính: Trang chủ hoặc danh sách/bản đồ → chi tiết cơ sở → lịch trống → thông tin đặt sân → tạo đơn giữ sân → QR chuyển khoản hoặc yêu cầu tiền mặt → trạng thái đơn → Lịch của tôi.

[HT] Từ đơn đang giữ sân có nhánh chia tiền nhóm. Thành viên tham gia qua liên kết mời. Người quay lại mở đơn hoặc nhóm từ Lịch của tôi. Ưu đãi cung cấp mã để sao chép và áp dụng tại checkout.

Giữ cách gọi quen thuộc, nhưng phân biệt rõ: **cơ sở** là địa điểm có nhiều sân; **sân** là sân cụ thể; **khung giờ** là khoảng chơi; **đơn** là giao dịch đặt chỗ. Giữ tiếng Việt, giờ 24 giờ, ngày theo Việt Nam, tiền VNĐ và hai giao diện sáng/tối. Không đổi thương hiệu ở giai đoạn này.

### Nguồn đã kiểm tra

Các đường dẫn dưới đây tính từ repository, dùng truy vết quan sát, không phải danh sách triển khai.

| Nguồn | Bằng chứng liên quan |
| --- | --- |
| `src/lib/config/brand.ts`, `src/app/globals.css` | SmashBook, xanh lam chủ đạo, cam nhấn, nền sáng/tối, focus và giảm chuyển động |
| `src/components/features/layout/Navbar.tsx`, `MobileTabBar.tsx` | Điều hướng và điểm vào tài khoản |
| `src/app/page.tsx`, `src/components/features/home/` | Tìm kiếm, lọc nhanh, nhóm sân gần bạn và đánh giá cao |
| `src/app/venues/page.tsx`, `src/components/features/venues/` | Bộ lọc, thẻ cơ sở, bản đồ và không có kết quả |
| `src/services/venue.service.ts` | Tìm có/không dấu, dữ liệu dự phòng, giới hạn nhãn khoảng cách/lịch tối nay |
| `src/app/venues/[slug]/page.tsx` | Ảnh, địa chỉ, tiện ích, đánh giá, bảng giá và điều kiện đặt/hủy |
| `src/app/venues/[slug]/book/page.tsx`, `src/lib/booking.ts` | Bảng sân x giờ, dải ngày, giá và quy tắc lựa chọn |
| `src/app/checkout/page.tsx` | Liên hệ, ghi chú, HLV tùy chọn, voucher, tổng và tạo đơn |
| `src/app/login/page.tsx`, `src/app/register/page.tsx` | Xác thực và điều hướng sau xác thực |
| `src/services/reservation.service.ts` | Kiểm tra lịch/giá/HLV/voucher và thời hạn giữ sân |
| `src/app/payment/result/page.tsx` | QR, tiền mặt chờ duyệt, kiểm tra trạng thái và hết hạn |
| `src/components/GroupPaymentCreate.tsx`, `src/app/groups/[token]/page.tsx` | Bảng chia, tham gia, phần tiền, trả hộ, vé nhận sân, hủy/hoàn theo quyền |
| `src/app/bookings/page.tsx`, `src/services/booking.service.ts`, `src/types/booking.ts` | Các nhóm lịch và trạng thái đặt chỗ/thanh toán |
| `src/app/offers/page.tsx`, `src/app/account/page.tsx`, `src/app/notifications/page.tsx` | Điểm vào phụ và một số tương tác hiện chỉ lưu cục bộ |

### Ràng buộc sản phẩm

- [HT] Một đơn chọn các ô 30 phút liên tiếp trên cùng một sân, trong dải 7 ngày. Chọn ô chưa giữ chỗ; lịch được kiểm tra lại khi tạo đơn.
- [HT] Cần đăng nhập để tạo đơn. Tên và điện thoại được điền từ tài khoản khi có.
- [HT] Giá phụ thuộc ngày/giờ. Voucher giảm tiền sân, không giảm phí HLV. HLV là tùy chọn và được kiểm tra lại khi tạo đơn.
- [HT] Thời gian giữ sân tối đa 5 phút, có thể ngắn hơn khi gần giờ bắt đầu. Trang chi tiết đang ghi 10 phút, không khớp hành vi tạo đơn.
- [HT] Tiền mặt cần sân duyệt. Xác nhận lịch và nhận tiền là hai trạng thái khác nhau.
- [HT] Chia nhóm gồm 2 đến 30 người, chia đều hoặc nhập số tiền riêng. Chốt bảng chia thay QR tổng bằng các phần và không gia hạn giữ sân.
- [HT] Hủy đơn cá nhân hiện chỉ thông báo liên hệ cơ sở, chưa thực hiện hủy. Đơn nhóm có nhánh yêu cầu hủy theo quyền. Không biến thành hủy tức thì cho mọi đơn.

### Vấn đề quan sát và hướng xử lý

Hệ quả dưới đây là nhận định UX cần kiểm thử, không phải kết quả đo hành vi người dùng.

| Quan sát từ mã nguồn | Nguy cơ hiểu nhầm | Hướng xử lý [ĐX] |
| --- | --- | --- |
| Chi tiết ghi VNPAY/10 phút; thanh toán dùng QR ngân hàng, giữ tối đa 5 phút | Sai kỳ vọng về cách trả và thời hạn | Dùng phương thức khả dụng và thời hạn thực của đơn |
| Đăng nhập chỉ quay lại một dạng link nhóm; trường hợp khác và đăng ký về trang chủ | Mất nhiệm vụ đang làm tại checkout | Trở lại checkout, giữ bản nháp và kiểm tra lịch lại |
| Có thể chọn khác sân/ô rời trước khi báo sai | Sửa lựa chọn bằng thử và sai | Giải thích quy tắc cạnh lịch, chỉ rõ cách sửa |
| `hasSlotTonight` trong dữ liệu cơ sở suy từ sân hoạt động; khoảng cách có thể thiếu | Nhãn còn trống/gần bạn thiếu căn cứ | Chỉ khẳng định khi có dữ liệu tương ứng |
| Danh sách có thể dùng cơ sở mẫu; lịch đặt dùng danh mục riêng | Xem được cơ sở nhưng không đặt được | Trạng thái chưa mở đặt trực tuyến riêng |
| Lịch của tôi gộp một số trạng thái thành Đã hủy | Hết hạn/không đến bị hiểu là chủ động hủy | Nhãn đúng từng trạng thái, tách tình trạng tiền |
| Lỗi tải HLV trở thành danh sách rỗng | Lỗi tải bị hiểu là hết HLV | Tách lỗi tải khỏi không có lựa chọn |
| Yêu thích trên thẻ lưu cục bộ; nút chi tiết chưa có hành vi; thông báo là mẫu | Hứa chức năng chưa tồn tại | Không dùng làm nền tảng journey hoặc nút chính giả |

## 3. Trải nghiệm đích

Người chơi lần lượt trả lời được: cơ sở ở đâu và phù hợp không; ngày nào/sân nào còn chỗ; tổng phải trả bao nhiêu; bước tiếp tạo đơn hay trả tiền; lịch và tiền đang ở trạng thái gì.

- **Khám phá:** ảnh thể hiện cơ sở, địa chỉ/quận và giá từ theo giờ dễ so sánh; tìm kiếm nổi bật hơn banner quảng bá.
- **Chọn lịch:** luôn nhận biết ngày, sân, khoảng chơi và tổng đã chọn. Lý do không thể tiếp tục nằm cạnh lựa chọn.
- **Kiểm tra đơn:** sửa được trước khi tạo đơn; HLV và mã ưu đãi không thành bước bắt buộc.
- **Thanh toán:** thông báo nói rõ việc đã xảy ra và việc còn phải làm. Yêu cầu mới gửi không mang hình thức thành công.
- **Phục hồi:** quay lại sau đăng nhập hoặc chuyển ứng dụng ngân hàng vẫn nhận ra đơn. Mất kết nối không đồng nghĩa chưa trả tiền.

Định hướng hình ảnh: ảnh sân đúng ngữ cảnh, tiêu đề và giá nổi bật hơn mô tả, thông tin được nhóm theo nhiệm vụ, khoảng trống hỗ trợ quét nội dung. Màu nhấn dành cho hành động chính; trạng thái có chữ/biểu tượng, không chỉ màu. Giảm viền, badge và lời quảng bá cạnh tranh. Đây là đề xuất bố cục, không phải bộ token hoặc thương hiệu mới.

## 4. Hành trình người dùng

**Khách mới:** Trang chủ → kết quả/bản đồ → chi tiết cơ sở → chọn ngày/sân/giờ → checkout → xác thực nếu cần → quay lại checkout, kiểm tra lịch → tạo đơn → QR hoặc tiền mặt chờ duyệt → xác nhận lịch → Lịch của tôi.

**Người quay lại:** Lịch của tôi → đơn/nhóm → tiếp tục thanh toán nếu còn hiệu lực, xem lịch đã xác nhận, hoặc xử lý hết hạn/hủy. Đặt lượt mới đi qua chọn lịch mới, không sao chép cam kết lịch cũ.

**Nhóm:** Đơn đang giữ → bảng chia → xác nhận thay mã → trang nhóm → mời → xác thực và nhận phần → trả phần mình/trả hộ hoặc yêu cầu tiền mặt → theo dõi chung/cá nhân → vé nhận sân khi được cấp.

**Phục hồi:** không kết quả → sửa lọc; hết chỗ → đổi ngày/giờ; xung đột tạo đơn → cập nhật lịch; voucher/HLV sai → sửa/bỏ tùy chọn; mất mạng → kiểm tra cùng đơn; hết giữ sân → dừng mã cũ, đối soát tiền đã chuyển nếu có.

## 5. Đặc tả luồng

### F1. Tìm và đánh giá cơ sở

**Kích hoạt:** Trang chủ, Sân cầu lông, Bản đồ hoặc link cơ sở.

**Bước:** 1. Nhập tên/khu vực hoặc lọc. 2. Xem kết quả và tiêu chí đang áp dụng. 3. Chuyển danh sách/bản đồ nếu cần. 4. Mở cơ sở, đọc thông tin và điều kiện. 5. Xem lịch trống.

**Quyết định:** đổi tiêu chí; chủ động yêu cầu vị trí hiện tại; chọn cơ sở khác. Giữ truy vấn khi đổi chế độ và quay lại.

**Kết thúc:** vào lịch hoặc trở lại kết quả còn ngữ cảnh.

**Lỗi/phục hồi:** không kết quả có bỏ từng lọc/xóa tất cả; bản đồ lỗi vẫn dùng danh sách; từ chối vị trí vẫn tìm quận; thiếu tọa độ không làm cơ sở biến mất khỏi danh sách. Chưa mở đặt trực tuyến có thông báo riêng.

### F2. Chọn sân và giờ

**Kích hoạt:** Xem lịch trống tại cơ sở.

**Bước:** 1. Chọn ngày trong dải 7 ngày. 2. Chọn ô đầu trên một sân. 3. Thêm ô liền kề. 4. Kiểm tra khoảng giờ, thời lượng, tiền. 5. Tiếp tục checkout.

**Quyết định:** bỏ ô, đổi ngày hoặc sân. Đổi ngày khi đã chọn phải báo sẽ xóa lựa chọn. Chọn sân khác hỏi thay lựa chọn, không cộng hai sân vào đơn. Chọn ô rời không tự lấp khoảng trống hoặc cộng tiền ngoài ý muốn.

**Kết thúc:** lựa chọn hợp lệ tới checkout; chưa hợp lệ thì nút tiếp tục có lý do chưa dùng được bằng chữ.

**Lỗi/phục hồi:** phân biệt đã đặt, đã qua giờ, không mở/không có giá. Hết giờ/hết chỗ gợi ý đổi ngày. Tải lỗi có thử lại. Lịch thay đổi chỉ rõ phần không còn dùng được; không nói đã giữ sân trước khi tạo đơn.

### F3. Xác thực và kiểm tra đơn

**Kích hoạt:** từ lịch hoặc quay lại checkout chưa hoàn thành.

**Bước:** 1. Xem tóm tắt. 2. Xác thực nếu cần rồi quay lại đúng nhiệm vụ. 3. Điền tên/điện thoại và ghi chú tùy chọn. 4. Chọn HLV/voucher nếu muốn. 5. Kiểm tra tiền sân, giảm giá, HLV, tổng. 6. Tạo đơn và tiếp tục thanh toán.

**Quyết định:** sửa giờ; bỏ tùy chọn; thoát xác thực về lựa chọn. Giữ thông tin không nhạy cảm trong hành trình, không giữ mật khẩu trong bản nháp.

**Kết thúc:** có mã đơn thì vào thanh toán, không báo thành công khi mới gửi yêu cầu.

**Lỗi/phục hồi:** lỗi cạnh trường; voucher sai giữ form; HLV không khả dụng cho bỏ/chọn lại; sân bị đặt dẫn về đúng cơ sở/ngày. Chưa rõ kết quả tạo đơn thì kiểm tra trước khi tạo đơn thứ hai. Không xóa cả form vì một tùy chọn lỗi.

### F4. Thanh toán và xác nhận

**Kích hoạt:** có mã đơn hoặc mở đơn từ Lịch của tôi.

**Bước:** 1. Đọc trạng thái lịch/tiền và hạn giữ. 2. QR: quét hoặc sao chép ngân hàng, số tiền, nội dung. Tiền mặt: gửi yêu cầu khi khả dụng. 3. Chờ xác nhận. 4. Xem kết quả và lịch. 5. Về Lịch của tôi.

**Quyết định:** đổi phương thức khi được phép; chia nhóm trước khi có người chuyển QR tổng. Đổi phương thức không phải bằng chứng nhận tiền.

**Kết thúc:** lịch được xác nhận với tiền đã nhận/chưa nhận đúng thực tế, hoặc hết hạn/hủy có hướng xử lý.

**Lỗi/phục hồi:** QR lỗi vẫn đọc/sao chép thông tin; copy thất bại không báo đã chép. Mất mạng giữ mã đơn và có Kiểm tra lại, nhắc kiểm tra trước khi chuyển thêm. Đồng hồ về 0 dừng chỉ dẫn trả mã cũ và xác minh tình trạng; tiền đã chuyển cần đối soát, không mô phỏng hoàn tự động.

### F5. Chia tiền và tham gia nhóm

**Kích hoạt:** Chia tiền với nhóm trên đơn đủ điều kiện, hoặc link mời.

**Bước:** 1. Chọn 2 đến 30 người, chia đều/tùy chỉnh. 2. Kiểm tra tổng các phần. 3. Xác nhận thay QR tổng, không tăng thời hạn. 4. Chốt và mời bằng link. 5. Thành viên xác thực, nhận phần còn trống. 6. Thanh toán phần mình/trả hộ theo quyền. 7. Theo dõi chung và phần cá nhân.

**Quyết định:** thoát bảng chia trước khi chốt giữ nguyên đơn; sau chốt không mô phỏng sửa tự do số tiền. [HT] Trang nhóm có thể tự nhận phần khi người đủ điều kiện mở link. [ĐX] Prototype cho xem trước và xác nhận nhận phần chủ động.

**Kết thúc:** xác nhận chung theo trạng thái hệ thống; tiền đã nhận và tiền mặt chờ thu vẫn tách biệt. Vé nhận sân chỉ hiện khi được cấp, không dùng QR thanh toán làm vé.

**Lỗi/phục hồi:** link sai, không có quyền, hết phần, tranh chấp nhận phần, tổng sai, hết hạn hoặc mất mạng có giải thích. Trả hộ nêu rõ các phần và tổng. Trưởng nhóm yêu cầu hủy theo quyền, xác nhận lý do/hệ quả; theo dõi hoàn riêng, không hứa số tiền hoặc thời gian chưa có chính sách.

### F6. Tra cứu và yêu cầu hủy

**Kích hoạt:** Lịch của tôi hoặc sau thanh toán.

**Bước:** 1. Chọn nhóm lịch. 2. Đọc ngày, sân và hai loại trạng thái. 3. Mở đơn/nhóm. 4. Tiếp tục bước còn thiếu, xem thông tin tới sân hoặc yêu cầu hỗ trợ.

**Quyết định:** đặt lượt mới; liên hệ hủy cá nhân; trưởng nhóm yêu cầu hủy nhóm nếu đủ quyền.

**Kết thúc:** biết tình trạng hoặc thực hiện bước tiếp mà không tạo đơn mới ngoài ý muốn.

**Lỗi/phục hồi:** tách chưa xác thực khỏi lỗi tải; nhóm lịch trống có Tìm sân. Không dùng đơn mẫu như lịch thật. Hủy cá nhân phải nói rõ đơn chưa bị hủy tới khi cơ sở xử lý.

## 6. Danh mục màn hình và trạng thái

Mỗi mã là màn hình hoặc vùng trạng thái trong màn hình; không bắt buộc tạo trang riêng cho từng trạng thái. Đây là danh mục chuẩn cho prototype.

| Mã / màn hình | Mục đích, điều kiện vào | Thông tin bắt buộc | Chính / phụ | Trạng thái | Chuyển tới |
| --- | --- | --- | --- | --- | --- |
| S01 Trang chủ `/` | Bắt đầu tìm sân | Tìm kiếm, nhóm cơ sở có nguồn rõ | Tìm / lọc nhanh, mở cơ sở | Mặc định, tải, rỗng/lỗi, ảnh thiếu | S02, S03, S09 |
| S02 Kết quả `/venues` | So sánh sau tìm hoặc điều hướng | Truy vấn, tiêu chí, số kết quả, sắp xếp, ảnh/tên/quận/giá từ | Mở cơ sở / lọc, danh sách-bản đồ | Có/không kết quả, tải/lỗi, lỗi bản đồ, từ chối vị trí, thiếu tọa độ | S03 hoặc ở lại |
| S03 Chi tiết | Đánh giá địa điểm | Ảnh, địa chỉ, giờ mở, tiện ích, giá tham khảo, chính sách | Xem lịch / về kết quả | Đầy đủ, thiếu ảnh/đánh giá, không tìm thấy, chưa đặt trực tuyến | S04, S02 |
| S04 Lịch | Chọn giờ trong cơ sở | Ngày, sân, giờ/giá ô, chú giải, tổng, chưa giữ chỗ | Tiếp tục / đổi ngày, bỏ/thay chọn | Tải, chưa chọn, đã chọn, bận/quá giờ/không giá, hết chỗ, lỗi, lựa chọn mất hiệu lực | S06, S03 |
| S05 Xác thực | Khi tạo đơn hoặc nhận phần nhóm | Lý do cần tài khoản, trường nhập và quy tắc, nơi sẽ quay lại | Đăng nhập/đăng ký / đổi cách, quay lại | Mặc định, gửi, lỗi trường, sai thông tin, thành công | S06, S11; S01 nếu vào độc lập |
| S06 Checkout | Kiểm tra trước tạo đơn | Lịch, liên hệ, HLV/voucher tùy chọn, chi tiết tiền | Tạo đơn và tiếp tục thanh toán / sửa giờ, bỏ tùy chọn | Chưa xác thực, điền sẵn, tải/rỗng/lỗi HLV, voucher đúng/sai, đang tạo, xung đột | S05, S04, S07 |
| S07 Thanh toán | Có đơn hoặc mở lại đơn | Mã, lịch, tổng, hai trạng thái, thời hạn, QR/ngân hàng hoặc tiền mặt | Thanh toán theo phương thức / kiểm tra lại, đổi phương thức, chia nhóm | Đang kiểm tra, chờ QR, QR lỗi, chờ duyệt tiền mặt, duyệt chưa thu, mất mạng, hết hạn, thiếu mã/không quyền | S08, S10, S09 |
| S08 Kết quả trong trang đơn | Hiểu kết quả và bước sau | Hiệu lực lịch, tiền/hoàn tiền, nơi và giờ chơi, mã đơn | Lịch của tôi / cơ sở, hỗ trợ | Trả và xác nhận, xác nhận chưa trả, hết hạn, hủy, nhận sân, đã chơi, không đến, chờ/đã hoàn | S09, S03 |
| S09 Lịch của tôi | Tra cứu, quay lại | Nhóm lịch, mã, lịch chơi, trạng thái lịch/tiền, đơn nhóm | Mở đơn/tiếp tục trả / tìm sân, liên hệ hủy | Tải, lỗi, chưa xác thực, từng nhóm rỗng, danh sách | S07/S08, S11, S02 |
| S10 Bảng chia trong đơn | Chốt trước thay QR | Số người, từng phần, tổng, cảnh báo thay mã/thời hạn | Chốt bảng chia / quay lại | Chia đều, tùy chỉnh, tổng sai, đang chốt, lỗi/hết hạn | S11, S07 |
| S11 Trang nhóm | Một lịch, nhiều phần tiền | Lịch chung, hạn, phần tôi, tiến độ tiền chung/cá nhân, quyền | Khách: nhận phần; thành viên: trả phần; trưởng nhóm: mời / trả hộ, tiền mặt, vé, yêu cầu hủy | Khách, tham gia, hết phần, chờ/nhận một phần, tiền mặt chờ duyệt/thu, xác nhận, hết hạn, hủy, vé, chờ/đã hoàn, lỗi/quyền | S05, S09 hoặc ở lại |
| S12 Ưu đãi | Tìm mã cho booking | Mã, điều kiện, thời hạn, mức giảm/phạm vi đã có | Sao chép / tìm sân, về checkout nếu có ngữ cảnh | Tải, có/rỗng, không khớp tìm, lỗi tải, copy đúng/lỗi | S02, S06 |
| S13 Tài khoản/thông báo, điểm nối | Giữ điều hướng phụ | Tài khoản, lịch, xác thực; thông báo mẫu phải nhận diện | Lịch của tôi / khám phá, đăng xuất | Có/không phiên, tải, thông báo mẫu | S09, S05, S01 |

### Hai loại trạng thái

| Trạng thái lịch [HT] | Nhãn đích [ĐX] | Hướng xử lý |
| --- | --- | --- |
| PENDING_PAYMENT | Đang giữ sân | Hiện hạn; trả tiền hoặc chờ duyệt |
| CONFIRMED | Đã xác nhận lịch | Đọc tiền riêng; có thể chưa trả tiền mặt |
| CHECKED_IN | Đã nhận sân | Xem thông tin, không còn lời yêu cầu giữ chỗ |
| COMPLETED | Đã chơi | Tra cứu, chọn lịch mới |
| NO_SHOW | Không đến chơi | Không ghi Đã hủy |
| CANCELLED | Đã hủy | Theo dõi tiền/hoàn riêng |
| EXPIRED | Hết thời gian giữ sân | Dừng mã cũ; chọn lại hoặc đối soát |

Trạng thái tiền có các nghĩa riêng: chưa trả, đang xử lý, đã thu một phần, đã thanh toán, thất bại, chờ hoàn, đã hoàn. Mất kết nối dùng Đang kiểm tra, không suy ra Chưa trả. Thanh toán thất bại không tự suy ra lịch đã hủy.

[ĐX] Giữ ba nhóm lịch, đổi nhóm cuối thành **Đã hủy / Hết hạn**. Sắp tới chứa giữ sân/xác nhận/đã nhận sân; Đã chơi chứa hoàn tất/không đến nhưng từng đơn ghi đúng trạng thái. Chưa bắt buộc thêm tab mới.

## 7. Yêu cầu tương tác

1. **Giữ ngữ cảnh:** Back trả về bộ lọc/lựa chọn còn hợp lệ. Sau xác thực kiểm tra lịch lại và giữ liên hệ đã nhập. Đây là cải thiện, chưa phải hiện trạng.
2. **Giữ chỗ trung thực:** đồng hồ chỉ có sau tạo đơn, dùng hạn thực; không đếm lại khi reload, đổi phương thức hoặc chia nhóm.
3. **Chọn lịch:** hỗ trợ chạm/click và bàn phím, không bắt buộc kéo. Giữ tên sân/giờ khi cuộn. Mobile chỉ bảng lịch cuộn ngang, có dấu hiệu còn nội dung; không kéo ngang toàn trang.
4. **Hành động chính:** tóm tắt và nút tiếp tục dễ tìm. Vùng cố định không che thanh điều hướng, bàn phím hoặc nội dung cuối. Không để hai hành động cùng tranh ưu tiên.
5. **Thay đổi có hệ quả:** đổi sân/ngày giải thích mất lựa chọn; chốt chia và hủy có xác nhận. Đóng hộp thoại không thay dữ liệu.
6. **Phản hồi:** lỗi quan trọng nằm trong trang, không chỉ toast; đưa chú ý đến vùng cần sửa. Tách đang tải, rỗng, mất mạng và thiếu quyền.
7. **Ra ứng dụng ngân hàng:** trở lại thì kiểm tra cùng đơn; không có nút tự xác nhận trả tiền để đạt thành công. Có sao chép thông tin cho người chỉ dùng một điện thoại; không hứa tự mở app ngân hàng.
8. **Định dạng:** tiếng Việt nhất quán, giờ 24 giờ, ngày rõ, lịch Việt Nam. Giá từ kèm /giờ; tổng là tiền khoảng chơi. Không rút gọn số tiền chuyển khoản.
9. **Tiếp cận:** focus rõ, thứ tự đọc hợp lý, nút icon có tên, trạng thái không chỉ màu, nội dung vẫn đọc được khi phóng to. Đồng hồ không đọc từng giây liên tục. Kiểm tra sáng/tối và giảm chuyển động.

## 8. Mẫu UX và phân tích

Không có kết quả Mobbin. ADOPT/ADAPT/REJECT dưới đây phân loại mẫu nội bộ và đề xuất, không phải kết luận nghiên cứu đối thủ. Lợi ích là mục tiêu cần kiểm thử.

| Mẫu | Bằng chứng nội bộ | Quyết định | Áp dụng |
| --- | --- | --- | --- |
| Danh sách và bản đồ cùng tiêu chí | Venues, bộ lọc, VenuesMap | ADAPT | Giữ hai góc nhìn, không nhập lại truy vấn |
| Thẻ cơ sở có ảnh và thông tin so sánh | VenueCard | ADAPT | Ưu tiên địa điểm/giá/tiện ích, bỏ khẳng định không đủ dữ liệu |
| Bảng sân x giờ | Book, selectionError | ADAPT | Giữ nhiều sân và ô 30 phút; hướng dẫn chọn/sửa ngay cạnh lịch |
| Tóm tắt tiền gần thao tác | Book, checkout | ADOPT | Hiện khoảng chơi, tổng và các phần giảm/phí |
| Xác thực làm mất nhiệm vụ | Login/register về trang chủ | REJECT | Quay lại checkout và kiểm tra lịch |
| Thành công theo trạng thái được xác nhận | Payment result | ADOPT | Không nhầm gửi yêu cầu với nhận tiền |
| Nhiều mẫu QR cùng mức ưu tiên | Payment result | ADAPT | Một QR mặc định, mẫu khác trong trợ giúp lỗi quét |
| Nhãn VNPAY/10 phút không khớp | Detail và reservation | REJECT | Dùng phương thức và thời hạn thực |
| Tiền cá nhân so với toàn nhóm | GroupPaymentCreate, groups | ADAPT | Phần tôi nổi bật, tổng nhóm và phần chờ thu riêng |

## 9. Bảng tham chiếu cho OpenDesign

Không có URL/ảnh Mobbin đã kiểm tra. Không thay bằng ảnh hoặc tên ứng dụng phỏng đoán. Tham chiếu dưới đây là cấu trúc nội bộ đọc từ nguồn, chưa phải ảnh giao diện chạy thật. Dùng để giữ nghĩa và hành vi, không bắt buộc sao chép bố cục hiện tại.

| Màn hình | Tham chiếu nội bộ | Điểm cần giữ/nghiên cứu khi dựng | Sử dụng |
| --- | --- | --- | --- |
| S01 | Home, HeroSearch, QuickFilters | Tìm kiếm trước các nhóm cơ sở | ADAPT |
| S02 | VenueCard, VenueSearchFilter, VenuesMap | Một bộ lọc, hai góc nhìn, tiêu chí xóa được | ADAPT |
| S03 | Venue detail | Ảnh, thông tin quyết định, giá theo giờ, đường vào lịch | ADAPT |
| S04 | Court booking grid | Ngày, sân/giờ, chú giải, tổng đang chọn | ADAPT |
| S05 | Login, Register | Trường quen thuộc và quay lại nhiệm vụ | ADAPT |
| S06 | Checkout | Bắt buộc so với tùy chọn, chi tiết tổng | ADAPT |
| S07/S08 | Payment result | Hạn, mã đơn, hai trạng thái, QR và phục hồi | ADAPT |
| S09 | Bookings | Ngày chơi và hành động theo trạng thái | ADAPT |
| S10/S11 | GroupPaymentCreate, Groups | Thay QR, phần tôi/toàn nhóm, vé khác QR trả tiền | ADAPT |
| S12/S13 | Offers, Account, Notifications | Điểm vào phụ, không hứa chức năng mẫu là thật | ADAPT |

Đường dẫn nguồn tương ứng ở mục 2. Nếu bổ sung Mobbin sau, mỗi tham chiếu phải có URL chính xác, ảnh đã xem, quan sát và lý do áp dụng. Theo chỉ đạo mới, nghiên cứu đó không là điều kiện chặn prototype.

## 10. Quyết định cho prototype

- Giữ khám phá không cần tài khoản; không thêm onboarding. Xác thực khi tạo đơn/nhận phần nhóm.
- Chọn lịch riêng, checkout một màn hình. HLV/voucher là tùy chọn, mặc định không chọn HLV.
- Tóm tắt luôn có cơ sở, sân, ngày, giờ đầu/cuối, thời lượng, tiền; sau tạo đơn thêm mã và hai trạng thái.
- Dùng nhãn **Tạo đơn và tiếp tục thanh toán**. Chỉ dùng xác nhận lịch/thanh toán thành công khi có kết quả tương ứng.
- Hiện hạn thực, tối đa 5 phút theo hiện trạng; không sao chép lời hứa 10 phút. Không thêm VNPAY thành phương thức chưa có trong luồng.
- Không hướng dẫn trả vào mã hết hạn. Khi chưa rõ tiền, kiểm tra cùng đơn trước khi trả thêm.
- Giữ tiền mặt chờ duyệt và chia nhóm theo quyền; đã duyệt khác đã thu tiền.
- Hủy cá nhân là liên hệ cơ sở. Hủy nhóm có xác nhận và kết quả thực; hoàn tiền riêng.
- Không tạo yêu thích đồng bộ, thông báo thật, chat hỗ trợ hoặc chức năng hồ sơ mới. Điều khiển chưa có hành vi không làm nút chính giả.
- Dữ liệu mẫu/ảnh minh họa phải được nhận diện trong prototype, không dùng làm bằng chứng lịch hay đánh giá thật.

### Tình huống nghiệm thu thiết kế

Đây là tiêu chí cho bước prototype sau này, chưa phải kết quả kiểm thử:

1. Tìm cơ sở, đổi danh sách/bản đồ và quay lại vẫn biết tiêu chí đang lọc.
2. Chọn 60/90 phút liên tiếp, hiểu vì sao ô rời/khác sân không hợp lệ, đọc tổng trước checkout.
3. Xác thực rồi tiếp tục đơn nháp; nếu mất giờ thì thấy cách chọn lại.
4. Voucher sai/HLV tải lỗi không xóa thông tin người đặt.
5. Quay lại từ ngân hàng thấy chờ/xác nhận/lỗi đúng nghĩa, không bị thúc trả thêm khi chưa rõ.
6. Phân biệt tiền mặt chờ duyệt, lịch đã xác nhận và tiền chưa thu.
7. Trưởng nhóm hiểu thay QR; thành viên nhận ra phần mình; trả hộ không nhầm tổng đơn.
8. Hết hạn, không đến, hủy và chờ hoàn có nhãn riêng.
9. Màn hình hẹp và bàn phím vẫn thao tác được; tổng/nút không bị che.

## 11. Giả định và câu hỏi mở

### Đã xác nhận

[HT] Người dùng yêu cầu cải thiện độ hấp dẫn/dễ dùng, chỉ tạo PRODUCT.md, không triển khai, và cho phép bỏ Mobbin. Route, thuật ngữ và ràng buộc nêu trong mục 2 dựa trên mã nguồn. Mức tác động UX chưa được đo.

### Khuyến nghị có cơ sở nội bộ

[ĐX] Giữ ngữ cảnh xác thực, tách lịch/tiền, sửa thời hạn/phương thức và phân biệt lỗi với rỗng xuất phát từ hành vi/mâu thuẫn cụ thể trong nguồn. Không có khuyến nghị nào được xác thực bằng Mobbin hoặc người dùng thực.

### Giả định

- [GĐ] Người tự đặt và người tổ chức nhóm là hai đối tượng ưu tiên; chưa có số liệu tần suất.
- [GĐ] Cần cả điện thoại và desktop; chưa biết tỷ trọng thiết bị.
- [GĐ] Giữ SmashBook và màu nhận diện để tập trung vào UX.
- [GĐ] Giữ bản nháp trong hành trình hiện tại; không cam kết đồng bộ qua thiết bị hoặc nhiều ngày.
- [GĐ] Chỉ gán ảnh cho cơ sở khi nguồn hỗ trợ; ảnh minh họa được ghi rõ.

### Câu hỏi cần xác nhận

| Câu hỏi | Tạm xử lý trong prototype |
| --- | --- |
| Người chơi ưu tiên khu vực, giá hay giờ? | Giữ tìm khu vực, chọn giờ theo cơ sở; chưa thêm tìm giờ toàn hệ thống |
| Khoảng cách/lịch tối nay đủ tin cậy không? | Chỉ khẳng định khi có dữ liệu, nếu không mời xem lịch |
| Tiền mặt có khác theo cơ sở? | Chỉ hiện khi đơn cho phép |
| Hủy miễn phí được xử lý thế nào khi đã thu tiền? | Hiện chính sách được cung cấp và bước yêu cầu/liên hệ; không hứa hoàn tự động |
| Kênh liên hệ nào có dữ liệu thật? | Không bịa số điện thoại/chat; đánh dấu dữ liệu hỗ trợ còn thiếu |
| 5 phút có đủ cho nhóm đông? | Giữ hiện trạng, kiểm thử riêng; không tự tăng thời hạn |
| Nhận phần nhóm tự động hay chủ động? | Prototype dùng xem trước và xác nhận, ghi nhận là thay đổi đề xuất |
| Bảng mobile có cần thay bằng chọn sân rồi chọn giờ? | Prototype đầu giữ bảng có ngữ cảnh; đổi sau khi có kiểm thử |
| Yêu thích/thông báo/email cục bộ sẽ hoàn thiện thế nào? | Giữ điểm nối, không mô phỏng dữ liệu bền vững hoặc thông báo thật |

## 12. Ngoài phạm vi

Không tạo DESIGN.md; không viết code, CSS hoặc token; không đánh giá kiến trúc sản xuất, thay schema/API hay chính sách tiền; không dùng Impeccable. Không thiết kế lại dashboard quản trị/chủ sân/HLV/đối tác. Không thêm đặt định kỳ, nhiều sân trong đơn, mạng xã hội, điểm thưởng, chat, cổng thanh toán mới hoặc yêu thích đồng bộ.

Tài liệu cho phép dựng prototype với các nhánh/trạng thái và giả định công khai. Nó không thay thế kiểm thử giao diện chạy thật, nghiên cứu người dùng hoặc xác nhận chính sách đang mở.
