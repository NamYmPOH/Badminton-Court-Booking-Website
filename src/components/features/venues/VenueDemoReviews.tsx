import { Star } from "lucide-react";
import { getDemoReviews } from "@/data/demo-reviews";

export function VenueDemoReviews({ venueId }: { venueId: string }) {
  const reviews = getDemoReviews(venueId);
  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <section aria-labelledby="demo-reviews-heading" className="rounded-card border border-border bg-surface p-6 shadow-sm">
      <h2 id="demo-reviews-heading" className="text-lg font-bold text-ink">
        Đánh giá mẫu ({reviews.length})
      </h2>
      <p className="mt-2 rounded-control border border-court-200 bg-court-50 p-3 text-sm text-court-800 dark:border-court-800 dark:bg-court-950 dark:text-court-200">
        Dữ liệu minh họa được tính vào điểm hiển thị cùng đánh giá người chơi; mỗi nhận xét minh họa đều có nhãn Mẫu.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-control border border-border p-4">
        <div>
          <p className="text-2xl font-bold text-ink">{average.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}<span className="text-sm font-normal text-muted"> / 5</span></p>
          <p className="text-xs text-muted">Điểm trung bình mẫu</p>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map(rating => {
            const count = reviews.filter(review => review.rating === rating).length;
            return (
              <div key={rating} className="flex items-center gap-3 text-xs text-muted">
                <span className="w-10 shrink-0">{rating} sao</span>
                <div aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${count / reviews.length * 100}%` }} />
                </div>
                <span className="w-16 shrink-0 text-right">{count} đánh giá</span>
              </div>
            );
          })}
        </div>
      </div>

      <ul className="mt-5 space-y-4">
        {reviews.map(review => (
          <li key={review.id} className="border-b border-border/60 pb-4 last:border-none last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-ink">{review.userName}</span>
                <span className="rounded-full bg-court-50 px-2 py-0.5 text-[10px] font-semibold text-court-700 dark:bg-court-950 dark:text-court-200">Mẫu</span>
              </div>
              <time dateTime={review.createdAt} className="text-xs text-muted">{review.createdAt.slice(0, 10).split("-").reverse().join("/")}</time>
            </div>
            <div aria-label={`${review.rating} trên 5 sao`} className="mt-2 flex items-center gap-1">
              {Array.from({ length: 5 }, (_, index) => <Star aria-hidden="true" key={index} size={13} className={index < review.rating ? "fill-amber-400 text-amber-400" : "text-muted/40"} />)}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">{review.comment}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
