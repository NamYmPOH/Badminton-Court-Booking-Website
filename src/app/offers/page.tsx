"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tag, Copy, Check, Sparkles, Building2, Calendar, ShieldCheck, ArrowRight } from "lucide-react";
import { formatVND } from "@/lib/utils";
import { toast } from "sonner";

interface PublicOffer {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerLogo: string | null;
  voucherCode: string;
  title: string;
  description: string | null;
  voucherType: "PERCENT" | "FIXED";
  voucherValue: number;
  maxDiscount: number | null;
  minAmount: number;
  validFrom: string;
  validTo: string;
  sponsor: string;
  budget: number;
  usedBudget: number;
  remainingBudget: number;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<PublicOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/offers", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Không thể tải danh sách ưu đãi.");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data.offers)) {
          setOffers(data.offers);
        }
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Lỗi tải ưu đãi");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Đã sao chép mã: ${code}`);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  const filteredOffers = offers.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.title.toLowerCase().includes(q) ||
      o.partnerName.toLowerCase().includes(q) ||
      o.voucherCode.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-bg pb-20">
      {/* Hero Banner */}
      <section className="border-b border-border bg-gradient-to-b from-court-50/60 to-surface px-4 py-12 sm:px-6 lg:py-16 dark:from-court-950/20 dark:to-surface">
        <div className="mx-auto max-w-content text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-court-200 bg-white/80 px-4 py-1.5 text-xs font-semibold text-court-700 shadow-sm backdrop-blur dark:border-court-800 dark:bg-court-950/80 dark:text-court-300">
            <Sparkles size={14} className="text-court-600" />
            Tài trợ độc quyền từ đối tác thể thao
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Ưu Đãi & Khuyến Mãi Đối Tác
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted sm:text-base">
            Nhận mã giảm giá trực tiếp vào tiền thuê sân từ các thương hiệu đồng hành.
            Sao chép mã và áp dụng ngay tại bước thanh toán.
          </p>

          <div className="mx-auto mt-6 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên thương hiệu, mã voucher..."
              className="w-full rounded-control border border-border bg-surface px-4 py-3 text-sm text-ink shadow-sm outline-none focus:border-court-500"
            />
          </div>
        </div>
      </section>

      {/* Danh sách ưu đãi */}
      <section className="mx-auto max-w-content px-4 py-10 sm:px-6">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-card border border-border bg-surface/50 p-6"
              />
            ))}
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="rounded-card border border-dashed border-border bg-surface p-12 text-center">
            <Tag size={40} className="mx-auto text-muted" />
            <h3 className="mt-4 text-base font-bold text-ink">
              Hiện chưa có chương trình ưu đãi nào
            </h3>
            <p className="mt-1 text-sm text-muted">
              {search
                ? "Không tìm thấy mã ưu đãi phù hợp với từ khóa của bạn."
                : "Các chương trình ưu đãi mới từ đối tác sẽ sớm được cập nhật."}
            </p>
            <Link
              href="/venues"
              className="mt-6 inline-flex items-center gap-1.5 rounded-control bg-court-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-court-700"
            >
              Xem danh sách sân cầu lông
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOffers.map((offer) => {
              const budgetPercent = Math.min(
                100,
                Math.round((offer.usedBudget / offer.budget) * 100)
              );
              const isCopied = copiedCode === offer.voucherCode;

              return (
                <div
                  key={offer.id}
                  className="flex flex-col justify-between overflow-hidden rounded-card border border-border bg-surface p-6 shadow-sm transition hover:shadow-md hover:border-court-300 dark:hover:border-court-800"
                >
                  <div>
                    {/* Header: Đối tác & Huy hiệu */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-control bg-court-50 font-bold text-court-700 dark:bg-court-950 dark:text-court-300">
                          {offer.partnerLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={offer.partnerLogo}
                              alt={offer.partnerName}
                              className="h-full w-full rounded-control object-cover"
                            />
                          ) : (
                            <Building2 size={20} />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                            {offer.partnerName}
                          </p>
                          <h3 className="font-bold text-ink line-clamp-1">
                            {offer.title}
                          </h3>
                        </div>
                      </div>

                      <span className="shrink-0 rounded-full bg-court-50 px-2.5 py-1 text-xs font-bold text-court-700 dark:bg-court-950 dark:text-court-300">
                        {offer.voucherType === "PERCENT"
                          ? `-${offer.voucherValue}%`
                          : `-${formatVND(offer.voucherValue)}`}
                      </span>
                    </div>

                    {/* Mô tả */}
                    {offer.description && (
                      <p className="mt-3 text-xs text-muted line-clamp-2">
                        {offer.description}
                      </p>
                    )}

                    {/* Điều kiện */}
                    <div className="mt-4 space-y-1.5 border-t border-border/60 pt-3 text-xs text-muted">
                      {offer.maxDiscount && offer.voucherType === "PERCENT" && (
                        <p>
                          • Giảm tối đa:{" "}
                          <strong className="text-ink">
                            {formatVND(offer.maxDiscount)}
                          </strong>
                        </p>
                      )}
                      <p>
                        • Đơn tối thiểu:{" "}
                        <strong className="text-ink">
                          {formatVND(offer.minAmount)}
                        </strong>
                      </p>
                      <p className="flex items-center gap-1">
                        <Calendar size={12} />
                        Hạn dùng:{" "}
                        {new Date(offer.validTo).toLocaleDateString("vi-VN")}
                      </p>
                    </div>

                    {/* Thanh tiến độ ngân sách */}
                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] text-muted mb-1">
                        <span>Ngân sách tài trợ đã dùng</span>
                        <span className="font-semibold">{budgetPercent}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-court-500 transition-all duration-300"
                          style={{ width: `${budgetPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Voucher Box & Actions */}
                  <div className="mt-6 pt-4 border-t border-border/80">
                    <div className="flex items-center justify-between rounded-control border border-dashed border-court-400 bg-court-50/70 p-2.5 dark:border-court-700 dark:bg-court-950/40">
                      <div className="pl-1">
                        <span className="font-mono text-sm font-bold tracking-wider text-court-700 dark:text-court-300">
                          {offer.voucherCode}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(offer.voucherCode)}
                        className="inline-flex items-center gap-1 rounded-control bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-court-50 dark:bg-surface dark:text-white"
                      >
                        {isCopied ? (
                          <>
                            <Check size={13} className="text-court-600" />
                            Đã chép
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            Sao chép
                          </>
                        )}
                      </button>
                    </div>

                    <Link
                      href="/venues"
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-control bg-court-600 py-2.5 text-xs font-bold text-white transition hover:bg-court-700 shadow-sm"
                    >
                      Đặt sân áp dụng ngay
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Cam kết minh bạch */}
      <section className="mx-auto max-w-content px-4 py-8 sm:px-6">
        <div className="rounded-card border border-border bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck size={28} className="text-court-600 shrink-0" />
              <div>
                <h4 className="font-bold text-ink text-sm sm:text-base">
                  Chính sách bảo đảm quyền lợi người dùng
                </h4>
                <p className="text-xs text-muted">
                  Voucher đối tác được khấu trừ trực tiếp vào giá thuê sân. Suất ưu đãi được giữ an toàn 5 phút khi tạo đơn.
                </p>
              </div>
            </div>
            <Link
              href="/partner"
              className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-court-600 hover:underline"
            >
              Bạn là thương hiệu? Đăng ký đối tác tài trợ →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
