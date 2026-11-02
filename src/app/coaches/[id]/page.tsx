"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Phone,
  HelpCircle,
} from "lucide-react";
import { formatVND } from "@/lib/utils";

interface CoachVenue {
  id: string;
  name: string;
  slug: string;
  address: string;
  district: string;
  province: string;
  phone: string;
}

interface CoachCertificate {
  id: string;
  title: string;
  verifiedAt: string | null;
}

interface CoachDetail {
  id: string;
  userId: string;
  name: string;
  image: string | null;
  bio: string | null;
  specialties: string[];
  experienceYears: number;
  hourlyRate: number;
  isDemo?: boolean;
  certificates: CoachCertificate[];
  venues: CoachVenue[];
}

interface FreeSlot {
  id: string;
  startsAt: string;
  endsAt: string;
}

export default function CoachDetailPage() {
  const params = useParams();
  const router = useRouter();
  const coachId = params?.id as string;

  const [coach, setCoach] = useState<CoachDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Availability query state
  const [selectedVenueId, setSelectedVenueId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [freeSlots, setFreeSlots] = useState<FreeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fetch coach detail
  const loadCoach = useCallback(async () => {
    if (!coachId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/coaches/${coachId}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success || !json.coach) {
        throw new Error(json.message || "Không tìm thấy hồ sơ huấn luyện viên.");
      }
      setCoach(json.coach);
      if (json.coach.venues?.length > 0) {
        setSelectedVenueId(json.coach.venues[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    void loadCoach();
  }, [loadCoach]);

  // Fetch availability slots when venue or date changes
  useEffect(() => {
    if (!coachId || !selectedVenueId || !selectedDate) {
      setFreeSlots([]);
      return;
    }

    let active = true;
    async function loadSlots() {
      setLoadingSlots(true);
      try {
        const res = await fetch(
          `/api/coaches/${coachId}?venueId=${selectedVenueId}&date=${selectedDate}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (active && res.ok && json.success) {
          setFreeSlots(json.freeSlots || []);
        }
      } catch {
        if (active) setFreeSlots([]);
      } finally {
        if (active) setLoadingSlots(false);
      }
    }

    void loadSlots();
    return () => {
      active = false;
    };
  }, [coachId, selectedVenueId, selectedDate]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-court-600 border-t-transparent" />
        <p className="mt-3 text-xs text-muted">Đang tải hồ sơ huấn luyện viên...</p>
      </div>
    );
  }

  if (error || !coach) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-card border border-rose-200 bg-rose-50/70 p-8 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
          <AlertCircle size={28} className="mx-auto mb-2 text-rose-600" />
          <h2 className="text-sm font-bold">Không tìm thấy huấn luyện viên</h2>
          <p className="mt-1 text-xs text-rose-700/80 dark:text-rose-400">
            {error || "Hồ sơ này có thể đã bị tạm ngưng hoặc không tồn tại."}
          </p>
          <Link
            href="/coaches"
            className="mt-4 inline-flex items-center gap-1.5 rounded-control bg-court-600 px-4 py-2 text-xs font-bold text-white hover:bg-court-700"
          >
            <ArrowLeft size={14} />
            Quay lại danh sách HLV
          </Link>
        </div>
      </div>
    );
  }

  const isDemo = coach.isDemo || coach.hourlyRate === 2000;
  const currentVenue = coach.venues.find((v) => v.id === selectedVenueId) || coach.venues[0];

  return (
    <div className="min-h-screen bg-bg pb-16">
      {/* Top Breadcrumb */}
      <div className="border-b border-border bg-surface/40 py-3 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-content flex items-center gap-2 text-xs text-muted">
          <Link href="/coaches" className="hover:text-ink transition flex items-center gap-1">
            <ArrowLeft size={14} />
            Danh sách HLV
          </Link>
          <span>/</span>
          <span className="text-ink font-semibold truncate">{coach.name}</span>
        </div>
      </div>

      <main className="mx-auto max-w-content px-4 py-8 sm:px-6 lg:px-8">
        {/* Banner Thử nghiệm nếu là demo */}
        {isDemo && (
          <div className="mb-6 rounded-card border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 flex items-start gap-3">
            <Sparkles size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 dark:text-amber-300">
                Hồ sơ Huấn luyện viên Thử nghiệm SmashBook (Demo 2.000đ/giờ)
              </p>
              <p className="mt-0.5 text-amber-700/90 dark:text-amber-400 text-[11px] leading-relaxed">
                Hồ sơ này phục vụ việc thử nghiệm quy trình chọn HLV, kiểm tra lịch dạy và tính phí
                tự động. Học phí 2.000đ/giờ (1.000đ/30 phút) được tách biệt hoàn toàn với tiền thuê sân và
                dịch vụ khác.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cột trái: Thông tin tổng quan HLV */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-card border border-border bg-surface p-6 shadow-xs text-center relative overflow-hidden">
              {/* Avatar */}
              <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full border-4 border-court-100 shadow-sm dark:border-court-950 bg-court-50 flex items-center justify-center">
                {coach.image ? (
                  <Image
                    src={coach.image}
                    alt={coach.name}
                    fill
                    className="object-cover"
                    sizes="112px"
                    priority
                  />
                ) : (
                  <span className="text-3xl font-extrabold text-court-700 dark:text-court-300">
                    {coach.name.charAt(0)}
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-lg font-bold text-ink">{coach.name}</h1>

              <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted">
                <Award size={14} className="text-amber-500 shrink-0" />
                <span>{coach.experienceYears} năm kinh nghiệm</span>
              </div>

              {/* Tag trạng thái */}
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Hồ sơ đã xét duyệt & đang hoạt động
              </div>

              {/* Học phí */}
              <div className="mt-5 rounded-control border border-border/70 bg-bg p-3">
                <span className="text-[11px] text-muted block">Học phí kèm riêng:</span>
                <div className="mt-0.5 flex items-baseline justify-center gap-1">
                  <span className="text-xl font-black text-court-600 dark:text-court-400">
                    {coach.hourlyRate.toLocaleString("vi-VN")} đ
                  </span>
                  <span className="text-xs text-muted">/ giờ</span>
                </div>
                <p className="mt-1 text-[10px] text-muted">
                  * Chưa bao gồm tiền thuê sân và cầu tập
                </p>
              </div>

              {/* Nút Đặt lịch trực tiếp */}
              {currentVenue && (
                <div className="mt-5">
                  <Link
                    href={`/venues/${currentVenue.slug || currentVenue.id}/book?coachId=${coach.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-control bg-court-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-court-700 active:scale-95"
                  >
                    <Calendar size={15} />
                    <span>Đặt sân kèm HLV này</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Bằng cấp & Chứng chỉ */}
            {coach.certificates && coach.certificates.length > 0 && (
              <div className="rounded-card border border-border bg-surface p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-ink border-b border-border/60 pb-2.5">
                  <ShieldCheck size={16} className="text-court-600" />
                  <span>Chứng chỉ & Đào tạo chuyên môn</span>
                </div>
                <div className="space-y-2">
                  {coach.certificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-start gap-2 text-xs rounded-control bg-bg p-2.5 border border-border/60"
                    >
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-ink">{cert.title}</p>
                        <p className="text-[10px] text-muted">Đã xác minh bởi SmashBook</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cột phải: Chi tiết bio, chuyên môn & Lịch giảng dạy tại cơ sở */}
          <div className="lg:col-span-2 space-y-6">
            {/* Giới thiệu & Chuyên môn */}
            <div className="rounded-card border border-border bg-surface p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-ink border-b border-border/60 pb-3">
                Giới thiệu & Chuyên môn huấn luyện
              </h2>

              {/* Chuyên môn tags */}
              <div>
                <span className="block text-[11px] font-semibold text-muted mb-2">
                  Lĩnh vực đào tạo thế mạnh:
                </span>
                <div className="flex flex-wrap gap-2">
                  {coach.specialties.map((spec) => (
                    <span
                      key={spec}
                      className="rounded-full bg-court-50 px-3 py-1 text-xs font-semibold text-court-800 dark:bg-court-950 dark:text-court-200 border border-court-200/60 dark:border-court-900"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div>
                <span className="block text-[11px] font-semibold text-muted mb-1.5">
                  Tiểu sử & Kinh nghiệm:
                </span>
                <p className="text-xs text-ink/90 leading-relaxed whitespace-pre-line bg-bg rounded-control p-4 border border-border/60">
                  {coach.bio || "Huấn luyện viên chưa cập nhật phần giới thiệu chi tiết."}
                </p>
              </div>
            </div>

            {/* Các cơ sở sân hợp tác */}
            <div className="rounded-card border border-border bg-surface p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h2 className="text-sm font-bold text-ink">Cơ sở sân giảng dạy</h2>
                <span className="text-xs text-muted">{coach.venues.length} cơ sở</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {coach.venues.map((venue) => (
                  <div
                    key={venue.id}
                    className={`rounded-control border p-3.5 transition cursor-pointer select-none ${
                      selectedVenueId === venue.id
                        ? "border-court-600 bg-court-50/60 dark:border-court-500 dark:bg-court-950/50 shadow-xs"
                        : "border-border bg-bg hover:border-court-300"
                    }`}
                    onClick={() => setSelectedVenueId(venue.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-xs text-ink">{venue.name}</div>
                      {selectedVenueId === venue.id && (
                        <span className="rounded bg-court-600 px-1.5 py-0.5 text-[9px] font-bold text-white shrink-0">
                          Đang chọn
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                      <MapPin size={13} className="text-court-600 shrink-0" />
                      <span className="truncate">{venue.address}, {venue.district}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kiểm tra khung giờ trống tại cơ sở */}
            <div className="rounded-card border border-border bg-surface p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-ink">Kiểm tra lịch dạy của HLV</h2>
                  <p className="text-[11px] text-muted">
                    Xem các khung giờ huấn luyện viên sẵn sàng nhận học viên tại sân đã chọn
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-semibold text-muted">Ngày:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="rounded-control border border-border bg-bg px-2.5 py-1 text-xs text-ink outline-none focus:border-court-500"
                  />
                </div>
              </div>

              {loadingSlots ? (
                <div className="py-8 text-center text-xs text-muted">
                  <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-court-600 border-t-transparent" />
                  <p className="mt-2">Đang tải lịch trống...</p>
                </div>
              ) : freeSlots.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted rounded-control border border-dashed border-border p-6">
                  <Calendar size={22} className="mx-auto mb-1 text-muted" />
                  <p>HLV chưa có lịch trống tại sân này vào ngày {selectedDate}.</p>
                  <p className="mt-1 text-[11px]">Vui lòng chọn ngày khác hoặc liên hệ cơ sở.</p>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {freeSlots.map((slot) => {
                      const start = new Date(slot.startsAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Ho_Chi_Minh",
                      });
                      const end = new Date(slot.endsAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Ho_Chi_Minh",
                      });

                      return (
                        <div
                          key={slot.id}
                          className="flex items-center gap-2 rounded-control border border-court-200 bg-court-50/50 p-2.5 text-xs text-court-900 dark:border-court-900 dark:bg-court-950/40 dark:text-court-200 font-semibold"
                        >
                          <Clock size={14} className="text-court-600 shrink-0" />
                          <span>{start} - {end}</span>
                        </div>
                      );
                    })}
                  </div>

                  {currentVenue && (
                    <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted">
                        Sẵn sàng tập luyện cùng HLV tại {currentVenue.name}?
                      </span>
                      <Link
                        href={`/venues/${currentVenue.slug || currentVenue.id}/book?coachId=${coach.id}&date=${selectedDate}`}
                        className="inline-flex items-center gap-1.5 rounded-control bg-court-600 px-4 py-2 text-xs font-bold text-white hover:bg-court-700 transition active:scale-95 shadow-sm"
                      >
                        <span>Đặt sân vào ngày này</span>
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
