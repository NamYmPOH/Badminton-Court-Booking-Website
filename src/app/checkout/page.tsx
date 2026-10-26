"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Tag,
  UserCheck,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Layers,
} from "lucide-react";
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

const CHECKOUT_DRAFT_KEY = "smashbook_checkout_draft";

function CheckoutContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const venueId = params.get("venueId") || "";

  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  // Thông tin liên hệ
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; phone?: string }>({});

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Huấn luyện viên
  const [coaches, setCoaches] = useState<CoachItem[]>([]);
  const [selectedCoachId, setSelectedCoachId] = useState<string>("");
  const [loadingCoaches, setLoadingCoaches] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);

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

  // Khôi phục bản nháp thông tin người đặt từ sessionStorage nếu có
  useEffect(() => {
    try {
      const draft = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.name) setName(parsed.name);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.note) setNote(parsed.note);
      }
    } catch {
      // Bỏ qua lỗi sessionStorage nếu bị tắt
    }
  }, []);

  // Tự động ưu tiên thông tin tài khoản đã đăng nhập
  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  // Lưu bản nháp mỗi khi người dùng thay đổi dữ liệu nhập
  useEffect(() => {
    try {
      sessionStorage.setItem(
        CHECKOUT_DRAFT_KEY,
        JSON.stringify({ name, phone, note })
      );
    } catch {
      // Bỏ qua lỗi hạn ngạch
    }
  }, [name, phone, note]);

  // Tải danh mục cơ sở sân
  useEffect(() => {
    if (!venueId) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");

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
        if (!controller.signal.aborted) {
          setError(err.message || "Không tải được thông tin sân.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [venueId]);

  // Tải danh sách HLV hoạt động tại cơ sở
  const fetchCoaches = useCallback(() => {
    if (!venueId) return;
    setLoadingCoaches(true);
    setCoachError(null);

    fetch(`/api/coaches?venueId=${encodeURIComponent(venueId)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Không tải được danh sách Huấn luyện viên.");
        }
        return data;
      })
      .then((data) => {
        if (Array.isArray(data.coaches)) {
          setCoaches(data.coaches);
        } else {
          setCoaches([]);
        }
      })
      .catch((err) => {
        setCoachError(
          err instanceof Error
            ? err.message
            : "Lỗi kết nối khi tải danh sách Huấn luyện viên."
        );
        setCoaches([]);
      })
      .finally(() => setLoadingCoaches(false));
  }, [venueId]);

  useEffect(() => {
    fetchCoaches();
  }, [fetchCoaches]);

  const selection = venue ? parseSelection([venue], params, new Date(), false) : null;

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-court-600 border-t-transparent" />
        <p className="mt-4 text-sm text-muted">Đang tải thông tin đặt sân...</p>
      </div>
    );
  }

  if (!selection) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center">
        <AlertCircle size={40} className="mx-auto text-amber-500" />
        <h1 className="mt-4 text-xl font-bold text-ink">Chưa thể tạo đơn đặt sân</h1>
        <p className="my-3 text-sm leading-relaxed text-muted">
          {error || "Lựa chọn đã hết hạn hoặc không hợp lệ. Vui lòng chọn lại giờ chơi."}
        </p>
        <Link
          href={venue ? `/venues/${venue.slug}/book` : "/venues"}
          className="mt-4 inline-flex items-center rounded-control bg-court-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-court-700"
        >
          {venue ? "Quay lại chọn giờ chơi" : "Xem danh sách sân"}
        </Link>
      </div>
    );
  }

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

  // Lấy URL hiện tại để chuyển hướng quay lại checkout sau khi đăng nhập / đăng ký
  const callbackUrl = typeof window !== "undefined"
    ? window.location.pathname + window.location.search
    : "/checkout";

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
      toast.success(`Đã áp dụng mã: Giảm ${formatVND(data.discountAmount)} tiền thuê sân.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Mã ưu đãi không hợp lệ.";
      setVoucherError(msg);
      toast.error(msg);
    } finally {
      setVoucherLoading(false);
    }
  }

  function removeVoucher() {
    setAppliedVoucher(null);
    setVoucherCodeInput("");
    setVoucherError("");
    toast.info("Đã gỡ mã ưu đãi.");
  }

  // Xác thực form thông tin liên hệ
  function validateForm(): boolean {
    const errors: { name?: string; phone?: string } = {};

    if (!name.trim() || name.trim().length < 2) {
      errors.name = "Vui lòng nhập họ và tên tối thiểu 2 ký tự.";
    }

    const cleanPhone = phone.replace(/[\s.-]/g, "");
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (!cleanPhone) {
      errors.phone = "Vui lòng nhập số điện thoại liên hệ.";
    } else if (!phoneRegex.test(cleanPhone)) {
      errors.phone = "Số điện thoại không hợp lệ (gồm 10 số, đầu số 03, 05, 07, 08, 09).";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Gửi tạo đơn đặt sân
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current || !selection) return;

    if (!validateForm()) {
      toast.warning("Vui lòng điền đúng và đủ thông tin người đặt.");
      return;
    }

    if (authLoading) return;
    if (!user) {
      setError("Vui lòng đăng nhập tài khoản để tạo và quản lý đơn đặt sân.");
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
        customerPhone: phone.replace(/[\s.-]/g, ""),
        note: note.trim(),
        coachId: selectedCoachId || undefined,
        voucherCode: appliedVoucher ? appliedVoucher.code : undefined,
      };

      const serialized = JSON.stringify(input);
      if (requestRef.current.input !== serialized) {
        requestRef.current = { input: serialized, id: crypto.randomUUID() };
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, requestId: requestRef.current.id }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Không tạo được đơn đặt sân.");
      }

      // Xóa bản nháp sau khi đã tạo đơn thành công
      try {
        sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
      } catch {
        // Bỏ qua lỗi sessionStorage
      }

      router.push(`/payment/result?booking=${encodeURIComponent(data.booking.code)}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không kết nối được máy chủ. Vui lòng thử lại."
      );
      toast.error(
        err instanceof Error ? err.message : "Không tạo được đơn đặt sân."
      );
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Nút quay lại chọn giờ */}
      <Link
        href={`/venues/${venue!.slug}/book`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-court-600 transition hover:underline"
      >
        <ArrowLeft size={16} />
        <span>Quay lại chọn sân & giờ chơi</span>
      </Link>

      <h1 className="my-5 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        Kiểm tra đơn & Đặt sân
      </h1>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Khối bên trái (3 cột): Form thông tin người đặt & Huấn luyện viên & Voucher */}
        <div className="space-y-6 lg:col-span-3">
          <form
            onSubmit={submit}
            className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h2 className="text-base font-bold text-ink">Thông tin người đặt sân</h2>
              <span className="text-xs text-muted">(*) Bắt buộc</span>
            </div>

            {/* Trường Họ và tên */}
            <div>
              <label className="block text-xs font-semibold text-ink">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <input
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="Nguyễn Văn A"
                className={`mt-1.5 block w-full rounded-control border bg-bg p-3 text-sm text-ink outline-none transition focus:border-court-500 ${
                  fieldErrors.name ? "border-rose-400 bg-rose-50/20" : "border-border"
                }`}
              />
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.name}</p>
              )}
            </div>

            {/* Trường Số điện thoại */}
            <div>
              <label className="block text-xs font-semibold text-ink">
                Số điện thoại liên hệ <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="tel"
                maxLength={20}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                placeholder="0912 345 678"
                className={`mt-1.5 block w-full rounded-control border bg-bg p-3 text-sm text-ink outline-none transition focus:border-court-500 ${
                  fieldErrors.phone ? "border-rose-400 bg-rose-50/20" : "border-border"
                }`}
              />
              {fieldErrors.phone && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.phone}</p>
              )}
            </div>

            {/* Trường Ghi chú tùy chọn */}
            <div>
              <label className="block text-xs font-semibold text-ink">
                Ghi chú riêng <span className="text-xs font-normal text-muted">(Tùy chọn)</span>
              </label>
              <textarea
                maxLength={1000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Yêu cầu về chuẩn bị sân, thuê vợt, mua ống cầu hoặc gửi xe..."
                rows={2}
                className="mt-1.5 block w-full rounded-control border border-border bg-bg p-3 text-sm text-ink outline-none transition focus:border-court-500"
              />
            </div>

            {/* Khối chọn Huấn luyện viên (Tách biệt lỗi tải) */}
            <div className="border-t border-border/80 pt-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <UserCheck size={16} className="text-court-600" />
                  Đặt kèm Huấn luyện viên
                  <span className="text-xs font-normal text-muted">(Tùy chọn)</span>
                </span>
                {loadingCoaches && (
                  <span className="text-xs text-muted">Đang tải danh sách...</span>
                )}
              </div>

              {coachError ? (
                <div className="mt-2.5 flex items-center justify-between rounded-control border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{coachError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={fetchCoaches}
                    className="inline-flex items-center gap-1 font-semibold text-court-700 underline hover:text-court-900 dark:text-court-300"
                  >
                    <RefreshCw size={12} />
                    <span>Thử lại</span>
                  </button>
                </div>
              ) : coaches.length === 0 && !loadingCoaches ? (
                <p className="mt-2 text-xs text-muted">
                  Cơ sở này hiện chưa có Huấn luyện viên nhận đặt trực tuyến.
                </p>
              ) : (
                <div className="mt-2 space-y-2">
                  <select
                    value={selectedCoachId}
                    onChange={(e) => setSelectedCoachId(e.target.value)}
                    className="w-full rounded-control border border-border bg-bg p-3 text-sm text-ink outline-none transition focus:border-court-500"
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
                        Chuyên môn: {selectedCoach.specialties.join(", ") || "Tổng hợp"} · {durationHours} giờ hướng dẫn
                      </p>
                      <p className="mt-1 text-court-700 font-bold dark:text-court-300">
                        Phí HLV: +{formatVND(coachFee)} (không trừ vào ưu đãi voucher)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Thông báo lỗi tổng quát */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-control border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
              >
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Trạng thái xác thực tài khoản có nút đăng nhập giữ ngữ cảnh */}
            {authLoading ? (
              <p className="text-xs text-muted">Đang xác thực phiên đăng nhập...</p>
            ) : !user ? (
              <div className="rounded-control border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
                <p className="font-semibold">Bạn chưa đăng nhập</p>
                <p className="mt-1">
                  Cần tài khoản để xác nhận và quản lý đơn đặt sân của bạn.
                </p>
                <div className="mt-3 flex gap-3">
                  <Link
                    href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                    className="rounded-control bg-court-600 px-4 py-2 font-bold text-white transition hover:bg-court-700 active:scale-95"
                  >
                    Đăng nhập ngay
                  </Link>
                  <Link
                    href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                    className="rounded-control border border-amber-300 bg-white px-4 py-2 font-bold text-ink transition hover:bg-amber-100/50 dark:bg-surface"
                  >
                    Đăng ký tài khoản
                  </Link>
                </div>
              </div>
            ) : null}

            {/* Nút hành động chính chuẩn hóa theo PRODUCT.md */}
            <button
              type="submit"
              disabled={submitting || authLoading || !user}
              className="w-full rounded-control bg-court-600 p-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-court-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Đang tạo đơn giữ sân..." : "Tạo đơn và tiếp tục thanh toán"}
            </button>
          </form>

          {/* Form nhập Voucher / Mã ưu đãi */}
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink">
              <Tag size={18} className="text-court-600" />
              <span>Mã ưu đãi / Voucher</span>
              <span className="text-xs font-normal text-muted">(Tùy chọn)</span>
            </h2>
            <p className="mt-1 text-xs text-muted">
              Mã ưu đãi được áp dụng giảm trừ trực tiếp vào tiền thuê sân.
            </p>

            {appliedVoucher ? (
              <div className="mt-3.5 flex items-center justify-between rounded-control border border-court-300 bg-court-50 p-3 dark:border-court-800 dark:bg-court-950/40">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-court-600 dark:text-court-400" />
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
                  className="rounded-control p-1 text-muted transition hover:bg-rose-50 hover:text-rose-600"
                  title="Gỡ mã ưu đãi"
                  aria-label="Gỡ mã ưu đãi"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <form onSubmit={applyVoucher} className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã ưu đãi (VD: CHAOBAN10)"
                  value={voucherCodeInput}
                  onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                  className="flex-1 rounded-control border border-border bg-bg p-2.5 text-sm uppercase text-ink outline-none transition focus:border-court-500"
                />
                <button
                  type="submit"
                  disabled={voucherLoading || !voucherCodeInput.trim()}
                  className="rounded-control bg-court-600 px-4 text-xs font-semibold text-white transition hover:bg-court-700 disabled:opacity-50 active:scale-95"
                >
                  {voucherLoading ? "Kiểm tra..." : "Áp dụng"}
                </button>
              </form>
            )}

            {voucherError && (
              <p className="mt-2 text-xs text-rose-600">{voucherError}</p>
            )}
          </div>
        </div>

        {/* Khối bên phải (2 cột): Tóm tắt chi tiết đơn & Tổng tiền */}
        <div className="h-fit space-y-4 rounded-card border border-border bg-surface p-6 shadow-sm lg:col-span-2">
          <div>
            <h2 className="text-lg font-bold text-ink">{venue!.name}</h2>
            <div className="mt-1 flex items-start gap-1.5 text-xs text-muted">
              <MapPin size={13} className="mt-0.5 shrink-0 text-court-500" />
              <span>{venue!.address}, {venue!.district}</span>
            </div>
          </div>

          <div className="space-y-2 rounded-control border border-border bg-bg p-3.5 text-xs text-muted">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-ink font-medium">
                <Calendar size={13} className="text-court-500" />
                Ngày chơi:
              </span>
              <strong className="text-ink">{date}</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-ink font-medium">
                <Layers size={13} className="text-court-500" />
                Sân thi đấu:
              </span>
              <strong className="text-ink">{slots[0].courtName}</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-ink font-medium">
                <Clock size={13} className="text-court-500" />
                Khung giờ:
              </span>
              <strong className="text-ink">
                {formatHour(slots[0].startMin)} – {formatHour(slots[slots.length - 1].endMin)} ({durationMin} phút)
              </strong>
            </div>

            <div className="pt-2 text-right">
              <Link
                href={`/venues/${venue!.slug}/book`}
                className="text-[11px] font-semibold text-court-600 hover:underline"
              >
                Sửa giờ chơi →
              </Link>
            </div>
          </div>

          {/* Chi tiết thanh toán */}
          <div className="space-y-2.5 border-t border-border pt-4 text-xs">
            <div className="flex justify-between text-muted">
              <span>Tiền thuê sân ({slots.length} ô):</span>
              <span className="font-semibold text-ink">{formatVND(total)}</span>
            </div>

            {appliedVoucher && (
              <div className="flex justify-between text-court-600 font-semibold">
                <span>Ưu đãi voucher ({appliedVoucher.code}):</span>
                <span>-{formatVND(courtDiscount)}</span>
              </div>
            )}

            {selectedCoach && (
              <div className="flex justify-between text-muted">
                <span>Huấn luyện viên ({selectedCoach.name}):</span>
                <span className="font-semibold text-ink">+{formatVND(coachFee)}</span>
              </div>
            )}

            <div className="flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-sm font-bold text-ink">Tổng thanh toán:</span>
              <span className="text-2xl font-black text-court-600 dark:text-court-400">
                {formatVND(grandTotal)}
              </span>
            </div>
          </div>

          {/* Lưu ý giữ chỗ trung thực theo PRODUCT.md */}
          <div className="rounded-control border border-border bg-bg p-3.5 text-xs text-muted space-y-1.5">
            <div className="flex items-center gap-1 text-ink font-semibold">
              <ShieldCheck size={14} className="text-court-600" />
              <span>Chính sách & Giữ sân:</span>
            </div>
            <p>• Suất đặt được giữ tối đa <strong>5 phút</strong> để bạn hoàn tất bước thanh toán.</p>
            <p>• Hỗ trợ thanh toán qua mã QR ngân hàng hoặc tiền mặt tại sân (nếu cơ sở cho phép).</p>
            <p>• Nếu HLV có việc đột xuất, bạn sẽ được hoàn 100% phí HLV và lịch sân vẫn được giữ nguyên.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-court-600 border-t-transparent" />
          <p className="mt-4 text-sm text-muted">Đang tải trang đặt sân...</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
