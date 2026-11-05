import Link from "next/link";
import type { Venue } from "@/types/venue";
import { getDemoReviews } from "@/data/demo-reviews";
import { StarRating } from "@/components/ui/StarRating";
export function VenueReviewPreview({ venue }: { venue: Venue }) {
  const reviews = [...venue.reviews, ...getDemoReviews(venue.id)].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);
  return <section className="rounded-card border border-border bg-surface p-6 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold text-ink">Đánh giá sân ({venue.ratingCount})</h2><Link href={`/venues/${venue.slug}/reviews`} className="text-sm font-semibold text-court-600 dark:text-court-300">Xem tất cả đánh giá →</Link></div>
    <div className="mt-3 text-sm"><StarRating rating={venue.ratingAvg} count={venue.ratingCount} demoCount={venue.demoRatingCount} /></div>
    <p className="mt-2 text-xs text-muted">Điểm hiển thị tính cả đánh giá mẫu và đánh giá của người chơi. Nhận xét mẫu được gắn nhãn để phân biệt.</p>
    {venue.reviewsUnavailable && <p role="status" className="mt-2 text-sm text-amber-600">Chưa tải được nhận xét của người chơi. Hãy thử lại trên trang tất cả đánh giá.</p>}
    <ul className="mt-5 space-y-4">{reviews.map(review => <li key={review.id} className="border-b border-border pb-4 last:border-none"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-ink">{review.userName}</span>{review.isDemo && <span className="rounded-full bg-court-50 px-2 py-0.5 text-xs text-court-700 dark:bg-court-950 dark:text-court-200">Mẫu</span>}</div><div className="mt-1 text-xs"><StarRating rating={review.rating} /></div><p className="mt-2 text-sm text-muted">{review.comment}</p></li>)}</ul>
    <Link href={`/venues/${venue.slug}/reviews#write-review`} className="mt-4 inline-flex rounded-control bg-court-600 px-4 py-2 text-sm font-semibold text-white">Viết đánh giá / Thêm ảnh</Link>
  </section>;
}
