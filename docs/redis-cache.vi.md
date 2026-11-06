# Redis cache cho catalog sân và HLV

## Phạm vi đã áp dụng

Đã đọc `graphify-out/GRAPH_REPORT.md`, sau đó `AGENTS.md` trước khi khảo sát. Graph được tạo ở commit `146a8f26`, còn checkout trước thay đổi là `12c279ad`; quyết định dưới đây dựa thêm vào mã nguồn hiện tại.

| Dữ liệu | Quyết định | Lý do |
| --- | --- | --- |
| Catalog cơ sở ACTIVE: thông tin sân, ảnh, tiện ích, giờ mở cửa, giá tham khảo, sân con, điểm đánh giá tổng hợp | Đã cache; TTL mặc định tối đa 60 giây, có jitter giảm nhẹ | Một catalog dùng chung cho trang chủ, danh sách, gợi ý tìm kiếm, tra cứu theo id/slug |
| Bộ lọc, ưu tiên sân của chủ đang đăng nhập, trạng thái mở cửa theo thời điểm | Tính sau khi đọc catalog | Tránh lưu kết quả riêng của một người/thời điểm cho mọi người |
| Chi tiết đánh giá và ảnh đánh giá | Chưa cache | Có tên người đánh giá; trang chi tiết vẫn đọc mới, API phân trang giữ nguyên |
| Danh sách/hồ sơ HLV công khai | Đã cache; dùng chung TTL cấu hình với catalog sân | Chỉ tên, ảnh, bio, chuyên môn, kinh nghiệm, học phí tham khảo, chứng chỉ đã xác minh và cơ sở ACTIVE |
| Ưu đãi, ngân sách và số lượt sử dụng | Chưa cache | Thay đổi theo giao dịch và mốc hiệu lực; kiểm tra áp dụng phải đọc DB |
| Lịch trống, giữ chỗ, `/api/booking-catalog` | Chưa cache | Response có dữ liệu trực tiếp và URL tiếp tục thanh toán phụ thuộc người xem/token |
| Tài khoản, quyền, đơn đặt, đơn nhóm, thanh toán, hoàn tiền, ca trực, báo cáo quản trị | Chưa cache | Riêng tư hoặc cần tính đúng đắn trong giao dịch |

`hasSlotTonight` hiện được tính từ việc có sân con ACTIVE, **không phải** lịch trống thực tế. Thay đổi cache này giữ nguyên cách tính hiện tại. Khi đặt sân, backend vẫn kiểm tra dữ liệu và ràng buộc trong database.

Chỉ đưa các trường đã ánh xạ trong `Venue` vào payload; bảng giá cũng được chiếu rõ từng trường để không mang theo metadata nội bộ hoặc `Date` của Prisma. Không cache response có thông tin tài khoản, contact, số tài khoản ngân hàng hoặc token. `ownerId` là quan hệ sẵn có của catalog, dùng để sắp xếp sau cache, không dùng để quyết định quyền.

## Luồng xử lý và giới hạn

```text
Request → gộp yêu cầu cùng key trong một process
        → Redis GET catalog
          → hit: trả catalog → lọc/sắp xếp theo từng request
          → miss: tranh lock SET NX PX
            → được lock: truy vấn sân + tổng hợp đánh giá → publish có kiểm tra token
            → process khác đang tải: chờ cache có giới hạn; quá hạn báo PaymentError(503)
        → Redis lỗi/không cấu hình: đọc DB, vẫn gộp yêu cầu và giới hạn tải
```

- Hai key cố định `venues` và `coaches`, mỗi key có một lock; không tạo key theo chuỗi tìm kiếm, user, ID HLV hoặc từng tổ hợp bộ lọc. Số key không tăng theo lượt tìm kiếm. Đây là cache phía server, không phụ thuộc cache trình duyệt.
- Redis lock sống 15 giây, chỉ giúp gộp tải catalog. Không sử dụng lock này để xác nhận đặt sân hay thanh toán.
- Publish và release sử dụng Lua kiểm tra token sở hữu lock. Loader mất lock/lock hết hạn không thể ghi đè giá trị mới hay xóa lock của process khác. Truy vấn kéo dài hơn 15 giây có thể bị tải lại bởi process khác; không có tự gia hạn lock.
- TTL mặc định 60 giây, giới hạn cấu hình 5–300 giây; jitter chỉ giảm TTL, không tăng quá giá trị cấu hình.
- Timeout kết nối Redis 300 ms; mỗi command 250 ms; không xếp hàng offline, không tự retry command. Có giới hạn thời gian ngoài client để xử lý cả trường hợp promise kết nối bị treo.
- Sau lỗi Redis, tạm bỏ qua Redis trong 5 giây để không dồn kết nối lỗi vào mỗi request. Phần chờ lock khoảng 1 giây, cộng thời gian command đang chạy; hết thời gian thì trả 503 thay vì cho toàn bộ request gọi DB.
- Gộp request hoạt động cả khi tắt Redis. Tối đa 4 loader DB đang chạy trong một process; quá giới hạn báo `PaymentError(503)`. API search ánh xạ lỗi này thành HTTP 503; các trang SSR dùng xử lý lỗi trang của Next.js. Bình thường chỉ có một loader cho mỗi catalog. Nhiều invalidation liên tiếp có thể tách các lượt tải đang chạy nên vẫn cần giới hạn này.
- Giới hạn DB là **theo process**, không phải toàn bộ cụm khi Redis mất kết nối. Khi tăng số replica cần phối hợp giới hạn tải HTTP/DB pool theo năng lực database.
- Catalog sân khi DB lỗi hoặc rỗng vẫn sử dụng demo fallback có sẵn của ứng dụng, nhưng không lưu demo vào Redis. Catalog HLV cache được danh sách rỗng hợp lệ; lỗi DB truyền về caller, không cache lỗi hay tạo demo. Lỗi quá tải 503 không bị chuyển thành demo. Lỗi DB không khiến loader bị gọi lần hai trong cùng một cache attempt.

## Khi dữ liệu thay đổi

Invalidate được gọi **sau khi transaction đã commit** ở:

- Admin đổi trạng thái cơ sở (`VENUE_STATUS`).
- Chủ sân thêm/sửa/xóa sân con, thêm/sửa/xóa bảng giá.
- API PATCH sửa thông tin cơ sở, sân con và bảng giá.
- Gửi đánh giá làm thay đổi điểm/số lượng đánh giá.

Đăng ký cơ sở mới tạo trạng thái PENDING nên chưa ảnh hưởng catalog ACTIVE; lúc admin duyệt sẽ invalidate.

Catalog HLV được xóa sau khi ghi/transaction thành công ở: cập nhật hồ sơ HLV, xóa chứng chỉ, duyệt trạng thái HLV, duyệt/sửa liên kết sân, admin sửa hồ sơ, cập nhật quyền/trạng thái tài khoản, API sửa tên/ảnh tài khoản. Mọi lần invalidate sân cũng xóa catalog HLV vì DTO HLV chứa tên, địa chỉ và giờ mở cửa sân. Transaction rollback không xóa cache. Chứng chỉ mới chưa xác minh và liên kết mới/gửi lại PENDING chưa xuất hiện công khai nên không cần invalidate; thao tác duyệt liên kết có invalidate. Thay đổi trực tiếp `verifiedAt` bằng script/SQL cần invalidate thủ công hoặc chờ TTL.

Danh sách, tìm kiếm, bộ lọc và phân trang HLV dùng chung catalog `coaches`; lọc sau khi đọc cache, không cache kết quả riêng theo request. Hồ sơ chi tiết tra cùng catalog, chỉ trả chứng chỉ có `verifiedAt` và liên kết ACTIVE tới cơ sở ACTIVE. Không lưu email, số điện thoại, file chứng chỉ, lý do duyệt, lịch rảnh hoặc booking. Học phí cache chỉ để hiển thị; bước đặt lịch vẫn kiểm tra giá, trạng thái và lịch trống trong DB. Client Prisma được truyền tường minh khác singleton DB bỏ qua Redis để tránh trộn dữ liệu giữa database/transaction.

Catalog HLV hiện tải toàn bộ hồ sơ ACTIVE trước khi lọc/phân trang, tương tự catalog sân. Cách này phù hợp quy mô hiện tại (đã đo 7 hồ sơ); khi catalog lớn cần đo dung lượng payload và thời gian tải trước khi mở rộng. Counter `dbQueries` ghi nhận số lời gọi Prisma được instrument, không phải số SQL bên trong các relation query.

Lua invalidation xóa đồng thời giá trị và lock; vì publish phải kiểm tra token lock nên loader đã đọc dữ liệu cũ không ghi trở lại sau invalidation. Local singleflight cũng được tách để request mới không nhập chung lượt đọc cũ. Request đã bắt đầu trước cập nhật vẫn có thể nhận snapshot cũ.

Cache-aside vẫn có độ trễ đồng bộ: DB commit và Redis invalidation là hai thao tác riêng; process chết giữa hai thao tác hoặc invalidation lỗi có thể để cache cũ tồn tại đến TTL. Nếu xóa cache lỗi, process thực hiện ghi bỏ qua Redis trong 300 giây (TTL tối đa); replica khác có thể tiếp tục thấy cache cũ cho tới khi hết hạn. DB luôn là nguồn kiểm tra cho giao dịch và quyền.

Thay đổi trực tiếp DB bằng SQL/script ngoài các luồng trên không tự invalidate: chờ TTL hoặc xóa đúng key và lock trong đúng namespace. Khi cần bảo đảm hơn, triển khai outbox/event invalidation có retry, không coi TTL là đồng bộ tuyệt đối.

## Setup trên máy Windows

Repo đã có dependency `ioredis`; không cần thêm thư viện hay migration database. Không thay `.env.local` hiện có bằng toàn bộ `.env.example`, vì sẽ làm mất cấu hình khác.

1. Nếu chưa có, cài [Docker Desktop cho Windows](https://docs.docker.com/desktop/setup/install/windows-install/) và hoàn tất cấu hình WSL 2 theo hướng dẫn chính thức. Mở Docker Desktop và chờ engine sẵn sàng.
2. Tại thư mục dự án, chạy riêng Redis; lệnh này không khởi động hoặc thay đổi database đang dùng:

   ```powershell
   docker compose up -d redis
   docker compose exec redis redis-cli ping
   ```

   Kết quả mong đợi: `PONG`. Docker Compose chỉ publish Redis tới `127.0.0.1:6379`, giới hạn RAM Redis 128 MB, dùng eviction `allkeys-lru`. Cấu hình local này không có mật khẩu; chỉ dùng cho phát triển.

3. Thêm/cập nhật **chỉ** các biến sau trong `.env.local`:

   ```dotenv
   REDIS_URL="redis://127.0.0.1:6379"
   PUBLIC_CACHE_ENABLED="true"
   PUBLIC_CACHE_TTL_SECONDS="60"
   REDIS_CACHE_PREFIX="smashbook:local:public:v1"
   ```

4. Khởi động lại ứng dụng đang chạy để nhận biến mới. Khi chưa chạy ứng dụng có thể dùng `npm run dev` như bình thường.
5. Chạy smoke test Redis thật:

   ```powershell
   npm run cache:check
   ```

   Script mặc định dùng dữ liệu mẫu trong namespace ngẫu nhiên riêng, không truy vấn database, không thay catalog thật, không dùng `FLUSHDB`; kiểm tra cả `venues` và `coaches`, mỗi loại gộp 20 request, cache hit, TTL, invalidation và tải lại. Các key test được xóa lúc kết thúc; TTL/lock TTL làm dự phòng nếu script bị ngắt. Nếu chỉ thấy fallback thì script báo FAIL, không coi fallback là cache thành công.

   Để đọc catalog HLV từ database thật và xác minh lần đọc lại từ Redis không gọi Prisma, chạy `npm run cache:check -- --catalog`. Chế độ này chỉ đọc DB, cache dữ liệu công khai vào namespace test rồi dọn; chỉ in số lượng hồ sơ/thời gian, không in nội dung hồ sơ hay credentials.

6. Mở `/venues` hoặc tìm kiếm qua `/api/venues/search?q=cau%20giay` vài lần với dữ liệu DB thật. Xem TTL và thống kê Redis:

   ```powershell
   docker compose exec redis redis-cli TTL smashbook:local:public:v1:venues
   docker compose exec redis redis-cli INFO stats
   ```

   TTL dương nghĩa là key đã có; `-2` nghĩa là chưa có/hết hạn. Nếu DB chưa sẵn sàng, chỉ có dữ liệu demo hoặc Redis chưa kết nối, key sẽ không được tạo. Cache CDN có sẵn trên API search có thể làm request không đến ứng dụng; dùng trang động `/venues` khi kiểm tra log phía server.

   API search và danh sách HLV giữ cấu hình CDN cũ (`s-maxage=30, stale-while-revalidate=60`); xóa Redis không xóa response đã nằm trên CDN. TTL Redis chỉ giới hạn catalog trong Redis, không phải thời gian cập nhật toàn bộ các tầng cache.

   Với HLV, mở `/coaches` hoặc gọi `/api/coaches`, rồi tìm `smashbook:local:public:v1:coaches` trong Upstash Data Browser. Lần đọc chi tiết vẫn truy vấn lịch rảnh riêng; cache chỉ thay phần hồ sơ công khai.

Tắt cache Redis để chẩn đoán: đặt `PUBLIC_CACHE_ENABLED="false"` rồi restart app. Thiếu/để trống `REDIS_URL` cũng chuyển sang DB có gộp yêu cầu. Singleflight/giới hạn tải vẫn hoạt động; không có cache kết quả qua các request tuần tự khi Redis tắt.

## Setup môi trường online

### Database Upstash đang dùng cho local

Từ ngày 06/11/2026, `.env.local` được cấu hình dùng **Website AI Cache** (database ID `56e1a397-b1cd-40c8-b3fb-90049af7d0c4`), primary region Singapore (`ap-southeast-1`). Kết nối TCP qua TLS (`rediss://`) bằng `ioredis` hiện có; không cần thêm SDK REST.

- `REDIS_URL` chứa credentials và chỉ được lưu trong `.env.local`, file đã được Git ignore.
- `PUBLIC_CACHE_ENABLED=true`, `PUBLIC_CACHE_TTL_SECONDS=60`.
- `REDIS_CACHE_PREFIX=smashbook:local:public:v1` để tách cache local khỏi các môi trường khác dùng chung database.
- Khởi động lại dev server đang chạy để nhận cấu hình mới. Không cần chạy Redis Docker cho cấu hình này.
- Cấu hình này áp dụng cho checkout local; môi trường deploy cần khai báo biến server riêng và prefix tương ứng.

`npm run cache:check` đã PASS với Redis Upstash thật: gộp 20 yêu cầu đồng thời thành một loader, cache hit không gọi loader, invalidation và tải lại thành công, `errors=0`, `bypass=0`. Script dùng dữ liệu giả trong namespace tạm và dọn key sau kiểm tra; kết quả này xác minh tầng cache, chưa phải kiểm thử catalog với database thật hoặc deployment.

- Dùng Redis standalone cung cấp endpoint TCP `redis://` hoặc TLS `rediss://`, hỗ trợ `GET`, `SET`, `DEL`, `EVAL`. Endpoint chỉ hỗ trợ REST không dùng trực tiếp với `ioredis` này. Bản hiện tại không cấu hình Redis Cluster: Lua dùng hai key chưa có chung hash tag, nên không áp dụng nguyên trạng cho cluster chia shard.
- Đặt Redis gần vùng chạy backend; đo lại timeout nếu khoảng cách mạng lớn. Tạo credentials/ACL cho namespace cache; lưu URL trong biến môi trường **server**, không đặt `NEXT_PUBLIC_`, không commit vào Git.
- Đặt `REDIS_URL`, `PUBLIC_CACHE_ENABLED=true`, `PUBLIC_CACHE_TTL_SECONDS=60` trong môi trường chạy backend và restart/redeploy theo quy trình dự án.
- Đặt prefix riêng, ví dụ `smashbook:production:public:v1`; các instance cùng DB phải dùng cùng prefix. Preview hoặc DB khác phải có prefix khác; `NODE_ENV=production` một mình không tách preview khỏi production.
- Giữ Redis cache tách khỏi Redis chứa dữ liệu quan trọng. Eviction có thể xóa cả lock; token fencing hạn chế ghi đè nhưng cache lock chỉ là tối ưu hiệu năng, không bảo đảm giao dịch.
- Không mở Redis chưa xác thực ra Internet. Với managed Redis dùng TLS và giới hạn truy cập theo khả năng nhà cung cấp.

## Đo hiệu quả

Module xuất `getPublicCacheMetrics()` và in log JSON `[PUBLIC_CACHE_METRICS]` khi có request hoàn tất, tối đa một lần mỗi 60 giây trong từng process. Không có endpoint metrics công khai và không có timer giữ process sống.

| Trường | Ý nghĩa |
| --- | --- |
| `requests`, `hit`, `miss`, `coalesced` | Số request vào helper, cache hit/miss và số request dùng chung promise |
| `hitRate` | `hit / (hit + miss)`; một lượt chờ có thể ghi nhận miss ban đầu và hit sau đó. Theo dõi cùng `coalesced` vì request gộp không phát sinh GET riêng |
| `dbLoads`, `dbQueries` | Số loader catalog và số query được instrument rõ tại `venue.findMany`/`review.groupBy` |
| `averageLoaderMs`, `averageResponseMs` | Thời gian trung bình loader và helper cache; không phải toàn bộ thời gian HTTP render |
| `errors`, `bypass`, `loadErrors` | Lỗi Redis/cache, số lượt bỏ qua Redis, lỗi loader DB |
| `rejected`, `activeLoads`, `invalidations` | Số lượt bị giới hạn, loader đang chạy và số lần yêu cầu xóa cache |

Counter là lũy kế từ lúc process khởi động, dùng chung qua hot reload; cần tổng hợp ở nền tảng log nếu có nhiều replica. `dbQueries` chỉ đo catalog, không phải toàn bộ SQL trong ứng dụng; chi tiết đánh giá vẫn truy vấn DB riêng. Đo p95 HTTP và DB query tổng tại hệ thống giám sát hiện có nếu cần đánh giá toàn trang.

Kỳ vọng trong điều kiện tuần tự, không có cập nhật/hết hạn: lần đầu đọc catalog sân gọi Prisma 2 lần; catalog HLV gọi `findMany` 1 lần; 99 lần sau không gọi Prisma cho catalog đó. Kiểm thử hồi quy xác nhận các consumer catalog dùng chung dữ liệu; mức giảm thực tế phải đo sau khi có Redis và traffic thật.

## Kiểm tra và nguồn tham khảo

```powershell
node --test tests/public-cache.test.cjs tests/venue-catalog-cache.test.cjs tests/coach-catalog-cache.test.cjs tests/public-cache-invalidation.test.cjs tests/coach-service.test.cjs tests/admin-coach-management.test.cjs
npx tsc --noEmit
npm run lint
npm run cache:check
npm run cache:check -- --catalog
```

Các test tự động dùng Redis giả lập có kiểm soát để kiểm tra lỗi/timeout, TTL, truy cập đồng thời và race invalidation. `cache:check` là bước bổ sung cần Redis thật. Kết quả chạy thực tế trong phiên triển khai được ghi ở phần nghiệm thu cuối tài liệu.

- [Redis: cache-aside](https://redis.io/docs/latest/develop/use-cases/cache-aside/).
- [ioredis: cấu hình connection, offline queue, retry, timeout](https://github.com/redis/ioredis).
- [Redis: SET NX và expiration](https://redis.io/docs/latest/commands/set/).
- [Microsoft: giới hạn nhất quán của cache-aside](https://learn.microsoft.com/en-us/azure/architecture/databases/architecture/cache-aside-azure-managed-redis-postgresql).

Prompt mở rộng: [redis-cache-next-phase.vi.md](prompts/redis-cache-next-phase.vi.md).

## Nghiệm thu ngày 05/11/2026

- 35/35 test mới trong 3 suite cache đạt.
- TypeScript (`npx tsc --noEmit`) đạt; `git diff --check` đạt.
- Production build (`npm run build`) đạt sau khi chạy ngoài sandbox; trong sandbox gặp EPERM tạo thư mục `.next`.
- Lint đạt với một warning có sẵn ở `src/components/features/venue-operations/ReceiptPrintModal.tsx:74` về dependency `booking.id` của `useMemo`.
- Chạy toàn bộ suite hiện có phát hiện các test DB thật không kết nối được database. Chạy riêng các suite còn lại: 339/340 đạt; một test cũ `Issue E` trong `tests/counter-booking-ops-regression.test.cjs:612` dùng lịch cố định `2026-11-05` 08:00 nhưng không truyền thời gian kiểm thử, nên bị quy tắc chặn hủy sau giờ chơi từ chối. File test và logic hủy này không bị thay đổi trong hạng mục cache.
- `npm run cache:check` báo FAIL đúng kỳ vọng khi chưa cấu hình/kết nối Redis hoạt động. Cổng local 6379 chưa có Redis; chưa có Docker/WSL sẵn dùng. Chưa xác minh bằng Redis thật, chưa đo hiệu suất thực tế hoặc thử tích hợp DB thật.
- Chưa thay `.env.local`, chưa provision dịch vụ, chưa deploy và chưa commit.

## Nghiệm thu mở rộng ngày 06/11/2026

- Mở rộng cache HLV trên cùng Website AI Cache, giữ TLS và namespace môi trường hiện có; không thêm dependency hay migration.
- 80/80 test trong 6 suite ở trên đạt, gồm DTO không có trường riêng tư, lọc/phân trang, JSON roundtrip, client DB khác không dùng chung cache, lỗi/timeout Redis, race invalidation, xóa chứng chỉ, đổi tên/ảnh và invalidation sau commit/không invalidate khi rollback.
- 29/29 test hồi quy bổ sung trong `admin.test.cjs`, `coach-and-account-verification.test.cjs`, `coach-reservation.test.cjs` đạt; tổng 109/109 test đã chạy cho hạng mục này.
- TypeScript và `git diff --check` đạt. Lint đạt với warning có sẵn tại `ReceiptPrintModal.tsx:74`.
- Redis thật: cả `venues` và `coaches` PASS, TTL 57s và 54s trong lượt đo có catalog thật, `errors=0`, `bypass=0`.
- Catalog HLV DB thật có 7 hồ sơ: lần đầu 1810 ms, lần đọc lại 58 ms, không thêm lời gọi Prisma. Đây là một mẫu đo từ máy local, có cả chi phí khởi tạo kết nối; không phải p95 hay benchmark tải.
- Có một lượt smoke test vượt timeout kết nối TLS 300 ms; lượt chạy lại thành công. Khi mạng chậm ứng dụng có thể tạm fallback DB theo cooldown hiện có; cần theo dõi `errors`/`bypass` ở môi trường chạy thật.
- Script test dọn các key tạm; key catalog ứng dụng sẽ được tạo khi truy cập trang/API tương ứng. Chưa kiểm thử browser hoặc deploy production trong hạng mục này.
