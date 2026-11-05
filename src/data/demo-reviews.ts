import type { Review } from "../types/venue";

// Nội dung minh họa, tính vào điểm hiển thị kèm nhãn mẫu; không ghi giao dịch giả.
const SCENARIOS = [
  { rating: 5, comment: "Buổi tập rất thoải mái, sân dễ di chuyển và nhóm mình muốn quay lại vào tuần sau." },
  { rating: 4, comment: "Trải nghiệm nhìn chung ổn. Nếu bổ sung thêm ghế nghỉ giữa các lượt chơi thì sẽ tiện hơn." },
  { rating: 1, comment: "Trong tình huống này, lịch sân bị chồng chéo và nhóm phải chờ lâu. Mong cơ sở kiểm tra lại khâu xếp lịch." },
  { rating: 5, comment: "Đặt lịch thuận tiện, nhận sân nhanh. Nhóm có một buổi giao lưu vui vẻ và đủ thời gian khởi động." },
  { rating: 4, comment: "Phù hợp cho nhóm bạn tập luyện thường xuyên. Giờ cao điểm hơi đông nên cần đến sớm một chút." },
  { rating: 5, comment: "Không gian chơi dễ chịu, nhóm mới bắt đầu cũng cảm thấy thoải mái. Sẽ tiếp tục đặt cho buổi tập tới." },
  { rating: 1, comment: "Tình huống minh họa: ánh sáng chưa phù hợp với nhóm và yêu cầu hỗ trợ chưa được giải quyết kịp thời." },
  { rating: 4, comment: "Buổi chơi diễn ra đúng giờ, trải nghiệm khá tốt. Phần hướng dẫn tìm sân có thể rõ hơn với khách đến lần đầu." },
  { rating: 5, comment: "Lịch tập của cả nhóm được chuẩn bị thuận lợi. Rất hài lòng với trải nghiệm đặt sân và nhận sân." },
  { rating: 4, comment: "Nhìn chung đáp ứng nhu cầu tập luyện. Mong có thêm lựa chọn khung giờ buổi tối cho nhóm đi làm." },
  { rating: 1, comment: "Tình huống minh họa: khu vực nghỉ chưa được chuẩn bị tốt và nhóm chưa hài lòng với cách xử lý phản hồi." },
  { rating: 5, comment: "Một buổi vận động trọn vẹn cùng bạn bè. Sẵn sàng chọn lại sân cho lịch giao lưu tiếp theo." },
] as const;

/** Mỗi sân có 12 mẫu ổn định: 3 x 1 sao, 4 x 4 sao và 5 x 5 sao. */
export function getDemoReviews(venueId: string): Review[] {
  const offset = Array.from(venueId).reduce((sum, char) => sum + char.codePointAt(0)!, 0) % SCENARIOS.length;
  return Array.from({ length: SCENARIOS.length }, (_, index) => {
    const scenario = SCENARIOS[(index + offset) % SCENARIOS.length];
    return {
      id: `demo-review:${venueId}:${index + 1}`,
      isDemo: true,
      images: [],
      userName: `Người chơi mẫu ${String(index + 1).padStart(2, "0")}`,
      rating: scenario.rating,
      comment: scenario.comment,
      createdAt: `2026-10-${String(30 - index).padStart(2, "0")}`,
    };
  });
}
