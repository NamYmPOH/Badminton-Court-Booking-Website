"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Tag, UserCheck, X, CheckCircle2, AlertCircle } from "lucide-react";
import type { Venue } from "@/types/venue";
import { formatHour, parseSelection } from "@/lib/booking";
import { formatVND } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface CoachItem {
  id: string;
  name: string;
  image?: string | null;
  hourlyRate: number;
  experienceYears: number;
  specialties: string[];
}

function CheckoutContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const venueId = params.get("venueId") || "";

  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Tự động điền thông tin tài khoản đã đăng nhập
  useEffect(() => {
    if (user) {
      setName((prev) => (prev.trim() ? prev : user.name || ""));
      setPhone((prev) => (prev.trim() ? prev : user.phone || ""));
    }
  }, [user]);

  // Huấn luyện viên
  const [coaches, setCoaches] = useState<CoachItem[]>([]);
  const [selectedCoachId, setSelectedCoachId] = useState<string>("");
  const [loadingCoaches, setLoadingCoaches] = useState(false);

  // Ưu đãi / Voucher
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discountAmount: number;
    title?: string;
  } | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState("");

  const requestRef = useRef({ input: "", id: "" });
  const inFlight = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setVenue(null);
    fetch(`/api/booking-catalog?venueId=${encodeURIComponent(venueId)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
      })
      .then((data) => setVenue(data.venue))
      .catch((err) => {
        if (!controller.signal.aborted)
          setError(err.message || "Không tải được thông tin sân.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [venueId]);

  // Tải danh sách HLV hoạt động tại cơ sở này
  useEffect(() => {
    if (!venueId) return;
    setLoadingCoaches(true);
    fetch(`/api/coaches?venueId=${encodeURIComponent(venueId)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) return { coaches: [] };
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data.coaches)) {
          setCoaches(data.coaches);
        }
      })
      .catch(() => {
        setCoaches([]);
      })
      .finally(() => setLoadingCoaches(false));
  }, [venueId]);

  const selection = venue ? parseSelection([venue], params, new Date(), false) : null;

  if (loading) return <p className="p-8">Đang tải thông tin đặt sân...</p>;
  if (!selection)
    return (
      <div className="mx-auto max-w-xl p-8">
        <h1 className="text-xl font-bold">Chưa thể tạo đơn đặt sân</h1>
        <p className="my-4">
          {error || "Lựa chọn đã hết hạn hoặc không hợp lệ. Vui lòng chọn lại giờ chơi."}
        </p>
        <Link href="/venues" className="text-court-600 underline">
          Chọn sân
        </Link>
      </div>
    );

  const { slots, date, total } = selection;
  const durationMin = slots.reduce((acc, s) => acc + (s.endMin - s.startMin), 0);
  const durationHours = durationMin / 60;

  const selectedCoach = coaches.find((c) => c.id === selectedCoachId);
  const coachFee = selectedCoach
    ? Math.round((selectedCoach.hourlyRate * durationMin) / 60)
    : 0;

  const courtDiscount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  const finalCourtTotal = Math.max(0, total - courtDiscount);
  const grandTotal = finalCourtTotal + coachFee;

  // Áp dụng voucher
  async function applyVoucher(e: React.FormEvent) {
    e.preventDefault();
    const code = voucherCodeInput.trim().toUpperCase();
    if (!code) return;
    setVoucherLoading(true);
    setVoucherError("");
    try {
      const res = await fetch("/api/offers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          venueId,
          courtSubtotal: total,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Mã ưu đãi không hợp lệ.");
      }
      setAppliedVoucher({
        code,
        discountAmount: data.discountAmount,
        title: data.partnerOfferTitle || data.voucherCode,
      });
      toast.success(`Đã áp dụng mã ưu đãi: Giảm ${formatVND(data.discountAmount)} tiền sân`);
    } catch (err) {
      setVoucherError(err instanceof Error ? err.message : "Không thể kiểm tra mã.");
      toast.error(err instanceof Error ? err.message : "Mã ưu đãi không hợp lệ.");
    } finally {
      setVoucherLoading(false);
    }
  }

  function removeVoucher() {
    setAppliedVoucher(null);
    setVoucherCodeInput("");
    setVoucherError("");
    toast.info("Đã gỡ mã ưu đãi");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current || !selection) return;
    if (authLoading) return;
    if (!user) {
      setError("Vui lòng đăng nhập trước khi đặt sân.");
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setError("");

    try {
      const input = {
        venueId,
        date,
        slots: slots.map(({ courtId, startMin, endMin }) => ({
          courtId,
          startMin,
          endMin,
        })),
        customerName: name.trim(),
        customerPhone: phone.replace(/\s/g, ""),
        note: note.trim(),
        coachId: selectedCoachId || undefined,
        voucherCode: appliedVoucher ? appliedVoucher.code : undefined,
      };

      const serialized = JSON.stringify(input);
      if (requestRef.current.input !== serialized)
        requestRef.current = { input: serialized, id: crypto.randomUUID() };

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, requestId: requestRef.current.id }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Không tạo được đơn đặt sân.");

      router.push(`/payment/result?booking=${encodeURIComponent(data.booking.code)}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không kết nối được máy chủ. Vui lòng thử lại."
      );
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href={`/venues/${venue!.slug}/book`}
        className="inline-flex items-center gap-1 text-sm font-medium text-court-600 hover:underline"
      >
        ← Quay lại chọn sân
      </Link>
      <h1 className="my-6 text-2xl font-bold tracking-tight">Thông tin đặt sân</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Form bên trái: Thông tin khách hàng & Chọn HLV & Nhập ưu đãi */}
        <div className="space-y-6">
          <form
            onSubmit={submit}
            className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-sm"
          >
            <h2 className="text-base font-bold text-ink">Thông tin người đặt</h2>
            <label className="block text-sm">
              <span className="text-muted">Họ và tên</span>
              <input
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="mt-1 block w-full rounded-control border border-border bg-bg text-ink p-3 outline-none focus:border-court-500"
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Số điện thoại</span>
              <input
                required
                type="tel"
                maxLength={20}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678"
                className="mt-1 block w-full rounded-control border border-border bg-bg text-ink p-3 outline-none focus:border-court-500"
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Ghi chú (tùy chọn)</span>
              <textarea
                maxLength={1000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Yêu cầu riêng về vợt, cầu hoặc nước uống..."
                rows={2}
                className="mt-1 block w-full rounded-control border border-border bg-bg text-ink p-3 outline-none focus:border-court-500"
              />
            </label>

            {/* Khối chọn Huấn luyện viên */}
            <div className="border-t border-border/80 pt-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <UserCheck size={16} className="text-court-600" />
                  Đặt kèm Huấn luyện viên (Tùy chọn)
                </span>
                {loadingCoaches && (
                  <span className="text-xs text-muted">Đang tải...</span>
                )}
              </div>

              {coaches.length === 0 ? (
                <p className="mt-2 text-xs text-muted">
                  Hiện tại chưa có HLV hoạt động tại cơ sở này trong khung giờ này.
                </p>
              ) : (
                <div className="mt-2 space-y-2">
                  <select
                    value={selectedCoachId}
                    onChange={(e) => setSelectedCoachId(e.target.value)}
                    className="w-full rounded-control border border-border bg-bg p-3 text-sm text-ink outline-none focus:border-court-500"
                  >
                    <option value="">Không thuê Huấn luyện viên</option>
                    {coaches.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {formatVND(c.hourlyRate)}/giờ ({c.experienceYears} năm KN)
                      </option>
                    ))}
                  </select>
                  {selectedCoach && (
                    <div className="rounded-control bg-court-50 p-3 text-xs text-court-900 dark:bg-court-950/40 dark:text-court-200">
                      <p className="font-semibold">{selectedCoach.name}</p>
                      <p className="mt-0.5 text-muted">
                        Chuyên môn: {selectedCoach.specialties.join(", ") || "Tổng hợp"} · {durationHours} giờ dạy
                      </p>
                      <p className="mt-1 text-court-700 font-bold dark:text-court-300">
                        Phí HLV: +{formatVND(coachFee)} (không tính chiết khấu voucher)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="flex items-center gap-1.5 rounded-control bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-950/40"
              >
                <AlertCircle size={16} />
                {error}
              </p>
            )}

            {authLoading ? (
              <p className="text-sm text-muted">Đang kiểm tra đăng nhập...</p>
            ) : !user ? (
              <p className="text-sm text-muted">
                Bạn cần{" "}
                <Link href="/login" className="text-court-600 underline font-semibold">
                  đăng nhập
                </Link>{" "}
                để tạo và quản lý đơn.
              </p>
            ) : null}

            <button
              disabled={submitting || authLoading || !user}
              className="w-full rounded-control bg-court-600 p-3.5 font-bold text-white shadow transition hover:bg-court-700 disabled:opacity-50"
            >
              {submitting ? "Đang tạo đơn..." : "Tạo đơn và chọn thanh toán"}
            </button>
          </form>

          {/* Form nhập Voucher Đối tác */}
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink">
              <Tag size={18} className="text-court-600" />
              Mã ưu đãi / Voucher Đối tác
            </h2>
            <p className="mt-1 text-xs text-muted">
              Ưu đãi được tài trợ chỉ giảm trừ vào tiền thuê sân, không áp dụng cho phí HLV.
            </p>

            {appliedVoucher ? (
              <div className="mt-3 flex items-center justify-between rounded-control border border-court-300 bg-court-50 p-3 dark:border-court-800 dark:bg-court-950/40">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-court-600" />
                  <div>
                    <span className="font-bold text-court-700 dark:text-court-300">
                      {appliedVoucher.code}
                    </span>
                    <p className="text-xs text-muted">
                      Giảm {formatVND(appliedVoucher.discountAmount)} tiền sân
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeVoucher}
                  className="rounded-control p-1 text-muted hover:bg-rose-50 hover:text-rose-600 transition"
                  title="Gỡ mã"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <form onSubmit={applyVoucher} className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã voucher (VD: YONEX20)"
                  value={voucherCodeInput}
                  onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                  className="flex-1 rounded-control border border-border bg-bg p-2.5 text-sm uppercase text-ink outline-none focus:border-court-500"
                />
                <button
                  type="submit"
                  disabled={voucherLoading || !voucherCodeInput.trim()}
                  className="rounded-control bg-court-600 px-4 text-sm font-semibold text-white transition hover:bg-court-700 disabled:opacity-50"
                >
                  {voucherLoading ? "Đang kiểm tra..." : "Áp dụng"}
                </button>
              </form>
            )}

            {voucherError && (
              <p className="mt-2 text-xs text-rose-600">{voucherError}</p>
            )}
          </div>
        </div>

        {/* Khối bên phải: Chi tiết đơn & Tổng thanh toán */}
        <div className="h-fit space-y-4 rounded-card border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-bold text-ink">{venue!.name}</h2>
          <div className="space-y-1 text-sm text-muted">
            <p>
              <strong className="text-ink">Ngày chơi:</strong> {date}
            </p>
            <p>
              <strong className="text-ink">Sân:</strong> {slots[0].courtName}
            </p>
            <p>
              <strong className="text-ink">Khung giờ:</strong>{" "}
              {formatHour(slots[0].startMin)} – {formatHour(slots[slots.length - 1].endMin)} ({durationMin} phút)
            </p>
          </div>

          <div className="border-t border-border pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-ink">
              <span>Tiền thuê sân:</span>
              <span className="font-semibold">{formatVND(total)}</span>
            </div>

            {appliedVoucher && (
              <div className="flex justify-between text-court-600 font-semibold">
                <span>Ưu đãi voucher ({appliedVoucher.code}):</span>
                <span>-{formatVND(courtDiscount)}</span>
              </div>
            )}

            {selectedCoach && (
              <div className="flex justify-between text-ink">
                <span>Phí Huấn luyện viên ({selectedCoach.name}):</span>
                <span className="font-semibold">+{formatVND(coachFee)}</span>
              </div>
            )}

            <div className="flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-base font-bold text-ink">Tổng thanh toán:</span>
              <span className="text-2xl font-bold text-court-600">
                {formatVND(grandTotal)}
              </span>
            </div>
          </div>

          <div className="rounded-control bg-bg p-3.5 text-xs text-muted space-y-1">
            <p className="font-semibold text-ink">Lưu ý giữ chỗ:</p>
            <p>• Đơn và suất ưu đãi được giữ tối đa <strong>5 phút</strong> để bạn hoàn tất thanh toán.</p>
            <p>• Bạn có thể thanh toán trực tuyến qua mã QR ngân hàng hoặc chọn thanh toán tiền mặt tại sân.</p>
            <p>• Nếu Huấn luyện viên bận việc đột xuất cần hủy lịch, 100% phí HLV sẽ được hoàn lại và lịch sân vẫn giữ nguyên.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<p className="p-8">Đang tải...</p>}>
      <CheckoutContent />
    </Suspense>
  );
}
