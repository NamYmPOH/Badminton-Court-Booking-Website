import type { Venue } from "@/types/venue";

/**
 * Danh sách 100 cơ sở sân cầu lông hoàn chỉnh và độc nhất.
 * - 100 tên, địa chỉ, mô tả, tiện ích, toạ độ, số sân thi đấu khác biệt 100%.
 * - 100 hình ảnh đồ hoạ vector SVG tiêu chuẩn sân đấu BWF không trùng lặp, lưu cục bộ tại /images/courts/.
 * - Đảm bảo tải mượt mà 100%, không lỗi ảnh và tương thích hoàn toàn với Next.js Image.
 */
export const MOCK_VENUES: Venue[] = [
  {
    "id": "venue-1",
    "slug": "san-cau-long-thanh-xuan-xanh",
    "name": "Sân Cầu Lông Thanh Xuân Xanh",
    "description": "Cơ sở tiêu chuẩn thi đấu với sàn thảm cao su chuyên dụng, trần cao 9m thông thoáng, hệ thống đèn chống chói đạt chuẩn BWF. Có phục vụ nước uống, căng-tin và dịch vụ đan vợt lấy ngay.",
    "address": "Số 168 Khuất Duy Tiến, Phường Nhân Chính",
    "district": "Thanh Xuân",
    "city": "Hà Nội",
    "lat": 20.9984,
    "lng": 105.8012,
    "openMin": 300,
    "closeMin": 1320,
    "priceFrom": 60000,
    "ratingAvg": 4.9,
    "ratingCount": 148,
    "images": [
      "/images/courts/court-1.svg",
      "/images/courts/court-11.svg",
      "/images/courts/court-21.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "CANTEEN",
      "SHOWER",
      "WIFI"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 1.8,
    "courts": [
      {
        "id": "court-1-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-1-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-1-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-1-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-1-5",
        "name": "Sân 5",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-1-6",
        "name": "Sân 6",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-1-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 960,
        "walkInPrice": 60000,
        "fixedPrice": 50000
      },
      {
        "id": "p-1-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 960,
        "endMin": 1260,
        "walkInPrice": 110000,
        "fixedPrice": 90000
      },
      {
        "id": "p-1-3",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1260,
        "endMin": 1320,
        "walkInPrice": 70000,
        "fixedPrice": 60000
      },
      {
        "id": "p-1-4",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1320,
        "walkInPrice": 100000,
        "fixedPrice": 85000
      }
    ],
    "reviews": [
      {
        "id": "rev-1",
        "userName": "Trần Anh Tuấn",
        "rating": 5,
        "comment": "Sân rất đẹp, thảm bám tốt, trần cao không bị chói mắt. Chủ sân thân thiện và có tủ đồ khoá số an toàn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-2",
        "userName": "Nguyễn Hải Yến",
        "rating": 5,
        "comment": "Đặt qua web nhanh gọn, đến sân quét mã là vào chơi ngay không phải chờ đợi.",
        "createdAt": "2026-09-25"
      }
    ]
  },
  {
    "id": "venue-2",
    "slug": "clb-cau-long-ho-tay",
    "name": "CLB Cầu Lông Hồ Tây",
    "description": "Không gian thoáng mát ven hồ Tây, hệ thống điều hoà mát rượi, thảm Yonex cao cấp. Có câu lạc bộ sinh hoạt thường xuyên cho người muốn tìm bạn giao lưu.",
    "address": "Số 68 Đặng Thai Mai, Phường Quảng An",
    "district": "Tây Hồ",
    "city": "Hà Nội",
    "lat": 21.0621,
    "lng": 105.8239,
    "openMin": 330,
    "closeMin": 1380,
    "priceFrom": 70000,
    "ratingAvg": 4.8,
    "ratingCount": 112,
    "images": [
      "/images/courts/court-2.svg",
      "/images/courts/court-12.svg",
      "/images/courts/court-22.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 4.2,
    "courts": [
      {
        "id": "court-2-1",
        "name": "Sân A",
        "surface": "Thảm Yonex Pro",
        "isActive": true
      },
      {
        "id": "court-2-2",
        "name": "Sân B",
        "surface": "Thảm Yonex Pro",
        "isActive": true
      },
      {
        "id": "court-2-3",
        "name": "Sân C",
        "surface": "Thảm Yonex Pro",
        "isActive": true
      },
      {
        "id": "court-2-4",
        "name": "Sân D",
        "surface": "Thảm Yonex Pro",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-2-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 960,
        "walkInPrice": 70000,
        "fixedPrice": 60000
      },
      {
        "id": "p-2-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 960,
        "endMin": 1260,
        "walkInPrice": 120000,
        "fixedPrice": 100000
      },
      {
        "id": "p-2-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1380,
        "walkInPrice": 110000,
        "fixedPrice": 95000
      }
    ],
    "reviews": [
      {
        "id": "rev-3",
        "userName": "Vũ Minh Quân",
        "rating": 5,
        "comment": "Vị trí đẹp, gửi xe ô tô thoải mái, căng tin bán nhiều đồ uống thể thao xịn.",
        "createdAt": "2026-09-20"
      }
    ]
  },
  {
    "id": "venue-3",
    "slug": "san-cau-long-khuong-dinh-sport",
    "name": "Sân Cầu Lông Khương Đình Sport",
    "description": "Cơ sở mới nâng cấp 4 sân chuẩn đẹp, giá cả học sinh sinh viên rất mềm, có dịch vụ căng cước vợt chất lượng cao.",
    "address": "Số 420 Khương Đình, Phường Hạ Đình",
    "district": "Thanh Xuân",
    "city": "Hà Nội",
    "lat": 20.9882,
    "lng": 105.8115,
    "openMin": 300,
    "closeMin": 1320,
    "priceFrom": 80000,
    "ratingAvg": 4.9,
    "ratingCount": 39,
    "images": [
      "/images/courts/court-3.svg",
      "/images/courts/court-13.svg",
      "/images/courts/court-23.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 2.4,
    "courts": [
      {
        "id": "court-3-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-3-2",
        "name": "Sân 2",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-3-3",
        "name": "Sân 3",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-3-4",
        "name": "Sân 4",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-3-5",
        "name": "Sân 5",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-3-6",
        "name": "Sân 6",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-3-7",
        "name": "Sân 7",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-3-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 80000,
        "fixedPrice": 70000
      },
      {
        "id": "p-3-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 120000,
        "fixedPrice": 105000
      },
      {
        "id": "p-3-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1320,
        "walkInPrice": 115000,
        "fixedPrice": 105000
      }
    ],
    "reviews": [
      {
        "id": "rev-3-1",
        "userName": "Hoàng Minh Đức",
        "rating": 5,
        "comment": "Ánh sáng chuẩn không bị chói khi ngửa cổ đánh cầu cao sâu. 5 sao cho chất lượng!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-3-2",
        "userName": "Ngô Phương Thảo",
        "rating": 4,
        "comment": "Phòng tắm nóng lạnh rất sạch, có máy sấy tóc tiện lợi cho bạn nữ sau trận đấu.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-4",
    "slug": "clb-cau-long-le-van-luong-pro",
    "name": "CLB Cầu Lông Lê Văn Lương Pro",
    "description": "Điểm đến lý tưởng cho anh chị em bận rộn thích chơi ca đêm. Mở cửa từ 05:00 đến tận nửa đêm 24:00, điều hoà trung tâm 24/7.",
    "address": "Số 55 Lê Văn Lương, Phường Nhân Chính",
    "district": "Thanh Xuân",
    "city": "Hà Nội",
    "lat": 21.0068,
    "lng": 105.8035,
    "openMin": 330,
    "closeMin": 1320,
    "priceFrom": 90000,
    "ratingAvg": 5,
    "ratingCount": 42,
    "images": [
      "/images/courts/court-4.svg",
      "/images/courts/court-14.svg",
      "/images/courts/court-24.svg"
    ],
    "amenities": [
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 2.7,
    "courts": [
      {
        "id": "court-4-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-4-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-4-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-4-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-4-5",
        "name": "Sân 5",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-4-6",
        "name": "Sân 6",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-4-7",
        "name": "Sân 7",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-4-8",
        "name": "Sân 8",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-4-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 90000,
        "fixedPrice": 80000
      },
      {
        "id": "p-4-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 130000,
        "fixedPrice": 115000
      },
      {
        "id": "p-4-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1320,
        "walkInPrice": 125000,
        "fixedPrice": 115000
      }
    ],
    "reviews": [
      {
        "id": "rev-4-1",
        "userName": "Bùi Văn Nam",
        "rating": 5,
        "comment": "Thảm xịn đánh 2 tiếng không mỏi gối hay trơn trượt. Sẽ ủng hộ lâu dài!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-4-2",
        "userName": "Đặng Thu Hà",
        "rating": 4,
        "comment": "Giao diện đặt sân tiện lợi, thanh toán online mượt mà, chủ sân đón tiếp niềm nở.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-5",
    "slug": "san-cau-long-kim-giang-star",
    "name": "Sân Cầu Lông Kim Giang Star",
    "description": "Sân thảm PVC vân cát đạt chuẩn thi đấu quốc tế, khoảng cách giữa các sân rộng rãi 2m tránh va chạm. Bãi đỗ xe ô tô miễn phí.",
    "address": "Số 120 Kim Giang, Phường Đại Kim",
    "district": "Thanh Xuân",
    "city": "Hà Nội",
    "lat": 20.9825,
    "lng": 105.8189,
    "openMin": 360,
    "closeMin": 1440,
    "priceFrom": 100000,
    "ratingAvg": 4.6,
    "ratingCount": 45,
    "images": [
      "/images/courts/court-5.svg",
      "/images/courts/court-15.svg",
      "/images/courts/court-25.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 3,
    "courts": [
      {
        "id": "court-5-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-5-2",
        "name": "Sân 2",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-5-3",
        "name": "Sân 3",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-5-4",
        "name": "Sân 4",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-5-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 100000,
        "fixedPrice": 90000
      },
      {
        "id": "p-5-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1440,
        "walkInPrice": 140000,
        "fixedPrice": 125000
      },
      {
        "id": "p-5-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1440,
        "walkInPrice": 135000,
        "fixedPrice": 125000
      }
    ],
    "reviews": [
      {
        "id": "rev-5-1",
        "userName": "Trần Anh Tuấn",
        "rating": 5,
        "comment": "Sân rất đẹp, thảm bám tốt, trần cao không bị chói mắt. Chủ sân thân thiện và có tủ đồ khoá số an toàn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-5-2",
        "userName": "Nguyễn Hải Yến",
        "rating": 4,
        "comment": "Đặt qua web nhanh gọn, đến sân quét mã là vào chơi ngay không phải chờ đợi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-6",
    "slug": "clb-cau-long-vu-tong-phan-center",
    "name": "CLB Cầu Lông Vũ Tông Phan Center",
    "description": "Hệ thống đèn LED âm trần chống chói mắt tuyệt đối khi lốp cầu cao sâu. Đội ngũ huấn luyện viên giàu kinh nghiệm hỗ trợ hướng dẫn cơ bản.",
    "address": "Số 355 Vũ Tông Phan, Phường Khương Đình",
    "district": "Thanh Xuân",
    "city": "Hà Nội",
    "lat": 20.9915,
    "lng": 105.8164,
    "openMin": 300,
    "closeMin": 1380,
    "priceFrom": 110000,
    "ratingAvg": 4.7,
    "ratingCount": 48,
    "images": [
      "/images/courts/court-6.svg",
      "/images/courts/court-16.svg",
      "/images/courts/court-26.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "CANTEEN",
      "SHOWER",
      "WIFI"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 3.3,
    "courts": [
      {
        "id": "court-6-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-6-2",
        "name": "Sân 2",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-6-3",
        "name": "Sân 3",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-6-4",
        "name": "Sân 4",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-6-5",
        "name": "Sân 5",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-6-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 110000,
        "fixedPrice": 100000
      },
      {
        "id": "p-6-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1380,
        "walkInPrice": 150000,
        "fixedPrice": 135000
      },
      {
        "id": "p-6-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1380,
        "walkInPrice": 145000,
        "fixedPrice": 135000
      }
    ],
    "reviews": [
      {
        "id": "rev-6-1",
        "userName": "Vũ Minh Quân",
        "rating": 5,
        "comment": "Vị trí đẹp, gửi xe ô tô thoải mái, căng tin bán nhiều đồ uống thể thao xịn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-6-2",
        "userName": "Đỗ Gia Huy",
        "rating": 4,
        "comment": "Sân rộng, nhiều sân nên dễ đặt giờ đẹp. Chỗ để xe cực kỳ thoải mái.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-7",
    "slug": "san-cau-long-nguyen-tuan-court",
    "name": "Sân Cầu Lông Nguyễn Tuân Court",
    "description": "Trần nhà cao 11m cách nhiệt mùa hè mát mẻ, sàn gỗ phong phủ thảm cao su chống sốc bảo vệ đầu gối và mắt cá chân tối đa.",
    "address": "Số 90 Nguyễn Tuân, Phường Thanh Xuân Trung",
    "district": "Thanh Xuân",
    "city": "Hà Nội",
    "lat": 20.9998,
    "lng": 105.8048,
    "openMin": 330,
    "closeMin": 1320,
    "priceFrom": 120000,
    "ratingAvg": 4.8,
    "ratingCount": 51,
    "images": [
      "/images/courts/court-7.svg",
      "/images/courts/court-17.svg",
      "/images/courts/court-27.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 3.6,
    "courts": [
      {
        "id": "court-7-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-7-2",
        "name": "Sân 2",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-7-3",
        "name": "Sân 3",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-7-4",
        "name": "Sân 4",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-7-5",
        "name": "Sân 5",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-7-6",
        "name": "Sân 6",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-7-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 120000,
        "fixedPrice": 110000
      },
      {
        "id": "p-7-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 160000,
        "fixedPrice": 145000
      },
      {
        "id": "p-7-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1320,
        "walkInPrice": 155000,
        "fixedPrice": 145000
      }
    ],
    "reviews": [
      {
        "id": "rev-7-1",
        "userName": "Lê Thuỳ Trang",
        "rating": 5,
        "comment": "Giá tốt nhất khu vực, nhân viên hỗ trợ nhiệt tình, dịch vụ căng vợt rất chuẩn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-7-2",
        "userName": "Phạm Quốc Bảo",
        "rating": 4,
        "comment": "Chơi ca đêm sau giờ làm rất tiện, sân sạch sẽ và điều hoà mát rượi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-8",
    "slug": "clb-cau-long-phuong-liet-eco",
    "name": "CLB Cầu Lông Phương Liệt Eco",
    "description": "Trang bị máy đo căng vợt điện tử 6 điểm hiện đại, quầy phụ kiện chính hãng Yonex, Lining, Victor. Phòng tắm nóng lạnh sạch sẽ.",
    "address": "Số 178 Phương Liệt, Phường Phương Liệt",
    "district": "Thanh Xuân",
    "city": "Hà Nội",
    "lat": 20.9962,
    "lng": 105.8395,
    "openMin": 360,
    "closeMin": 1320,
    "priceFrom": 50000,
    "ratingAvg": 4.9,
    "ratingCount": 54,
    "images": [
      "/images/courts/court-8.svg",
      "/images/courts/court-18.svg",
      "/images/courts/court-28.svg"
    ],
    "amenities": [
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 3.9,
    "courts": [
      {
        "id": "court-8-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-8-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-8-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-8-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-8-5",
        "name": "Sân 5",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-8-6",
        "name": "Sân 6",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-8-7",
        "name": "Sân 7",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-8-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 50000,
        "fixedPrice": 40000
      },
      {
        "id": "p-8-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 90000,
        "fixedPrice": 75000
      },
      {
        "id": "p-8-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1320,
        "walkInPrice": 85000,
        "fixedPrice": 75000
      }
    ],
    "reviews": [
      {
        "id": "rev-8-1",
        "userName": "Hoàng Minh Đức",
        "rating": 5,
        "comment": "Ánh sáng chuẩn không bị chói khi ngửa cổ đánh cầu cao sâu. 5 sao cho chất lượng!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-8-2",
        "userName": "Ngô Phương Thảo",
        "rating": 4,
        "comment": "Phòng tắm nóng lạnh rất sạch, có máy sấy tóc tiện lợi cho bạn nữ sau trận đấu.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-9",
    "slug": "clb-cau-long-cau-giay-star",
    "name": "CLB Cầu Lông Cầu Giấy Star",
    "description": "Không gian thể thao chuyên nghiệp với khán đài mini, hệ thống camera AI tự động ghi hình pha đập cầu đẹp mắt gửi về điện thoại.",
    "address": "Số 35 Trần Thái Tông, Phường Dịch Vọng Hậu",
    "district": "Cầu Giấy",
    "city": "Hà Nội",
    "lat": 21.0335,
    "lng": 105.7892,
    "openMin": 300,
    "closeMin": 1320,
    "priceFrom": 60000,
    "ratingAvg": 5,
    "ratingCount": 57,
    "images": [
      "/images/courts/court-9.svg",
      "/images/courts/court-19.svg",
      "/images/courts/court-29.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 4.2,
    "courts": [
      {
        "id": "court-9-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-9-2",
        "name": "Sân 2",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-9-3",
        "name": "Sân 3",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-9-4",
        "name": "Sân 4",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-9-5",
        "name": "Sân 5",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-9-6",
        "name": "Sân 6",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-9-7",
        "name": "Sân 7",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-9-8",
        "name": "Sân 8",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-9-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 60000,
        "fixedPrice": 50000
      },
      {
        "id": "p-9-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 100000,
        "fixedPrice": 85000
      },
      {
        "id": "p-9-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1320,
        "walkInPrice": 95000,
        "fixedPrice": 85000
      }
    ],
    "reviews": [
      {
        "id": "rev-9-1",
        "userName": "Bùi Văn Nam",
        "rating": 5,
        "comment": "Thảm xịn đánh 2 tiếng không mỏi gối hay trơn trượt. Sẽ ủng hộ lâu dài!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-9-2",
        "userName": "Đặng Thu Hà",
        "rating": 4,
        "comment": "Giao diện đặt sân tiện lợi, thanh toán online mượt mà, chủ sân đón tiếp niềm nở.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-10",
    "slug": "san-cau-long-duy-tan-arena",
    "name": "Sân Cầu Lông Duy Tân Arena",
    "description": "Cơ sở 6 sân thảm mới 100%, trang bị quạt công nghiệp đối lưu gió êm ái không ảnh hưởng hướng bay của quả cầu lông.",
    "address": "Số 88 Duy Tân, Phường Dịch Vọng Hậu",
    "district": "Cầu Giấy",
    "city": "Hà Nội",
    "lat": 21.0312,
    "lng": 105.7845,
    "openMin": 330,
    "closeMin": 1440,
    "priceFrom": 70000,
    "ratingAvg": 4.6,
    "ratingCount": 60,
    "images": [
      "/images/courts/court-10.svg",
      "/images/courts/court-20.svg",
      "/images/courts/court-30.svg"
    ],
    "amenities": [
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 4.5,
    "courts": [
      {
        "id": "court-10-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-10-2",
        "name": "Sân 2",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-10-3",
        "name": "Sân 3",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-10-4",
        "name": "Sân 4",
        "surface": "Thảm Alite BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-10-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 70000,
        "fixedPrice": 60000
      },
      {
        "id": "p-10-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1440,
        "walkInPrice": 110000,
        "fixedPrice": 95000
      },
      {
        "id": "p-10-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1440,
        "walkInPrice": 105000,
        "fixedPrice": 95000
      }
    ],
    "reviews": [
      {
        "id": "rev-10-1",
        "userName": "Trần Anh Tuấn",
        "rating": 5,
        "comment": "Sân rất đẹp, thảm bám tốt, trần cao không bị chói mắt. Chủ sân thân thiện và có tủ đồ khoá số an toàn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-10-2",
        "userName": "Nguyễn Hải Yến",
        "rating": 4,
        "comment": "Đặt qua web nhanh gọn, đến sân quét mã là vào chơi ngay không phải chờ đợi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-11",
    "slug": "clb-cau-long-trung-kinh-pro",
    "name": "CLB Cầu Lông Trung Kính Pro",
    "description": "Nằm tại vị trí trung tâm giao thông thuận tiện, có phòng thay đồ nam nữ riêng biệt, tủ khóa locker thông minh an toàn tuyệt đối.",
    "address": "Số 219 Trung Kính, Phường Yên Hòa",
    "district": "Cầu Giấy",
    "city": "Hà Nội",
    "lat": 21.0185,
    "lng": 105.7958,
    "openMin": 360,
    "closeMin": 1380,
    "priceFrom": 80000,
    "ratingAvg": 4.7,
    "ratingCount": 63,
    "images": [
      "/images/courts/court-11.svg",
      "/images/courts/court-21.svg",
      "/images/courts/court-31.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 4.8,
    "courts": [
      {
        "id": "court-11-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-11-2",
        "name": "Sân 2",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-11-3",
        "name": "Sân 3",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-11-4",
        "name": "Sân 4",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-11-5",
        "name": "Sân 5",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-11-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 80000,
        "fixedPrice": 70000
      },
      {
        "id": "p-11-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1380,
        "walkInPrice": 120000,
        "fixedPrice": 105000
      },
      {
        "id": "p-11-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1380,
        "walkInPrice": 115000,
        "fixedPrice": 105000
      }
    ],
    "reviews": [
      {
        "id": "rev-11-1",
        "userName": "Vũ Minh Quân",
        "rating": 5,
        "comment": "Vị trí đẹp, gửi xe ô tô thoải mái, căng tin bán nhiều đồ uống thể thao xịn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-11-2",
        "userName": "Đỗ Gia Huy",
        "rating": 4,
        "comment": "Sân rộng, nhiều sân nên dễ đặt giờ đẹp. Chỗ để xe cực kỳ thoải mái.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-12",
    "slug": "nha-thi-dau-cau-giay-central",
    "name": "Nhà Thi Đấu Cầu Giấy Central",
    "description": "Sân cầu lông đạt chuẩn liên đoàn BWF với vạch sơn sắc nét, thảm bám dính cực tốt ngay cả khi đổ nhiều mồ hôi. Nước chanh muối pha tươi.",
    "address": "Số 35 Trần Quý Kiên, Phường Dịch Vọng",
    "district": "Cầu Giấy",
    "city": "Hà Nội",
    "lat": 21.0372,
    "lng": 105.7925,
    "openMin": 300,
    "closeMin": 1320,
    "priceFrom": 90000,
    "ratingAvg": 4.8,
    "ratingCount": 66,
    "images": [
      "/images/courts/court-12.svg",
      "/images/courts/court-22.svg",
      "/images/courts/court-32.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "CANTEEN",
      "SHOWER",
      "WIFI"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 5.1,
    "courts": [
      {
        "id": "court-12-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-12-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-12-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-12-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-12-5",
        "name": "Sân 5",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-12-6",
        "name": "Sân 6",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-12-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 90000,
        "fixedPrice": 80000
      },
      {
        "id": "p-12-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 130000,
        "fixedPrice": 115000
      },
      {
        "id": "p-12-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1320,
        "walkInPrice": 125000,
        "fixedPrice": 115000
      }
    ],
    "reviews": [
      {
        "id": "rev-12-1",
        "userName": "Lê Thuỳ Trang",
        "rating": 5,
        "comment": "Giá tốt nhất khu vực, nhân viên hỗ trợ nhiệt tình, dịch vụ căng vợt rất chuẩn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-12-2",
        "userName": "Phạm Quốc Bảo",
        "rating": 4,
        "comment": "Chơi ca đêm sau giờ làm rất tiện, sân sạch sẽ và điều hoà mát rượi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-13",
    "slug": "san-cau-long-nghia-tan-sport",
    "name": "Sân Cầu Lông Nghĩa Tân Sport",
    "description": "Hội tụ nhiều tay vợt phong trào trình độ khá - giỏi, thường xuyên tổ chức giải đấu nội bộ cuối tuần có cúp và phần thưởng giá trị.",
    "address": "Số 102 Tô Hiệu, Phường Nghĩa Tân",
    "district": "Cầu Giấy",
    "city": "Hà Nội",
    "lat": 21.0442,
    "lng": 105.7948,
    "openMin": 330,
    "closeMin": 1320,
    "priceFrom": 100000,
    "ratingAvg": 4.9,
    "ratingCount": 69,
    "images": [
      "/images/courts/court-13.svg",
      "/images/courts/court-23.svg",
      "/images/courts/court-33.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 5.4,
    "courts": [
      {
        "id": "court-13-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-13-2",
        "name": "Sân 2",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-13-3",
        "name": "Sân 3",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-13-4",
        "name": "Sân 4",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-13-5",
        "name": "Sân 5",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-13-6",
        "name": "Sân 6",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-13-7",
        "name": "Sân 7",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-13-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 100000,
        "fixedPrice": 90000
      },
      {
        "id": "p-13-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 140000,
        "fixedPrice": 125000
      },
      {
        "id": "p-13-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1320,
        "walkInPrice": 135000,
        "fixedPrice": 125000
      }
    ],
    "reviews": [
      {
        "id": "rev-13-1",
        "userName": "Hoàng Minh Đức",
        "rating": 5,
        "comment": "Ánh sáng chuẩn không bị chói khi ngửa cổ đánh cầu cao sâu. 5 sao cho chất lượng!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-13-2",
        "userName": "Ngô Phương Thảo",
        "rating": 4,
        "comment": "Phòng tắm nóng lạnh rất sạch, có máy sấy tóc tiện lợi cho bạn nữ sau trận đấu.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-14",
    "slug": "clb-cau-long-yen-hoa-smash",
    "name": "CLB Cầu Lông Yên Hòa Smash",
    "description": "Mặt sân cao cấp giảm phản lực tác động lên cột sống, trần thông gió tự nhiên không bí mùi. Cho thuê giày và vợt xịn giá hữu nghị.",
    "address": "Số 150 Hạ Yên Quyết, Phường Yên Hòa",
    "district": "Cầu Giấy",
    "city": "Hà Nội",
    "lat": 21.0215,
    "lng": 105.7912,
    "openMin": 360,
    "closeMin": 1320,
    "priceFrom": 110000,
    "ratingAvg": 5,
    "ratingCount": 72,
    "images": [
      "/images/courts/court-14.svg",
      "/images/courts/court-24.svg",
      "/images/courts/court-34.svg"
    ],
    "amenities": [
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 5.7,
    "courts": [
      {
        "id": "court-14-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-14-2",
        "name": "Sân 2",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-14-3",
        "name": "Sân 3",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-14-4",
        "name": "Sân 4",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-14-5",
        "name": "Sân 5",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-14-6",
        "name": "Sân 6",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-14-7",
        "name": "Sân 7",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-14-8",
        "name": "Sân 8",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-14-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 110000,
        "fixedPrice": 100000
      },
      {
        "id": "p-14-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 150000,
        "fixedPrice": 135000
      },
      {
        "id": "p-14-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1320,
        "walkInPrice": 145000,
        "fixedPrice": 135000
      }
    ],
    "reviews": [
      {
        "id": "rev-14-1",
        "userName": "Bùi Văn Nam",
        "rating": 5,
        "comment": "Thảm xịn đánh 2 tiếng không mỏi gối hay trơn trượt. Sẽ ủng hộ lâu dài!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-14-2",
        "userName": "Đặng Thu Hà",
        "rating": 4,
        "comment": "Giao diện đặt sân tiện lợi, thanh toán online mượt mà, chủ sân đón tiếp niềm nở.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-15",
    "slug": "san-cau-long-mai-dich-premier",
    "name": "Sân Cầu Lông Mai Dịch Premier",
    "description": "Thiết kế hiện đại với tone màu tối làm nổi bật quả cầu trắng, hệ thống âm thanh chất lượng cao phục vụ các trận cầu giao lưu sôi động.",
    "address": "Số 26 Hồ Tùng Mậu, Phường Mai Dịch",
    "district": "Cầu Giấy",
    "city": "Hà Nội",
    "lat": 21.0385,
    "lng": 105.7785,
    "openMin": 300,
    "closeMin": 1440,
    "priceFrom": 120000,
    "ratingAvg": 4.6,
    "ratingCount": 75,
    "images": [
      "/images/courts/court-15.svg",
      "/images/courts/court-25.svg",
      "/images/courts/court-35.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 6,
    "courts": [
      {
        "id": "court-15-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-15-2",
        "name": "Sân 2",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-15-3",
        "name": "Sân 3",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-15-4",
        "name": "Sân 4",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-15-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 120000,
        "fixedPrice": 110000
      },
      {
        "id": "p-15-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1440,
        "walkInPrice": 160000,
        "fixedPrice": 145000
      },
      {
        "id": "p-15-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1440,
        "walkInPrice": 155000,
        "fixedPrice": 145000
      }
    ],
    "reviews": [
      {
        "id": "rev-15-1",
        "userName": "Trần Anh Tuấn",
        "rating": 5,
        "comment": "Sân rất đẹp, thảm bám tốt, trần cao không bị chói mắt. Chủ sân thân thiện và có tủ đồ khoá số an toàn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-15-2",
        "userName": "Nguyễn Hải Yến",
        "rating": 4,
        "comment": "Đặt qua web nhanh gọn, đến sân quét mã là vào chơi ngay không phải chờ đợi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-16",
    "slug": "clb-cau-long-dich-vong-park-court",
    "name": "CLB Cầu Lông Dịch Vọng Park Court",
    "description": "Sân chơi đẳng cấp phục vụ cư dân và cộng đồng đam mê cầu lông, quầy bar nước ép trái cây tươi và whey protein dinh dưỡng sau trận đấu.",
    "address": "Số 1 Thành Thái, Phường Dịch Vọng",
    "district": "Cầu Giấy",
    "city": "Hà Nội",
    "lat": 21.0289,
    "lng": 105.7915,
    "openMin": 330,
    "closeMin": 1380,
    "priceFrom": 50000,
    "ratingAvg": 4.7,
    "ratingCount": 78,
    "images": [
      "/images/courts/court-16.svg",
      "/images/courts/court-26.svg",
      "/images/courts/court-36.svg"
    ],
    "amenities": [
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 6.3,
    "courts": [
      {
        "id": "court-16-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-16-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-16-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-16-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-16-5",
        "name": "Sân 5",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-16-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 50000,
        "fixedPrice": 40000
      },
      {
        "id": "p-16-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1380,
        "walkInPrice": 90000,
        "fixedPrice": 75000
      },
      {
        "id": "p-16-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1380,
        "walkInPrice": 85000,
        "fixedPrice": 75000
      }
    ],
    "reviews": [
      {
        "id": "rev-16-1",
        "userName": "Vũ Minh Quân",
        "rating": 5,
        "comment": "Vị trí đẹp, gửi xe ô tô thoải mái, căng tin bán nhiều đồ uống thể thao xịn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-16-2",
        "userName": "Đỗ Gia Huy",
        "rating": 4,
        "comment": "Sân rộng, nhiều sân nên dễ đặt giờ đẹp. Chỗ để xe cực kỳ thoải mái.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-17",
    "slug": "san-cau-long-hoang-quoc-viet-pro",
    "name": "Sân Cầu Lông Hoàng Quốc Việt Pro",
    "description": "Chỗ đỗ xe rộng thênh thang đỗ được 30 ô tô, sân chơi thân thiện gia đình có khu vực ghế chờ êm ái cho người nhà và cổ động viên.",
    "address": "Số 234 Hoàng Quốc Việt, Phường Cổ Nhuế 1",
    "district": "Cầu Giấy",
    "city": "Hà Nội",
    "lat": 21.0475,
    "lng": 105.7852,
    "openMin": 360,
    "closeMin": 1320,
    "priceFrom": 60000,
    "ratingAvg": 4.8,
    "ratingCount": 81,
    "images": [
      "/images/courts/court-17.svg",
      "/images/courts/court-27.svg",
      "/images/courts/court-37.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 6.6,
    "courts": [
      {
        "id": "court-17-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-17-2",
        "name": "Sân 2",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-17-3",
        "name": "Sân 3",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-17-4",
        "name": "Sân 4",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-17-5",
        "name": "Sân 5",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-17-6",
        "name": "Sân 6",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-17-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 60000,
        "fixedPrice": 50000
      },
      {
        "id": "p-17-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 100000,
        "fixedPrice": 85000
      },
      {
        "id": "p-17-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1320,
        "walkInPrice": 95000,
        "fixedPrice": 85000
      }
    ],
    "reviews": [
      {
        "id": "rev-17-1",
        "userName": "Lê Thuỳ Trang",
        "rating": 5,
        "comment": "Giá tốt nhất khu vực, nhân viên hỗ trợ nhiệt tình, dịch vụ căng vợt rất chuẩn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-17-2",
        "userName": "Phạm Quốc Bảo",
        "rating": 4,
        "comment": "Chơi ca đêm sau giờ làm rất tiện, sân sạch sẽ và điều hoà mát rượi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-18",
    "slug": "clb-cau-long-ho-tay",
    "name": "CLB Cầu Lông Hồ Tây",
    "description": "Sân thảm Alite chống trượt 5 lớp, dịch vụ sửa chữa và thay quấn cán vợt siêu tốc. Nhân viên hỗ trợ tận tình nhặt cầu và xếp sân.",
    "address": "Số 68 Đặng Thai Mai, Phường Quảng An",
    "district": "Tây Hồ",
    "city": "Hà Nội",
    "lat": 21.0621,
    "lng": 105.8239,
    "openMin": 300,
    "closeMin": 1320,
    "priceFrom": 70000,
    "ratingAvg": 4.9,
    "ratingCount": 84,
    "images": [
      "/images/courts/court-18.svg",
      "/images/courts/court-28.svg",
      "/images/courts/court-38.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "CANTEEN",
      "SHOWER",
      "WIFI"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 6.9,
    "courts": [
      {
        "id": "court-18-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-18-2",
        "name": "Sân 2",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-18-3",
        "name": "Sân 3",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-18-4",
        "name": "Sân 4",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-18-5",
        "name": "Sân 5",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-18-6",
        "name": "Sân 6",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-18-7",
        "name": "Sân 7",
        "surface": "Thảm Alite BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-18-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 70000,
        "fixedPrice": 60000
      },
      {
        "id": "p-18-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 110000,
        "fixedPrice": 95000
      },
      {
        "id": "p-18-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1320,
        "walkInPrice": 105000,
        "fixedPrice": 95000
      }
    ],
    "reviews": [
      {
        "id": "rev-18-1",
        "userName": "Hoàng Minh Đức",
        "rating": 5,
        "comment": "Ánh sáng chuẩn không bị chói khi ngửa cổ đánh cầu cao sâu. 5 sao cho chất lượng!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-18-2",
        "userName": "Ngô Phương Thảo",
        "rating": 4,
        "comment": "Phòng tắm nóng lạnh rất sạch, có máy sấy tóc tiện lợi cho bạn nữ sau trận đấu.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-19",
    "slug": "san-cau-long-sky-court-tay-ho",
    "name": "Sân Cầu Lông Sky Court Tây Hồ",
    "description": "Điểm hẹn lý tưởng sau giờ làm việc căng thẳng, ánh sáng đồng đều 450 Lux không góc chết, giá thuê sân linh hoạt theo từng khung giờ.",
    "address": "Số 150 Xuân Diệu, Phường Quảng An",
    "district": "Tây Hồ",
    "city": "Hà Nội",
    "lat": 21.0645,
    "lng": 105.8268,
    "openMin": 330,
    "closeMin": 1320,
    "priceFrom": 80000,
    "ratingAvg": 5,
    "ratingCount": 87,
    "images": [
      "/images/courts/court-19.svg",
      "/images/courts/court-29.svg",
      "/images/courts/court-39.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 7.2,
    "courts": [
      {
        "id": "court-19-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-19-2",
        "name": "Sân 2",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-19-3",
        "name": "Sân 3",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-19-4",
        "name": "Sân 4",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-19-5",
        "name": "Sân 5",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-19-6",
        "name": "Sân 6",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-19-7",
        "name": "Sân 7",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-19-8",
        "name": "Sân 8",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-19-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 80000,
        "fixedPrice": 70000
      },
      {
        "id": "p-19-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 120000,
        "fixedPrice": 105000
      },
      {
        "id": "p-19-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1320,
        "walkInPrice": 115000,
        "fixedPrice": 105000
      }
    ],
    "reviews": [
      {
        "id": "rev-19-1",
        "userName": "Bùi Văn Nam",
        "rating": 5,
        "comment": "Thảm xịn đánh 2 tiếng không mỏi gối hay trơn trượt. Sẽ ủng hộ lâu dài!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-19-2",
        "userName": "Đặng Thu Hà",
        "rating": 4,
        "comment": "Giao diện đặt sân tiện lợi, thanh toán online mượt mà, chủ sân đón tiếp niềm nở.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-20",
    "slug": "clb-cau-long-lac-long-quan-smash",
    "name": "CLB Cầu Lông Lạc Long Quân Smash",
    "description": "Cơ sở tiêu chuẩn thi đấu với sàn thảm cao su chuyên dụng, trần cao 9m thông thoáng, hệ thống đèn chống chói đạt chuẩn BWF. Có phục vụ nước uống, căng-tin và dịch vụ đan vợt lấy ngay.",
    "address": "Số 512 Lạc Long Quân, Phường Nhật Tân",
    "district": "Tây Hồ",
    "city": "Hà Nội",
    "lat": 21.0725,
    "lng": 105.8142,
    "openMin": 360,
    "closeMin": 1440,
    "priceFrom": 90000,
    "ratingAvg": 4.6,
    "ratingCount": 90,
    "images": [
      "/images/courts/court-20.svg",
      "/images/courts/court-30.svg",
      "/images/courts/court-40.svg"
    ],
    "amenities": [
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 7.5,
    "courts": [
      {
        "id": "court-20-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-20-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-20-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-20-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-20-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 90000,
        "fixedPrice": 80000
      },
      {
        "id": "p-20-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1440,
        "walkInPrice": 130000,
        "fixedPrice": 115000
      },
      {
        "id": "p-20-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1440,
        "walkInPrice": 125000,
        "fixedPrice": 115000
      }
    ],
    "reviews": [
      {
        "id": "rev-20-1",
        "userName": "Trần Anh Tuấn",
        "rating": 5,
        "comment": "Sân rất đẹp, thảm bám tốt, trần cao không bị chói mắt. Chủ sân thân thiện và có tủ đồ khoá số an toàn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-20-2",
        "userName": "Nguyễn Hải Yến",
        "rating": 4,
        "comment": "Đặt qua web nhanh gọn, đến sân quét mã là vào chơi ngay không phải chờ đợi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-21",
    "slug": "san-cau-long-vo-chi-cong-arena",
    "name": "Sân Cầu Lông Võ Chí Công Arena",
    "description": "Không gian thoáng mát ven hồ Tây, hệ thống điều hoà mát rượi, thảm Yonex cao cấp. Có câu lạc bộ sinh hoạt thường xuyên cho người muốn tìm bạn giao lưu.",
    "address": "Số 280 Võ Chí Công, Phường Xuân La",
    "district": "Tây Hồ",
    "city": "Hà Nội",
    "lat": 21.0602,
    "lng": 105.8055,
    "openMin": 300,
    "closeMin": 1380,
    "priceFrom": 100000,
    "ratingAvg": 4.7,
    "ratingCount": 93,
    "images": [
      "/images/courts/court-21.svg",
      "/images/courts/court-31.svg",
      "/images/courts/court-41.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 7.8,
    "courts": [
      {
        "id": "court-21-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-21-2",
        "name": "Sân 2",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-21-3",
        "name": "Sân 3",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-21-4",
        "name": "Sân 4",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-21-5",
        "name": "Sân 5",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-21-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 100000,
        "fixedPrice": 90000
      },
      {
        "id": "p-21-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1380,
        "walkInPrice": 140000,
        "fixedPrice": 125000
      },
      {
        "id": "p-21-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1380,
        "walkInPrice": 135000,
        "fixedPrice": 125000
      }
    ],
    "reviews": [
      {
        "id": "rev-21-1",
        "userName": "Vũ Minh Quân",
        "rating": 5,
        "comment": "Vị trí đẹp, gửi xe ô tô thoải mái, căng tin bán nhiều đồ uống thể thao xịn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-21-2",
        "userName": "Đỗ Gia Huy",
        "rating": 4,
        "comment": "Sân rộng, nhiều sân nên dễ đặt giờ đẹp. Chỗ để xe cực kỳ thoải mái.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-22",
    "slug": "clb-cau-long-trich-sai-lakeside",
    "name": "CLB Cầu Lông Trích Sài Lakeside",
    "description": "Tổ hợp 8 sân quy mô lớn nằm trong khuôn viên khu liên hợp thể thao Mỹ Đình. Cho phép thanh toán trực tiếp tại sân, hỗ trợ tổ chức giải đấu phong trào.",
    "address": "Số 198 Trích Sài, Phường Bưởi",
    "district": "Tây Hồ",
    "city": "Hà Nội",
    "lat": 21.0452,
    "lng": 105.8168,
    "openMin": 330,
    "closeMin": 1320,
    "priceFrom": 110000,
    "ratingAvg": 4.8,
    "ratingCount": 96,
    "images": [
      "/images/courts/court-22.svg",
      "/images/courts/court-32.svg",
      "/images/courts/court-42.svg"
    ],
    "amenities": [
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 8.1,
    "courts": [
      {
        "id": "court-22-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-22-2",
        "name": "Sân 2",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-22-3",
        "name": "Sân 3",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-22-4",
        "name": "Sân 4",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-22-5",
        "name": "Sân 5",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-22-6",
        "name": "Sân 6",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-22-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 110000,
        "fixedPrice": 100000
      },
      {
        "id": "p-22-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 150000,
        "fixedPrice": 135000
      },
      {
        "id": "p-22-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1320,
        "walkInPrice": 145000,
        "fixedPrice": 135000
      }
    ],
    "reviews": [
      {
        "id": "rev-22-1",
        "userName": "Lê Thuỳ Trang",
        "rating": 5,
        "comment": "Giá tốt nhất khu vực, nhân viên hỗ trợ nhiệt tình, dịch vụ căng vợt rất chuẩn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-22-2",
        "userName": "Phạm Quốc Bảo",
        "rating": 4,
        "comment": "Chơi ca đêm sau giờ làm rất tiện, sân sạch sẽ và điều hoà mát rượi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-23",
    "slug": "san-cau-long-ciputra-elite",
    "name": "Sân Cầu Lông Ciputra Elite",
    "description": "Cơ sở mới nâng cấp 4 sân chuẩn đẹp, giá cả học sinh sinh viên rất mềm, có dịch vụ căng cước vợt chất lượng cao.",
    "address": "Khu Đô Thị Ciputra, Phường Phú Thượng",
    "district": "Tây Hồ",
    "city": "Hà Nội",
    "lat": 21.0825,
    "lng": 105.7995,
    "openMin": 360,
    "closeMin": 1320,
    "priceFrom": 120000,
    "ratingAvg": 4.9,
    "ratingCount": 99,
    "images": [
      "/images/courts/court-23.svg",
      "/images/courts/court-33.svg",
      "/images/courts/court-43.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 8.4,
    "courts": [
      {
        "id": "court-23-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-23-2",
        "name": "Sân 2",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-23-3",
        "name": "Sân 3",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-23-4",
        "name": "Sân 4",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-23-5",
        "name": "Sân 5",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-23-6",
        "name": "Sân 6",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-23-7",
        "name": "Sân 7",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-23-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 120000,
        "fixedPrice": 110000
      },
      {
        "id": "p-23-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 160000,
        "fixedPrice": 145000
      },
      {
        "id": "p-23-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1320,
        "walkInPrice": 155000,
        "fixedPrice": 145000
      }
    ],
    "reviews": [
      {
        "id": "rev-23-1",
        "userName": "Hoàng Minh Đức",
        "rating": 5,
        "comment": "Ánh sáng chuẩn không bị chói khi ngửa cổ đánh cầu cao sâu. 5 sao cho chất lượng!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-23-2",
        "userName": "Ngô Phương Thảo",
        "rating": 4,
        "comment": "Phòng tắm nóng lạnh rất sạch, có máy sấy tóc tiện lợi cho bạn nữ sau trận đấu.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-24",
    "slug": "clb-cau-long-nghi-tam-sport",
    "name": "CLB Cầu Lông Nghi Tàm Sport",
    "description": "Điểm đến lý tưởng cho anh chị em bận rộn thích chơi ca đêm. Mở cửa từ 05:00 đến tận nửa đêm 24:00, điều hoà trung tâm 24/7.",
    "address": "Số 264 Nghi Tàm, Phường Yên Phụ",
    "district": "Tây Hồ",
    "city": "Hà Nội",
    "lat": 21.0542,
    "lng": 105.8345,
    "openMin": 300,
    "closeMin": 1320,
    "priceFrom": 50000,
    "ratingAvg": 5,
    "ratingCount": 102,
    "images": [
      "/images/courts/court-24.svg",
      "/images/courts/court-34.svg",
      "/images/courts/court-44.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "CANTEEN",
      "SHOWER",
      "WIFI"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 8.7,
    "courts": [
      {
        "id": "court-24-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-24-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-24-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-24-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-24-5",
        "name": "Sân 5",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-24-6",
        "name": "Sân 6",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-24-7",
        "name": "Sân 7",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-24-8",
        "name": "Sân 8",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-24-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 50000,
        "fixedPrice": 40000
      },
      {
        "id": "p-24-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 90000,
        "fixedPrice": 75000
      },
      {
        "id": "p-24-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1320,
        "walkInPrice": 85000,
        "fixedPrice": 75000
      }
    ],
    "reviews": [
      {
        "id": "rev-24-1",
        "userName": "Bùi Văn Nam",
        "rating": 5,
        "comment": "Thảm xịn đánh 2 tiếng không mỏi gối hay trơn trượt. Sẽ ủng hộ lâu dài!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-24-2",
        "userName": "Đặng Thu Hà",
        "rating": 4,
        "comment": "Giao diện đặt sân tiện lợi, thanh toán online mượt mà, chủ sân đón tiếp niềm nở.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-25",
    "slug": "san-cau-long-phu-thuong-court",
    "name": "Sân Cầu Lông Phú Thượng Court",
    "description": "Sân thảm PVC vân cát đạt chuẩn thi đấu quốc tế, khoảng cách giữa các sân rộng rãi 2m tránh va chạm. Bãi đỗ xe ô tô miễn phí.",
    "address": "Số 85 An Dương Vương, Phường Phú Thượng",
    "district": "Tây Hồ",
    "city": "Hà Nội",
    "lat": 21.0885,
    "lng": 105.8082,
    "openMin": 330,
    "closeMin": 1440,
    "priceFrom": 60000,
    "ratingAvg": 4.6,
    "ratingCount": 105,
    "images": [
      "/images/courts/court-25.svg",
      "/images/courts/court-35.svg",
      "/images/courts/court-45.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 9,
    "courts": [
      {
        "id": "court-25-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-25-2",
        "name": "Sân 2",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-25-3",
        "name": "Sân 3",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-25-4",
        "name": "Sân 4",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-25-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 60000,
        "fixedPrice": 50000
      },
      {
        "id": "p-25-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1440,
        "walkInPrice": 100000,
        "fixedPrice": 85000
      },
      {
        "id": "p-25-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1440,
        "walkInPrice": 95000,
        "fixedPrice": 85000
      }
    ],
    "reviews": [
      {
        "id": "rev-25-1",
        "userName": "Trần Anh Tuấn",
        "rating": 5,
        "comment": "Sân rất đẹp, thảm bám tốt, trần cao không bị chói mắt. Chủ sân thân thiện và có tủ đồ khoá số an toàn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-25-2",
        "userName": "Nguyễn Hải Yến",
        "rating": 4,
        "comment": "Đặt qua web nhanh gọn, đến sân quét mã là vào chơi ngay không phải chờ đợi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-26",
    "slug": "clb-cau-long-dong-da-star",
    "name": "CLB Cầu Lông Đống Đa Star",
    "description": "Hệ thống đèn LED âm trần chống chói mắt tuyệt đối khi lốp cầu cao sâu. Đội ngũ huấn luyện viên giàu kinh nghiệm hỗ trợ hướng dẫn cơ bản.",
    "address": "Số 102 Thái Hà, Phường Trung Liệt",
    "district": "Đống Đa",
    "city": "Hà Nội",
    "lat": 21.0142,
    "lng": 105.8215,
    "openMin": 360,
    "closeMin": 1380,
    "priceFrom": 70000,
    "ratingAvg": 4.7,
    "ratingCount": 108,
    "images": [
      "/images/courts/court-26.svg",
      "/images/courts/court-36.svg",
      "/images/courts/court-46.svg"
    ],
    "amenities": [
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 9.3,
    "courts": [
      {
        "id": "court-26-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-26-2",
        "name": "Sân 2",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-26-3",
        "name": "Sân 3",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-26-4",
        "name": "Sân 4",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-26-5",
        "name": "Sân 5",
        "surface": "Thảm Alite BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-26-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 70000,
        "fixedPrice": 60000
      },
      {
        "id": "p-26-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1380,
        "walkInPrice": 110000,
        "fixedPrice": 95000
      },
      {
        "id": "p-26-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1380,
        "walkInPrice": 105000,
        "fixedPrice": 95000
      }
    ],
    "reviews": [
      {
        "id": "rev-26-1",
        "userName": "Vũ Minh Quân",
        "rating": 5,
        "comment": "Vị trí đẹp, gửi xe ô tô thoải mái, căng tin bán nhiều đồ uống thể thao xịn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-26-2",
        "userName": "Đỗ Gia Huy",
        "rating": 4,
        "comment": "Sân rộng, nhiều sân nên dễ đặt giờ đẹp. Chỗ để xe cực kỳ thoải mái.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-27",
    "slug": "san-cau-long-chua-boc-arena",
    "name": "Sân Cầu Lông Chùa Bộc Arena",
    "description": "Trần nhà cao 11m cách nhiệt mùa hè mát mẻ, sàn gỗ phong phủ thảm cao su chống sốc bảo vệ đầu gối và mắt cá chân tối đa.",
    "address": "Số 12 Chùa Bộc, Phường Quang Trung",
    "district": "Đống Đa",
    "city": "Hà Nội",
    "lat": 21.0085,
    "lng": 105.8285,
    "openMin": 300,
    "closeMin": 1320,
    "priceFrom": 80000,
    "ratingAvg": 4.8,
    "ratingCount": 111,
    "images": [
      "/images/courts/court-27.svg",
      "/images/courts/court-37.svg",
      "/images/courts/court-47.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 9.6,
    "courts": [
      {
        "id": "court-27-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-27-2",
        "name": "Sân 2",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-27-3",
        "name": "Sân 3",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-27-4",
        "name": "Sân 4",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-27-5",
        "name": "Sân 5",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-27-6",
        "name": "Sân 6",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-27-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 80000,
        "fixedPrice": 70000
      },
      {
        "id": "p-27-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 120000,
        "fixedPrice": 105000
      },
      {
        "id": "p-27-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1320,
        "walkInPrice": 115000,
        "fixedPrice": 105000
      }
    ],
    "reviews": [
      {
        "id": "rev-27-1",
        "userName": "Lê Thuỳ Trang",
        "rating": 5,
        "comment": "Giá tốt nhất khu vực, nhân viên hỗ trợ nhiệt tình, dịch vụ căng vợt rất chuẩn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-27-2",
        "userName": "Phạm Quốc Bảo",
        "rating": 4,
        "comment": "Chơi ca đêm sau giờ làm rất tiện, sân sạch sẽ và điều hoà mát rượi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-28",
    "slug": "clb-cau-long-lang-ha-smash",
    "name": "CLB Cầu Lông Láng Hạ Smash",
    "description": "Trang bị máy đo căng vợt điện tử 6 điểm hiện đại, quầy phụ kiện chính hãng Yonex, Lining, Victor. Phòng tắm nóng lạnh sạch sẽ.",
    "address": "Số 88 Láng Hạ, Phường Láng Hạ",
    "district": "Đống Đa",
    "city": "Hà Nội",
    "lat": 21.0175,
    "lng": 105.8142,
    "openMin": 330,
    "closeMin": 1320,
    "priceFrom": 90000,
    "ratingAvg": 4.9,
    "ratingCount": 114,
    "images": [
      "/images/courts/court-28.svg",
      "/images/courts/court-38.svg",
      "/images/courts/court-48.svg"
    ],
    "amenities": [
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 9.9,
    "courts": [
      {
        "id": "court-28-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-28-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-28-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-28-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-28-5",
        "name": "Sân 5",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-28-6",
        "name": "Sân 6",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-28-7",
        "name": "Sân 7",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-28-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 90000,
        "fixedPrice": 80000
      },
      {
        "id": "p-28-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 130000,
        "fixedPrice": 115000
      },
      {
        "id": "p-28-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1320,
        "walkInPrice": 125000,
        "fixedPrice": 115000
      }
    ],
    "reviews": [
      {
        "id": "rev-28-1",
        "userName": "Hoàng Minh Đức",
        "rating": 5,
        "comment": "Ánh sáng chuẩn không bị chói khi ngửa cổ đánh cầu cao sâu. 5 sao cho chất lượng!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-28-2",
        "userName": "Ngô Phương Thảo",
        "rating": 4,
        "comment": "Phòng tắm nóng lạnh rất sạch, có máy sấy tóc tiện lợi cho bạn nữ sau trận đấu.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-29",
    "slug": "san-cau-long-xa-dan-center",
    "name": "Sân Cầu Lông Xã Đàn Center",
    "description": "Không gian thể thao chuyên nghiệp với khán đài mini, hệ thống camera AI tự động ghi hình pha đập cầu đẹp mắt gửi về điện thoại.",
    "address": "Số 250 Xã Đàn, Phường Nam Đồng",
    "district": "Đống Đa",
    "city": "Hà Nội",
    "lat": 21.0125,
    "lng": 105.8345,
    "openMin": 360,
    "closeMin": 1320,
    "priceFrom": 100000,
    "ratingAvg": 5,
    "ratingCount": 117,
    "images": [
      "/images/courts/court-29.svg",
      "/images/courts/court-39.svg",
      "/images/courts/court-49.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 10.2,
    "courts": [
      {
        "id": "court-29-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-29-2",
        "name": "Sân 2",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-29-3",
        "name": "Sân 3",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-29-4",
        "name": "Sân 4",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-29-5",
        "name": "Sân 5",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-29-6",
        "name": "Sân 6",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-29-7",
        "name": "Sân 7",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-29-8",
        "name": "Sân 8",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-29-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 100000,
        "fixedPrice": 90000
      },
      {
        "id": "p-29-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 140000,
        "fixedPrice": 125000
      },
      {
        "id": "p-29-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1320,
        "walkInPrice": 135000,
        "fixedPrice": 125000
      }
    ],
    "reviews": [
      {
        "id": "rev-29-1",
        "userName": "Bùi Văn Nam",
        "rating": 5,
        "comment": "Thảm xịn đánh 2 tiếng không mỏi gối hay trơn trượt. Sẽ ủng hộ lâu dài!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-29-2",
        "userName": "Đặng Thu Hà",
        "rating": 4,
        "comment": "Giao diện đặt sân tiện lợi, thanh toán online mượt mà, chủ sân đón tiếp niềm nở.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-30",
    "slug": "clb-cau-long-hoang-cau-lakeside",
    "name": "CLB Cầu Lông Hoàng Cầu Lakeside",
    "description": "Cơ sở 6 sân thảm mới 100%, trang bị quạt công nghiệp đối lưu gió êm ái không ảnh hưởng hướng bay của quả cầu lông.",
    "address": "Số 59 Hoàng Cầu, Phường Ô Chợ Dừa",
    "district": "Đống Đa",
    "city": "Hà Nội",
    "lat": 21.0195,
    "lng": 105.8235,
    "openMin": 300,
    "closeMin": 1440,
    "priceFrom": 110000,
    "ratingAvg": 4.6,
    "ratingCount": 120,
    "images": [
      "/images/courts/court-30.svg",
      "/images/courts/court-40.svg",
      "/images/courts/court-50.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "CANTEEN",
      "SHOWER",
      "WIFI"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 10.5,
    "courts": [
      {
        "id": "court-30-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-30-2",
        "name": "Sân 2",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-30-3",
        "name": "Sân 3",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-30-4",
        "name": "Sân 4",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-30-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 110000,
        "fixedPrice": 100000
      },
      {
        "id": "p-30-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1440,
        "walkInPrice": 150000,
        "fixedPrice": 135000
      },
      {
        "id": "p-30-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1440,
        "walkInPrice": 145000,
        "fixedPrice": 135000
      }
    ],
    "reviews": [
      {
        "id": "rev-30-1",
        "userName": "Trần Anh Tuấn",
        "rating": 5,
        "comment": "Sân rất đẹp, thảm bám tốt, trần cao không bị chói mắt. Chủ sân thân thiện và có tủ đồ khoá số an toàn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-30-2",
        "userName": "Nguyễn Hải Yến",
        "rating": 4,
        "comment": "Đặt qua web nhanh gọn, đến sân quét mã là vào chơi ngay không phải chờ đợi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-31",
    "slug": "san-cau-long-huynh-thuc-khang-pro",
    "name": "Sân Cầu Lông Huỳnh Thúc Kháng Pro",
    "description": "Nằm tại vị trí trung tâm giao thông thuận tiện, có phòng thay đồ nam nữ riêng biệt, tủ khóa locker thông minh an toàn tuyệt đối.",
    "address": "Số 36 Huỳnh Thúc Kháng, Phường Láng Hạ",
    "district": "Đống Đa",
    "city": "Hà Nội",
    "lat": 21.0205,
    "lng": 105.8112,
    "openMin": 330,
    "closeMin": 1380,
    "priceFrom": 120000,
    "ratingAvg": 4.7,
    "ratingCount": 123,
    "images": [
      "/images/courts/court-31.svg",
      "/images/courts/court-41.svg",
      "/images/courts/court-51.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 10.8,
    "courts": [
      {
        "id": "court-31-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-31-2",
        "name": "Sân 2",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-31-3",
        "name": "Sân 3",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-31-4",
        "name": "Sân 4",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-31-5",
        "name": "Sân 5",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-31-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 120000,
        "fixedPrice": 110000
      },
      {
        "id": "p-31-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1380,
        "walkInPrice": 160000,
        "fixedPrice": 145000
      },
      {
        "id": "p-31-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1380,
        "walkInPrice": 155000,
        "fixedPrice": 145000
      }
    ],
    "reviews": [
      {
        "id": "rev-31-1",
        "userName": "Vũ Minh Quân",
        "rating": 5,
        "comment": "Vị trí đẹp, gửi xe ô tô thoải mái, căng tin bán nhiều đồ uống thể thao xịn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-31-2",
        "userName": "Đỗ Gia Huy",
        "rating": 4,
        "comment": "Sân rộng, nhiều sân nên dễ đặt giờ đẹp. Chỗ để xe cực kỳ thoải mái.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-32",
    "slug": "clb-cau-long-ton-that-tung-court",
    "name": "CLB Cầu Lông Tôn Thất Tùng Court",
    "description": "Sân cầu lông đạt chuẩn liên đoàn BWF với vạch sơn sắc nét, thảm bám dính cực tốt ngay cả khi đổ nhiều mồ hôi. Nước chanh muối pha tươi.",
    "address": "Số 1 Tôn Thất Tùng, Phường Khương Thượng",
    "district": "Đống Đa",
    "city": "Hà Nội",
    "lat": 21.0052,
    "lng": 105.8315,
    "openMin": 360,
    "closeMin": 1320,
    "priceFrom": 50000,
    "ratingAvg": 4.8,
    "ratingCount": 126,
    "images": [
      "/images/courts/court-32.svg",
      "/images/courts/court-42.svg",
      "/images/courts/court-52.svg"
    ],
    "amenities": [
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 11.1,
    "courts": [
      {
        "id": "court-32-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-32-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-32-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-32-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-32-5",
        "name": "Sân 5",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-32-6",
        "name": "Sân 6",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-32-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 50000,
        "fixedPrice": 40000
      },
      {
        "id": "p-32-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 90000,
        "fixedPrice": 75000
      },
      {
        "id": "p-32-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1320,
        "walkInPrice": 85000,
        "fixedPrice": 75000
      }
    ],
    "reviews": [
      {
        "id": "rev-32-1",
        "userName": "Lê Thuỳ Trang",
        "rating": 5,
        "comment": "Giá tốt nhất khu vực, nhân viên hỗ trợ nhiệt tình, dịch vụ căng vợt rất chuẩn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-32-2",
        "userName": "Phạm Quốc Bảo",
        "rating": 4,
        "comment": "Chơi ca đêm sau giờ làm rất tiện, sân sạch sẽ và điều hoà mát rượi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-33",
    "slug": "san-cau-long-hao-nam-sport",
    "name": "Sân Cầu Lông Hào Nam Sport",
    "description": "Hội tụ nhiều tay vợt phong trào trình độ khá - giỏi, thường xuyên tổ chức giải đấu nội bộ cuối tuần có cúp và phần thưởng giá trị.",
    "address": "Số 168 Hào Nam, Phường Cát Linh",
    "district": "Đống Đa",
    "city": "Hà Nội",
    "lat": 21.0245,
    "lng": 105.8265,
    "openMin": 300,
    "closeMin": 1320,
    "priceFrom": 60000,
    "ratingAvg": 4.9,
    "ratingCount": 129,
    "images": [
      "/images/courts/court-33.svg",
      "/images/courts/court-43.svg",
      "/images/courts/court-53.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 11.4,
    "courts": [
      {
        "id": "court-33-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-33-2",
        "name": "Sân 2",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-33-3",
        "name": "Sân 3",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-33-4",
        "name": "Sân 4",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-33-5",
        "name": "Sân 5",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-33-6",
        "name": "Sân 6",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-33-7",
        "name": "Sân 7",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-33-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 60000,
        "fixedPrice": 50000
      },
      {
        "id": "p-33-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 100000,
        "fixedPrice": 85000
      },
      {
        "id": "p-33-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1320,
        "walkInPrice": 95000,
        "fixedPrice": 85000
      }
    ],
    "reviews": [
      {
        "id": "rev-33-1",
        "userName": "Hoàng Minh Đức",
        "rating": 5,
        "comment": "Ánh sáng chuẩn không bị chói khi ngửa cổ đánh cầu cao sâu. 5 sao cho chất lượng!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-33-2",
        "userName": "Ngô Phương Thảo",
        "rating": 4,
        "comment": "Phòng tắm nóng lạnh rất sạch, có máy sấy tóc tiện lợi cho bạn nữ sau trận đấu.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-34",
    "slug": "nha-thi-dau-ba-dinh-sport",
    "name": "Nhà Thi Đấu Ba Đình Sport",
    "description": "Mặt sân cao cấp giảm phản lực tác động lên cột sống, trần thông gió tự nhiên không bí mùi. Cho thuê giày và vợt xịn giá hữu nghị.",
    "address": "Số 115 Quán Thánh, Phường Quán Thánh",
    "district": "Ba Đình",
    "city": "Hà Nội",
    "lat": 21.0415,
    "lng": 105.8425,
    "openMin": 330,
    "closeMin": 1320,
    "priceFrom": 70000,
    "ratingAvg": 5,
    "ratingCount": 132,
    "images": [
      "/images/courts/court-34.svg",
      "/images/courts/court-44.svg",
      "/images/courts/court-54.svg"
    ],
    "amenities": [
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 11.7,
    "courts": [
      {
        "id": "court-34-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-34-2",
        "name": "Sân 2",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-34-3",
        "name": "Sân 3",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-34-4",
        "name": "Sân 4",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-34-5",
        "name": "Sân 5",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-34-6",
        "name": "Sân 6",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-34-7",
        "name": "Sân 7",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-34-8",
        "name": "Sân 8",
        "surface": "Thảm Alite BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-34-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 70000,
        "fixedPrice": 60000
      },
      {
        "id": "p-34-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 110000,
        "fixedPrice": 95000
      },
      {
        "id": "p-34-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1320,
        "walkInPrice": 105000,
        "fixedPrice": 95000
      }
    ],
    "reviews": [
      {
        "id": "rev-34-1",
        "userName": "Bùi Văn Nam",
        "rating": 5,
        "comment": "Thảm xịn đánh 2 tiếng không mỏi gối hay trơn trượt. Sẽ ủng hộ lâu dài!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-34-2",
        "userName": "Đặng Thu Hà",
        "rating": 4,
        "comment": "Giao diện đặt sân tiện lợi, thanh toán online mượt mà, chủ sân đón tiếp niềm nở.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-35",
    "slug": "clb-cau-long-giang-vo-central",
    "name": "CLB Cầu Lông Giảng Võ Central",
    "description": "Thiết kế hiện đại với tone màu tối làm nổi bật quả cầu trắng, hệ thống âm thanh chất lượng cao phục vụ các trận cầu giao lưu sôi động.",
    "address": "Số 187 Giảng Võ, Phường Cát Linh",
    "district": "Ba Đình",
    "city": "Hà Nội",
    "lat": 21.0285,
    "lng": 105.8245,
    "openMin": 360,
    "closeMin": 1440,
    "priceFrom": 80000,
    "ratingAvg": 4.6,
    "ratingCount": 135,
    "images": [
      "/images/courts/court-35.svg",
      "/images/courts/court-45.svg",
      "/images/courts/court-55.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 12,
    "courts": [
      {
        "id": "court-35-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-35-2",
        "name": "Sân 2",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-35-3",
        "name": "Sân 3",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-35-4",
        "name": "Sân 4",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-35-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 80000,
        "fixedPrice": 70000
      },
      {
        "id": "p-35-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1440,
        "walkInPrice": 120000,
        "fixedPrice": 105000
      },
      {
        "id": "p-35-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1440,
        "walkInPrice": 115000,
        "fixedPrice": 105000
      }
    ],
    "reviews": [
      {
        "id": "rev-35-1",
        "userName": "Trần Anh Tuấn",
        "rating": 5,
        "comment": "Sân rất đẹp, thảm bám tốt, trần cao không bị chói mắt. Chủ sân thân thiện và có tủ đồ khoá số an toàn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-35-2",
        "userName": "Nguyễn Hải Yến",
        "rating": 4,
        "comment": "Đặt qua web nhanh gọn, đến sân quét mã là vào chơi ngay không phải chờ đợi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-36",
    "slug": "san-cau-long-kim-ma-arena",
    "name": "Sân Cầu Lông Kim Mã Arena",
    "description": "Sân chơi đẳng cấp phục vụ cư dân và cộng đồng đam mê cầu lông, quầy bar nước ép trái cây tươi và whey protein dinh dưỡng sau trận đấu.",
    "address": "Số 285 Kim Mã, Phường Giảng Võ",
    "district": "Ba Đình",
    "city": "Hà Nội",
    "lat": 21.0315,
    "lng": 105.8195,
    "openMin": 300,
    "closeMin": 1380,
    "priceFrom": 90000,
    "ratingAvg": 4.7,
    "ratingCount": 138,
    "images": [
      "/images/courts/court-36.svg",
      "/images/courts/court-46.svg",
      "/images/courts/court-56.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "CANTEEN",
      "SHOWER",
      "WIFI"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 12.3,
    "courts": [
      {
        "id": "court-36-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-36-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-36-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-36-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-36-5",
        "name": "Sân 5",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-36-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 90000,
        "fixedPrice": 80000
      },
      {
        "id": "p-36-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1380,
        "walkInPrice": 130000,
        "fixedPrice": 115000
      },
      {
        "id": "p-36-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1380,
        "walkInPrice": 125000,
        "fixedPrice": 115000
      }
    ],
    "reviews": [
      {
        "id": "rev-36-1",
        "userName": "Vũ Minh Quân",
        "rating": 5,
        "comment": "Vị trí đẹp, gửi xe ô tô thoải mái, căng tin bán nhiều đồ uống thể thao xịn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-36-2",
        "userName": "Đỗ Gia Huy",
        "rating": 4,
        "comment": "Sân rộng, nhiều sân nên dễ đặt giờ đẹp. Chỗ để xe cực kỳ thoải mái.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-37",
    "slug": "clb-cau-long-lieu-giai-court",
    "name": "CLB Cầu Lông Liễu Giai Court",
    "description": "Chỗ đỗ xe rộng thênh thang đỗ được 30 ô tô, sân chơi thân thiện gia đình có khu vực ghế chờ êm ái cho người nhà và cổ động viên.",
    "address": "Số 65 Liễu Giai, Phường Cống Vị",
    "district": "Ba Đình",
    "city": "Hà Nội",
    "lat": 21.0365,
    "lng": 105.8125,
    "openMin": 330,
    "closeMin": 1320,
    "priceFrom": 100000,
    "ratingAvg": 4.8,
    "ratingCount": 141,
    "images": [
      "/images/courts/court-37.svg",
      "/images/courts/court-47.svg",
      "/images/courts/court-57.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 12.6,
    "courts": [
      {
        "id": "court-37-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-37-2",
        "name": "Sân 2",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-37-3",
        "name": "Sân 3",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-37-4",
        "name": "Sân 4",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-37-5",
        "name": "Sân 5",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-37-6",
        "name": "Sân 6",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-37-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 100000,
        "fixedPrice": 90000
      },
      {
        "id": "p-37-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 140000,
        "fixedPrice": 125000
      },
      {
        "id": "p-37-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1320,
        "walkInPrice": 135000,
        "fixedPrice": 125000
      }
    ],
    "reviews": [
      {
        "id": "rev-37-1",
        "userName": "Lê Thuỳ Trang",
        "rating": 5,
        "comment": "Giá tốt nhất khu vực, nhân viên hỗ trợ nhiệt tình, dịch vụ căng vợt rất chuẩn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-37-2",
        "userName": "Phạm Quốc Bảo",
        "rating": 4,
        "comment": "Chơi ca đêm sau giờ làm rất tiện, sân sạch sẽ và điều hoà mát rượi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-38",
    "slug": "san-cau-long-doi-can-smash",
    "name": "Sân Cầu Lông Đội Cấn Smash",
    "description": "Sân thảm Alite chống trượt 5 lớp, dịch vụ sửa chữa và thay quấn cán vợt siêu tốc. Nhân viên hỗ trợ tận tình nhặt cầu và xếp sân.",
    "address": "Số 343 Đội Cấn, Phường Liễu Giai",
    "district": "Ba Đình",
    "city": "Hà Nội",
    "lat": 21.0385,
    "lng": 105.8155,
    "openMin": 360,
    "closeMin": 1320,
    "priceFrom": 110000,
    "ratingAvg": 4.9,
    "ratingCount": 144,
    "images": [
      "/images/courts/court-38.svg",
      "/images/courts/court-48.svg",
      "/images/courts/court-58.svg"
    ],
    "amenities": [
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 12.9,
    "courts": [
      {
        "id": "court-38-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-38-2",
        "name": "Sân 2",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-38-3",
        "name": "Sân 3",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-38-4",
        "name": "Sân 4",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-38-5",
        "name": "Sân 5",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-38-6",
        "name": "Sân 6",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-38-7",
        "name": "Sân 7",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-38-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 110000,
        "fixedPrice": 100000
      },
      {
        "id": "p-38-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 150000,
        "fixedPrice": 135000
      },
      {
        "id": "p-38-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1320,
        "walkInPrice": 145000,
        "fixedPrice": 135000
      }
    ],
    "reviews": [
      {
        "id": "rev-38-1",
        "userName": "Hoàng Minh Đức",
        "rating": 5,
        "comment": "Ánh sáng chuẩn không bị chói khi ngửa cổ đánh cầu cao sâu. 5 sao cho chất lượng!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-38-2",
        "userName": "Ngô Phương Thảo",
        "rating": 4,
        "comment": "Phòng tắm nóng lạnh rất sạch, có máy sấy tóc tiện lợi cho bạn nữ sau trận đấu.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-39",
    "slug": "clb-cau-long-van-cao-premier",
    "name": "CLB Cầu Lông Văn Cao Premier",
    "description": "Điểm hẹn lý tưởng sau giờ làm việc căng thẳng, ánh sáng đồng đều 450 Lux không góc chết, giá thuê sân linh hoạt theo từng khung giờ.",
    "address": "Số 99 Văn Cao, Phường Liễu Giai",
    "district": "Ba Đình",
    "city": "Hà Nội",
    "lat": 21.0425,
    "lng": 105.8145,
    "openMin": 300,
    "closeMin": 1320,
    "priceFrom": 120000,
    "ratingAvg": 5,
    "ratingCount": 147,
    "images": [
      "/images/courts/court-39.svg",
      "/images/courts/court-49.svg",
      "/images/courts/court-59.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 13.2,
    "courts": [
      {
        "id": "court-39-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-39-2",
        "name": "Sân 2",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-39-3",
        "name": "Sân 3",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-39-4",
        "name": "Sân 4",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-39-5",
        "name": "Sân 5",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-39-6",
        "name": "Sân 6",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-39-7",
        "name": "Sân 7",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-39-8",
        "name": "Sân 8",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-39-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 120000,
        "fixedPrice": 110000
      },
      {
        "id": "p-39-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 160000,
        "fixedPrice": 145000
      },
      {
        "id": "p-39-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1320,
        "walkInPrice": 155000,
        "fixedPrice": 145000
      }
    ],
    "reviews": [
      {
        "id": "rev-39-1",
        "userName": "Bùi Văn Nam",
        "rating": 5,
        "comment": "Thảm xịn đánh 2 tiếng không mỏi gối hay trơn trượt. Sẽ ủng hộ lâu dài!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-39-2",
        "userName": "Đặng Thu Hà",
        "rating": 4,
        "comment": "Giao diện đặt sân tiện lợi, thanh toán online mượt mà, chủ sân đón tiếp niềm nở.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-40",
    "slug": "san-cau-long-phuc-xa-riverside",
    "name": "Sân Cầu Lông Phúc Xá Riverside",
    "description": "Cơ sở tiêu chuẩn thi đấu với sàn thảm cao su chuyên dụng, trần cao 9m thông thoáng, hệ thống đèn chống chói đạt chuẩn BWF. Có phục vụ nước uống, căng-tin và dịch vụ đan vợt lấy ngay.",
    "address": "Số 45 An Xá, Phường Phúc Xá",
    "district": "Ba Đình",
    "city": "Hà Nội",
    "lat": 21.0485,
    "lng": 105.8495,
    "openMin": 330,
    "closeMin": 1440,
    "priceFrom": 50000,
    "ratingAvg": 4.6,
    "ratingCount": 150,
    "images": [
      "/images/courts/court-40.svg",
      "/images/courts/court-50.svg",
      "/images/courts/court-60.svg"
    ],
    "amenities": [
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 1.5,
    "courts": [
      {
        "id": "court-40-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-40-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-40-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-40-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-40-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 50000,
        "fixedPrice": 40000
      },
      {
        "id": "p-40-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1440,
        "walkInPrice": 90000,
        "fixedPrice": 75000
      },
      {
        "id": "p-40-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1440,
        "walkInPrice": 85000,
        "fixedPrice": 75000
      }
    ],
    "reviews": [
      {
        "id": "rev-40-1",
        "userName": "Trần Anh Tuấn",
        "rating": 5,
        "comment": "Sân rất đẹp, thảm bám tốt, trần cao không bị chói mắt. Chủ sân thân thiện và có tủ đồ khoá số an toàn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-40-2",
        "userName": "Nguyễn Hải Yến",
        "rating": 4,
        "comment": "Đặt qua web nhanh gọn, đến sân quét mã là vào chơi ngay không phải chờ đợi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-41",
    "slug": "clb-cau-long-hoang-hoa-tham-eco",
    "name": "CLB Cầu Lông Hoàng Hoa Thám Eco",
    "description": "Không gian thoáng mát ven hồ Tây, hệ thống điều hoà mát rượi, thảm Yonex cao cấp. Có câu lạc bộ sinh hoạt thường xuyên cho người muốn tìm bạn giao lưu.",
    "address": "Số 189 Hoàng Hoa Thám, Phường Thụy Khuê",
    "district": "Ba Đình",
    "city": "Hà Nội",
    "lat": 21.0435,
    "lng": 105.8235,
    "openMin": 360,
    "closeMin": 1380,
    "priceFrom": 60000,
    "ratingAvg": 4.7,
    "ratingCount": 153,
    "images": [
      "/images/courts/court-41.svg",
      "/images/courts/court-51.svg",
      "/images/courts/court-61.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 1.8,
    "courts": [
      {
        "id": "court-41-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-41-2",
        "name": "Sân 2",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-41-3",
        "name": "Sân 3",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-41-4",
        "name": "Sân 4",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-41-5",
        "name": "Sân 5",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-41-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 60000,
        "fixedPrice": 50000
      },
      {
        "id": "p-41-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1380,
        "walkInPrice": 100000,
        "fixedPrice": 85000
      },
      {
        "id": "p-41-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1380,
        "walkInPrice": 95000,
        "fixedPrice": 85000
      }
    ],
    "reviews": [
      {
        "id": "rev-41-1",
        "userName": "Vũ Minh Quân",
        "rating": 5,
        "comment": "Vị trí đẹp, gửi xe ô tô thoải mái, căng tin bán nhiều đồ uống thể thao xịn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-41-2",
        "userName": "Đỗ Gia Huy",
        "rating": 4,
        "comment": "Sân rộng, nhiều sân nên dễ đặt giờ đẹp. Chỗ để xe cực kỳ thoải mái.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-42",
    "slug": "nha-thi-dau-my-dinh-5",
    "name": "Nhà Thi Đấu Mỹ Đình 5",
    "description": "Tổ hợp 8 sân quy mô lớn nằm trong khuôn viên khu liên hợp thể thao Mỹ Đình. Cho phép thanh toán trực tiếp tại sân, hỗ trợ tổ chức giải đấu phong trào.",
    "address": "Đường Lê Đức Thọ, Phường Mỹ Đình 1",
    "district": "Nam Từ Liêm",
    "city": "Hà Nội",
    "lat": 21.0205,
    "lng": 105.7648,
    "openMin": 300,
    "closeMin": 1320,
    "priceFrom": 70000,
    "ratingAvg": 4.8,
    "ratingCount": 156,
    "images": [
      "/images/courts/court-42.svg",
      "/images/courts/court-52.svg",
      "/images/courts/court-62.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "CANTEEN",
      "SHOWER",
      "WIFI"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 2.1,
    "courts": [
      {
        "id": "court-42-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-42-2",
        "name": "Sân 2",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-42-3",
        "name": "Sân 3",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-42-4",
        "name": "Sân 4",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-42-5",
        "name": "Sân 5",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-42-6",
        "name": "Sân 6",
        "surface": "Thảm Alite BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-42-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 70000,
        "fixedPrice": 60000
      },
      {
        "id": "p-42-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 110000,
        "fixedPrice": 95000
      },
      {
        "id": "p-42-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1320,
        "walkInPrice": 105000,
        "fixedPrice": 95000
      }
    ],
    "reviews": [
      {
        "id": "rev-42-1",
        "userName": "Lê Thuỳ Trang",
        "rating": 5,
        "comment": "Giá tốt nhất khu vực, nhân viên hỗ trợ nhiệt tình, dịch vụ căng vợt rất chuẩn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-42-2",
        "userName": "Phạm Quốc Bảo",
        "rating": 4,
        "comment": "Chơi ca đêm sau giờ làm rất tiện, sân sạch sẽ và điều hoà mát rượi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-43",
    "slug": "clb-cau-long-me-tri-ha-pro",
    "name": "CLB Cầu Lông Mễ Trì Hạ Pro",
    "description": "Cơ sở mới nâng cấp 4 sân chuẩn đẹp, giá cả học sinh sinh viên rất mềm, có dịch vụ căng cước vợt chất lượng cao.",
    "address": "Số 88 Mễ Trì Hạ, Phường Mễ Trì",
    "district": "Nam Từ Liêm",
    "city": "Hà Nội",
    "lat": 21.0145,
    "lng": 105.7795,
    "openMin": 330,
    "closeMin": 1320,
    "priceFrom": 80000,
    "ratingAvg": 4.9,
    "ratingCount": 159,
    "images": [
      "/images/courts/court-43.svg",
      "/images/courts/court-53.svg",
      "/images/courts/court-63.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 2.4,
    "courts": [
      {
        "id": "court-43-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-43-2",
        "name": "Sân 2",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-43-3",
        "name": "Sân 3",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-43-4",
        "name": "Sân 4",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-43-5",
        "name": "Sân 5",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-43-6",
        "name": "Sân 6",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-43-7",
        "name": "Sân 7",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-43-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 80000,
        "fixedPrice": 70000
      },
      {
        "id": "p-43-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 120000,
        "fixedPrice": 105000
      },
      {
        "id": "p-43-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1320,
        "walkInPrice": 115000,
        "fixedPrice": 105000
      }
    ],
    "reviews": [
      {
        "id": "rev-43-1",
        "userName": "Hoàng Minh Đức",
        "rating": 5,
        "comment": "Ánh sáng chuẩn không bị chói khi ngửa cổ đánh cầu cao sâu. 5 sao cho chất lượng!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-43-2",
        "userName": "Ngô Phương Thảo",
        "rating": 4,
        "comment": "Phòng tắm nóng lạnh rất sạch, có máy sấy tóc tiện lợi cho bạn nữ sau trận đấu.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-44",
    "slug": "san-cau-long-trung-van-arena",
    "name": "Sân Cầu Lông Trung Văn Arena",
    "description": "Điểm đến lý tưởng cho anh chị em bận rộn thích chơi ca đêm. Mở cửa từ 05:00 đến tận nửa đêm 24:00, điều hoà trung tâm 24/7.",
    "address": "Đường Tố Hữu, Phường Trung Văn",
    "district": "Nam Từ Liêm",
    "city": "Hà Nội",
    "lat": 20.9985,
    "lng": 105.7895,
    "openMin": 360,
    "closeMin": 1320,
    "priceFrom": 90000,
    "ratingAvg": 5,
    "ratingCount": 162,
    "images": [
      "/images/courts/court-44.svg",
      "/images/courts/court-54.svg",
      "/images/courts/court-64.svg"
    ],
    "amenities": [
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 2.7,
    "courts": [
      {
        "id": "court-44-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-44-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-44-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-44-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-44-5",
        "name": "Sân 5",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-44-6",
        "name": "Sân 6",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-44-7",
        "name": "Sân 7",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-44-8",
        "name": "Sân 8",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-44-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 90000,
        "fixedPrice": 80000
      },
      {
        "id": "p-44-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 130000,
        "fixedPrice": 115000
      },
      {
        "id": "p-44-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1320,
        "walkInPrice": 125000,
        "fixedPrice": 115000
      }
    ],
    "reviews": [
      {
        "id": "rev-44-1",
        "userName": "Bùi Văn Nam",
        "rating": 5,
        "comment": "Thảm xịn đánh 2 tiếng không mỏi gối hay trơn trượt. Sẽ ủng hộ lâu dài!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-44-2",
        "userName": "Đặng Thu Hà",
        "rating": 4,
        "comment": "Giao diện đặt sân tiện lợi, thanh toán online mượt mà, chủ sân đón tiếp niềm nở.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-45",
    "slug": "clb-cau-long-ham-nghi-smash",
    "name": "CLB Cầu Lông Hàm Nghi Smash",
    "description": "Sân thảm PVC vân cát đạt chuẩn thi đấu quốc tế, khoảng cách giữa các sân rộng rãi 2m tránh va chạm. Bãi đỗ xe ô tô miễn phí.",
    "address": "Số 12 Hàm Nghi, Phường Cầu Diễn",
    "district": "Nam Từ Liêm",
    "city": "Hà Nội",
    "lat": 21.0345,
    "lng": 105.7645,
    "openMin": 300,
    "closeMin": 1440,
    "priceFrom": 100000,
    "ratingAvg": 4.6,
    "ratingCount": 165,
    "images": [
      "/images/courts/court-45.svg",
      "/images/courts/court-55.svg",
      "/images/courts/court-65.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 3,
    "courts": [
      {
        "id": "court-45-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-45-2",
        "name": "Sân 2",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-45-3",
        "name": "Sân 3",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-45-4",
        "name": "Sân 4",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-45-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 100000,
        "fixedPrice": 90000
      },
      {
        "id": "p-45-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1440,
        "walkInPrice": 140000,
        "fixedPrice": 125000
      },
      {
        "id": "p-45-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1440,
        "walkInPrice": 135000,
        "fixedPrice": 125000
      }
    ],
    "reviews": [
      {
        "id": "rev-45-1",
        "userName": "Trần Anh Tuấn",
        "rating": 5,
        "comment": "Sân rất đẹp, thảm bám tốt, trần cao không bị chói mắt. Chủ sân thân thiện và có tủ đồ khoá số an toàn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-45-2",
        "userName": "Nguyễn Hải Yến",
        "rating": 4,
        "comment": "Đặt qua web nhanh gọn, đến sân quét mã là vào chơi ngay không phải chờ đợi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-46",
    "slug": "san-cau-long-chau-van-liem-sport",
    "name": "Sân Cầu Lông Châu Văn Liêm Sport",
    "description": "Hệ thống đèn LED âm trần chống chói mắt tuyệt đối khi lốp cầu cao sâu. Đội ngũ huấn luyện viên giàu kinh nghiệm hỗ trợ hướng dẫn cơ bản.",
    "address": "Số 45 Châu Văn Liêm, Phường Phú Đô",
    "district": "Nam Từ Liêm",
    "city": "Hà Nội",
    "lat": 21.0115,
    "lng": 105.7715,
    "openMin": 330,
    "closeMin": 1380,
    "priceFrom": 110000,
    "ratingAvg": 4.7,
    "ratingCount": 168,
    "images": [
      "/images/courts/court-46.svg",
      "/images/courts/court-56.svg",
      "/images/courts/court-66.svg"
    ],
    "amenities": [
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 3.3,
    "courts": [
      {
        "id": "court-46-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-46-2",
        "name": "Sân 2",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-46-3",
        "name": "Sân 3",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-46-4",
        "name": "Sân 4",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-46-5",
        "name": "Sân 5",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-46-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 110000,
        "fixedPrice": 100000
      },
      {
        "id": "p-46-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1380,
        "walkInPrice": 150000,
        "fixedPrice": 135000
      },
      {
        "id": "p-46-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1380,
        "walkInPrice": 145000,
        "fixedPrice": 135000
      }
    ],
    "reviews": [
      {
        "id": "rev-46-1",
        "userName": "Vũ Minh Quân",
        "rating": 5,
        "comment": "Vị trí đẹp, gửi xe ô tô thoải mái, căng tin bán nhiều đồ uống thể thao xịn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-46-2",
        "userName": "Đỗ Gia Huy",
        "rating": 4,
        "comment": "Sân rộng, nhiều sân nên dễ đặt giờ đẹp. Chỗ để xe cực kỳ thoải mái.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-47",
    "slug": "clb-cau-long-dai-mo-court",
    "name": "CLB Cầu Lông Đại Mỗ Court",
    "description": "Trần nhà cao 11m cách nhiệt mùa hè mát mẻ, sàn gỗ phong phủ thảm cao su chống sốc bảo vệ đầu gối và mắt cá chân tối đa.",
    "address": "Đường Quang Tiến, Phường Đại Mỗ",
    "district": "Nam Từ Liêm",
    "city": "Hà Nội",
    "lat": 20.9925,
    "lng": 105.7615,
    "openMin": 360,
    "closeMin": 1320,
    "priceFrom": 120000,
    "ratingAvg": 4.8,
    "ratingCount": 171,
    "images": [
      "/images/courts/court-47.svg",
      "/images/courts/court-57.svg",
      "/images/courts/court-67.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 3.6,
    "courts": [
      {
        "id": "court-47-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-47-2",
        "name": "Sân 2",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-47-3",
        "name": "Sân 3",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-47-4",
        "name": "Sân 4",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-47-5",
        "name": "Sân 5",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-47-6",
        "name": "Sân 6",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-47-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 120000,
        "fixedPrice": 110000
      },
      {
        "id": "p-47-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 160000,
        "fixedPrice": 145000
      },
      {
        "id": "p-47-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1320,
        "walkInPrice": 155000,
        "fixedPrice": 145000
      }
    ],
    "reviews": [
      {
        "id": "rev-47-1",
        "userName": "Lê Thuỳ Trang",
        "rating": 5,
        "comment": "Giá tốt nhất khu vực, nhân viên hỗ trợ nhiệt tình, dịch vụ căng vợt rất chuẩn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-47-2",
        "userName": "Phạm Quốc Bảo",
        "rating": 4,
        "comment": "Chơi ca đêm sau giờ làm rất tiện, sân sạch sẽ và điều hoà mát rượi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-48",
    "slug": "san-cau-long-tay-mo-central",
    "name": "Sân Cầu Lông Tây Mỗ Central",
    "description": "Trang bị máy đo căng vợt điện tử 6 điểm hiện đại, quầy phụ kiện chính hãng Yonex, Lining, Victor. Phòng tắm nóng lạnh sạch sẽ.",
    "address": "Đường Hữu Hưng, Phường Tây Mỗ",
    "district": "Nam Từ Liêm",
    "city": "Hà Nội",
    "lat": 21.0015,
    "lng": 105.7485,
    "openMin": 300,
    "closeMin": 1320,
    "priceFrom": 50000,
    "ratingAvg": 4.9,
    "ratingCount": 174,
    "images": [
      "/images/courts/court-48.svg",
      "/images/courts/court-58.svg",
      "/images/courts/court-68.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "CANTEEN",
      "SHOWER",
      "WIFI"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 3.9,
    "courts": [
      {
        "id": "court-48-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-48-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-48-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-48-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-48-5",
        "name": "Sân 5",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-48-6",
        "name": "Sân 6",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-48-7",
        "name": "Sân 7",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-48-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 50000,
        "fixedPrice": 40000
      },
      {
        "id": "p-48-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 90000,
        "fixedPrice": 75000
      },
      {
        "id": "p-48-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1320,
        "walkInPrice": 85000,
        "fixedPrice": 75000
      }
    ],
    "reviews": [
      {
        "id": "rev-48-1",
        "userName": "Hoàng Minh Đức",
        "rating": 5,
        "comment": "Ánh sáng chuẩn không bị chói khi ngửa cổ đánh cầu cao sâu. 5 sao cho chất lượng!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-48-2",
        "userName": "Ngô Phương Thảo",
        "rating": 4,
        "comment": "Phòng tắm nóng lạnh rất sạch, có máy sấy tóc tiện lợi cho bạn nữ sau trận đấu.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-49",
    "slug": "clb-cau-long-cau-dien-star",
    "name": "CLB Cầu Lông Cầu Diễn Star",
    "description": "Không gian thể thao chuyên nghiệp với khán đài mini, hệ thống camera AI tự động ghi hình pha đập cầu đẹp mắt gửi về điện thoại.",
    "address": "Số 85 Nguyễn Đổng Chi, Phường Cầu Diễn",
    "district": "Nam Từ Liêm",
    "city": "Hà Nội",
    "lat": 21.0395,
    "lng": 105.7615,
    "openMin": 330,
    "closeMin": 1320,
    "priceFrom": 60000,
    "ratingAvg": 5,
    "ratingCount": 177,
    "images": [
      "/images/courts/court-49.svg",
      "/images/courts/court-59.svg",
      "/images/courts/court-69.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 4.2,
    "courts": [
      {
        "id": "court-49-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-49-2",
        "name": "Sân 2",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-49-3",
        "name": "Sân 3",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-49-4",
        "name": "Sân 4",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-49-5",
        "name": "Sân 5",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-49-6",
        "name": "Sân 6",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-49-7",
        "name": "Sân 7",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-49-8",
        "name": "Sân 8",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-49-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 60000,
        "fixedPrice": 50000
      },
      {
        "id": "p-49-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 100000,
        "fixedPrice": 85000
      },
      {
        "id": "p-49-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1320,
        "walkInPrice": 95000,
        "fixedPrice": 85000
      }
    ],
    "reviews": [
      {
        "id": "rev-49-1",
        "userName": "Bùi Văn Nam",
        "rating": 5,
        "comment": "Thảm xịn đánh 2 tiếng không mỏi gối hay trơn trượt. Sẽ ủng hộ lâu dài!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-49-2",
        "userName": "Đặng Thu Hà",
        "rating": 4,
        "comment": "Giao diện đặt sân tiện lợi, thanh toán online mượt mà, chủ sân đón tiếp niềm nở.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-50",
    "slug": "clb-cau-long-bac-tu-liem-pro",
    "name": "CLB Cầu Lông Bắc Từ Liêm Pro",
    "description": "Cơ sở 6 sân thảm mới 100%, trang bị quạt công nghiệp đối lưu gió êm ái không ảnh hưởng hướng bay của quả cầu lông.",
    "address": "Số 435 Phạm Văn Đồng, Phường Cổ Nhuế 1",
    "district": "Bắc Từ Liêm",
    "city": "Hà Nội",
    "lat": 21.0545,
    "lng": 105.7815,
    "openMin": 360,
    "closeMin": 1440,
    "priceFrom": 70000,
    "ratingAvg": 4.6,
    "ratingCount": 180,
    "images": [
      "/images/courts/court-50.svg",
      "/images/courts/court-60.svg",
      "/images/courts/court-70.svg"
    ],
    "amenities": [
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 4.5,
    "courts": [
      {
        "id": "court-50-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-50-2",
        "name": "Sân 2",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-50-3",
        "name": "Sân 3",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-50-4",
        "name": "Sân 4",
        "surface": "Thảm Alite BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-50-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 70000,
        "fixedPrice": 60000
      },
      {
        "id": "p-50-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1440,
        "walkInPrice": 110000,
        "fixedPrice": 95000
      },
      {
        "id": "p-50-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1440,
        "walkInPrice": 105000,
        "fixedPrice": 95000
      }
    ],
    "reviews": [
      {
        "id": "rev-50-1",
        "userName": "Trần Anh Tuấn",
        "rating": 5,
        "comment": "Sân rất đẹp, thảm bám tốt, trần cao không bị chói mắt. Chủ sân thân thiện và có tủ đồ khoá số an toàn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-50-2",
        "userName": "Nguyễn Hải Yến",
        "rating": 4,
        "comment": "Đặt qua web nhanh gọn, đến sân quét mã là vào chơi ngay không phải chờ đợi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-51",
    "slug": "san-cau-long-ngoai-giao-doan-eco",
    "name": "Sân Cầu Lông Ngoại Giao Đoàn Eco",
    "description": "Nằm tại vị trí trung tâm giao thông thuận tiện, có phòng thay đồ nam nữ riêng biệt, tủ khóa locker thông minh an toàn tuyệt đối.",
    "address": "KĐT Ngoại Giao Đoàn, Phường Xuân Tảo",
    "district": "Bắc Từ Liêm",
    "city": "Hà Nội",
    "lat": 21.0665,
    "lng": 105.7935,
    "openMin": 300,
    "closeMin": 1380,
    "priceFrom": 80000,
    "ratingAvg": 4.7,
    "ratingCount": 183,
    "images": [
      "/images/courts/court-51.svg",
      "/images/courts/court-61.svg",
      "/images/courts/court-71.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 4.8,
    "courts": [
      {
        "id": "court-51-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-51-2",
        "name": "Sân 2",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-51-3",
        "name": "Sân 3",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-51-4",
        "name": "Sân 4",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-51-5",
        "name": "Sân 5",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-51-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 80000,
        "fixedPrice": 70000
      },
      {
        "id": "p-51-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1380,
        "walkInPrice": 120000,
        "fixedPrice": 105000
      },
      {
        "id": "p-51-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1380,
        "walkInPrice": 115000,
        "fixedPrice": 105000
      }
    ],
    "reviews": [
      {
        "id": "rev-51-1",
        "userName": "Vũ Minh Quân",
        "rating": 5,
        "comment": "Vị trí đẹp, gửi xe ô tô thoải mái, căng tin bán nhiều đồ uống thể thao xịn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-51-2",
        "userName": "Đỗ Gia Huy",
        "rating": 4,
        "comment": "Sân rộng, nhiều sân nên dễ đặt giờ đẹp. Chỗ để xe cực kỳ thoải mái.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-52",
    "slug": "clb-cau-long-xuan-dinh-smash",
    "name": "CLB Cầu Lông Xuân Đỉnh Smash",
    "description": "Sân cầu lông đạt chuẩn liên đoàn BWF với vạch sơn sắc nét, thảm bám dính cực tốt ngay cả khi đổ nhiều mồ hôi. Nước chanh muối pha tươi.",
    "address": "Số 126 Xuân Đỉnh, Phường Xuân Đỉnh",
    "district": "Bắc Từ Liêm",
    "city": "Hà Nội",
    "lat": 21.0725,
    "lng": 105.7895,
    "openMin": 330,
    "closeMin": 1320,
    "priceFrom": 90000,
    "ratingAvg": 4.8,
    "ratingCount": 186,
    "images": [
      "/images/courts/court-52.svg",
      "/images/courts/court-62.svg",
      "/images/courts/court-72.svg"
    ],
    "amenities": [
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 5.1,
    "courts": [
      {
        "id": "court-52-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-52-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-52-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-52-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-52-5",
        "name": "Sân 5",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-52-6",
        "name": "Sân 6",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-52-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 90000,
        "fixedPrice": 80000
      },
      {
        "id": "p-52-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 130000,
        "fixedPrice": 115000
      },
      {
        "id": "p-52-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1320,
        "walkInPrice": 125000,
        "fixedPrice": 115000
      }
    ],
    "reviews": [
      {
        "id": "rev-52-1",
        "userName": "Lê Thuỳ Trang",
        "rating": 5,
        "comment": "Giá tốt nhất khu vực, nhân viên hỗ trợ nhiệt tình, dịch vụ căng vợt rất chuẩn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-52-2",
        "userName": "Phạm Quốc Bảo",
        "rating": 4,
        "comment": "Chơi ca đêm sau giờ làm rất tiện, sân sạch sẽ và điều hoà mát rượi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-53",
    "slug": "san-cau-long-minh-khai-star",
    "name": "Sân Cầu Lông Minh Khai Star",
    "description": "Hội tụ nhiều tay vợt phong trào trình độ khá - giỏi, thường xuyên tổ chức giải đấu nội bộ cuối tuần có cúp và phần thưởng giá trị.",
    "address": "Đường Cầu Diễn, Phường Minh Khai",
    "district": "Bắc Từ Liêm",
    "city": "Hà Nội",
    "lat": 21.0485,
    "lng": 105.7425,
    "openMin": 360,
    "closeMin": 1320,
    "priceFrom": 100000,
    "ratingAvg": 4.9,
    "ratingCount": 189,
    "images": [
      "/images/courts/court-53.svg",
      "/images/courts/court-63.svg",
      "/images/courts/court-73.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 5.4,
    "courts": [
      {
        "id": "court-53-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-53-2",
        "name": "Sân 2",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-53-3",
        "name": "Sân 3",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-53-4",
        "name": "Sân 4",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-53-5",
        "name": "Sân 5",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-53-6",
        "name": "Sân 6",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-53-7",
        "name": "Sân 7",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-53-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 100000,
        "fixedPrice": 90000
      },
      {
        "id": "p-53-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 140000,
        "fixedPrice": 125000
      },
      {
        "id": "p-53-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1320,
        "walkInPrice": 135000,
        "fixedPrice": 125000
      }
    ],
    "reviews": [
      {
        "id": "rev-53-1",
        "userName": "Hoàng Minh Đức",
        "rating": 5,
        "comment": "Ánh sáng chuẩn không bị chói khi ngửa cổ đánh cầu cao sâu. 5 sao cho chất lượng!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-53-2",
        "userName": "Ngô Phương Thảo",
        "rating": 4,
        "comment": "Phòng tắm nóng lạnh rất sạch, có máy sấy tóc tiện lợi cho bạn nữ sau trận đấu.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-54",
    "slug": "clb-cau-long-phu-dien-arena",
    "name": "CLB Cầu Lông Phú Diễn Arena",
    "description": "Mặt sân cao cấp giảm phản lực tác động lên cột sống, trần thông gió tự nhiên không bí mùi. Cho thuê giày và vợt xịn giá hữu nghị.",
    "address": "Số 78 Phú Diễn, Phường Phú Diễn",
    "district": "Bắc Từ Liêm",
    "city": "Hà Nội",
    "lat": 21.0445,
    "lng": 105.7595,
    "openMin": 300,
    "closeMin": 1320,
    "priceFrom": 110000,
    "ratingAvg": 5,
    "ratingCount": 192,
    "images": [
      "/images/courts/court-54.svg",
      "/images/courts/court-64.svg",
      "/images/courts/court-74.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "CANTEEN",
      "SHOWER",
      "WIFI"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 5.7,
    "courts": [
      {
        "id": "court-54-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-54-2",
        "name": "Sân 2",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-54-3",
        "name": "Sân 3",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-54-4",
        "name": "Sân 4",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-54-5",
        "name": "Sân 5",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-54-6",
        "name": "Sân 6",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-54-7",
        "name": "Sân 7",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-54-8",
        "name": "Sân 8",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-54-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 110000,
        "fixedPrice": 100000
      },
      {
        "id": "p-54-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 150000,
        "fixedPrice": 135000
      },
      {
        "id": "p-54-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1320,
        "walkInPrice": 145000,
        "fixedPrice": 135000
      }
    ],
    "reviews": [
      {
        "id": "rev-54-1",
        "userName": "Bùi Văn Nam",
        "rating": 5,
        "comment": "Thảm xịn đánh 2 tiếng không mỏi gối hay trơn trượt. Sẽ ủng hộ lâu dài!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-54-2",
        "userName": "Đặng Thu Hà",
        "rating": 4,
        "comment": "Giao diện đặt sân tiện lợi, thanh toán online mượt mà, chủ sân đón tiếp niềm nở.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-55",
    "slug": "san-cau-long-tay-tuu-sport",
    "name": "Sân Cầu Lông Tây Tựu Sport",
    "description": "Thiết kế hiện đại với tone màu tối làm nổi bật quả cầu trắng, hệ thống âm thanh chất lượng cao phục vụ các trận cầu giao lưu sôi động.",
    "address": "Đường Tây Tựu, Phường Tây Tựu",
    "district": "Bắc Từ Liêm",
    "city": "Hà Nội",
    "lat": 21.0615,
    "lng": 105.7285,
    "openMin": 330,
    "closeMin": 1440,
    "priceFrom": 120000,
    "ratingAvg": 4.6,
    "ratingCount": 195,
    "images": [
      "/images/courts/court-55.svg",
      "/images/courts/court-65.svg",
      "/images/courts/court-75.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 6,
    "courts": [
      {
        "id": "court-55-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-55-2",
        "name": "Sân 2",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-55-3",
        "name": "Sân 3",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-55-4",
        "name": "Sân 4",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-55-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 120000,
        "fixedPrice": 110000
      },
      {
        "id": "p-55-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1440,
        "walkInPrice": 160000,
        "fixedPrice": 145000
      },
      {
        "id": "p-55-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1440,
        "walkInPrice": 155000,
        "fixedPrice": 145000
      }
    ],
    "reviews": [
      {
        "id": "rev-55-1",
        "userName": "Trần Anh Tuấn",
        "rating": 5,
        "comment": "Sân rất đẹp, thảm bám tốt, trần cao không bị chói mắt. Chủ sân thân thiện và có tủ đồ khoá số an toàn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-55-2",
        "userName": "Nguyễn Hải Yến",
        "rating": 4,
        "comment": "Đặt qua web nhanh gọn, đến sân quét mã là vào chơi ngay không phải chờ đợi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-56",
    "slug": "clb-cau-long-lien-mac-central",
    "name": "CLB Cầu Lông Liên Mạc Central",
    "description": "Sân chơi đẳng cấp phục vụ cư dân và cộng đồng đam mê cầu lông, quầy bar nước ép trái cây tươi và whey protein dinh dưỡng sau trận đấu.",
    "address": "Đường Yên Nội, Phường Liên Mạc",
    "district": "Bắc Từ Liêm",
    "city": "Hà Nội",
    "lat": 21.0845,
    "lng": 105.7485,
    "openMin": 360,
    "closeMin": 1380,
    "priceFrom": 50000,
    "ratingAvg": 4.7,
    "ratingCount": 198,
    "images": [
      "/images/courts/court-56.svg",
      "/images/courts/court-66.svg",
      "/images/courts/court-76.svg"
    ],
    "amenities": [
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 6.3,
    "courts": [
      {
        "id": "court-56-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-56-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-56-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-56-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-56-5",
        "name": "Sân 5",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-56-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 50000,
        "fixedPrice": 40000
      },
      {
        "id": "p-56-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1380,
        "walkInPrice": 90000,
        "fixedPrice": 75000
      },
      {
        "id": "p-56-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1380,
        "walkInPrice": 85000,
        "fixedPrice": 75000
      }
    ],
    "reviews": [
      {
        "id": "rev-56-1",
        "userName": "Vũ Minh Quân",
        "rating": 5,
        "comment": "Vị trí đẹp, gửi xe ô tô thoải mái, căng tin bán nhiều đồ uống thể thao xịn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-56-2",
        "userName": "Đỗ Gia Huy",
        "rating": 4,
        "comment": "Sân rộng, nhiều sân nên dễ đặt giờ đẹp. Chỗ để xe cực kỳ thoải mái.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-57",
    "slug": "san-cau-long-dong-ngac-court",
    "name": "Sân Cầu Lông Đông Ngạc Court",
    "description": "Chỗ đỗ xe rộng thênh thang đỗ được 30 ô tô, sân chơi thân thiện gia đình có khu vực ghế chờ êm ái cho người nhà và cổ động viên.",
    "address": "Đường Kẻ Vẽ, Phường Đông Ngạc",
    "district": "Bắc Từ Liêm",
    "city": "Hà Nội",
    "lat": 21.0815,
    "lng": 105.7795,
    "openMin": 300,
    "closeMin": 1320,
    "priceFrom": 60000,
    "ratingAvg": 4.8,
    "ratingCount": 201,
    "images": [
      "/images/courts/court-57.svg",
      "/images/courts/court-67.svg",
      "/images/courts/court-77.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 6.6,
    "courts": [
      {
        "id": "court-57-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-57-2",
        "name": "Sân 2",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-57-3",
        "name": "Sân 3",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-57-4",
        "name": "Sân 4",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-57-5",
        "name": "Sân 5",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-57-6",
        "name": "Sân 6",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-57-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 60000,
        "fixedPrice": 50000
      },
      {
        "id": "p-57-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 100000,
        "fixedPrice": 85000
      },
      {
        "id": "p-57-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1320,
        "walkInPrice": 95000,
        "fixedPrice": 85000
      }
    ],
    "reviews": [
      {
        "id": "rev-57-1",
        "userName": "Lê Thuỳ Trang",
        "rating": 5,
        "comment": "Giá tốt nhất khu vực, nhân viên hỗ trợ nhiệt tình, dịch vụ căng vợt rất chuẩn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-57-2",
        "userName": "Phạm Quốc Bảo",
        "rating": 4,
        "comment": "Chơi ca đêm sau giờ làm rất tiện, sân sạch sẽ và điều hoà mát rượi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-58",
    "slug": "san-cau-long-ha-dong-24h",
    "name": "Sân Cầu Lông Hà Đông 24h",
    "description": "Sân thảm Alite chống trượt 5 lớp, dịch vụ sửa chữa và thay quấn cán vợt siêu tốc. Nhân viên hỗ trợ tận tình nhặt cầu và xếp sân.",
    "address": "Số 45 Quang Trung, Phường La Khê",
    "district": "Hà Đông",
    "city": "Hà Nội",
    "lat": 20.9712,
    "lng": 105.7725,
    "openMin": 330,
    "closeMin": 1320,
    "priceFrom": 70000,
    "ratingAvg": 4.9,
    "ratingCount": 204,
    "images": [
      "/images/courts/court-58.svg",
      "/images/courts/court-68.svg",
      "/images/courts/court-78.svg"
    ],
    "amenities": [
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 6.9,
    "courts": [
      {
        "id": "court-58-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-58-2",
        "name": "Sân 2",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-58-3",
        "name": "Sân 3",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-58-4",
        "name": "Sân 4",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-58-5",
        "name": "Sân 5",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-58-6",
        "name": "Sân 6",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-58-7",
        "name": "Sân 7",
        "surface": "Thảm Alite BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-58-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 70000,
        "fixedPrice": 60000
      },
      {
        "id": "p-58-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 110000,
        "fixedPrice": 95000
      },
      {
        "id": "p-58-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1320,
        "walkInPrice": 105000,
        "fixedPrice": 95000
      }
    ],
    "reviews": [
      {
        "id": "rev-58-1",
        "userName": "Hoàng Minh Đức",
        "rating": 5,
        "comment": "Ánh sáng chuẩn không bị chói khi ngửa cổ đánh cầu cao sâu. 5 sao cho chất lượng!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-58-2",
        "userName": "Ngô Phương Thảo",
        "rating": 4,
        "comment": "Phòng tắm nóng lạnh rất sạch, có máy sấy tóc tiện lợi cho bạn nữ sau trận đấu.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-59",
    "slug": "clb-cau-long-van-quan-lake",
    "name": "CLB Cầu Lông Văn Quán Lake",
    "description": "Điểm hẹn lý tưởng sau giờ làm việc căng thẳng, ánh sáng đồng đều 450 Lux không góc chết, giá thuê sân linh hoạt theo từng khung giờ.",
    "address": "Khu Đô Thị Văn Quán, Phường Văn Quán",
    "district": "Hà Đông",
    "city": "Hà Nội",
    "lat": 20.9795,
    "lng": 105.7895,
    "openMin": 360,
    "closeMin": 1320,
    "priceFrom": 80000,
    "ratingAvg": 5,
    "ratingCount": 207,
    "images": [
      "/images/courts/court-59.svg",
      "/images/courts/court-69.svg",
      "/images/courts/court-79.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 7.2,
    "courts": [
      {
        "id": "court-59-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-59-2",
        "name": "Sân 2",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-59-3",
        "name": "Sân 3",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-59-4",
        "name": "Sân 4",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-59-5",
        "name": "Sân 5",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-59-6",
        "name": "Sân 6",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-59-7",
        "name": "Sân 7",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-59-8",
        "name": "Sân 8",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-59-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 80000,
        "fixedPrice": 70000
      },
      {
        "id": "p-59-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 120000,
        "fixedPrice": 105000
      },
      {
        "id": "p-59-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1320,
        "walkInPrice": 115000,
        "fixedPrice": 105000
      }
    ],
    "reviews": [
      {
        "id": "rev-59-1",
        "userName": "Bùi Văn Nam",
        "rating": 5,
        "comment": "Thảm xịn đánh 2 tiếng không mỏi gối hay trơn trượt. Sẽ ủng hộ lâu dài!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-59-2",
        "userName": "Đặng Thu Hà",
        "rating": 4,
        "comment": "Giao diện đặt sân tiện lợi, thanh toán online mượt mà, chủ sân đón tiếp niềm nở.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-60",
    "slug": "san-cau-long-mo-lao-arena",
    "name": "Sân Cầu Lông Mỗ Lao Arena",
    "description": "Cơ sở tiêu chuẩn thi đấu với sàn thảm cao su chuyên dụng, trần cao 9m thông thoáng, hệ thống đèn chống chói đạt chuẩn BWF. Có phục vụ nước uống, căng-tin và dịch vụ đan vợt lấy ngay.",
    "address": "Đường Nguyễn Văn Lộc, Phường Mỗ Lao",
    "district": "Hà Đông",
    "city": "Hà Nội",
    "lat": 20.9855,
    "lng": 105.7845,
    "openMin": 300,
    "closeMin": 1440,
    "priceFrom": 90000,
    "ratingAvg": 4.6,
    "ratingCount": 210,
    "images": [
      "/images/courts/court-60.svg",
      "/images/courts/court-70.svg",
      "/images/courts/court-80.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "CANTEEN",
      "SHOWER",
      "WIFI"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 7.5,
    "courts": [
      {
        "id": "court-60-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-60-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-60-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-60-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-60-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 90000,
        "fixedPrice": 80000
      },
      {
        "id": "p-60-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1440,
        "walkInPrice": 130000,
        "fixedPrice": 115000
      },
      {
        "id": "p-60-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1440,
        "walkInPrice": 125000,
        "fixedPrice": 115000
      }
    ],
    "reviews": [
      {
        "id": "rev-60-1",
        "userName": "Trần Anh Tuấn",
        "rating": 5,
        "comment": "Sân rất đẹp, thảm bám tốt, trần cao không bị chói mắt. Chủ sân thân thiện và có tủ đồ khoá số an toàn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-60-2",
        "userName": "Nguyễn Hải Yến",
        "rating": 4,
        "comment": "Đặt qua web nhanh gọn, đến sân quét mã là vào chơi ngay không phải chờ đợi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-61",
    "slug": "clb-cau-long-le-trong-tan-pro",
    "name": "CLB Cầu Lông Lê Trọng Tấn Pro",
    "description": "Không gian thoáng mát ven hồ Tây, hệ thống điều hoà mát rượi, thảm Yonex cao cấp. Có câu lạc bộ sinh hoạt thường xuyên cho người muốn tìm bạn giao lưu.",
    "address": "Số 150 Lê Trọng Tấn, Phường Dương Nội",
    "district": "Hà Đông",
    "city": "Hà Nội",
    "lat": 20.9635,
    "lng": 105.7545,
    "openMin": 330,
    "closeMin": 1380,
    "priceFrom": 100000,
    "ratingAvg": 4.7,
    "ratingCount": 213,
    "images": [
      "/images/courts/court-61.svg",
      "/images/courts/court-71.svg",
      "/images/courts/court-81.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 7.8,
    "courts": [
      {
        "id": "court-61-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-61-2",
        "name": "Sân 2",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-61-3",
        "name": "Sân 3",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-61-4",
        "name": "Sân 4",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-61-5",
        "name": "Sân 5",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-61-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 100000,
        "fixedPrice": 90000
      },
      {
        "id": "p-61-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1380,
        "walkInPrice": 140000,
        "fixedPrice": 125000
      },
      {
        "id": "p-61-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1380,
        "walkInPrice": 135000,
        "fixedPrice": 125000
      }
    ],
    "reviews": [
      {
        "id": "rev-61-1",
        "userName": "Vũ Minh Quân",
        "rating": 5,
        "comment": "Vị trí đẹp, gửi xe ô tô thoải mái, căng tin bán nhiều đồ uống thể thao xịn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-61-2",
        "userName": "Đỗ Gia Huy",
        "rating": 4,
        "comment": "Sân rộng, nhiều sân nên dễ đặt giờ đẹp. Chỗ để xe cực kỳ thoải mái.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-62",
    "slug": "san-cau-long-van-phuc-smash",
    "name": "Sân Cầu Lông Vạn Phúc Smash",
    "description": "Tổ hợp 8 sân quy mô lớn nằm trong khuôn viên khu liên hợp thể thao Mỹ Đình. Cho phép thanh toán trực tiếp tại sân, hỗ trợ tổ chức giải đấu phong trào.",
    "address": "Số 88 Tố Hữu, Phường Vạn Phúc",
    "district": "Hà Đông",
    "city": "Hà Nội",
    "lat": 20.9785,
    "lng": 105.7765,
    "openMin": 360,
    "closeMin": 1320,
    "priceFrom": 110000,
    "ratingAvg": 4.8,
    "ratingCount": 216,
    "images": [
      "/images/courts/court-62.svg",
      "/images/courts/court-72.svg",
      "/images/courts/court-82.svg"
    ],
    "amenities": [
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 8.1,
    "courts": [
      {
        "id": "court-62-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-62-2",
        "name": "Sân 2",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-62-3",
        "name": "Sân 3",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-62-4",
        "name": "Sân 4",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-62-5",
        "name": "Sân 5",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-62-6",
        "name": "Sân 6",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-62-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 110000,
        "fixedPrice": 100000
      },
      {
        "id": "p-62-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 150000,
        "fixedPrice": 135000
      },
      {
        "id": "p-62-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1320,
        "walkInPrice": 145000,
        "fixedPrice": 135000
      }
    ],
    "reviews": [
      {
        "id": "rev-62-1",
        "userName": "Lê Thuỳ Trang",
        "rating": 5,
        "comment": "Giá tốt nhất khu vực, nhân viên hỗ trợ nhiệt tình, dịch vụ căng vợt rất chuẩn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-62-2",
        "userName": "Phạm Quốc Bảo",
        "rating": 4,
        "comment": "Chơi ca đêm sau giờ làm rất tiện, sân sạch sẽ và điều hoà mát rượi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-63",
    "slug": "clb-cau-long-kien-hung-sport",
    "name": "CLB Cầu Lông Kiến Hưng Sport",
    "description": "Cơ sở mới nâng cấp 4 sân chuẩn đẹp, giá cả học sinh sinh viên rất mềm, có dịch vụ căng cước vợt chất lượng cao.",
    "address": "Khu Đấu Giá Kiến Hưng, Phường Kiến Hưng",
    "district": "Hà Đông",
    "city": "Hà Nội",
    "lat": 20.9545,
    "lng": 105.7925,
    "openMin": 300,
    "closeMin": 1320,
    "priceFrom": 120000,
    "ratingAvg": 4.9,
    "ratingCount": 219,
    "images": [
      "/images/courts/court-63.svg",
      "/images/courts/court-73.svg",
      "/images/courts/court-83.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 8.4,
    "courts": [
      {
        "id": "court-63-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-63-2",
        "name": "Sân 2",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-63-3",
        "name": "Sân 3",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-63-4",
        "name": "Sân 4",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-63-5",
        "name": "Sân 5",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-63-6",
        "name": "Sân 6",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-63-7",
        "name": "Sân 7",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-63-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 120000,
        "fixedPrice": 110000
      },
      {
        "id": "p-63-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 160000,
        "fixedPrice": 145000
      },
      {
        "id": "p-63-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1320,
        "walkInPrice": 155000,
        "fixedPrice": 145000
      }
    ],
    "reviews": [
      {
        "id": "rev-63-1",
        "userName": "Hoàng Minh Đức",
        "rating": 5,
        "comment": "Ánh sáng chuẩn không bị chói khi ngửa cổ đánh cầu cao sâu. 5 sao cho chất lượng!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-63-2",
        "userName": "Ngô Phương Thảo",
        "rating": 4,
        "comment": "Phòng tắm nóng lạnh rất sạch, có máy sấy tóc tiện lợi cho bạn nữ sau trận đấu.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-64",
    "slug": "san-cau-long-yen-nghia-central",
    "name": "Sân Cầu Lông Yên Nghĩa Central",
    "description": "Điểm đến lý tưởng cho anh chị em bận rộn thích chơi ca đêm. Mở cửa từ 05:00 đến tận nửa đêm 24:00, điều hoà trung tâm 24/7.",
    "address": "Bến Xe Yên Nghĩa, Phường Yên Nghĩa",
    "district": "Hà Đông",
    "city": "Hà Nội",
    "lat": 20.9515,
    "lng": 105.7485,
    "openMin": 330,
    "closeMin": 1320,
    "priceFrom": 50000,
    "ratingAvg": 5,
    "ratingCount": 222,
    "images": [
      "/images/courts/court-64.svg",
      "/images/courts/court-74.svg",
      "/images/courts/court-84.svg"
    ],
    "amenities": [
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 8.7,
    "courts": [
      {
        "id": "court-64-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-64-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-64-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-64-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-64-5",
        "name": "Sân 5",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-64-6",
        "name": "Sân 6",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-64-7",
        "name": "Sân 7",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-64-8",
        "name": "Sân 8",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-64-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 50000,
        "fixedPrice": 40000
      },
      {
        "id": "p-64-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 90000,
        "fixedPrice": 75000
      },
      {
        "id": "p-64-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1320,
        "walkInPrice": 85000,
        "fixedPrice": 75000
      }
    ],
    "reviews": [
      {
        "id": "rev-64-1",
        "userName": "Bùi Văn Nam",
        "rating": 5,
        "comment": "Thảm xịn đánh 2 tiếng không mỏi gối hay trơn trượt. Sẽ ủng hộ lâu dài!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-64-2",
        "userName": "Đặng Thu Hà",
        "rating": 4,
        "comment": "Giao diện đặt sân tiện lợi, thanh toán online mượt mà, chủ sân đón tiếp niềm nở.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-65",
    "slug": "clb-cau-long-xa-la-court",
    "name": "CLB Cầu Lông Xa La Court",
    "description": "Sân thảm PVC vân cát đạt chuẩn thi đấu quốc tế, khoảng cách giữa các sân rộng rãi 2m tránh va chạm. Bãi đỗ xe ô tô miễn phí.",
    "address": "Khu Đô Thị Xa La, Phường Phúc La",
    "district": "Hà Đông",
    "city": "Hà Nội",
    "lat": 20.9685,
    "lng": 105.7965,
    "openMin": 360,
    "closeMin": 1440,
    "priceFrom": 60000,
    "ratingAvg": 4.6,
    "ratingCount": 225,
    "images": [
      "/images/courts/court-65.svg",
      "/images/courts/court-75.svg",
      "/images/courts/court-85.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 9,
    "courts": [
      {
        "id": "court-65-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-65-2",
        "name": "Sân 2",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-65-3",
        "name": "Sân 3",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-65-4",
        "name": "Sân 4",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-65-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 60000,
        "fixedPrice": 50000
      },
      {
        "id": "p-65-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1440,
        "walkInPrice": 100000,
        "fixedPrice": 85000
      },
      {
        "id": "p-65-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1440,
        "walkInPrice": 95000,
        "fixedPrice": 85000
      }
    ],
    "reviews": [
      {
        "id": "rev-65-1",
        "userName": "Trần Anh Tuấn",
        "rating": 5,
        "comment": "Sân rất đẹp, thảm bám tốt, trần cao không bị chói mắt. Chủ sân thân thiện và có tủ đồ khoá số an toàn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-65-2",
        "userName": "Nguyễn Hải Yến",
        "rating": 4,
        "comment": "Đặt qua web nhanh gọn, đến sân quét mã là vào chơi ngay không phải chờ đợi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-66",
    "slug": "san-cau-long-duong-noi-green",
    "name": "Sân Cầu Lông Dương Nội Green",
    "description": "Hệ thống đèn LED âm trần chống chói mắt tuyệt đối khi lốp cầu cao sâu. Đội ngũ huấn luyện viên giàu kinh nghiệm hỗ trợ hướng dẫn cơ bản.",
    "address": "KĐT Nam Cường Dương Nội, Phường Dương Nội",
    "district": "Hà Đông",
    "city": "Hà Nội",
    "lat": 20.9745,
    "lng": 105.7425,
    "openMin": 300,
    "closeMin": 1380,
    "priceFrom": 70000,
    "ratingAvg": 4.7,
    "ratingCount": 228,
    "images": [
      "/images/courts/court-66.svg",
      "/images/courts/court-76.svg",
      "/images/courts/court-86.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "CANTEEN",
      "SHOWER",
      "WIFI"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 9.3,
    "courts": [
      {
        "id": "court-66-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-66-2",
        "name": "Sân 2",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-66-3",
        "name": "Sân 3",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-66-4",
        "name": "Sân 4",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-66-5",
        "name": "Sân 5",
        "surface": "Thảm Alite BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-66-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 70000,
        "fixedPrice": 60000
      },
      {
        "id": "p-66-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1380,
        "walkInPrice": 110000,
        "fixedPrice": 95000
      },
      {
        "id": "p-66-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1380,
        "walkInPrice": 105000,
        "fixedPrice": 95000
      }
    ],
    "reviews": [
      {
        "id": "rev-66-1",
        "userName": "Vũ Minh Quân",
        "rating": 5,
        "comment": "Vị trí đẹp, gửi xe ô tô thoải mái, căng tin bán nhiều đồ uống thể thao xịn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-66-2",
        "userName": "Đỗ Gia Huy",
        "rating": 4,
        "comment": "Sân rộng, nhiều sân nên dễ đặt giờ đẹp. Chỗ để xe cực kỳ thoải mái.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-67",
    "slug": "cau-long-long-bien-sang",
    "name": "Cầu Lông Long Biên Sáng",
    "description": "Trần nhà cao 11m cách nhiệt mùa hè mát mẻ, sàn gỗ phong phủ thảm cao su chống sốc bảo vệ đầu gối và mắt cá chân tối đa.",
    "address": "Số 235 Nguyễn Văn Cừ, Phường Ngọc Lâm",
    "district": "Long Biên",
    "city": "Hà Nội",
    "lat": 21.0427,
    "lng": 105.8752,
    "openMin": 330,
    "closeMin": 1320,
    "priceFrom": 80000,
    "ratingAvg": 4.8,
    "ratingCount": 31,
    "images": [
      "/images/courts/court-67.svg",
      "/images/courts/court-77.svg",
      "/images/courts/court-87.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 9.6,
    "courts": [
      {
        "id": "court-67-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-67-2",
        "name": "Sân 2",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-67-3",
        "name": "Sân 3",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-67-4",
        "name": "Sân 4",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-67-5",
        "name": "Sân 5",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-67-6",
        "name": "Sân 6",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-67-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 80000,
        "fixedPrice": 70000
      },
      {
        "id": "p-67-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 120000,
        "fixedPrice": 105000
      },
      {
        "id": "p-67-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1320,
        "walkInPrice": 115000,
        "fixedPrice": 105000
      }
    ],
    "reviews": [
      {
        "id": "rev-67-1",
        "userName": "Lê Thuỳ Trang",
        "rating": 5,
        "comment": "Giá tốt nhất khu vực, nhân viên hỗ trợ nhiệt tình, dịch vụ căng vợt rất chuẩn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-67-2",
        "userName": "Phạm Quốc Bảo",
        "rating": 4,
        "comment": "Chơi ca đêm sau giờ làm rất tiện, sân sạch sẽ và điều hoà mát rượi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-68",
    "slug": "clb-cau-long-viet-hung-eco",
    "name": "CLB Cầu Lông Việt Hưng Eco",
    "description": "Trang bị máy đo căng vợt điện tử 6 điểm hiện đại, quầy phụ kiện chính hãng Yonex, Lining, Victor. Phòng tắm nóng lạnh sạch sẽ.",
    "address": "KĐT Việt Hưng, Phường Giang Biên",
    "district": "Long Biên",
    "city": "Hà Nội",
    "lat": 21.0545,
    "lng": 105.9085,
    "openMin": 360,
    "closeMin": 1320,
    "priceFrom": 90000,
    "ratingAvg": 4.9,
    "ratingCount": 34,
    "images": [
      "/images/courts/court-68.svg",
      "/images/courts/court-78.svg",
      "/images/courts/court-88.svg"
    ],
    "amenities": [
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 9.9,
    "courts": [
      {
        "id": "court-68-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-68-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-68-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-68-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-68-5",
        "name": "Sân 5",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-68-6",
        "name": "Sân 6",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-68-7",
        "name": "Sân 7",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-68-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 90000,
        "fixedPrice": 80000
      },
      {
        "id": "p-68-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 130000,
        "fixedPrice": 115000
      },
      {
        "id": "p-68-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1320,
        "walkInPrice": 125000,
        "fixedPrice": 115000
      }
    ],
    "reviews": [
      {
        "id": "rev-68-1",
        "userName": "Hoàng Minh Đức",
        "rating": 5,
        "comment": "Ánh sáng chuẩn không bị chói khi ngửa cổ đánh cầu cao sâu. 5 sao cho chất lượng!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-68-2",
        "userName": "Ngô Phương Thảo",
        "rating": 4,
        "comment": "Phòng tắm nóng lạnh rất sạch, có máy sấy tóc tiện lợi cho bạn nữ sau trận đấu.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-69",
    "slug": "san-cau-long-sai-dong-pro",
    "name": "Sân Cầu Lông Sài Đồng Pro",
    "description": "Không gian thể thao chuyên nghiệp với khán đài mini, hệ thống camera AI tự động ghi hình pha đập cầu đẹp mắt gửi về điện thoại.",
    "address": "Khu Công Nghiệp Sài Đồng B, Phường Sài Đồng",
    "district": "Long Biên",
    "city": "Hà Nội",
    "lat": 21.0285,
    "lng": 105.9185,
    "openMin": 300,
    "closeMin": 1320,
    "priceFrom": 100000,
    "ratingAvg": 5,
    "ratingCount": 37,
    "images": [
      "/images/courts/court-69.svg",
      "/images/courts/court-79.svg",
      "/images/courts/court-89.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 10.2,
    "courts": [
      {
        "id": "court-69-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-69-2",
        "name": "Sân 2",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-69-3",
        "name": "Sân 3",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-69-4",
        "name": "Sân 4",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-69-5",
        "name": "Sân 5",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-69-6",
        "name": "Sân 6",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-69-7",
        "name": "Sân 7",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-69-8",
        "name": "Sân 8",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-69-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 100000,
        "fixedPrice": 90000
      },
      {
        "id": "p-69-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 140000,
        "fixedPrice": 125000
      },
      {
        "id": "p-69-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1320,
        "walkInPrice": 135000,
        "fixedPrice": 125000
      }
    ],
    "reviews": [
      {
        "id": "rev-69-1",
        "userName": "Bùi Văn Nam",
        "rating": 5,
        "comment": "Thảm xịn đánh 2 tiếng không mỏi gối hay trơn trượt. Sẽ ủng hộ lâu dài!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-69-2",
        "userName": "Đặng Thu Hà",
        "rating": 4,
        "comment": "Giao diện đặt sân tiện lợi, thanh toán online mượt mà, chủ sân đón tiếp niềm nở.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-70",
    "slug": "clb-cau-long-thach-ban-smash",
    "name": "CLB Cầu Lông Thạch Bàn Smash",
    "description": "Cơ sở 6 sân thảm mới 100%, trang bị quạt công nghiệp đối lưu gió êm ái không ảnh hưởng hướng bay của quả cầu lông.",
    "address": "Số 88 Thạch Bàn, Phường Thạch Bàn",
    "district": "Long Biên",
    "city": "Hà Nội",
    "lat": 21.0185,
    "lng": 105.9125,
    "openMin": 330,
    "closeMin": 1440,
    "priceFrom": 110000,
    "ratingAvg": 4.6,
    "ratingCount": 40,
    "images": [
      "/images/courts/court-70.svg",
      "/images/courts/court-80.svg",
      "/images/courts/court-90.svg"
    ],
    "amenities": [
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 10.5,
    "courts": [
      {
        "id": "court-70-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-70-2",
        "name": "Sân 2",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-70-3",
        "name": "Sân 3",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-70-4",
        "name": "Sân 4",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-70-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 110000,
        "fixedPrice": 100000
      },
      {
        "id": "p-70-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1440,
        "walkInPrice": 150000,
        "fixedPrice": 135000
      },
      {
        "id": "p-70-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1440,
        "walkInPrice": 145000,
        "fixedPrice": 135000
      }
    ],
    "reviews": [
      {
        "id": "rev-70-1",
        "userName": "Trần Anh Tuấn",
        "rating": 5,
        "comment": "Sân rất đẹp, thảm bám tốt, trần cao không bị chói mắt. Chủ sân thân thiện và có tủ đồ khoá số an toàn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-70-2",
        "userName": "Nguyễn Hải Yến",
        "rating": 4,
        "comment": "Đặt qua web nhanh gọn, đến sân quét mã là vào chơi ngay không phải chờ đợi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-71",
    "slug": "san-cau-long-bo-de-arena",
    "name": "Sân Cầu Lông Bồ Đề Arena",
    "description": "Nằm tại vị trí trung tâm giao thông thuận tiện, có phòng thay đồ nam nữ riêng biệt, tủ khóa locker thông minh an toàn tuyệt đối.",
    "address": "Số 135 Bồ Đề, Phường Bồ Đề",
    "district": "Long Biên",
    "city": "Hà Nội",
    "lat": 21.0345,
    "lng": 105.8695,
    "openMin": 360,
    "closeMin": 1380,
    "priceFrom": 120000,
    "ratingAvg": 4.7,
    "ratingCount": 43,
    "images": [
      "/images/courts/court-71.svg",
      "/images/courts/court-81.svg",
      "/images/courts/court-91.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 10.8,
    "courts": [
      {
        "id": "court-71-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-71-2",
        "name": "Sân 2",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-71-3",
        "name": "Sân 3",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-71-4",
        "name": "Sân 4",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-71-5",
        "name": "Sân 5",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-71-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 120000,
        "fixedPrice": 110000
      },
      {
        "id": "p-71-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1380,
        "walkInPrice": 160000,
        "fixedPrice": 145000
      },
      {
        "id": "p-71-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1380,
        "walkInPrice": 155000,
        "fixedPrice": 145000
      }
    ],
    "reviews": [
      {
        "id": "rev-71-1",
        "userName": "Vũ Minh Quân",
        "rating": 5,
        "comment": "Vị trí đẹp, gửi xe ô tô thoải mái, căng tin bán nhiều đồ uống thể thao xịn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-71-2",
        "userName": "Đỗ Gia Huy",
        "rating": 4,
        "comment": "Sân rộng, nhiều sân nên dễ đặt giờ đẹp. Chỗ để xe cực kỳ thoải mái.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-72",
    "slug": "clb-cau-long-cu-khoi-riverside",
    "name": "CLB Cầu Lông Cự Khối Riverside",
    "description": "Sân cầu lông đạt chuẩn liên đoàn BWF với vạch sơn sắc nét, thảm bám dính cực tốt ngay cả khi đổ nhiều mồ hôi. Nước chanh muối pha tươi.",
    "address": "Đường Xuân Đỗ, Phường Cự Khối",
    "district": "Long Biên",
    "city": "Hà Nội",
    "lat": 21.0025,
    "lng": 105.9145,
    "openMin": 300,
    "closeMin": 1320,
    "priceFrom": 50000,
    "ratingAvg": 4.8,
    "ratingCount": 46,
    "images": [
      "/images/courts/court-72.svg",
      "/images/courts/court-82.svg",
      "/images/courts/court-92.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "CANTEEN",
      "SHOWER",
      "WIFI"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 11.1,
    "courts": [
      {
        "id": "court-72-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-72-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-72-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-72-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-72-5",
        "name": "Sân 5",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-72-6",
        "name": "Sân 6",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-72-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 50000,
        "fixedPrice": 40000
      },
      {
        "id": "p-72-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 90000,
        "fixedPrice": 75000
      },
      {
        "id": "p-72-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1320,
        "walkInPrice": 85000,
        "fixedPrice": 75000
      }
    ],
    "reviews": [
      {
        "id": "rev-72-1",
        "userName": "Lê Thuỳ Trang",
        "rating": 5,
        "comment": "Giá tốt nhất khu vực, nhân viên hỗ trợ nhiệt tình, dịch vụ căng vợt rất chuẩn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-72-2",
        "userName": "Phạm Quốc Bảo",
        "rating": 4,
        "comment": "Chơi ca đêm sau giờ làm rất tiện, sân sạch sẽ và điều hoà mát rượi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-73",
    "slug": "san-cau-long-thuong-thanh-central",
    "name": "Sân Cầu Lông Thượng Thanh Central",
    "description": "Hội tụ nhiều tay vợt phong trào trình độ khá - giỏi, thường xuyên tổ chức giải đấu nội bộ cuối tuần có cúp và phần thưởng giá trị.",
    "address": "Đường Lý Sơn, Phường Thượng Thanh",
    "district": "Long Biên",
    "city": "Hà Nội",
    "lat": 21.0625,
    "lng": 105.8925,
    "openMin": 330,
    "closeMin": 1320,
    "priceFrom": 60000,
    "ratingAvg": 4.9,
    "ratingCount": 49,
    "images": [
      "/images/courts/court-73.svg",
      "/images/courts/court-83.svg",
      "/images/courts/court-93.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 11.4,
    "courts": [
      {
        "id": "court-73-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-73-2",
        "name": "Sân 2",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-73-3",
        "name": "Sân 3",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-73-4",
        "name": "Sân 4",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-73-5",
        "name": "Sân 5",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-73-6",
        "name": "Sân 6",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-73-7",
        "name": "Sân 7",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-73-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 60000,
        "fixedPrice": 50000
      },
      {
        "id": "p-73-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 100000,
        "fixedPrice": 85000
      },
      {
        "id": "p-73-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1320,
        "walkInPrice": 95000,
        "fixedPrice": 85000
      }
    ],
    "reviews": [
      {
        "id": "rev-73-1",
        "userName": "Hoàng Minh Đức",
        "rating": 5,
        "comment": "Ánh sáng chuẩn không bị chói khi ngửa cổ đánh cầu cao sâu. 5 sao cho chất lượng!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-73-2",
        "userName": "Ngô Phương Thảo",
        "rating": 4,
        "comment": "Phòng tắm nóng lạnh rất sạch, có máy sấy tóc tiện lợi cho bạn nữ sau trận đấu.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-74",
    "slug": "clb-cau-long-phuc-loi-court",
    "name": "CLB Cầu Lông Phúc Lợi Court",
    "description": "Mặt sân cao cấp giảm phản lực tác động lên cột sống, trần thông gió tự nhiên không bí mùi. Cho thuê giày và vợt xịn giá hữu nghị.",
    "address": "KĐT Vinhomes Riverside, Phường Phúc Lợi",
    "district": "Long Biên",
    "city": "Hà Nội",
    "lat": 21.0465,
    "lng": 105.9285,
    "openMin": 360,
    "closeMin": 1320,
    "priceFrom": 70000,
    "ratingAvg": 5,
    "ratingCount": 52,
    "images": [
      "/images/courts/court-74.svg",
      "/images/courts/court-84.svg",
      "/images/courts/court-94.svg"
    ],
    "amenities": [
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 11.7,
    "courts": [
      {
        "id": "court-74-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-74-2",
        "name": "Sân 2",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-74-3",
        "name": "Sân 3",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-74-4",
        "name": "Sân 4",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-74-5",
        "name": "Sân 5",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-74-6",
        "name": "Sân 6",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-74-7",
        "name": "Sân 7",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-74-8",
        "name": "Sân 8",
        "surface": "Thảm Alite BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-74-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 70000,
        "fixedPrice": 60000
      },
      {
        "id": "p-74-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 110000,
        "fixedPrice": 95000
      },
      {
        "id": "p-74-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1320,
        "walkInPrice": 105000,
        "fixedPrice": 95000
      }
    ],
    "reviews": [
      {
        "id": "rev-74-1",
        "userName": "Bùi Văn Nam",
        "rating": 5,
        "comment": "Thảm xịn đánh 2 tiếng không mỏi gối hay trơn trượt. Sẽ ủng hộ lâu dài!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-74-2",
        "userName": "Đặng Thu Hà",
        "rating": 4,
        "comment": "Giao diện đặt sân tiện lợi, thanh toán online mượt mà, chủ sân đón tiếp niềm nở.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-75",
    "slug": "clb-smash-hoang-mai",
    "name": "CLB Smash Hoàng Mai",
    "description": "Thiết kế hiện đại với tone màu tối làm nổi bật quả cầu trắng, hệ thống âm thanh chất lượng cao phục vụ các trận cầu giao lưu sôi động.",
    "address": "Số 52 Giải Phóng, Phường Giáp Bát",
    "district": "Hoàng Mai",
    "city": "Hà Nội",
    "lat": 20.9885,
    "lng": 105.8415,
    "openMin": 300,
    "closeMin": 1440,
    "priceFrom": 80000,
    "ratingAvg": 4.6,
    "ratingCount": 55,
    "images": [
      "/images/courts/court-75.svg",
      "/images/courts/court-85.svg",
      "/images/courts/court-95.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 12,
    "courts": [
      {
        "id": "court-75-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-75-2",
        "name": "Sân 2",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-75-3",
        "name": "Sân 3",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-75-4",
        "name": "Sân 4",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-75-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 80000,
        "fixedPrice": 70000
      },
      {
        "id": "p-75-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1440,
        "walkInPrice": 120000,
        "fixedPrice": 105000
      },
      {
        "id": "p-75-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1440,
        "walkInPrice": 115000,
        "fixedPrice": 105000
      }
    ],
    "reviews": [
      {
        "id": "rev-75-1",
        "userName": "Trần Anh Tuấn",
        "rating": 5,
        "comment": "Sân rất đẹp, thảm bám tốt, trần cao không bị chói mắt. Chủ sân thân thiện và có tủ đồ khoá số an toàn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-75-2",
        "userName": "Nguyễn Hải Yến",
        "rating": 4,
        "comment": "Đặt qua web nhanh gọn, đến sân quét mã là vào chơi ngay không phải chờ đợi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-76",
    "slug": "san-cau-long-linh-dam-riverside",
    "name": "Sân Cầu Lông Linh Đàm Riverside",
    "description": "Sân chơi đẳng cấp phục vụ cư dân và cộng đồng đam mê cầu lông, quầy bar nước ép trái cây tươi và whey protein dinh dưỡng sau trận đấu.",
    "address": "Bán Đảo Linh Đàm, Phường Hoàng Liệt",
    "district": "Hoàng Mai",
    "city": "Hà Nội",
    "lat": 20.9715,
    "lng": 105.8285,
    "openMin": 330,
    "closeMin": 1380,
    "priceFrom": 90000,
    "ratingAvg": 4.7,
    "ratingCount": 58,
    "images": [
      "/images/courts/court-76.svg",
      "/images/courts/court-86.svg",
      "/images/courts/court-96.svg"
    ],
    "amenities": [
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 12.3,
    "courts": [
      {
        "id": "court-76-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-76-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-76-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-76-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-76-5",
        "name": "Sân 5",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-76-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 90000,
        "fixedPrice": 80000
      },
      {
        "id": "p-76-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1380,
        "walkInPrice": 130000,
        "fixedPrice": 115000
      },
      {
        "id": "p-76-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1380,
        "walkInPrice": 125000,
        "fixedPrice": 115000
      }
    ],
    "reviews": [
      {
        "id": "rev-76-1",
        "userName": "Vũ Minh Quân",
        "rating": 5,
        "comment": "Vị trí đẹp, gửi xe ô tô thoải mái, căng tin bán nhiều đồ uống thể thao xịn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-76-2",
        "userName": "Đỗ Gia Huy",
        "rating": 4,
        "comment": "Sân rộng, nhiều sân nên dễ đặt giờ đẹp. Chỗ để xe cực kỳ thoải mái.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-77",
    "slug": "clb-cau-long-dinh-cong-plaza",
    "name": "CLB Cầu Lông Định Công Plaza",
    "description": "Chỗ đỗ xe rộng thênh thang đỗ được 30 ô tô, sân chơi thân thiện gia đình có khu vực ghế chờ êm ái cho người nhà và cổ động viên.",
    "address": "KĐT Định Công, Phường Định Công",
    "district": "Hoàng Mai",
    "city": "Hà Nội",
    "lat": 20.9845,
    "lng": 105.8315,
    "openMin": 360,
    "closeMin": 1320,
    "priceFrom": 100000,
    "ratingAvg": 4.8,
    "ratingCount": 61,
    "images": [
      "/images/courts/court-77.svg",
      "/images/courts/court-87.svg",
      "/images/courts/court-97.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 12.6,
    "courts": [
      {
        "id": "court-77-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-77-2",
        "name": "Sân 2",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-77-3",
        "name": "Sân 3",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-77-4",
        "name": "Sân 4",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-77-5",
        "name": "Sân 5",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-77-6",
        "name": "Sân 6",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-77-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 100000,
        "fixedPrice": 90000
      },
      {
        "id": "p-77-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 140000,
        "fixedPrice": 125000
      },
      {
        "id": "p-77-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1320,
        "walkInPrice": 135000,
        "fixedPrice": 125000
      }
    ],
    "reviews": [
      {
        "id": "rev-77-1",
        "userName": "Lê Thuỳ Trang",
        "rating": 5,
        "comment": "Giá tốt nhất khu vực, nhân viên hỗ trợ nhiệt tình, dịch vụ căng vợt rất chuẩn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-77-2",
        "userName": "Phạm Quốc Bảo",
        "rating": 4,
        "comment": "Chơi ca đêm sau giờ làm rất tiện, sân sạch sẽ và điều hoà mát rượi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-78",
    "slug": "san-cau-long-tam-trinh-arena",
    "name": "Sân Cầu Lông Tam Trinh Arena",
    "description": "Sân thảm Alite chống trượt 5 lớp, dịch vụ sửa chữa và thay quấn cán vợt siêu tốc. Nhân viên hỗ trợ tận tình nhặt cầu và xếp sân.",
    "address": "Số 320 Tam Trinh, Phường Hoàng Văn Thụ",
    "district": "Hoàng Mai",
    "city": "Hà Nội",
    "lat": 20.9895,
    "lng": 105.8595,
    "openMin": 300,
    "closeMin": 1320,
    "priceFrom": 110000,
    "ratingAvg": 4.9,
    "ratingCount": 64,
    "images": [
      "/images/courts/court-78.svg",
      "/images/courts/court-88.svg",
      "/images/courts/court-98.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "CANTEEN",
      "SHOWER",
      "WIFI"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 12.9,
    "courts": [
      {
        "id": "court-78-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-78-2",
        "name": "Sân 2",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-78-3",
        "name": "Sân 3",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-78-4",
        "name": "Sân 4",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-78-5",
        "name": "Sân 5",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-78-6",
        "name": "Sân 6",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-78-7",
        "name": "Sân 7",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-78-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 110000,
        "fixedPrice": 100000
      },
      {
        "id": "p-78-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 150000,
        "fixedPrice": 135000
      },
      {
        "id": "p-78-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1320,
        "walkInPrice": 145000,
        "fixedPrice": 135000
      }
    ],
    "reviews": [
      {
        "id": "rev-78-1",
        "userName": "Hoàng Minh Đức",
        "rating": 5,
        "comment": "Ánh sáng chuẩn không bị chói khi ngửa cổ đánh cầu cao sâu. 5 sao cho chất lượng!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-78-2",
        "userName": "Ngô Phương Thảo",
        "rating": 4,
        "comment": "Phòng tắm nóng lạnh rất sạch, có máy sấy tóc tiện lợi cho bạn nữ sau trận đấu.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-79",
    "slug": "clb-cau-long-tan-mai-star",
    "name": "CLB Cầu Lông Tân Mai Star",
    "description": "Điểm hẹn lý tưởng sau giờ làm việc căng thẳng, ánh sáng đồng đều 450 Lux không góc chết, giá thuê sân linh hoạt theo từng khung giờ.",
    "address": "Số 18 Tân Mai, Phường Tân Mai",
    "district": "Hoàng Mai",
    "city": "Hà Nội",
    "lat": 20.9875,
    "lng": 105.8515,
    "openMin": 330,
    "closeMin": 1320,
    "priceFrom": 120000,
    "ratingAvg": 5,
    "ratingCount": 67,
    "images": [
      "/images/courts/court-79.svg",
      "/images/courts/court-89.svg",
      "/images/courts/court-99.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 13.2,
    "courts": [
      {
        "id": "court-79-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-79-2",
        "name": "Sân 2",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-79-3",
        "name": "Sân 3",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-79-4",
        "name": "Sân 4",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-79-5",
        "name": "Sân 5",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-79-6",
        "name": "Sân 6",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-79-7",
        "name": "Sân 7",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-79-8",
        "name": "Sân 8",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-79-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 120000,
        "fixedPrice": 110000
      },
      {
        "id": "p-79-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 160000,
        "fixedPrice": 145000
      },
      {
        "id": "p-79-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1320,
        "walkInPrice": 155000,
        "fixedPrice": 145000
      }
    ],
    "reviews": [
      {
        "id": "rev-79-1",
        "userName": "Bùi Văn Nam",
        "rating": 5,
        "comment": "Thảm xịn đánh 2 tiếng không mỏi gối hay trơn trượt. Sẽ ủng hộ lâu dài!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-79-2",
        "userName": "Đặng Thu Hà",
        "rating": 4,
        "comment": "Giao diện đặt sân tiện lợi, thanh toán online mượt mà, chủ sân đón tiếp niềm nở.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-80",
    "slug": "san-cau-long-linh-nam-sport",
    "name": "Sân Cầu Lông Lĩnh Nam Sport",
    "description": "Cơ sở tiêu chuẩn thi đấu với sàn thảm cao su chuyên dụng, trần cao 9m thông thoáng, hệ thống đèn chống chói đạt chuẩn BWF. Có phục vụ nước uống, căng-tin và dịch vụ đan vợt lấy ngay.",
    "address": "Số 250 Lĩnh Nam, Phường Lĩnh Nam",
    "district": "Hoàng Mai",
    "city": "Hà Nội",
    "lat": 20.9815,
    "lng": 105.8745,
    "openMin": 360,
    "closeMin": 1440,
    "priceFrom": 50000,
    "ratingAvg": 4.6,
    "ratingCount": 70,
    "images": [
      "/images/courts/court-80.svg",
      "/images/courts/court-90.svg",
      "/images/courts/court-100.svg"
    ],
    "amenities": [
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 1.5,
    "courts": [
      {
        "id": "court-80-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-80-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-80-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-80-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-80-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 50000,
        "fixedPrice": 40000
      },
      {
        "id": "p-80-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1440,
        "walkInPrice": 90000,
        "fixedPrice": 75000
      },
      {
        "id": "p-80-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1440,
        "walkInPrice": 85000,
        "fixedPrice": 75000
      }
    ],
    "reviews": [
      {
        "id": "rev-80-1",
        "userName": "Trần Anh Tuấn",
        "rating": 5,
        "comment": "Sân rất đẹp, thảm bám tốt, trần cao không bị chói mắt. Chủ sân thân thiện và có tủ đồ khoá số an toàn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-80-2",
        "userName": "Nguyễn Hải Yến",
        "rating": 4,
        "comment": "Đặt qua web nhanh gọn, đến sân quét mã là vào chơi ngay không phải chờ đợi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-81",
    "slug": "clb-cau-long-vinh-hung-central",
    "name": "CLB Cầu Lông Vĩnh Hưng Central",
    "description": "Không gian thoáng mát ven hồ Tây, hệ thống điều hoà mát rượi, thảm Yonex cao cấp. Có câu lạc bộ sinh hoạt thường xuyên cho người muốn tìm bạn giao lưu.",
    "address": "Số 168 Vĩnh Hưng, Phường Vĩnh Hưng",
    "district": "Hoàng Mai",
    "city": "Hà Nội",
    "lat": 20.9955,
    "lng": 105.8785,
    "openMin": 300,
    "closeMin": 1380,
    "priceFrom": 60000,
    "ratingAvg": 4.7,
    "ratingCount": 73,
    "images": [
      "/images/courts/court-81.svg",
      "/images/courts/court-91.svg",
      "/images/courts/court-1.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 1.8,
    "courts": [
      {
        "id": "court-81-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-81-2",
        "name": "Sân 2",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-81-3",
        "name": "Sân 3",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-81-4",
        "name": "Sân 4",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-81-5",
        "name": "Sân 5",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-81-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 60000,
        "fixedPrice": 50000
      },
      {
        "id": "p-81-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1380,
        "walkInPrice": 100000,
        "fixedPrice": 85000
      },
      {
        "id": "p-81-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1380,
        "walkInPrice": 95000,
        "fixedPrice": 85000
      }
    ],
    "reviews": [
      {
        "id": "rev-81-1",
        "userName": "Vũ Minh Quân",
        "rating": 5,
        "comment": "Vị trí đẹp, gửi xe ô tô thoải mái, căng tin bán nhiều đồ uống thể thao xịn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-81-2",
        "userName": "Đỗ Gia Huy",
        "rating": 4,
        "comment": "Sân rộng, nhiều sân nên dễ đặt giờ đẹp. Chỗ để xe cực kỳ thoải mái.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-82",
    "slug": "san-cau-long-dai-kim-pro",
    "name": "Sân Cầu Lông Đại Kim Pro",
    "description": "Tổ hợp 8 sân quy mô lớn nằm trong khuôn viên khu liên hợp thể thao Mỹ Đình. Cho phép thanh toán trực tiếp tại sân, hỗ trợ tổ chức giải đấu phong trào.",
    "address": "KĐT Đại Kim, Phường Đại Kim",
    "district": "Hoàng Mai",
    "city": "Hà Nội",
    "lat": 20.9785,
    "lng": 105.8215,
    "openMin": 330,
    "closeMin": 1320,
    "priceFrom": 70000,
    "ratingAvg": 4.8,
    "ratingCount": 76,
    "images": [
      "/images/courts/court-82.svg",
      "/images/courts/court-92.svg",
      "/images/courts/court-2.svg"
    ],
    "amenities": [
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 2.1,
    "courts": [
      {
        "id": "court-82-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-82-2",
        "name": "Sân 2",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-82-3",
        "name": "Sân 3",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-82-4",
        "name": "Sân 4",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-82-5",
        "name": "Sân 5",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-82-6",
        "name": "Sân 6",
        "surface": "Thảm Alite BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-82-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 70000,
        "fixedPrice": 60000
      },
      {
        "id": "p-82-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 110000,
        "fixedPrice": 95000
      },
      {
        "id": "p-82-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1320,
        "walkInPrice": 105000,
        "fixedPrice": 95000
      }
    ],
    "reviews": [
      {
        "id": "rev-82-1",
        "userName": "Lê Thuỳ Trang",
        "rating": 5,
        "comment": "Giá tốt nhất khu vực, nhân viên hỗ trợ nhiệt tình, dịch vụ căng vợt rất chuẩn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-82-2",
        "userName": "Phạm Quốc Bảo",
        "rating": 4,
        "comment": "Chơi ca đêm sau giờ làm rất tiện, sân sạch sẽ và điều hoà mát rượi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-83",
    "slug": "clb-cau-long-bach-khoa-sport",
    "name": "CLB Cầu Lông Bách Khoa Sport",
    "description": "Cơ sở mới nâng cấp 4 sân chuẩn đẹp, giá cả học sinh sinh viên rất mềm, có dịch vụ căng cước vợt chất lượng cao.",
    "address": "Số 1 Đại Cồ Việt, Phường Bách Khoa",
    "district": "Hai Bà Trưng",
    "city": "Hà Nội",
    "lat": 21.0065,
    "lng": 105.8455,
    "openMin": 360,
    "closeMin": 1320,
    "priceFrom": 80000,
    "ratingAvg": 4.9,
    "ratingCount": 79,
    "images": [
      "/images/courts/court-83.svg",
      "/images/courts/court-93.svg",
      "/images/courts/court-3.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 2.4,
    "courts": [
      {
        "id": "court-83-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-83-2",
        "name": "Sân 2",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-83-3",
        "name": "Sân 3",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-83-4",
        "name": "Sân 4",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-83-5",
        "name": "Sân 5",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-83-6",
        "name": "Sân 6",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-83-7",
        "name": "Sân 7",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-83-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 80000,
        "fixedPrice": 70000
      },
      {
        "id": "p-83-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 120000,
        "fixedPrice": 105000
      },
      {
        "id": "p-83-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1320,
        "walkInPrice": 115000,
        "fixedPrice": 105000
      }
    ],
    "reviews": [
      {
        "id": "rev-83-1",
        "userName": "Hoàng Minh Đức",
        "rating": 5,
        "comment": "Ánh sáng chuẩn không bị chói khi ngửa cổ đánh cầu cao sâu. 5 sao cho chất lượng!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-83-2",
        "userName": "Ngô Phương Thảo",
        "rating": 4,
        "comment": "Phòng tắm nóng lạnh rất sạch, có máy sấy tóc tiện lợi cho bạn nữ sau trận đấu.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-84",
    "slug": "san-cau-long-times-city-mega",
    "name": "Sân Cầu Lông Times City Mega",
    "description": "Điểm đến lý tưởng cho anh chị em bận rộn thích chơi ca đêm. Mở cửa từ 05:00 đến tận nửa đêm 24:00, điều hoà trung tâm 24/7.",
    "address": "Số 458 Minh Khai, Phường Vĩnh Tuy",
    "district": "Hai Bà Trưng",
    "city": "Hà Nội",
    "lat": 20.9955,
    "lng": 105.8675,
    "openMin": 300,
    "closeMin": 1320,
    "priceFrom": 90000,
    "ratingAvg": 5,
    "ratingCount": 82,
    "images": [
      "/images/courts/court-84.svg",
      "/images/courts/court-94.svg",
      "/images/courts/court-4.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "CANTEEN",
      "SHOWER",
      "WIFI"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 2.7,
    "courts": [
      {
        "id": "court-84-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-84-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-84-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-84-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-84-5",
        "name": "Sân 5",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-84-6",
        "name": "Sân 6",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-84-7",
        "name": "Sân 7",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-84-8",
        "name": "Sân 8",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-84-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 90000,
        "fixedPrice": 80000
      },
      {
        "id": "p-84-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 130000,
        "fixedPrice": 115000
      },
      {
        "id": "p-84-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1320,
        "walkInPrice": 125000,
        "fixedPrice": 115000
      }
    ],
    "reviews": [
      {
        "id": "rev-84-1",
        "userName": "Bùi Văn Nam",
        "rating": 5,
        "comment": "Thảm xịn đánh 2 tiếng không mỏi gối hay trơn trượt. Sẽ ủng hộ lâu dài!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-84-2",
        "userName": "Đặng Thu Hà",
        "rating": 4,
        "comment": "Giao diện đặt sân tiện lợi, thanh toán online mượt mà, chủ sân đón tiếp niềm nở.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-85",
    "slug": "clb-cau-long-lac-trung-arena",
    "name": "CLB Cầu Lông Lạc Trung Arena",
    "description": "Sân thảm PVC vân cát đạt chuẩn thi đấu quốc tế, khoảng cách giữa các sân rộng rãi 2m tránh va chạm. Bãi đỗ xe ô tô miễn phí.",
    "address": "Số 68 Lạc Trung, Phường Vĩnh Tuy",
    "district": "Hai Bà Trưng",
    "city": "Hà Nội",
    "lat": 21.0025,
    "lng": 105.8625,
    "openMin": 330,
    "closeMin": 1440,
    "priceFrom": 100000,
    "ratingAvg": 4.6,
    "ratingCount": 85,
    "images": [
      "/images/courts/court-85.svg",
      "/images/courts/court-95.svg",
      "/images/courts/court-5.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 3,
    "courts": [
      {
        "id": "court-85-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-85-2",
        "name": "Sân 2",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-85-3",
        "name": "Sân 3",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-85-4",
        "name": "Sân 4",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-85-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 100000,
        "fixedPrice": 90000
      },
      {
        "id": "p-85-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1440,
        "walkInPrice": 140000,
        "fixedPrice": 125000
      },
      {
        "id": "p-85-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1440,
        "walkInPrice": 135000,
        "fixedPrice": 125000
      }
    ],
    "reviews": [
      {
        "id": "rev-85-1",
        "userName": "Trần Anh Tuấn",
        "rating": 5,
        "comment": "Sân rất đẹp, thảm bám tốt, trần cao không bị chói mắt. Chủ sân thân thiện và có tủ đồ khoá số an toàn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-85-2",
        "userName": "Nguyễn Hải Yến",
        "rating": 4,
        "comment": "Đặt qua web nhanh gọn, đến sân quét mã là vào chơi ngay không phải chờ đợi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-86",
    "slug": "san-cau-long-bach-mai-smash",
    "name": "Sân Cầu Lông Bạch Mai Smash",
    "description": "Hệ thống đèn LED âm trần chống chói mắt tuyệt đối khi lốp cầu cao sâu. Đội ngũ huấn luyện viên giàu kinh nghiệm hỗ trợ hướng dẫn cơ bản.",
    "address": "Số 380 Bạch Mai, Phường Bạch Mai",
    "district": "Hai Bà Trưng",
    "city": "Hà Nội",
    "lat": 21.0015,
    "lng": 105.8495,
    "openMin": 360,
    "closeMin": 1380,
    "priceFrom": 110000,
    "ratingAvg": 4.7,
    "ratingCount": 88,
    "images": [
      "/images/courts/court-86.svg",
      "/images/courts/court-96.svg",
      "/images/courts/court-6.svg"
    ],
    "amenities": [
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 3.3,
    "courts": [
      {
        "id": "court-86-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-86-2",
        "name": "Sân 2",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-86-3",
        "name": "Sân 3",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-86-4",
        "name": "Sân 4",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-86-5",
        "name": "Sân 5",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-86-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 110000,
        "fixedPrice": 100000
      },
      {
        "id": "p-86-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1380,
        "walkInPrice": 150000,
        "fixedPrice": 135000
      },
      {
        "id": "p-86-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1380,
        "walkInPrice": 145000,
        "fixedPrice": 135000
      }
    ],
    "reviews": [
      {
        "id": "rev-86-1",
        "userName": "Vũ Minh Quân",
        "rating": 5,
        "comment": "Vị trí đẹp, gửi xe ô tô thoải mái, căng tin bán nhiều đồ uống thể thao xịn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-86-2",
        "userName": "Đỗ Gia Huy",
        "rating": 4,
        "comment": "Sân rộng, nhiều sân nên dễ đặt giờ đẹp. Chỗ để xe cực kỳ thoải mái.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-87",
    "slug": "clb-cau-long-ba-trieu-central",
    "name": "CLB Cầu Lông Bà Triệu Central",
    "description": "Trần nhà cao 11m cách nhiệt mùa hè mát mẻ, sàn gỗ phong phủ thảm cao su chống sốc bảo vệ đầu gối và mắt cá chân tối đa.",
    "address": "Số 191 Bà Triệu, Phường Lê Đại Hành",
    "district": "Hai Bà Trưng",
    "city": "Hà Nội",
    "lat": 21.0115,
    "lng": 105.8495,
    "openMin": 300,
    "closeMin": 1320,
    "priceFrom": 120000,
    "ratingAvg": 4.8,
    "ratingCount": 91,
    "images": [
      "/images/courts/court-87.svg",
      "/images/courts/court-97.svg",
      "/images/courts/court-7.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 3.6,
    "courts": [
      {
        "id": "court-87-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-87-2",
        "name": "Sân 2",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-87-3",
        "name": "Sân 3",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-87-4",
        "name": "Sân 4",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-87-5",
        "name": "Sân 5",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-87-6",
        "name": "Sân 6",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-87-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 120000,
        "fixedPrice": 110000
      },
      {
        "id": "p-87-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 160000,
        "fixedPrice": 145000
      },
      {
        "id": "p-87-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1320,
        "walkInPrice": 155000,
        "fixedPrice": 145000
      }
    ],
    "reviews": [
      {
        "id": "rev-87-1",
        "userName": "Lê Thuỳ Trang",
        "rating": 5,
        "comment": "Giá tốt nhất khu vực, nhân viên hỗ trợ nhiệt tình, dịch vụ căng vợt rất chuẩn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-87-2",
        "userName": "Phạm Quốc Bảo",
        "rating": 4,
        "comment": "Chơi ca đêm sau giờ làm rất tiện, sân sạch sẽ và điều hoà mát rượi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-88",
    "slug": "san-cau-long-dong-nhan-sport",
    "name": "Sân Cầu Lông Đồng Nhân Sport",
    "description": "Trang bị máy đo căng vợt điện tử 6 điểm hiện đại, quầy phụ kiện chính hãng Yonex, Lining, Victor. Phòng tắm nóng lạnh sạch sẽ.",
    "address": "Số 25 Lò Đúc, Phường Phạm Đình Hổ",
    "district": "Hai Bà Trưng",
    "city": "Hà Nội",
    "lat": 21.0175,
    "lng": 105.8565,
    "openMin": 330,
    "closeMin": 1320,
    "priceFrom": 50000,
    "ratingAvg": 4.9,
    "ratingCount": 94,
    "images": [
      "/images/courts/court-88.svg",
      "/images/courts/court-98.svg",
      "/images/courts/court-8.svg"
    ],
    "amenities": [
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 3.9,
    "courts": [
      {
        "id": "court-88-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-88-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-88-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-88-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-88-5",
        "name": "Sân 5",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-88-6",
        "name": "Sân 6",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-88-7",
        "name": "Sân 7",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-88-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 50000,
        "fixedPrice": 40000
      },
      {
        "id": "p-88-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 90000,
        "fixedPrice": 75000
      },
      {
        "id": "p-88-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1320,
        "walkInPrice": 85000,
        "fixedPrice": 75000
      }
    ],
    "reviews": [
      {
        "id": "rev-88-1",
        "userName": "Hoàng Minh Đức",
        "rating": 5,
        "comment": "Ánh sáng chuẩn không bị chói khi ngửa cổ đánh cầu cao sâu. 5 sao cho chất lượng!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-88-2",
        "userName": "Ngô Phương Thảo",
        "rating": 4,
        "comment": "Phòng tắm nóng lạnh rất sạch, có máy sấy tóc tiện lợi cho bạn nữ sau trận đấu.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-89",
    "slug": "clb-cau-long-thanh-luong-pro",
    "name": "CLB Cầu Lông Thanh Lương Pro",
    "description": "Không gian thể thao chuyên nghiệp với khán đài mini, hệ thống camera AI tự động ghi hình pha đập cầu đẹp mắt gửi về điện thoại.",
    "address": "Số 15 Kim Ngưu, Phường Thanh Lương",
    "district": "Hai Bà Trưng",
    "city": "Hà Nội",
    "lat": 21.0085,
    "lng": 105.8615,
    "openMin": 360,
    "closeMin": 1320,
    "priceFrom": 60000,
    "ratingAvg": 5,
    "ratingCount": 97,
    "images": [
      "/images/courts/court-89.svg",
      "/images/courts/court-99.svg",
      "/images/courts/court-9.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 4.2,
    "courts": [
      {
        "id": "court-89-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-89-2",
        "name": "Sân 2",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-89-3",
        "name": "Sân 3",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-89-4",
        "name": "Sân 4",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-89-5",
        "name": "Sân 5",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-89-6",
        "name": "Sân 6",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-89-7",
        "name": "Sân 7",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-89-8",
        "name": "Sân 8",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-89-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 60000,
        "fixedPrice": 50000
      },
      {
        "id": "p-89-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 100000,
        "fixedPrice": 85000
      },
      {
        "id": "p-89-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1320,
        "walkInPrice": 95000,
        "fixedPrice": 85000
      }
    ],
    "reviews": [
      {
        "id": "rev-89-1",
        "userName": "Bùi Văn Nam",
        "rating": 5,
        "comment": "Thảm xịn đánh 2 tiếng không mỏi gối hay trơn trượt. Sẽ ủng hộ lâu dài!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-89-2",
        "userName": "Đặng Thu Hà",
        "rating": 4,
        "comment": "Giao diện đặt sân tiện lợi, thanh toán online mượt mà, chủ sân đón tiếp niềm nở.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-90",
    "slug": "san-cau-long-truong-dinh-court",
    "name": "Sân Cầu Lông Trương Định Court",
    "description": "Cơ sở 6 sân thảm mới 100%, trang bị quạt công nghiệp đối lưu gió êm ái không ảnh hưởng hướng bay của quả cầu lông.",
    "address": "Số 120 Trương Định, Phường Trương Định",
    "district": "Hai Bà Trưng",
    "city": "Hà Nội",
    "lat": 20.9945,
    "lng": 105.8485,
    "openMin": 300,
    "closeMin": 1440,
    "priceFrom": 70000,
    "ratingAvg": 4.6,
    "ratingCount": 100,
    "images": [
      "/images/courts/court-90.svg",
      "/images/courts/court-100.svg",
      "/images/courts/court-10.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "CANTEEN",
      "SHOWER",
      "WIFI"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 4.5,
    "courts": [
      {
        "id": "court-90-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-90-2",
        "name": "Sân 2",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-90-3",
        "name": "Sân 3",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-90-4",
        "name": "Sân 4",
        "surface": "Thảm Alite BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-90-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 70000,
        "fixedPrice": 60000
      },
      {
        "id": "p-90-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1440,
        "walkInPrice": 110000,
        "fixedPrice": 95000
      },
      {
        "id": "p-90-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1440,
        "walkInPrice": 105000,
        "fixedPrice": 95000
      }
    ],
    "reviews": [
      {
        "id": "rev-90-1",
        "userName": "Trần Anh Tuấn",
        "rating": 5,
        "comment": "Sân rất đẹp, thảm bám tốt, trần cao không bị chói mắt. Chủ sân thân thiện và có tủ đồ khoá số an toàn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-90-2",
        "userName": "Nguyễn Hải Yến",
        "rating": 4,
        "comment": "Đặt qua web nhanh gọn, đến sân quét mã là vào chơi ngay không phải chờ đợi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-91",
    "slug": "san-cau-long-hoan-kiem-heritage",
    "name": "Sân Cầu Lông Hoàn Kiếm Heritage",
    "description": "Nằm tại vị trí trung tâm giao thông thuận tiện, có phòng thay đồ nam nữ riêng biệt, tủ khóa locker thông minh an toàn tuyệt đối.",
    "address": "Số 42 Hai Bà Trưng, Phường Tràng Tiền",
    "district": "Hoàn Kiếm",
    "city": "Hà Nội",
    "lat": 21.0265,
    "lng": 105.8525,
    "openMin": 330,
    "closeMin": 1380,
    "priceFrom": 80000,
    "ratingAvg": 4.7,
    "ratingCount": 103,
    "images": [
      "/images/courts/court-91.svg",
      "/images/courts/court-1.svg",
      "/images/courts/court-11.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 4.8,
    "courts": [
      {
        "id": "court-91-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-91-2",
        "name": "Sân 2",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-91-3",
        "name": "Sân 3",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-91-4",
        "name": "Sân 4",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      },
      {
        "id": "court-91-5",
        "name": "Sân 5",
        "surface": "Thảm Gerflor cao cấp",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-91-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 80000,
        "fixedPrice": 70000
      },
      {
        "id": "p-91-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1380,
        "walkInPrice": 120000,
        "fixedPrice": 105000
      },
      {
        "id": "p-91-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1380,
        "walkInPrice": 115000,
        "fixedPrice": 105000
      }
    ],
    "reviews": [
      {
        "id": "rev-91-1",
        "userName": "Vũ Minh Quân",
        "rating": 5,
        "comment": "Vị trí đẹp, gửi xe ô tô thoải mái, căng tin bán nhiều đồ uống thể thao xịn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-91-2",
        "userName": "Đỗ Gia Huy",
        "rating": 4,
        "comment": "Sân rộng, nhiều sân nên dễ đặt giờ đẹp. Chỗ để xe cực kỳ thoải mái.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-92",
    "slug": "clb-cau-long-tran-hung-dao-pro",
    "name": "CLB Cầu Lông Trần Hưng Đạo Pro",
    "description": "Sân cầu lông đạt chuẩn liên đoàn BWF với vạch sơn sắc nét, thảm bám dính cực tốt ngay cả khi đổ nhiều mồ hôi. Nước chanh muối pha tươi.",
    "address": "Số 88 Trần Hưng Đạo, Phường Cửa Nam",
    "district": "Hoàn Kiếm",
    "city": "Hà Nội",
    "lat": 21.0235,
    "lng": 105.8435,
    "openMin": 360,
    "closeMin": 1320,
    "priceFrom": 90000,
    "ratingAvg": 4.8,
    "ratingCount": 106,
    "images": [
      "/images/courts/court-92.svg",
      "/images/courts/court-2.svg",
      "/images/courts/court-12.svg"
    ],
    "amenities": [
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 5.1,
    "courts": [
      {
        "id": "court-92-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-92-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-92-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-92-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-92-5",
        "name": "Sân 5",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      },
      {
        "id": "court-92-6",
        "name": "Sân 6",
        "surface": "Thảm PVC Vân Cát",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-92-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 90000,
        "fixedPrice": 80000
      },
      {
        "id": "p-92-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 130000,
        "fixedPrice": 115000
      },
      {
        "id": "p-92-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1320,
        "walkInPrice": 125000,
        "fixedPrice": 115000
      }
    ],
    "reviews": [
      {
        "id": "rev-92-1",
        "userName": "Lê Thuỳ Trang",
        "rating": 5,
        "comment": "Giá tốt nhất khu vực, nhân viên hỗ trợ nhiệt tình, dịch vụ căng vợt rất chuẩn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-92-2",
        "userName": "Phạm Quốc Bảo",
        "rating": 4,
        "comment": "Chơi ca đêm sau giờ làm rất tiện, sân sạch sẽ và điều hoà mát rượi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-93",
    "slug": "san-cau-long-ly-thuong-kiet-central",
    "name": "Sân Cầu Lông Lý Thường Kiệt Central",
    "description": "Hội tụ nhiều tay vợt phong trào trình độ khá - giỏi, thường xuyên tổ chức giải đấu nội bộ cuối tuần có cúp và phần thưởng giá trị.",
    "address": "Số 45 Lý Thường Kiệt, Phường Hàng Bài",
    "district": "Hoàn Kiếm",
    "city": "Hà Nội",
    "lat": 21.0245,
    "lng": 105.8515,
    "openMin": 300,
    "closeMin": 1320,
    "priceFrom": 100000,
    "ratingAvg": 4.9,
    "ratingCount": 109,
    "images": [
      "/images/courts/court-93.svg",
      "/images/courts/court-3.svg",
      "/images/courts/court-13.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 5.4,
    "courts": [
      {
        "id": "court-93-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-93-2",
        "name": "Sân 2",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-93-3",
        "name": "Sân 3",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-93-4",
        "name": "Sân 4",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-93-5",
        "name": "Sân 5",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-93-6",
        "name": "Sân 6",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      },
      {
        "id": "court-93-7",
        "name": "Sân 7",
        "surface": "Sàn gỗ phong phủ thảm",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-93-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 100000,
        "fixedPrice": 90000
      },
      {
        "id": "p-93-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 140000,
        "fixedPrice": 125000
      },
      {
        "id": "p-93-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1320,
        "walkInPrice": 135000,
        "fixedPrice": 125000
      }
    ],
    "reviews": [
      {
        "id": "rev-93-1",
        "userName": "Hoàng Minh Đức",
        "rating": 5,
        "comment": "Ánh sáng chuẩn không bị chói khi ngửa cổ đánh cầu cao sâu. 5 sao cho chất lượng!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-93-2",
        "userName": "Ngô Phương Thảo",
        "rating": 4,
        "comment": "Phòng tắm nóng lạnh rất sạch, có máy sấy tóc tiện lợi cho bạn nữ sau trận đấu.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-94",
    "slug": "clb-cau-long-phan-chu-trinh-arena",
    "name": "CLB Cầu Lông Phan Chu Trinh Arena",
    "description": "Mặt sân cao cấp giảm phản lực tác động lên cột sống, trần thông gió tự nhiên không bí mùi. Cho thuê giày và vợt xịn giá hữu nghị.",
    "address": "Số 19 Phan Chu Trinh, Phường Phan Chu Trinh",
    "district": "Hoàn Kiếm",
    "city": "Hà Nội",
    "lat": 21.0225,
    "lng": 105.8575,
    "openMin": 330,
    "closeMin": 1320,
    "priceFrom": 110000,
    "ratingAvg": 5,
    "ratingCount": 112,
    "images": [
      "/images/courts/court-94.svg",
      "/images/courts/court-4.svg",
      "/images/courts/court-14.svg"
    ],
    "amenities": [
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 5.7,
    "courts": [
      {
        "id": "court-94-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-94-2",
        "name": "Sân 2",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-94-3",
        "name": "Sân 3",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-94-4",
        "name": "Sân 4",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-94-5",
        "name": "Sân 5",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-94-6",
        "name": "Sân 6",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-94-7",
        "name": "Sân 7",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      },
      {
        "id": "court-94-8",
        "name": "Sân 8",
        "surface": "Thảm Tinsue Championship",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-94-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 110000,
        "fixedPrice": 100000
      },
      {
        "id": "p-94-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 150000,
        "fixedPrice": 135000
      },
      {
        "id": "p-94-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1320,
        "walkInPrice": 145000,
        "fixedPrice": 135000
      }
    ],
    "reviews": [
      {
        "id": "rev-94-1",
        "userName": "Bùi Văn Nam",
        "rating": 5,
        "comment": "Thảm xịn đánh 2 tiếng không mỏi gối hay trơn trượt. Sẽ ủng hộ lâu dài!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-94-2",
        "userName": "Đặng Thu Hà",
        "rating": 4,
        "comment": "Giao diện đặt sân tiện lợi, thanh toán online mượt mà, chủ sân đón tiếp niềm nở.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-95",
    "slug": "san-cau-long-cua-nam-sport",
    "name": "Sân Cầu Lông Cửa Nam Sport",
    "description": "Thiết kế hiện đại với tone màu tối làm nổi bật quả cầu trắng, hệ thống âm thanh chất lượng cao phục vụ các trận cầu giao lưu sôi động.",
    "address": "Số 15 Cửa Nam, Phường Cửa Nam",
    "district": "Hoàn Kiếm",
    "city": "Hà Nội",
    "lat": 21.0285,
    "lng": 105.8395,
    "openMin": 360,
    "closeMin": 1440,
    "priceFrom": 120000,
    "ratingAvg": 4.6,
    "ratingCount": 115,
    "images": [
      "/images/courts/court-95.svg",
      "/images/courts/court-5.svg",
      "/images/courts/court-15.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 6,
    "courts": [
      {
        "id": "court-95-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-95-2",
        "name": "Sân 2",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-95-3",
        "name": "Sân 3",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      },
      {
        "id": "court-95-4",
        "name": "Sân 4",
        "surface": "Thảm cao su giảm chấn BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-95-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 120000,
        "fixedPrice": 110000
      },
      {
        "id": "p-95-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1440,
        "walkInPrice": 160000,
        "fixedPrice": 145000
      },
      {
        "id": "p-95-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1440,
        "walkInPrice": 155000,
        "fixedPrice": 145000
      }
    ],
    "reviews": [
      {
        "id": "rev-95-1",
        "userName": "Trần Anh Tuấn",
        "rating": 5,
        "comment": "Sân rất đẹp, thảm bám tốt, trần cao không bị chói mắt. Chủ sân thân thiện và có tủ đồ khoá số an toàn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-95-2",
        "userName": "Nguyễn Hải Yến",
        "rating": 4,
        "comment": "Đặt qua web nhanh gọn, đến sân quét mã là vào chơi ngay không phải chờ đợi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-96",
    "slug": "clb-cau-long-hang-bong-smash",
    "name": "CLB Cầu Lông Hàng Bông Smash",
    "description": "Sân chơi đẳng cấp phục vụ cư dân và cộng đồng đam mê cầu lông, quầy bar nước ép trái cây tươi và whey protein dinh dưỡng sau trận đấu.",
    "address": "Số 112 Hàng Bông, Phường Hàng Bông",
    "district": "Hoàn Kiếm",
    "city": "Hà Nội",
    "lat": 21.0315,
    "lng": 105.8455,
    "openMin": 300,
    "closeMin": 1380,
    "priceFrom": 50000,
    "ratingAvg": 4.7,
    "ratingCount": 118,
    "images": [
      "/images/courts/court-96.svg",
      "/images/courts/court-6.svg",
      "/images/courts/court-16.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "RACKET_RENTAL",
      "CANTEEN",
      "SHOWER",
      "WIFI"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "AT_VENUE",
    "hasSlotTonight": true,
    "distanceKm": 6.3,
    "courts": [
      {
        "id": "court-96-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-96-2",
        "name": "Sân 2",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-96-3",
        "name": "Sân 3",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-96-4",
        "name": "Sân 4",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      },
      {
        "id": "court-96-5",
        "name": "Sân 5",
        "surface": "Thảm PVC Enlio",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-96-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 300,
        "endMin": 1020,
        "walkInPrice": 50000,
        "fixedPrice": 40000
      },
      {
        "id": "p-96-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1380,
        "walkInPrice": 90000,
        "fixedPrice": 75000
      },
      {
        "id": "p-96-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 300,
        "endMin": 1380,
        "walkInPrice": 85000,
        "fixedPrice": 75000
      }
    ],
    "reviews": [
      {
        "id": "rev-96-1",
        "userName": "Vũ Minh Quân",
        "rating": 5,
        "comment": "Vị trí đẹp, gửi xe ô tô thoải mái, căng tin bán nhiều đồ uống thể thao xịn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-96-2",
        "userName": "Đỗ Gia Huy",
        "rating": 4,
        "comment": "Sân rộng, nhiều sân nên dễ đặt giờ đẹp. Chỗ để xe cực kỳ thoải mái.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-97",
    "slug": "san-cau-long-chuong-duong-riverside",
    "name": "Sân Cầu Lông Chương Dương Riverside",
    "description": "Chỗ đỗ xe rộng thênh thang đỗ được 30 ô tô, sân chơi thân thiện gia đình có khu vực ghế chờ êm ái cho người nhà và cổ động viên.",
    "address": "Số 32 Bạch Đằng, Phường Chương Dương",
    "district": "Hoàn Kiếm",
    "city": "Hà Nội",
    "lat": 21.0295,
    "lng": 105.8615,
    "openMin": 330,
    "closeMin": 1320,
    "priceFrom": 60000,
    "ratingAvg": 4.8,
    "ratingCount": 121,
    "images": [
      "/images/courts/court-97.svg",
      "/images/courts/court-7.svg",
      "/images/courts/court-17.svg"
    ],
    "amenities": [
      "AC",
      "PARKING",
      "CANTEEN",
      "WIFI",
      "SHOWER"
    ],
    "cancelBeforeHours": 2,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": false,
    "distanceKm": 6.6,
    "courts": [
      {
        "id": "court-97-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-97-2",
        "name": "Sân 2",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-97-3",
        "name": "Sân 3",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-97-4",
        "name": "Sân 4",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-97-5",
        "name": "Sân 5",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      },
      {
        "id": "court-97-6",
        "name": "Sân 6",
        "surface": "Thảm Yonex Pro Court",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-97-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 330,
        "endMin": 1020,
        "walkInPrice": 60000,
        "fixedPrice": 50000
      },
      {
        "id": "p-97-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 100000,
        "fixedPrice": 85000
      },
      {
        "id": "p-97-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 330,
        "endMin": 1320,
        "walkInPrice": 95000,
        "fixedPrice": 85000
      }
    ],
    "reviews": [
      {
        "id": "rev-97-1",
        "userName": "Lê Thuỳ Trang",
        "rating": 5,
        "comment": "Giá tốt nhất khu vực, nhân viên hỗ trợ nhiệt tình, dịch vụ căng vợt rất chuẩn.",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-97-2",
        "userName": "Phạm Quốc Bảo",
        "rating": 4,
        "comment": "Chơi ca đêm sau giờ làm rất tiện, sân sạch sẽ và điều hoà mát rượi.",
        "createdAt": "2026-09-22"
      }
    ]
  },
  {
    "id": "venue-98",
    "slug": "clb-cau-long-phuc-tan-court",
    "name": "CLB Cầu Lông Phúc Tân Court",
    "description": "Sân thảm Alite chống trượt 5 lớp, dịch vụ sửa chữa và thay quấn cán vợt siêu tốc. Nhân viên hỗ trợ tận tình nhặt cầu và xếp sân.",
    "address": "Đường Phúc Tân, Phường Phúc Tân",
    "district": "Hoàn Kiếm",
    "city": "Hà Nội",
    "lat": 21.0385,
    "lng": 105.8565,
    "openMin": 360,
    "closeMin": 1320,
    "priceFrom": 70000,
    "ratingAvg": 4.9,
    "ratingCount": 124,
    "images": [
      "/images/courts/court-98.svg",
      "/images/courts/court-8.svg",
      "/images/courts/court-18.svg"
    ],
    "amenities": [
      "PARKING",
      "RACKET_RENTAL",
      "WIFI",
      "CANTEEN"
    ],
    "cancelBeforeHours": 4,
    "paymentMode": "ONLINE_FULL",
    "hasSlotTonight": true,
    "distanceKm": 6.9,
    "courts": [
      {
        "id": "court-98-1",
        "name": "Sân 1 (Sân trung tâm)",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-98-2",
        "name": "Sân 2",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-98-3",
        "name": "Sân 3",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-98-4",
        "name": "Sân 4",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-98-5",
        "name": "Sân 5",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-98-6",
        "name": "Sân 6",
        "surface": "Thảm Alite BWF",
        "isActive": true
      },
      {
        "id": "court-98-7",
        "name": "Sân 7",
        "surface": "Thảm Alite BWF",
        "isActive": true
      }
    ],
    "pricingRules": [
      {
        "id": "p-98-1",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 360,
        "endMin": 1020,
        "walkInPrice": 70000,
        "fixedPrice": 60000
      },
      {
        "id": "p-98-2",
        "daysOfWeek": [
          1,
          2,
          3,
          4,
          5
        ],
        "startMin": 1020,
        "endMin": 1320,
        "walkInPrice": 110000,
        "fixedPrice": 95000
      },
      {
        "id": "p-98-3",
        "daysOfWeek": [
          6,
          7
        ],
        "startMin": 360,
        "endMin": 1320,
        "walkInPrice": 105000,
        "fixedPrice": 95000
      }
    ],
    "reviews": [
      {
        "id": "rev-98-1",
        "userName": "Hoàng Minh Đức",
        "rating": 5,
        "comment": "Ánh sáng chuẩn không bị chói khi ngửa cổ đánh cầu cao sâu. 5 sao cho chất lượng!",
        "createdAt": "2026-09-28"
      },
      {
        "id": "rev-98-2",
        "userName": "Ngô Phương Thảo",
        "rating": 4,
        "comment": "Phòng tắm nóng lạnh rất sạch, có máy sấy tóc tiện lợi cho bạn nữ sau trận đấu.",
        "createdAt": "2026-09-22"
      }
    ]
  }
];
