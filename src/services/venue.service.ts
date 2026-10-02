import type { Venue, VenueFilterParams } from "@/types/venue";

// Dữ liệu mẫu chuẩn theo đặc tả §12.2 của SmashBook
export const MOCK_VENUES: Venue[] = [
  {
    id: "venue-1",
    slug: "san-cau-long-thanh-xuan-xanh",
    name: "Sân Cầu Lông Thanh Xuân Xanh",
    description:
      "Cơ sở tiêu chuẩn thi đấu với sàn thảm cao su chuyên dụng, trần cao 9m thông thoáng, hệ thống đèn chống chói đạt chuẩn BWF. Có phục vụ nước uống, căng-tin và dịch vụ đan vợt lấy ngay.",
    address: "Số 168 Khuất Duy Tiến, Phường Nhân Chính",
    district: "Thanh Xuân",
    city: "Hà Nội",
    lat: 20.9984,
    lng: 105.8012,
    openMin: 300,  // 05:00
    closeMin: 1320, // 22:00
    priceFrom: 60000,
    ratingAvg: 4.9,
    ratingCount: 148,
    images: [
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1521537634581-0dced2fed2a8?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1613918108466-292b78a8ef95?auto=format&fit=crop&w=800&q=80",
    ],
    amenities: ["AC", "PARKING", "RACKET_RENTAL", "CANTEEN", "SHOWER", "WIFI"],
    cancelBeforeHours: 4,
    paymentMode: "ONLINE_FULL",
    hasSlotTonight: true,
    distanceKm: 1.8,
    courts: [
      { id: "court-1-1", name: "Sân 1 (Sân trung tâm)", surface: "Thảm PVC Enlio", isActive: true },
      { id: "court-1-2", name: "Sân 2", surface: "Thảm PVC Enlio", isActive: true },
      { id: "court-1-3", name: "Sân 3", surface: "Thảm PVC Enlio", isActive: true },
      { id: "court-1-4", name: "Sân 4", surface: "Thảm PVC Enlio", isActive: true },
      { id: "court-1-5", name: "Sân 5", surface: "Thảm PVC Enlio", isActive: true },
      { id: "court-1-6", name: "Sân 6", surface: "Thảm PVC Enlio", isActive: true },
    ],
    pricingRules: [
      { id: "p-1-1", daysOfWeek: [1, 2, 3, 4, 5], startMin: 300, endMin: 960, walkInPrice: 60000, fixedPrice: 50000 },
      { id: "p-1-2", daysOfWeek: [1, 2, 3, 4, 5], startMin: 960, endMin: 1260, walkInPrice: 110000, fixedPrice: 90000 },
      { id: "p-1-3", daysOfWeek: [1, 2, 3, 4, 5], startMin: 1260, endMin: 1320, walkInPrice: 70000, fixedPrice: 60000 },
      { id: "p-1-4", daysOfWeek: [6, 7], startMin: 300, endMin: 1320, walkInPrice: 100000, fixedPrice: 85000 },
    ],
    reviews: [
      {
        id: "rev-1",
        userName: "Trần Anh Tuấn",
        rating: 5,
        comment: "Sân rất đẹp, thảm bám tốt, trần cao không bị chói mắt. Chủ sân thân thiện và có tủ đồ khoá số an toàn.",
        createdAt: "2026-09-28",
      },
      {
        id: "rev-2",
        userName: "Nguyễn Hải Yến",
        rating: 5,
        comment: "Đặt qua web nhanh gọn, đến sân quét mã là vào chơi ngay không phải chờ đợi.",
        createdAt: "2026-09-25",
      },
    ],
  },
  {
    id: "venue-2",
    slug: "clb-cau-long-ho-tay",
    name: "CLB Cầu Lông Hồ Tây",
    description:
      "Không gian thoáng mát ven hồ Tây, hệ thống điều hoà mát rượi, thảm Yonex cao cấp. Có câu lạc bộ sinh hoạt thường xuyên cho người muốn tìm bạn giao lưu.",
    address: "Số 68 Đặng Thai Mai, Phường Quảng An",
    district: "Tây Hồ",
    city: "Hà Nội",
    lat: 21.0621,
    lng: 105.8239,
    openMin: 330,  // 05:30
    closeMin: 1380, // 23:00
    priceFrom: 70000,
    ratingAvg: 4.8,
    ratingCount: 112,
    images: [
      "https://images.unsplash.com/photo-1521537634581-0dced2fed2a8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80",
    ],
    amenities: ["AC", "PARKING", "CANTEEN", "WIFI", "SHOWER"],
    cancelBeforeHours: 4,
    paymentMode: "ONLINE_FULL",
    hasSlotTonight: true,
    distanceKm: 4.2,
    courts: [
      { id: "court-2-1", name: "Sân A", surface: "Thảm Yonex Pro", isActive: true },
      { id: "court-2-2", name: "Sân B", surface: "Thảm Yonex Pro", isActive: true },
      { id: "court-2-3", name: "Sân C", surface: "Thảm Yonex Pro", isActive: true },
      { id: "court-2-4", name: "Sân D", surface: "Thảm Yonex Pro", isActive: true },
    ],
    pricingRules: [
      { id: "p-2-1", daysOfWeek: [1, 2, 3, 4, 5], startMin: 330, endMin: 960, walkInPrice: 70000, fixedPrice: 60000 },
      { id: "p-2-2", daysOfWeek: [1, 2, 3, 4, 5], startMin: 960, endMin: 1260, walkInPrice: 120000, fixedPrice: 100000 },
      { id: "p-2-3", daysOfWeek: [6, 7], startMin: 330, endMin: 1380, walkInPrice: 110000, fixedPrice: 95000 },
    ],
    reviews: [
      {
        id: "rev-3",
        userName: "Vũ Minh Quân",
        rating: 5,
        comment: "Vị trí đẹp, gửi xe ô tô thoải mái, căng tin bán nhiều đồ uống thể thao xịn.",
        createdAt: "2026-09-20",
      },
    ],
  },
  {
    id: "venue-3",
    slug: "nha-thi-dau-my-dinh-5",
    name: "Nhà Thi Đấu Mỹ Đình 5",
    description:
      "Tổ hợp 8 sân quy mô lớn nằm trong khuôn viên khu liên hợp thể thao Mỹ Đình. Cho phép thanh toán trực tiếp tại sân, hỗ trợ tổ chức giải đấu phong trào.",
    address: "Đường Lê Đức Thọ, Phường Mỹ Đình 1",
    district: "Nam Từ Liêm",
    city: "Hà Nội",
    lat: 21.0205,
    lng: 105.7648,
    openMin: 360,  // 06:00
    closeMin: 1320, // 22:00
    priceFrom: 80000,
    ratingAvg: 4.7,
    ratingCount: 95,
    images: [
      "https://images.unsplash.com/photo-1613918108466-292b78a8ef95?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80",
    ],
    amenities: ["AC", "PARKING", "RACKET_RENTAL", "CANTEEN", "WIFI"],
    cancelBeforeHours: 4,
    paymentMode: "AT_VENUE",
    hasSlotTonight: false,
    distanceKm: 5.5,
    courts: [
      { id: "court-3-1", name: "Sân 1", surface: "Thảm Alite", isActive: true },
      { id: "court-3-2", name: "Sân 2", surface: "Thảm Alite", isActive: true },
      { id: "court-3-3", name: "Sân 3", surface: "Thảm Alite", isActive: true },
      { id: "court-3-4", name: "Sân 4", surface: "Thảm Alite", isActive: true },
      { id: "court-3-5", name: "Sân 5", surface: "Thảm Alite", isActive: true },
      { id: "court-3-6", name: "Sân 6", surface: "Thảm Alite", isActive: true },
      { id: "court-3-7", name: "Sân 7", surface: "Thảm Alite", isActive: true },
      { id: "court-3-8", name: "Sân 8", surface: "Thảm Alite", isActive: true },
    ],
    pricingRules: [
      { id: "p-3-1", daysOfWeek: [1, 2, 3, 4, 5], startMin: 360, endMin: 1020, walkInPrice: 80000, fixedPrice: 70000 },
      { id: "p-3-2", daysOfWeek: [1, 2, 3, 4, 5], startMin: 1020, endMin: 1320, walkInPrice: 130000, fixedPrice: 110000 },
      { id: "p-3-3", daysOfWeek: [6, 7], startMin: 360, endMin: 1320, walkInPrice: 120000, fixedPrice: 100000 },
    ],
    reviews: [
      {
        id: "rev-4",
        userName: "Đỗ Gia Huy",
        rating: 4,
        comment: "Sân rộng, nhiều sân nên dễ đặt giờ đẹp. Chỗ để xe cực kỳ thoải mái.",
        createdAt: "2026-09-18",
      },
    ],
  },
  {
    id: "venue-4",
    slug: "cau-long-long-bien-sang",
    name: "Cầu Lông Long Biên Sáng",
    description:
      "Cơ sở mới nâng cấp 4 sân chuẩn đẹp, giá cả học sinh sinh viên rất mềm, có dịch vụ căng cước vợt chất lượng cao.",
    address: "Số 235 Nguyễn Văn Cừ, Phường Ngọc Lâm",
    district: "Long Biên",
    city: "Hà Nội",
    lat: 21.0427,
    lng: 105.8752,
    openMin: 300,  // 05:00
    closeMin: 1320, // 22:00
    priceFrom: 55000,
    ratingAvg: 4.6,
    ratingCount: 64,
    images: [
      "https://images.unsplash.com/photo-1521537634581-0dced2fed2a8?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: ["PARKING", "RACKET_RENTAL", "WIFI", "CANTEEN"],
    cancelBeforeHours: 4,
    paymentMode: "ONLINE_FULL",
    hasSlotTonight: true,
    distanceKm: 6.8,
    courts: [
      { id: "court-4-1", name: "Sân 1", surface: "Thảm PVC", isActive: true },
      { id: "court-4-2", name: "Sân 2", surface: "Thảm PVC", isActive: true },
      { id: "court-4-3", name: "Sân 3", surface: "Thảm PVC", isActive: true },
      { id: "court-4-4", name: "Sân 4", surface: "Thảm PVC", isActive: true },
    ],
    pricingRules: [
      { id: "p-4-1", daysOfWeek: [1, 2, 3, 4, 5], startMin: 300, endMin: 960, walkInPrice: 55000, fixedPrice: 45000 },
      { id: "p-4-2", daysOfWeek: [1, 2, 3, 4, 5], startMin: 960, endMin: 1320, walkInPrice: 95000, fixedPrice: 80000 },
      { id: "p-4-3", daysOfWeek: [6, 7], startMin: 300, endMin: 1320, walkInPrice: 90000, fixedPrice: 75000 },
    ],
    reviews: [
      {
        id: "rev-5",
        userName: "Lê Thuỳ Trang",
        rating: 5,
        comment: "Giá tốt nhất khu vực Long Biên, nhân viên hỗ trợ nhiệt tình.",
        createdAt: "2026-09-12",
      },
    ],
  },
  {
    id: "venue-5",
    slug: "san-cau-long-ha-dong-24h",
    name: "Sân Cầu Lông Hà Đông 24h",
    description:
      "Điểm đến lý tưởng cho anh chị em bận rộn thích chơi ca đêm. Mở cửa từ 05:00 đến tận nửa đêm 24:00, điều hoà trung tâm 24/7.",
    address: "Số 45 Quang Trung, Phường La Khê",
    district: "Hà Đông",
    city: "Hà Nội",
    lat: 20.9712,
    lng: 105.7725,
    openMin: 300,  // 05:00
    closeMin: 1440, // 24:00
    priceFrom: 50000,
    ratingAvg: 4.8,
    ratingCount: 88,
    images: [
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: ["AC", "PARKING", "RACKET_RENTAL", "WIFI", "CANTEEN", "SHOWER"],
    cancelBeforeHours: 4,
    paymentMode: "ONLINE_FULL",
    hasSlotTonight: true,
    distanceKm: 3.1,
    courts: [
      { id: "court-5-1", name: "Sân 1", surface: "Thảm PVC Vân Cát", isActive: true },
      { id: "court-5-2", name: "Sân 2", surface: "Thảm PVC Vân Cát", isActive: true },
      { id: "court-5-3", name: "Sân 3", surface: "Thảm PVC Vân Cát", isActive: true },
      { id: "court-5-4", name: "Sân 4", surface: "Thảm PVC Vân Cát", isActive: true },
      { id: "court-5-5", name: "Sân 5", surface: "Thảm PVC Vân Cát", isActive: true },
    ],
    pricingRules: [
      { id: "p-5-1", daysOfWeek: [1, 2, 3, 4, 5], startMin: 300, endMin: 960, walkInPrice: 50000, fixedPrice: 40000 },
      { id: "p-5-2", daysOfWeek: [1, 2, 3, 4, 5], startMin: 960, endMin: 1320, walkInPrice: 100000, fixedPrice: 85000 },
      { id: "p-5-3", daysOfWeek: [1, 2, 3, 4, 5], startMin: 1320, endMin: 1440, walkInPrice: 75000, fixedPrice: 65000 },
      { id: "p-5-4", daysOfWeek: [6, 7], startMin: 300, endMin: 1440, walkInPrice: 95000, fixedPrice: 80000 },
    ],
    reviews: [
      {
        id: "rev-6",
        userName: "Phạm Quốc Bảo",
        rating: 5,
        comment: "Chơi ca đêm sau giờ làm rất tiện, sân sạch sẽ và điều hoà mát.",
        createdAt: "2026-09-10",
      },
    ],
  },
];

export async function getVenues(params?: VenueFilterParams): Promise<Venue[]> {
  let list = [...MOCK_VENUES];

  if (params?.q) {
    const query = params.q.toLowerCase().trim();
    list = list.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        v.address.toLowerCase().includes(query) ||
        v.district.toLowerCase().includes(query)
    );
  }

  if (params?.district && params.district !== "all") {
    list = list.filter((v) => v.district.toLowerCase() === params.district?.toLowerCase());
  }

  if (params?.hasSlotTonight) {
    list = list.filter((v) => v.hasSlotTonight);
  }

  if (params?.maxPrice) {
    list = list.filter((v) => v.priceFrom <= (params.maxPrice ?? Infinity));
  }

  if (params?.amenities && params.amenities.length > 0) {
    list = list.filter((v) =>
      params.amenities?.every((a) => v.amenities.includes(a))
    );
  }

  if (params?.sort === "rating") {
    list.sort((a, b) => b.ratingAvg - a.ratingAvg);
  } else if (params?.sort === "price_asc") {
    list.sort((a, b) => a.priceFrom - b.priceFrom);
  } else if (params?.sort === "price_desc") {
    list.sort((a, b) => b.priceFrom - a.priceFrom);
  } else {
    // Mặc định khoảng cách
    list.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }

  return list;
}

export async function getVenueBySlug(slug: string): Promise<Venue | null> {
  const venue = MOCK_VENUES.find((v) => v.slug === slug);
  return venue ?? null;
}

export async function getVenueById(id: string): Promise<Venue | null> {
  const venue = MOCK_VENUES.find((v) => v.id === id);
  return venue ?? null;
}

export async function getFeaturedVenues(): Promise<Venue[]> {
  // Trả về danh sách sân gần bạn nhất
  return [...MOCK_VENUES].sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0)).slice(0, 3);
}

export async function getTopRatedVenues(): Promise<Venue[]> {
  // Trả về danh sách sân đánh giá cao nhất
  return [...MOCK_VENUES].sort((a, b) => b.ratingAvg - a.ratingAvg).slice(0, 3);
}
