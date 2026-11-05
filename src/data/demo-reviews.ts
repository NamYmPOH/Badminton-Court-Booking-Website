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

const POSITIVE_TOPICS = [
  "Buổi giao lưu diễn ra đúng giờ, nhóm có đủ thời gian khởi động.",
  "Lịch tập của nhóm được sắp xếp thuận tiện ngay từ đầu.",
  "Thao tác kiểm tra lịch trống và chọn giờ rất dễ theo dõi.",
  "Nhận sân nhanh giúp cả nhóm vào buổi tập thoải mái.",
  "Không gian tập luyện phù hợp để nhóm bạn duy trì vận động.",
  "Trải nghiệm tìm sân và đặt lịch liền mạch, dễ làm quen.",
  "Nhóm mới bắt đầu cũng theo kịp nhịp buổi chơi.",
  "Buổi tập đôi có nhiều pha cầu vui và diễn ra trọn vẹn.",
  "Việc xem thông tin khung giờ giúp nhóm chủ động kế hoạch.",
  "Lịch chơi sau giờ làm phù hợp với thời gian của các thành viên.",
  "Các bước xác nhận đơn rõ ràng, giúp nhóm yên tâm chuẩn bị.",
  "Nhóm gia đình có một buổi vận động nhẹ nhàng và vui vẻ.",
  "Trải nghiệm theo dõi đơn trên điện thoại khá thuận tiện.",
  "Việc thống nhất sân và giờ chơi cho buổi giao lưu dễ dàng.",
  "Cả nhóm có thể tập trung vào luyện kỹ thuật suốt buổi.",
  "Buổi chơi cuối tuần đáp ứng tốt kế hoạch rèn luyện của nhóm.",
  "Thông tin sân và lịch đặt giúp người đến lần đầu chuẩn bị tốt hơn.",
];
const POSITIVE_ENDINGS = [
  "Sẵn sàng chọn lại cho một buổi tập sắp tới.",
  "Trải nghiệm minh họa này phù hợp với một nhóm chơi phong trào.",
  "Điều mình thích nhất là sự chủ động khi lên lịch cùng bạn bè.",
  "Cảm giác sau buổi chơi rất thoải mái và có thêm động lực vận động.",
  "Nhóm muốn tiếp tục duy trì lịch chơi đều đặn ở đây.",
  "Một lựa chọn đáng cân nhắc cho buổi giao lưu kế tiếp.",
  "Các thành viên đều có thời gian tập luyện theo kế hoạch.",
  "Tổng thể buổi trải nghiệm đem lại nhiều năng lượng tích cực.",
  "Rất tiện khi có thể kiểm tra lại thông tin trước lúc đến sân.",
  "Phù hợp để rủ thêm bạn mới tham gia nhóm cầu lông.",
  "Buổi tập kết thúc với tinh thần vui vẻ của cả nhóm.",
];

function reviewSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619) >>> 0;
  return hash;
}

/** Giữ 12 mẫu cũ, bổ sung phân bố ổn định theo sân; khoảng 80% có điểm mẫu 4,6–4,8. */
export function getDemoReviews(venueId: string): Review[] {
  const offset = Array.from(venueId).reduce((sum, char) => sum + char.codePointAt(0)!, 0) % SCENARIOS.length;
  const existing = Array.from({ length: SCENARIOS.length }, (_, index) => {
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
  const seed = reviewSeed(venueId);
  const highRated = seed % 10 < 8;
  const extraCount = highRated ? 36 + Math.floor(seed / 10) % 49 : 4 + Math.floor(seed / 10) % 13;
  const fourStarCount = Math.floor(seed / 100) % 4;
  const extra = Array.from({ length: extraCount }, (_, index): Review => {
    const rating = highRated ? (index < fourStarCount ? 4 : 5) : [3, 4, 4, 5, 5][(index + seed) % 5];
    const topic = POSITIVE_TOPICS[(index + seed % POSITIVE_TOPICS.length) % POSITIVE_TOPICS.length];
    const ending = POSITIVE_ENDINGS[(index + seed % POSITIVE_ENDINGS.length) % POSITIVE_ENDINGS.length];
    const comment = rating === 3
      ? `Trải nghiệm minh họa ở mức trung bình: ${topic} Mong phần hướng dẫn nhận sân chi tiết hơn. ${ending}`
      : rating === 4
        ? `${topic} Nếu có thêm lựa chọn giờ tập cho nhóm đông thì sẽ tiện hơn. ${ending}`
        : `${topic} ${ending}`;
    return {
      id: `demo-review:${venueId}:${SCENARIOS.length + index + 1}`,
      isDemo: true,
      images: [],
      userName: `Người chơi mẫu ${String(SCENARIOS.length + index + 1).padStart(2, "0")}`,
      rating,
      comment,
      createdAt: new Date(Date.UTC(2026, 9, 18, 12) - index * 4 * 3600000).toISOString(),
    };
  });
  return [...existing, ...extra];
}
