/** Hằng số nghiệp vụ (BR-xx, D-xx) — không import từ component, dùng trong service/validator. */

/** Khoảng thời gian mặc định cho 1 ô (phút) — D-05 */
export const DEFAULT_SLOT_MINUTES = 30;

/** Tối thiểu thời lượng đặt (phút) — D-05 */
export const MIN_BOOKING_MINUTES = 60;

/** Tối đa thời lượng một dải (phút) — D-05 */
export const MAX_BOOKING_MINUTES = 240;

/** Tối đa số dải trong một lần đặt — BR-02 */
export const MAX_BOOKING_RANGES = 8;

/** Đặt trước tối đa (ngày) — D-05 */
export const MAX_ADVANCE_DAYS = 30;

/** Thời gian giữ chỗ (giây) — D-06 */
export const HOLD_TTL_SECONDS = 600;

/** Thời gian huỷ miễn phí trước giờ chơi (giờ) — BR-06 */
export const DEFAULT_CANCEL_BEFORE_HOURS = 4;

/** Mật khẩu tối thiểu (ký tự) — D-07 */
export const MIN_PASSWORD_LENGTH = 8;

/** Regex SĐT VN hợp lệ — D-07 */
export const PHONE_VN_REGEX = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

/** Bcrypt cost — §10.1 */
export const BCRYPT_COST = 12;

/** Tiện ích cơ sở */
export const AMENITIES = [
  "PARKING",
  "SHOWER",
  "WIFI",
  "CANTEEN",
  "RACKET_RENTAL",
  "SHUTTLE_SALE",
  "AIRCON",
  "LOCKER",
] as const;

export type Amenity = (typeof AMENITIES)[number];

/** Nhãn tiện ích tiếng Việt */
export const AMENITY_LABELS: Record<Amenity, string> = {
  PARKING: "Chỗ đậu xe",
  SHOWER: "Phòng tắm",
  WIFI: "WiFi",
  CANTEEN: "Căng-tin",
  RACKET_RENTAL: "Cho thuê vợt",
  SHUTTLE_SALE: "Bán cầu",
  AIRCON: "Điều hoà",
  LOCKER: "Tủ khoá",
};
