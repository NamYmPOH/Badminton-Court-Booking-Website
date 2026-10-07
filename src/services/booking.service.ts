import type { Booking } from "@/types/booking";

// Dữ liệu booking mẫu phục vụ hiển thị màn hình "Lịch của tôi" theo §9.5
export const MOCK_BOOKINGS: Booking[] = [
  {
    id: "bk-1",
    code: "SB-261005-7K2F",
    venueId: "venue-1",
    venueName: "Sân Cầu Lông Thanh Xuân Xanh",
    venueAddress: "Số 168 Khuất Duy Tiến, Thanh Xuân, Hà Nội",
    venueSlug: "san-cau-long-thanh-xuan-xanh",
    status: "CONFIRMED",
    paymentStatus: "PAID",
    paymentMethod: "VNPAY",
    subtotal: 165000,
    discount: 20000,
    total: 145000,
    contactName: "Nguyễn Văn Nam",
    contactPhone: "0912345678",
    note: "Mang thêm vợt sơ cua giúp mình",
    expiresAt: "2026-10-05T17:10:00.000Z",
    createdAt: "2026-10-02T10:00:00.000Z",
    items: [
      {
        id: "item-1",
        courtId: "court-1-1",
        courtName: "Sân 1 (Sân trung tâm)",
        date: "2026-10-05",
        startMin: 1080, // 18:00
        endMin: 1170,   // 19:30
        price: 165000,
        status: "CONFIRMED",
      },
    ],
  },
  {
    id: "bk-2",
    code: "SB-260928-3M9X",
    venueId: "venue-2",
    venueName: "CLB Cầu Lông Hồ Tây",
    venueAddress: "Số 68 Đặng Thai Mai, Tây Hồ, Hà Nội",
    venueSlug: "clb-cau-long-ho-tay",
    status: "COMPLETED",
    paymentStatus: "PAID",
    paymentMethod: "VNPAY",
    subtotal: 180000,
    discount: 0,
    total: 180000,
    contactName: "Nguyễn Văn Nam",
    contactPhone: "0912345678",
    expiresAt: "2026-09-28T18:10:00.000Z",
    createdAt: "2026-09-27T09:30:00.000Z",
    items: [
      {
        id: "item-2",
        courtId: "court-2-2",
        courtName: "Sân B",
        date: "2026-09-28",
        startMin: 1140, // 19:00
        endMin: 1230,   // 20:30
        price: 180000,
        status: "COMPLETED",
      },
    ],
  },
  {
    id: "bk-3",
    code: "SB-260915-1K8P",
    venueId: "venue-3",
    venueName: "Nhà Thi Đấu Mỹ Đình 5",
    venueAddress: "Đường Lê Đức Thọ, Nam Từ Liêm, Hà Nội",
    venueSlug: "nha-thi-dau-my-dinh-5",
    status: "CANCELLED",
    paymentStatus: "REFUNDED",
    paymentMethod: "VNPAY",
    subtotal: 130000,
    discount: 0,
    total: 130000,
    contactName: "Nguyễn Văn Nam",
    contactPhone: "0912345678",
    expiresAt: "2026-09-15T16:10:00.000Z",
    createdAt: "2026-09-14T08:00:00.000Z",
    items: [
      {
        id: "item-3",
        courtId: "court-3-1",
        courtName: "Sân 1",
        date: "2026-09-15",
        startMin: 1020, // 17:00
        endMin: 1080,   // 18:00
        price: 130000,
        status: "CANCELLED",
      },
    ],
  },
];

export async function getUserBookings(
  tab: "upcoming" | "past" | "cancelled" = "upcoming"
): Promise<Booking[]> {
  const response = await fetch("/api/bookings", { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Không tải được lịch đặt sân.");
  const bookings: Booking[] = data.bookings;
  if (tab === "upcoming") {
    return bookings.filter((b) => ["CONFIRMED", "PENDING_PAYMENT", "CHECKED_IN"].includes(b.status));
  }
  if (tab === "past") {
    return bookings.filter((b) => ["COMPLETED", "NO_SHOW"].includes(b.status));
  }
  return bookings.filter((b) => b.status === "CANCELLED" || b.status === "EXPIRED");
}

export async function getBookingByCode(code: string): Promise<Booking | null> {
  const response = await fetch(`/api/bookings/${encodeURIComponent(code)}`, { cache: "no-store" });
  if (response.status === 404) return null;
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Không tải được đơn đặt sân.");
  return data.booking;
}
