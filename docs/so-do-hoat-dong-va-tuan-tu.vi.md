# Bộ sơ đồ Hoạt động (Activity) và Tuần tự (Sequence) — SmashBook

Vẽ lại ngày 2026-11-26 theo mã nguồn tại commit `0cb5839` và đồ thị Graphify chạy lại cùng ngày (`graphify-out/GRAPH_REPORT.md`: 2280 node, 5357 cạnh, 143 cộng đồng). Bộ này thay cho các sơ đồ cũ ở `badminton-booking-spec.md` §5.5–5.6 (VNPAY, Redis, giữ chỗ 10 phút) và `docs/group-payment-flow.vi.md` §6 (bản đề xuất trước khi triển khai).

Khác biệt chính so với bản cũ, đều lấy từ mã:

- Thanh toán online là chuyển khoản VietQR, xác nhận qua webhook SePay (`/api/payment/webhook`). Không còn VNPAY/IPN.
- Giữ chỗ là `HOLD_TTL_SECONDS = 300` (5 phút), không vượt quá giờ bắt đầu chơi. Chống trùng lịch bằng transaction `serializable` trên PostgreSQL, không dùng khóa Redis.
- Có ba cách trả: chuyển khoản cả đơn, tiền mặt tại sân (nhân viên duyệt giữ sân rồi thu tiền), hoặc chia tiền nhóm (mỗi phần một mã `GP…`).
- Hủy đơn đã thu tiền phải qua bước chủ sân/Admin duyệt. Tiền hoàn được ghi theo từng khoản thu gốc và chỉ đóng khi có chứng từ chi.

| Mã | Tên trong bộ tài liệu | Nội dung | Mã nguồn chính |
| --- | --- | --- | --- |
| HĐ-01 | MainActivityDiagram / Activity luồng chính | Đặt sân online từ chọn giờ đến hoàn tất | `reservation.service.ts`, `sepay.service.ts`, `payment/result/page.tsx` |
| HĐ-02 | ActivityDiagram1.2 | Chia tiền nhóm, QR từng phần, tiền mặt, vé cá nhân | `group-payment.service.ts`, `lib/group-payment.ts` |
| HĐ-03 | Activity hủy | Hủy đơn, duyệt hoàn, ghi chứng từ chi | `venue-session.service.ts`, `refund.service.ts`, `cancellation-policy.ts` |
| HĐ-04 | Activity vận hành sân | Ca trực, đặt tại quầy, check-in, thu tiền mặt, hoàn tất | `venue-operations/route.ts`, `venue-session.service.ts`, `admin.service.ts` |
| TT-01 | Sequence1 | Tạo đơn và thanh toán chuyển khoản SePay | `api/bookings`, `api/payment/webhook` |
| TT-02 | Sequence2 | Hủy và hoàn tiền | `api/bookings/[code]/cancel`, `api/venue-operations`, `api/admin/cancellations` |
| TT-03 | Sequence3 | Vận hành tại sân và tác vụ cron | `api/venue-operations`, `api/cron/venue-sessions` |
| TT-04 | Sequence nhóm | Thanh toán nhóm từ lập nhóm đến quét vé | `api/groups`, `api/groups/[token]`, `api/payment/webhook` |

Quy ước: sơ đồ hoạt động dùng `flowchart` của Mermaid, mỗi `subgraph` là một làn (swimlane). Hình thoi là điểm rẽ nhánh. Mã lỗi HTTP ghi kèm khi máy chủ từ chối.

---

## HĐ-01. Luồng chính đặt sân online (MainActivityDiagram)

```mermaid
flowchart TB
  subgraph L1["Khách hàng"]
    A0(["Bắt đầu"])
    A1["Tìm cơ sở, chọn ngày, sân con và các ô giờ liền kề<br/>(tùy chọn: HLV, mã ưu đãi)"]
    A2{"Đã đăng nhập?"}
    A3["Đăng nhập / đăng ký"]
    A4["Nhập tên, số điện thoại và gửi đặt sân"]
    A5{"Chọn cách thanh toán"}
    A6["Quét VietQR và chuyển đúng số tiền,<br/>nội dung là mã đơn DATSAN…"]
    A7["Chọn trả tiền mặt tại sân"]
    A8["Chia tiền với nhóm (xem HĐ-02)"]
    A9["Đến sân đúng giờ"]
    A10["Chơi trong khung giờ đã đặt"]
    A11["Đánh giá sân (tùy chọn)"]
    AZ(["Kết thúc"])
  end
  subgraph L2["Hệ thống (Web + API)"]
    S1{"Dữ liệu hợp lệ?<br/>ngày trong hạn đặt trước, ô giờ liền kề,<br/>thời lượng tối thiểu–tối đa, giá tính lại ở máy chủ"}
    S2{"requestId đã dùng?"}
    S3{"Ô giờ bị khóa hoặc đã có người giữ/đặt?"}
    S4{"Khách đang có ≥ 3 đơn chờ thanh toán?"}
    S5{"HLV rảnh và mã ưu đãi hợp lệ?"}
    S6["Tạo Booking PENDING_PAYMENT, BookingItem HELD<br/>giữ chỗ 5 phút, không quá giờ chơi"]
    S7["Trang /payment/result: VietQR + đếm ngược<br/>tải lại trạng thái mỗi 3 giây"]
    S8{"Webhook SePay khớp tài khoản, mã đơn,<br/>số tiền và còn hạn giữ chỗ?"}
    S9["Booking CONFIRMED + PAID<br/>ghi Payment, tiêu thụ ưu đãi"]
    S10["Ghi SepayReceipt REVIEW_… để đối soát thủ công"]
    S11["Ghi paymentMethod = CASH"]
    S12{"Hết 5 phút mà chưa thanh toán<br/>hoặc chưa được duyệt?"}
    S13["Cron: Booking EXPIRED, nhả sân, HLV và ưu đãi"]
    S14{"Đủ tiền, toàn bộ online,<br/>không có ca trực, không cần bàn giao?"}
    S15["Tự động COMPLETED sau giờ kết thúc 1 phút"]
    S16["Báo lỗi 400 / 409 / 429, giữ lựa chọn để chọn lại"]
    S17["Trả lại đơn đã tạo (idempotent)"]
  end
  subgraph L3["Nhân viên / Chủ sân"]
    N1["Duyệt giữ sân: CONFIRM<br/>Booking CONFIRMED, tiền chưa thu"]
    N2["Check-in: CHECK_IN"]
    N3["Thu tiền mặt phần còn thiếu: CASH_PAID"]
    N4["Bàn giao sân: COMPLETE"]
  end

  A0 --> A1 --> A2
  A2 -- "Chưa" --> A3 --> A4
  A2 -- "Rồi" --> A4
  A4 --> S2
  S2 -- "Có" --> S17 --> S7
  S2 -- "Không" --> S1
  S1 -- "Không" --> S16
  S1 -- "Có" --> S3
  S3 -- "Có" --> S16
  S3 -- "Không" --> S4
  S4 -- "Có" --> S16
  S4 -- "Không" --> S5
  S5 -- "Không" --> S16
  S5 -- "Có" --> S6 --> S7
  S16 --> A1
  S7 --> A5
  A5 -- "Chuyển khoản" --> A6 --> S8
  A5 -- "Tiền mặt" --> A7 --> S11 --> N1
  A5 -- "Nhóm" --> A8
  S8 -- "Khớp" --> S9 --> A9
  S8 -- "Không khớp" --> S10 --> S12
  S11 --> S12
  S12 -- "Có" --> S13 --> AZ
  N1 --> A9
  A9 --> N2 --> A10
  N2 -.-> N3
  A10 --> S14
  S14 -- "Có" --> S15 --> A11
  S14 -- "Không" --> N4 --> A11
  A11 --> AZ
```

Ghi chú:

- Chuyển khoản sai số tiền, sai nội dung, đến sau khi hết hạn hoặc trùng giao dịch đều không xác nhận đơn. Giao dịch được lưu ở `SepayReceipt` với kết quả `REVIEW_…` (`DUPLICATE` nếu SePay gửi lại).
- Đơn tiền mặt chỉ được check-in khi đã `CONFIRMED`. Muốn `COMPLETE` thì phải thu đủ tiền (`CASH_PAID`).
- Đơn đã `CONFIRMED` nhưng chưa trả vẫn có thể chuyển khoản online trước giờ chơi đầu tiên (`canPayBooking`).

---

## HĐ-02. Thanh toán chia tiền nhóm (ActivityDiagram1.2)

```mermaid
flowchart TB
  subgraph G1["Trưởng nhóm"]
    T0(["Bắt đầu: đơn đang giữ chỗ"])
    T1["Chọn Chia tiền với nhóm<br/>nhập số người hoặc số tiền từng phần"]
    T2["Sao chép liên kết / QR mời /groups/…"]
    T3{"Còn phần chưa trả?"}
    T4["Trả thay các phần còn thiếu: COVER<br/>một QR bằng tổng các phần đó"]
    T5["Xin trả phần còn lại tại sân: REQUEST_CASH_ALL"]
  end
  subgraph G2["Thành viên"]
    M1["Đăng nhập, mở liên kết, nhận một vị trí trống: JOIN"]
    M2{"Chọn cách trả phần của mình"}
    M3["Quét VietQR của phần mình<br/>nội dung là mã GP… riêng"]
    M4["Chọn tiền mặt: METHOD CASH"]
    M5["Mở vé cá nhân khi đến sân"]
  end
  subgraph G3["Hệ thống"]
    H1{"Đơn PENDING_PAYMENT, còn hạn<br/>và chưa có khoản thu?"}
    H2["Chia đều theo số nguyên VND (dư 1đ chia lần lượt)<br/>hoặc kiểm tra tổng các phần = tổng đơn"]
    H3["Tạo BookingGroup + GroupShare<br/>ẩn QR tổng đơn"]
    H4["Tạo GroupPaymentIntent OPEN<br/>mã GP…, số tiền cố định, lưu tài khoản nhận"]
    H5{"Webhook SePay: đúng tài khoản, intent OPEN,<br/>đúng số tiền, các phần chưa được trả?"}
    H6["Ghi Payment, gán vào từng phần, intent PAID"]
    H7["Ghi SepayReceipt REVIEW_… để đối soát"]
    H8["Đánh dấu cashRequested<br/>gửi thông báo cho chủ sân và nhân viên"]
    H9["Đồng bộ đơn (sync)"]
    H10{"Đã thu đủ tổng đơn?"}
    H11["Booking PAID + CONFIRMED, đóng các intent<br/>tiêu thụ ưu đãi, kích hoạt vé cá nhân"]
    H12{"Mọi phần thiếu đều được duyệt trả tại sân?"}
    H13["Booking CONFIRMED, PARTIALLY_PAID<br/>vé chưa dùng được"]
    H14{"Còn hạn giữ chỗ?"}
    H15["Đóng nhóm, nhả sân (EXPIRED), khóa mọi intent<br/>lập GroupRefund cho khoản đã thu"]
    H16{"Vé hợp lệ, chưa dùng, đơn PAID và<br/>trong khung từ 15 phút trước giờ chơi đến hết giờ?"}
    H17["Ghi checkedInAt cho phần đó, Booking CHECKED_IN"]
    H18["Từ chối 409, giữ nguyên đơn"]
  end
  subgraph G4["Nhân viên / Chủ sân"]
    V1["Duyệt trả tại sân cho các phần: APPROVE_CASH"]
    V2["Thu tiền và chọn các phần đã thu: COLLECT_CASH"]
    V3["Quét vé cá nhân: CHECK_IN_TICKET"]
  end
  GZ(["Kết thúc"])

  T0 --> T1 --> H1
  H1 -- "Không" --> H18
  H1 -- "Có" --> H2 --> H3 --> T2 --> M1 --> M2
  M2 -- "Online" --> H4 --> M3 --> H5
  H5 -- "Khớp" --> H6 --> H9
  H5 -- "Không khớp" --> H7
  M2 -- "Tiền mặt" --> M4 --> H8 --> V1 --> H9
  V2 --> H9
  H9 --> H10
  H10 -- "Có" --> H11 --> M5 --> V3 --> H16
  H10 -- "Chưa" --> H12
  H12 -- "Có" --> H13 --> V2
  H12 -- "Chưa" --> H14
  H14 -- "Có" --> T3
  T3 -- "Trả thay" --> T4 --> H4
  T3 -- "Trả tại sân" --> T5 --> H8
  T3 -- "Chờ thành viên" --> M2
  H14 -- "Hết hạn" --> H15 --> GZ
  H16 -- "Có" --> H17 --> GZ
  H16 -- "Không" --> H18
```

Ghi chú:

- Mỗi yêu cầu chuyển khoản dùng mã `GP` + 24 ký tự hex riêng, nên hai người trả cùng số tiền vẫn được ghi đúng phần. Nội dung chứa cả `GP…` lẫn `DATSAN…` sẽ bị đưa vào đối soát, không tự xác nhận.
- Trưởng nhóm bấm trả thay nhiều lần với cùng các phần thì dùng lại intent đang mở. Hệ thống không đổi QR mà người khác có thể đang quét.
- Hạn giữ chỗ được kiểm tra ở máy chủ, không theo đồng hồ trình duyệt. Nếu trang nhóm được mở hoặc webhook đến sau hạn, `expire()` đóng nhóm và lập `GroupRefund` cho khoản đã thu. Cron `cleanupExpiredBookings` chỉ chuyển đơn sang `EXPIRED` và nhả sân, chưa đóng nhóm hay lập khoản hoàn. Nếu cron chạy trước, khoản đã thu của nhóm phải đối soát thủ công.
- Hủy đơn nhóm (`closeGroup`) dùng ngưỡng riêng: trên 24 giờ hoàn 100%, 12–24 giờ 50%, dưới 12 giờ 0%. Đơn còn đang giữ chỗ được hoàn 100%. Ngưỡng này khác chính sách đơn lẻ ở HĐ-03 (mốc 6 giờ).

---

## HĐ-03. Hủy đơn và hoàn tiền (Activity hủy)

```mermaid
flowchart TB
  subgraph C1["Khách hàng"]
    K0(["Bắt đầu: mở chi tiết đơn"])
    K1["Bấm Hủy đơn"]
    K2["Đọc tỷ lệ hoàn, số tiền dự kiến,<br/>nhập lý do (≥ 5 ký tự) và xác nhận"]
    K3["Nhận thông báo: đã hủy, chờ duyệt hoàn trong 24 giờ"]
  end
  subgraph C2["Hệ thống"]
    Y1["Xem trước chính sách theo giờ máy chủ (UTC+7)<br/>≥ 24 giờ: 100% · 6–24 giờ: 50% · dưới 6 giờ: 0%<br/>tính trên tiền thực thu còn được hoàn"]
    Y2{"Đơn PENDING_PAYMENT / CONFIRMED<br/>và chưa tới giờ chơi?"}
    Y3["Từ chối 409"]
    Y4{"Đã có tiền thực thu?"}
    Y5["Hủy ngay: Booking CANCELLED, nhả sân,<br/>HLV, ưu đãi, nhóm, ghi AdminAudit"]
    Y6["Booking CANCELLED + cancelRequestedAt<br/>chốt tỷ lệ và số tiền hoàn, nhả sân ngay"]
    Y7["Thông báo chủ sân và nhân viên"]
    Y8{"Số tiền duyệt ≤ tiền thực thu còn lại?"}
    Y9["reserveRefund: chia khoản hoàn theo từng Payment gốc<br/>GroupRefund PENDING, Booking REFUND_PENDING"]
    Y10{"Mã chứng từ đã dùng?"}
    Y11["Ghi RefundDisbursement, cập nhật GroupRefund và Payment"]
    Y12{"Còn khoản chờ hoàn?"}
    Y13["Booking REFUNDED, ghi refundCompletedAt"]
    Y14["Cùng khoản, cùng số tiền: bỏ qua (idempotent)<br/>khác: từ chối 409"]
  end
  subgraph C3["Chủ sân / Quản trị"]
    Q1{"Duyệt theo chính sách<br/>hay ngoại lệ?"}
    Q2["Duyệt đúng mức đã chốt"]
    Q3["Ngoại lệ: chỉ ADMIN, bắt buộc lý do"]
  end
  subgraph C4["Nhân viên / Chủ sân"]
    E1["Chuyển khoản hoàn cho người đã trả<br/>(ngoài hệ thống)"]
    E2["Ghi mã giao dịch chi / số phiếu chi: RECORD_REFUND"]
  end
  KZ(["Kết thúc"])

  K0 --> K1 --> Y1 --> K2 --> Y2
  Y2 -- "Không" --> Y3 --> KZ
  Y2 -- "Có" --> Y4
  Y4 -- "Chưa" --> Y5 --> KZ
  Y4 -- "Có" --> Y6 --> Y7 --> K3
  Y7 --> Q1
  Q1 -- "Chính sách" --> Q2 --> Y8
  Q1 -- "Ngoại lệ" --> Q3 --> Y8
  Y8 -- "Không" --> Y3
  Y8 -- "Có" --> Y9 --> E1 --> E2 --> Y10
  Y10 -- "Có" --> Y14 --> Y12
  Y10 -- "Chưa" --> Y11 --> Y12
  Y12 -- "Còn" --> E1
  Y12 -- "Hết" --> Y13 --> KZ
```

Ghi chú:

- Nhân viên có thể gửi yêu cầu hủy thay khách (`CANCEL_REQUEST`) và đi tiếp nhánh chờ duyệt như trên. Chủ sân hoặc Admin tự hủy thì được duyệt luôn trong cùng transaction.
- Khách gửi lại yêu cầu khi đơn đang chờ duyệt thì hệ thống trả lại tỷ lệ và số tiền đã chốt, không tính lại.
- Duyệt hoàn 0đ (hủy dưới 6 giờ) không tạo khoản hoàn. Trạng thái tiền giữ nguyên.

---

## HĐ-04. Vận hành tại sân (Activity vận hành sân)

```mermaid
flowchart TB
  subgraph O1["Nhân viên / Chủ sân"]
    O0(["Bắt đầu ca"])
    O1a["Mở ca trực: START_SHIFT"]
    O2["Tạo đơn tại quầy: COUNTER_BOOKING"]
    O3["Duyệt giữ sân cho đơn tiền mặt: CONFIRM"]
    O4["Check-in khách: CHECK_IN"]
    O5["Thu tiền mặt phần còn thiếu: CASH_PAID"]
    O6["Bàn giao, hoàn tất: COMPLETE"]
    O7["Đóng ca: END_SHIFT"]
    OZ(["Kết thúc ca"])
  end
  subgraph O2L["Hệ thống"]
    P0["Ghi StaffShift<br/>thao tác trên đơn của nhân viên cần ca đang mở"]
    P1{"requestId đã dùng?"}
    P2["Cùng dữ liệu: trả lại đơn cũ<br/>khác dữ liệu: từ chối 409"]
    P3{"Ngày, giờ, sân con hợp lệ<br/>và không trùng lịch?"}
    P4["Booking CONFIRMED, userId trống<br/>UNPAID (tiền mặt) / PENDING (chuyển khoản)"]
    P5{"Đơn còn hạn giữ chỗ?"}
    P6["Booking CONFIRMED, Item / HLV CONFIRMED"]
    P7{"Đơn CONFIRMED và đã trả<br/>hoặc trả tại sân?"}
    P8["Booking CHECKED_IN"]
    P9{"Số tiền trên hộp thoại<br/>= số còn thiếu hiện tại?"}
    P10["Ghi Payment CASH, Booking PAID<br/>đánh dấu bắt buộc bàn giao thủ công"]
    P11["Cron: hết giờ thì OVERDUE_PENDING<br/>và báo nhân viên trực (chống gửi lặp)"]
    P12{"Đủ tiền, toàn bộ online, không có ca trực,<br/>không cần bàn giao?"}
    P13["Tự động COMPLETED sau giờ kết thúc 1 phút"]
    P14{"Đã hết giờ và đã thu đủ?"}
    P15["Booking COMPLETED, HLV COMPLETED"]
    PX(["Từ chối 409, đơn giữ nguyên"])
  end
  subgraph O3L["Khách hàng"]
    K1["Đến quầy"]
    K2{"Đã có đơn?"}
    K3{"Còn tiền phải trả?"}
    K4["Chơi trong khung giờ"]
  end

  O0 --> O1a --> P0 --> K1 --> K2
  K2 -- "Chưa, khách vãng lai" --> O2 --> P1
  P1 -- "Có" --> P2 --> O4
  P1 -- "Không" --> P3
  P3 -- "Không, chọn giờ khác" --> O2
  P3 -- "Có" --> P4 --> O4
  K2 -- "Có, đơn tiền mặt đang giữ chỗ" --> O3 --> P5
  P5 -- "Hết hạn, đặt lại tại quầy" --> O2
  P5 -- "Còn" --> P6 --> O4
  K2 -- "Có, đã xác nhận" --> O4
  O4 --> P7
  P7 -- "Không (đơn nhóm dùng vé cá nhân, HĐ-02)" --> PX
  P7 -- "Có" --> P8 --> K3
  K3 -- "Có" --> O5 --> P9
  P9 -- "Đã đổi, tải lại" --> O5
  P9 -- "Khớp" --> P10 --> K4
  K3 -- "Không" --> K4
  K4 --> P11 --> P12
  P12 -- "Có" --> P13 --> O7
  P12 -- "Không" --> O6 --> P14
  P14 -- "Có" --> P15 --> O7
  P14 -- "Không" --> PX
  O7 --> OZ
```

Ghi chú:

- Nhân viên phải có ca trực đang mở mới được thao tác trên đơn. Chủ sân và Admin không cần ca trực.
- Đơn tại quầy được tạo thẳng ở `CONFIRMED`, không có hạn giữ chỗ. Gửi lại cùng `requestId` mà khác dữ liệu sẽ bị từ chối để không ghi đè đơn khác.
- Cron tự hoàn tất đơn khi đủ bốn điều kiện: đã thanh toán đủ, không có tiền mặt, không có nhân viên đang trực, không bị đánh dấu bàn giao thủ công. Các trường hợp còn lại do nhân viên bàn giao.

---

## TT-01. Tạo đơn và thanh toán chuyển khoản SePay (Sequence1)

```mermaid
sequenceDiagram
  autonumber
  actor KH as Khách hàng
  participant WEB as Web Next.js
  participant API as API /api/bookings
  participant RS as reservation.service
  participant DB as PostgreSQL
  participant NH as Ứng dụng ngân hàng
  participant SP as SePay
  participant WH as API /api/payment/webhook
  participant SS as sepay.service

  KH->>WEB: Chọn sân con, ô giờ, HLV, mã ưu đãi và bấm Đặt sân
  WEB->>API: POST /api/bookings (requestId, venueId, date, slots, thông tin liên hệ)
  API->>API: assertSameOrigin, requirePaymentUser, tài khoản ACTIVE và không phải STAFF
  API->>API: Zod bookingRequestSchema
  API->>RS: createReservation(userId, input)
  RS->>DB: BEGIN SERIALIZABLE
  RS->>DB: Tìm Booking theo requestId
  alt requestId đã tồn tại
    DB-->>RS: Đơn cũ
    RS-->>API: Trả lại đơn cũ (idempotent)
  else Yêu cầu mới
    RS->>DB: Đọc Venue, Court, PricingRule
    RS->>RS: priceBooking: hạn đặt trước, ô liền kề, thời lượng, giá
    RS->>DB: Kiểm tra CourtBlock và BookingItem chồng giờ
    RS->>DB: Đếm đơn PENDING_PAYMENT còn hạn của khách
    opt Có HLV hoặc mã ưu đãi
      RS->>DB: Kiểm tra lịch rảnh HLV, hạn mức và phạm vi ưu đãi
    end
    alt Trùng lịch, quá 3 đơn chờ hoặc HLV/ưu đãi không hợp lệ
      RS-->>API: PaymentError 409 / 429 / 400
      API-->>WEB: Lỗi kèm thông báo
      WEB-->>KH: Giữ lựa chọn, yêu cầu chọn lại
    else Hợp lệ
      RS->>DB: INSERT Booking PENDING_PAYMENT, expiresAt = min(now + 5 phút, giờ chơi)
      RS->>DB: INSERT BookingItem HELD, PriceLine, CoachBooking HELD, OfferUsage RESERVED
      RS->>DB: COMMIT
      RS-->>API: Booking (mã DATSAN…)
      API-->>WEB: 201 booking
    end
  end
  WEB->>WEB: Chuyển tới /payment/result?booking=mã đơn

  loop Mỗi 3 giây đến khi xong hoặc hết hạn
    WEB->>API: GET /api/bookings/mã đơn
    API->>DB: Đọc Booking của chính khách
    API-->>WEB: Trạng thái, hạn giữ chỗ, VietQR nếu còn được trả
  end

  opt Khách chọn trả tiền mặt
    WEB->>API: PATCH /api/bookings/mã đơn (method CASH)
    API->>DB: choosePaymentMethod: paymentMethod = CASH
    API-->>WEB: Chờ nhân viên duyệt giữ sân (xem TT-03)
  end

  KH->>NH: Quét VietQR, chuyển đúng số tiền với nội dung mã đơn
  NH->>SP: Biến động số dư
  SP->>WH: POST webhook (payload và chữ ký HMAC)
  WH->>WH: verifySepaySignature
  alt Sai chữ ký
    WH-->>SP: 401
  else Chữ ký đúng
    WH->>SS: receiveSepayPayment(event)
    SS->>DB: BEGIN SERIALIZABLE
    SS->>DB: Tìm SepayReceipt theo transactionId
    alt Đã nhận giao dịch này
      SS-->>WH: DUPLICATE (dữ liệu khác thì 409)
    else Giao dịch mới
      SS->>SS: Kiểm tra tiền vào, tài khoản, mã đơn, trạng thái, hạn và số tiền
      alt Tất cả khớp
        SS->>DB: UPDATE có điều kiện Booking CONFIRMED + PAID
        SS->>DB: BookingItem và CoachBooking CONFIRMED, tiêu thụ ưu đãi
        SS->>DB: INSERT Payment BANK_TRANSFER PAID
      else Một điều kiện sai
        SS->>SS: result = REVIEW_… (chờ đối soát)
      end
      SS->>DB: INSERT SepayReceipt(result) rồi COMMIT
      SS-->>WH: result
    end
    WH-->>SP: 200 (success, result)
  end
  WEB->>API: GET /api/bookings/mã đơn (lượt kế tiếp)
  API-->>WEB: CONFIRMED, PAID
  WEB-->>KH: Đặt sân thành công
```

---

## TT-02. Hủy đơn và hoàn tiền (Sequence2)

```mermaid
sequenceDiagram
  autonumber
  actor KH as Khách hàng
  participant WEB as Web Next.js
  participant API as API /api/bookings/mã/…
  participant VS as venue-session.service
  participant RF as refund.service
  participant DB as PostgreSQL
  actor CS as Chủ sân / Admin
  participant AC as API venue-operations hoặc admin/cancellations
  actor NV as Nhân viên / Chủ sân

  KH->>WEB: Bấm Hủy đơn
  WEB->>API: GET cancellation-preview
  API->>DB: Đọc Booking, các ô giờ và sổ thu (refundLedger)
  API-->>WEB: Tỷ lệ hoàn 100 / 50 / 0 %, số tiền dự kiến, khoản không hoàn
  KH->>WEB: Nhập lý do và xác nhận
  WEB->>API: POST cancel (reason)
  API->>DB: Kiểm tra đơn thuộc khách
  API->>VS: requestBookingCancellation(actor, bookingId, reason)
  VS->>DB: BEGIN SERIALIZABLE
  alt Đơn đang chờ duyệt hủy
    VS-->>API: Trả lại tỷ lệ và số tiền đã chốt
  else Đã kết thúc, đang dùng hoặc đã qua giờ chơi
    VS-->>API: 409
  else Chưa có tiền thực thu
    VS->>RF: releaseCancelledResources: Item, HLV, ưu đãi, nhóm
    VS->>DB: Booking CANCELLED, ghi AdminAudit, COMMIT
    VS-->>API: Hủy xong, không cần duyệt
  else Đã có tiền thực thu
    VS->>VS: evaluateCancellationPolicy theo giờ máy chủ
    VS->>DB: Booking CANCELLED, cancelRequestedAt, chốt tỷ lệ và số tiền, nhả sân
    VS->>DB: Ghi AdminAudit và Notification cho chủ sân, nhân viên
    VS->>DB: COMMIT
    VS-->>API: requiresApproval = true
  end
  API-->>WEB: Kết quả và thông báo
  WEB-->>KH: Đã hủy, chờ duyệt hoàn nếu có

  CS->>AC: Chủ sân: POST /api/venue-operations APPROVE_CANCEL. Admin: POST /api/admin/cancellations approve
  AC->>VS: approveBookingCancellation
  VS->>DB: BEGIN SERIALIZABLE
  VS->>VS: Chỉ OWNER của cơ sở hoặc ADMIN, chưa duyệt trước đó
  VS->>VS: Số tiền = mức đã chốt. Ngoại lệ chỉ ADMIN và phải có lý do
  alt Vượt tiền thực thu còn lại
    VS-->>AC: 409
  else Hợp lệ
    VS->>RF: approveCancellationInTransaction
    RF->>DB: reserveRefund: chia GroupRefund theo từng Payment gốc
    RF->>DB: Booking cancelApprovedAt, REFUND_PENDING
    VS->>DB: Ghi AdminAudit, COMMIT
    VS-->>AC: refundAmountApproved
  end
  AC-->>CS: Kết quả duyệt

  NV->>NV: Chuyển khoản hoàn cho người đã trả (ngoài hệ thống)
  NV->>AC: POST RECORD_REFUND (refundId, amount, reference). Admin dùng action refund
  AC->>VS: recordManualRefund
  VS->>RF: completeRefund
  RF->>DB: Tìm RefundDisbursement theo reference
  alt Chứng từ đã dùng cho đúng khoản và số tiền
    RF-->>VS: duplicate (không ghi thêm)
  else Chứng từ đã dùng cho khoản khác hoặc vượt số còn lại
    RF-->>VS: 409
  else Hợp lệ
    RF->>DB: INSERT RefundDisbursement
    RF->>DB: Cập nhật GroupRefund (COMPLETED khi đủ), Payment REFUNDED
    RF->>DB: Booking REFUNDED khi không còn khoản chờ
  end
  VS-->>AC: Số còn phải hoàn, paymentStatus
  AC-->>NV: Kết quả ghi chứng từ
```

---

## TT-03. Vận hành tại sân và tác vụ định kỳ (Sequence3)

```mermaid
sequenceDiagram
  autonumber
  actor NV as Nhân viên / Chủ sân
  participant WEB as Trang vận hành sân
  participant API as API /api/venue-operations
  participant VS as venue-session.service
  participant AS as admin.service
  participant DB as PostgreSQL
  participant CR as Cron
  participant CA as API /api/cron/venue-sessions
  actor KH as Khách hàng

  NV->>API: POST START_SHIFT (venueId)
  API->>VS: startStaffShift
  VS->>DB: INSERT StaffShift
  NV->>API: GET trạng thái sân
  API->>VS: getVenueCourtsLiveStatus
  VS-->>WEB: Đơn theo sân, trạng thái phiên, số tiền còn thiếu

  opt Đơn tiền mặt đang giữ chỗ
    NV->>API: POST CONFIRM (id)
    API->>AS: performAdminAction
    AS->>AS: checkBookingAction: còn hạn giữ và (đã trả hoặc trả tại sân)
    AS->>DB: Booking CONFIRMED, Item và HLV CONFIRMED, ghi AdminAudit
  end

  KH->>NV: Đến sân, đọc mã đơn
  NV->>API: POST CHECK_IN (id)
  API->>AS: performAdminAction
  alt Đơn nhóm
    AS-->>API: 409, dùng vé cá nhân (TT-04)
  else Đơn CONFIRMED, đã trả hoặc trả tại sân
    AS->>DB: Booking CHECKED_IN, checkedInById, ghi AdminAudit
  end

  opt Còn tiền mặt phải thu
    NV->>API: POST CASH_PAID (id, expectedAmount)
    API->>VS: confirmCashPayment
    VS->>DB: BEGIN SERIALIZABLE
    VS->>VS: Nhân viên có ca trực mở, đơn CONFIRMED / CHECKED_IN
    alt expectedAmount khác số còn thiếu
      VS-->>API: 409, yêu cầu tải lại
    else Khớp
      VS->>DB: INSERT Payment CASH PAID, tiêu thụ ưu đãi
      VS->>DB: Booking PAID, hasCashPayment, manualHandoverRequired
      VS->>DB: Ghi AdminAudit, COMMIT
    end
  end

  CR->>CA: GET (Authorization Bearer CRON_SECRET)
  par Phiên đang chơi
    CA->>VS: processOverdueAndCompletions
    VS->>DB: Hết giờ thì sessionStatus OVERDUE_PENDING
    VS->>DB: Notification cho nhân viên đang trực (chống gửi lặp)
    VS->>DB: Đủ điều kiện tự hoàn tất thì Booking COMPLETED
  and Đơn hết hạn giữ chỗ
    CA->>DB: cleanupExpiredBookings
    DB-->>CA: Booking EXPIRED, Item EXPIRED, HLV CANCELLED, ưu đãi RELEASED
  end

  NV->>API: POST COMPLETE (id)
  API->>VS: completeBookingSession
  alt Chưa hết giờ hoặc chưa thu đủ
    VS-->>API: 409
  else Đủ điều kiện
    VS->>DB: Booking COMPLETED, HLV COMPLETED
  end
  NV->>API: POST END_SHIFT
  API->>VS: endStaffShift
```

---

## TT-04. Thanh toán nhóm (Sequence nhóm)

```mermaid
sequenceDiagram
  autonumber
  actor TN as Trưởng nhóm
  actor TV as Thành viên
  participant WEB as Web Next.js
  participant API as API /api/groups
  participant GS as group-payment.service
  participant DB as PostgreSQL
  participant SP as SePay
  participant WH as API /api/payment/webhook
  actor NV as Nhân viên / Chủ sân

  TN->>WEB: Chọn Chia tiền với nhóm
  WEB->>API: POST /api/groups (bookingCode, count, amounts)
  API->>GS: createGroup
  GS->>DB: BEGIN SERIALIZABLE, đọc Booking của trưởng nhóm
  alt Không còn giữ chỗ hoặc đã có khoản thu
    GS-->>API: 409
  else Hợp lệ
    GS->>GS: splitAmounts: tổng các phần bằng tổng đơn
    GS->>DB: INSERT BookingGroup và GroupShare (vị trí 1 là trưởng nhóm, ticketNonce)
    GS->>DB: COMMIT
    GS-->>WEB: inviteToken
  end
  TN-->>TV: Gửi liên kết hoặc QR mời /groups/token

  TV->>API: GET /api/groups/token
  API->>GS: getGroupView (đóng nhóm nếu đã quá hạn)
  GS-->>WEB: Các phần, tiền đã thu, thời gian còn lại
  TV->>API: POST JOIN (position)
  GS->>DB: Gán userId cho vị trí trống (đã có người thì 409)

  alt Thành viên trả online
    TV->>API: POST METHOD (BANK_TRANSFER)
    GS->>DB: INSERT GroupPaymentIntent OPEN (mã GP…, số tiền phần, tài khoản nhận)
    GS-->>WEB: VietQR của phần
    TV->>SP: Chuyển khoản qua ngân hàng
    SP->>WH: POST webhook có chữ ký
    WH->>GS: receiveSepayPayment phát hiện mã GP… và gọi settleGroupTransfer
    GS->>DB: Đọc intent, nhóm và các phần
    alt Đúng tài khoản, intent OPEN, đúng số tiền, phần chưa trả
      GS->>DB: INSERT Payment PAID, gán paymentId cho phần, intent PAID
      GS->>GS: sync(nhóm)
      GS-->>WH: GROUP_PAID
    else Sai một điều kiện
      GS-->>WH: REVIEW_… (chờ đối soát)
    end
    WH->>DB: INSERT SepayReceipt rồi COMMIT
    WH-->>SP: 200
  else Thành viên trả tiền mặt
    TV->>API: POST METHOD (CASH)
    GS->>DB: GroupShare cashRequested, Notification cho chủ sân và nhân viên
    NV->>API: POST APPROVE_CASH (shareIds)
    GS->>DB: cashApprovedAt, sync(nhóm)
    NV->>API: POST COLLECT_CASH (shareIds) khi nhận tiền
    GS->>DB: INSERT Payment CASH PAID, gán vào các phần, sync(nhóm)
  end

  opt Trưởng nhóm trả thay phần còn thiếu
    TN->>API: POST COVER (shareIds)
    GS->>DB: Dùng lại intent đang mở hoặc tạo intent mới bằng tổng các phần
    Note over TN,SP: Thanh toán tiếp theo nhánh online ở trên
  end

  Note over GS,DB: sync: đủ tiền thì PAID + CONFIRMED, đóng intent, tiêu thụ ưu đãi. Mọi phần thiếu đã được duyệt tiền mặt thì CONFIRMED nhưng còn nợ.

  opt Hết hạn giữ chỗ trước khi đủ tiền và chưa được duyệt
    GS->>DB: Khi trang nhóm hoặc webhook chạm vào: closeGroup, Item EXPIRED, đóng intent, GroupRefund cho khoản đã thu
  end

  TV->>NV: Đưa vé cá nhân GT.shareId.chữ ký
  NV->>API: POST CHECK_IN_TICKET (ticket)
  GS->>GS: So khớp HMAC, vé chưa dùng, đơn PAID, trong khung 15 phút trước giờ chơi đến hết giờ
  alt Hợp lệ
    GS->>DB: GroupShare checkedInAt, Booking CHECKED_IN, ghi AdminAudit
    GS-->>NV: Cho vào sân
  else Không hợp lệ
    GS-->>NV: 409
  end
```

---

## Chưa vẽ trong bộ này

Các luồng phụ có trong mã nhưng chưa có sơ đồ riêng: đổi lịch (`reschedule.service.ts`), chuyển nhượng đơn (`transfer.service.ts`), báo sự cố (`incident.service.ts`), đánh giá kèm ảnh (`review.service.ts`), HLV hủy ca (`api/coach/bookings/[id]/cancel`), đăng ký và xác thực email, đăng ký cơ sở và đối tác. Khi cần vẽ thêm, dùng `graphify explain "<tên hàm>"` để lấy các cạnh gọi hàm làm khung.
