"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Camera, Star, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { StarRating } from "@/components/ui/StarRating";
import type { Booking } from "@/types/booking";

type Review = {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  isDemo?: boolean;
  images?: string[];
};
type ReviewData = {
  venue: { id: string; name: string; slug: string };
  summary: { average: number; count: number; demoCount: number; realCount: number; distribution: Record<string, number> };
  reviews: Review[];
  page: number;
  totalPages: number;
};
const control = "w-full rounded-control border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20";
const button = "inline-flex items-center justify-center gap-2 rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-court-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-court-950";
const photoLimit = 3 * 1024 * 1024;

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : value;
}

export function VenueReviewsPage({ slug, bookingCode }: { slug: string; bookingCode: string }) {
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<ReviewData | null>(null);
  const [ratingFilter, setRatingFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsOwner, setBookingsOwner] = useState("");
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState("");
  const [selectedCode, setSelectedCode] = useState(bookingCode);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [notice, setNotice] = useState("");
  const savingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const composeRef = useRef<HTMLElement>(null);
  const userId = user?.id || "";
  const returnPath = `/venues/${encodeURIComponent(slug)}/reviews${bookingCode ? `?booking=${encodeURIComponent(bookingCode)}` : ""}`;

  useEffect(() => {
    const abort = new AbortController();
    setLoading(true); setLoadError("");
    fetch(`/api/venues/${encodeURIComponent(slug)}/reviews?${new URLSearchParams({ page: String(page), rating: ratingFilter })}`, { cache: "no-store", signal: abort.signal })
      .then(async res => { const json = await res.json(); if (!res.ok) throw new Error(json.message || "Không tải được đánh giá của sân."); return json; })
      .then(json => { if (!abort.signal.aborted) setData(json); })
      .catch(e => { if (!abort.signal.aborted) setLoadError(e instanceof Error ? e.message : "Không thể kết nối. Hãy thử lại."); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [slug, page, ratingFilter, refresh]);

  useEffect(() => {
    setBookings([]); setBookingsOwner(""); setBookingsError("");
    if (!userId) { setBookingsLoading(false); return; }
    const abort = new AbortController();
    setBookingsLoading(true);
    fetch("/api/bookings", { cache: "no-store", signal: abort.signal })
      .then(async res => { const json = await res.json(); if (!res.ok) throw new Error(json.message || "Không tải được lịch đã chơi của bạn."); return json; })
      .then(json => { if (!abort.signal.aborted) { setBookings(Array.isArray(json.bookings) ? json.bookings : []); setBookingsOwner(userId); } })
      .catch(e => { if (!abort.signal.aborted) setBookingsError(e instanceof Error ? e.message : "Không tải được lịch đặt sân."); })
      .finally(() => { if (!abort.signal.aborted) setBookingsLoading(false); });
    return () => abort.abort();
  }, [userId, refresh]);

  useEffect(() => {
    const next = files.map(file => ({ url: URL.createObjectURL(file), name: file.name }));
    setPreviews(next);
    return () => next.forEach(photo => URL.revokeObjectURL(photo.url));
  }, [files]);

  useEffect(() => {
    if (bookingCode) composeRef.current?.scrollIntoView({ block: "start" });
  }, [bookingCode]);

  const ownBookings = bookingsOwner === userId ? bookings : [];
  const venueBookings = ownBookings.filter(b => b.venueId === data?.venue.id);
  const eligible = venueBookings.filter(b => b.canReview && !b.review);
  const targetCode = selectedCode || eligible[0]?.code || "";
  const selectedBooking = eligible.find(b => b.code === targetCode);
  const requestedBooking = bookingCode ? venueBookings.find(b => b.code === bookingCode) : null;

  function addPhotos(event: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(event.target.files || []);
    event.target.value = "";
    setSubmitError("");
    if (incoming.some(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
      setSubmitError("Chỉ nhận ảnh JPG, PNG hoặc WebP. Hãy chuyển ảnh HEIC, GIF hoặc SVG sang định dạng phù hợp."); return;
    }
    if (incoming.some(file => file.size > 2 * 1024 * 1024 || file.size === 0)) {
      setSubmitError("Mỗi ảnh phải có dung lượng lớn hơn 0 và không quá 2 MB."); return;
    }
    const next = [...files, ...incoming.filter(file => !files.some(old => old.name === file.name && old.size === file.size && old.lastModified === file.lastModified))];
    if (next.length > 3) { setSubmitError("Bạn có thể đính kèm tối đa 3 ảnh."); return; }
    if (next.reduce((total, file) => total + file.size, 0) > photoLimit) { setSubmitError("Tổng dung lượng ảnh tối đa 3 MB. Hãy chọn ảnh nhỏ hơn hoặc giảm số ảnh."); return; }
    setFiles(next);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current || !selectedBooking) return;
    if (!rating) { setSubmitError("Hãy chọn từ 1 đến 5 sao."); return; }
    savingRef.current = true; setSaving(true); setSubmitError(""); setNotice("");
    const form = new FormData();
    form.set("rating", String(rating)); form.set("comment", comment);
    files.forEach(file => form.append("photos", file));
    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(selectedBooking.code)}/review`, { method: "POST", body: form });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Không gửi được đánh giá. Hãy thử lại.");
      setRating(0); setComment(""); setFiles([]); setSelectedCode("");
      setNotice("Đánh giá đã được lưu. Cảm ơn bạn đã chia sẻ trải nghiệm!");
      setPage(1); setRatingFilter("all"); setRefresh(value => value + 1);
    } catch (e) { setSubmitError(e instanceof Error ? e.message : "Lỗi kết nối. Nội dung và ảnh vẫn được giữ để bạn gửi lại."); }
    finally { savingRef.current = false; setSaving(false); }
  }

  return <main className="mx-auto max-w-content px-4 py-8 sm:px-6">
    <Link href={`/venues/${encodeURIComponent(slug)}`} className="inline-flex items-center gap-2 text-sm font-semibold text-court-600 dark:text-court-300"><ArrowLeft size={16} />Thông tin sân</Link>
    <header className="mt-5">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">Tất cả đánh giá</h1>
      <p className="mt-2 text-muted">{data?.venue.name || "Đánh giá sân cầu lông"}</p>
    </header>

    <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
      <div className="min-w-0 space-y-5">
        {data && <section aria-label="Tổng hợp đánh giá" className="rounded-card border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-4xl font-bold text-ink">{data.summary.average.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}<span className="text-lg font-normal text-muted"> / 5</span></p>
            <div><StarRating rating={data.summary.average} count={data.summary.count} size={19} /><p className="mt-1 text-xs text-muted">{data.summary.realCount} đánh giá từ người chơi · {data.summary.demoCount} đánh giá mẫu</p></div>
          </div>
          {data.summary.demoCount > 0 && <p className="mt-4 rounded-control border border-court-200 bg-court-50 p-3 text-sm text-court-800 dark:border-court-800 dark:bg-court-950 dark:text-court-200">Điểm hiển thị bao gồm {data.summary.demoCount} đánh giá mẫu. Những nhận xét này dùng để minh họa và có nhãn “Mẫu”.</p>}
          <div className="mt-4 space-y-2">{[5, 4, 3, 2, 1].map(stars => {
            const count = data.summary.distribution[String(stars)] || 0;
            return <div key={stars} className="flex items-center gap-3 text-xs text-muted"><span className="w-10 shrink-0">{stars} sao</span><div aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-amber-400" style={{ width: `${data.summary.count ? count / data.summary.count * 100 : 0}%` }} /></div><span className="w-8 text-right">{count}</span></div>;
          })}</div>
        </section>}

        <section aria-labelledby="review-list-heading" className="rounded-card border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="review-list-heading" className="text-lg font-bold text-ink">Nhận xét về sân</h2><label className="flex items-center gap-2 text-sm text-muted">Lọc theo sao<select value={ratingFilter} onChange={e => { setRatingFilter(e.target.value); setPage(1); }} className="rounded-control border border-border bg-bg px-2 py-2 text-ink"><option value="all">Tất cả</option>{[5, 4, 3, 2, 1].map(stars => <option key={stars} value={stars}>{stars} sao</option>)}</select></label></div>
          {loadError ? <div role="alert" className="mt-5 space-y-3 text-sm text-red-500"><p>{loadError}</p><button className={button} onClick={() => setRefresh(value => value + 1)}>Thử lại</button></div> : loading ? <p role="status" className="py-8 text-sm text-muted">Đang tải đánh giá…</p> : !data?.reviews.length ? <p className="py-8 text-sm text-muted">Chưa có đánh giá phù hợp với bộ lọc này.</p> : <ul className="mt-5 space-y-5">{data.reviews.map(review => <li key={review.id} className="border-b border-border pb-5 last:border-none last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="text-sm font-bold text-ink">{review.userName}</span>{review.isDemo && <span className="rounded-full bg-court-50 px-2 py-0.5 text-[10px] font-semibold text-court-700 dark:bg-court-950 dark:text-court-200">Mẫu</span>}</div><time dateTime={review.createdAt} className="text-xs text-muted">{formatDate(review.createdAt)}</time></div>
            <div className="mt-2 text-xs"><StarRating rating={review.rating} /></div>
            {review.comment && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted">{review.comment}</p>}
            {!!review.images?.length && <div className="mt-3 flex flex-wrap gap-2">{review.images.map((url, index) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="relative block h-24 w-24 overflow-hidden rounded-control border border-border" aria-label={`Mở ảnh đánh giá ${index + 1} của ${review.userName}`}><Image src={url} alt={`Ảnh sân do ${review.userName} đính kèm, ảnh ${index + 1}`} fill sizes="96px" unoptimized className="object-cover" /></a>)}</div>}
          </li>)}</ul>}
          {data && data.totalPages > 1 && <nav aria-label="Phân trang đánh giá" className="mt-6 flex items-center justify-between gap-3"><button className={button} disabled={loading || page <= 1} onClick={() => setPage(value => value - 1)}>Trước</button><span className="text-sm text-muted">Trang {data.page} / {data.totalPages}</span><button className={button} disabled={loading || page >= data.totalPages} onClick={() => setPage(value => value + 1)}>Sau</button></nav>}
        </section>
      </div>

      <section id="write-review" ref={composeRef} aria-labelledby="write-review-heading" className="scroll-mt-24 rounded-card border border-border bg-surface p-5 lg:sticky lg:top-24">
        <h2 id="write-review-heading" className="text-lg font-bold text-ink">Viết đánh giá của bạn</h2>
        <p className="mt-2 text-sm text-muted">Chỉ tài khoản đặt sân đã chơi xong được gửi đánh giá, mỗi đơn một lần.</p>
        {notice && <p role="status" className="mt-4 rounded-control bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{notice}</p>}
        {authLoading ? <p className="mt-4 text-sm text-muted">Đang kiểm tra tài khoản…</p> : !user ? <Link href={`/login?callbackUrl=${encodeURIComponent(returnPath)}`} className={`${button} mt-4`}>Đăng nhập để đánh giá</Link> : bookingsLoading || (bookingsOwner !== userId && !bookingsError) ? <p className="mt-4 text-sm text-muted">Đang kiểm tra lịch đã chơi…</p> : bookingsError ? <div role="alert" className="mt-4 space-y-3 text-sm text-red-500"><p>{bookingsError}</p><button className={button} onClick={() => setRefresh(value => value + 1)}>Tải lại lịch</button></div> : <>
          {bookingCode && !selectedBooking && <p className="mt-4 text-sm text-muted">{requestedBooking?.review ? "Bạn đã đánh giá đơn này. Mỗi đơn chỉ được đánh giá một lần." : "Đơn trong liên kết chưa đủ điều kiện đánh giá hoặc không thuộc tài khoản đặt sân của bạn."}</p>}
          {!eligible.length ? <p className="mt-4 text-sm text-muted">Bạn chưa có đơn đã chơi xong và chưa đánh giá tại sân này. <Link href="/bookings?tab=past" className="font-semibold text-court-600 dark:text-court-300">Xem lịch đã chơi</Link></p> : <form onSubmit={submit} className="mt-4 space-y-4">
            <fieldset disabled={saving} className="space-y-4 disabled:opacity-70">
              <label className="block text-sm font-semibold text-ink">Đơn đặt sân<select required value={selectedBooking?.code || ""} onChange={e => setSelectedCode(e.target.value)} className={`${control} mt-2`}><option value="" disabled>Chọn đơn đã chơi</option>{eligible.map(booking => <option key={booking.code} value={booking.code}>{booking.code} · {booking.items[0]?.date || "Đã chơi"}</option>)}</select></label>
              <fieldset><legend className="text-sm font-semibold text-ink">Bạn đánh giá bao nhiêu sao?</legend><div className="mt-2 flex gap-1">{[1, 2, 3, 4, 5].map(value => <label key={value} className="relative cursor-pointer rounded-control p-2 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-court-500"><input className="sr-only" type="radio" name="rating" value={value} checked={rating === value} onChange={() => setRating(value)} aria-label={`${value} sao`} required /><Star aria-hidden="true" size={27} className={value <= rating ? "fill-amber-400 text-amber-400" : "text-muted/50"} /></label>)}</div><p aria-live="polite" className="mt-1 text-xs text-muted">{rating ? `Đã chọn ${rating}/5 sao` : "Chưa chọn sao"}</p></fieldset>
              <label className="block text-sm font-semibold text-ink">Nhận xét (tùy chọn)<textarea className={`${control} mt-2 min-h-28 font-normal`} maxLength={2000} value={comment} onChange={e => setComment(e.target.value)} placeholder="Chia sẻ về sân, dịch vụ và buổi chơi của bạn…" /></label>
              <div><p className="text-sm font-semibold text-ink">Ảnh từ thiết bị (tùy chọn)</p><p id="review-photo-help" className="mt-1 text-xs leading-relaxed text-muted">Tối đa 3 ảnh JPG, PNG hoặc WebP; mỗi ảnh tối đa 2 MB, tổng tối đa 3 MB. Ảnh gửi kèm sẽ hiển thị công khai cùng nhận xét. Chỉ tải ảnh bạn có quyền chia sẻ.</p><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addPhotos} className="sr-only" tabIndex={-1} aria-describedby="review-photo-help" aria-label="Chọn ảnh đánh giá" /><button type="button" className={`${button} mt-3`} onClick={() => inputRef.current?.click()} disabled={files.length >= 3}><Camera size={16} />Thêm ảnh ({files.length}/3)</button>
                {!!previews.length && <ul className="mt-3 flex flex-wrap gap-3">{previews.map((photo, index) => <li key={photo.url} className="relative"><div className="relative h-20 w-20 overflow-hidden rounded-control border border-border"><Image src={photo.url} alt={`Ảnh đã chọn: ${photo.name}`} fill unoptimized sizes="80px" className="object-cover" /></div><button type="button" className="absolute -right-2 -top-2 rounded-full border border-border bg-surface p-1 text-ink" aria-label={`Bỏ ảnh ${photo.name}`} onClick={() => setFiles(current => current.filter((_, position) => position !== index))}><X size={14} /></button></li>)}</ul>}
              </div>
            </fieldset>
            {submitError && <p role="alert" className="text-sm text-red-500">{submitError}</p>}
            <button disabled={saving || !rating || !selectedBooking} type="submit" className="w-full rounded-control bg-court-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-court-700 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Đang gửi đánh giá…" : "Gửi đánh giá"}</button>
          </form>}
        </>}
      </section>
    </div>
  </main>;
}
