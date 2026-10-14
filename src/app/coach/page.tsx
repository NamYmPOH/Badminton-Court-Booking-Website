"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  UserCheck,
  Calendar,
  Clock,
  Building2,
  Award,
  AlertCircle,
  Plus,
  Trash2,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatVND } from "@/lib/utils";
import { toast } from "sonner";

interface CoachProfile {
  id: string;
  userId: string;
  bio: string | null;
  specialties: string[];
  experienceYears: number;
  hourlyRate: number;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  reviewReason?: string | null;
  certificates: { id: string; title: string; verifiedAt: string | null }[];
  venues: { id: string; name: string; address: string; openMin: number; closeMin: number }[];
}

interface CoachBookingItem {
  id: string;
  bookingCode: string;
  bookingStatus: string;
  customerName: string;
  customerPhone: string;
  courtName: string;
  venueName: string;
  venueAddress: string;
  startsAt: string;
  endsAt: string;
  fee: number;
  commissionAmount: number;
  status: "HELD" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  cancelledAt: string | null;
  cancelReason: string | null;
}

interface CoachAvailabilityItem {
  id: string;
  venueId: string;
  venueName: string;
  venueAddress: string;
  startsAt: string;
  endsAt: string;
}

const SPECIALTY_OPTIONS = [
  "Kỹ thuật cơ bản",
  "Nâng cao & Chiến thuật",
  "Đơn nam / Đơn nữ",
  "Đôi nam / Đôi nữ",
  "Đôi nam nữ phối hợp",
  "Rèn luyện thể lực",
  "Đào tạo thiếu nhi & thanh thiếu niên",
];

export default function CoachPortalPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bookings" | "availability" | "venues" | "profile">("bookings");

  // Form đăng ký / cập nhật hồ sơ HLV
  const [profileForm, setProfileForm] = useState({
    bio: "",
    experienceYears: 2,
    hourlyRate: 200000,
    specialties: [] as string[],
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Danh sách đơn dạy
  const [bookings, setBookings] = useState<CoachBookingItem[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [cancelModalBooking, setCancelModalBooking] = useState<CoachBookingItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Lịch rảnh
  const [availabilities, setAvailabilities] = useState<CoachAvailabilityItem[]>([]);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [showAddAvail, setShowAddAvail] = useState(false);
  const [availForm, setAvailForm] = useState({
    venueId: "",
    date: new Date().toISOString().slice(0, 10),
    startTime: "08:00",
    endTime: "10:00",
  });
  const [addingAvail, setAddingAvail] = useState(false);

  // Cơ sở sân khả dụng để đăng ký
  const [allVenues, setAllVenues] = useState<{ id: string; name: string }[]>([]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/coach/profile", { cache: "no-store" });
      if (res.status === 404) {
        setProfile(null);
        return;
      }
      if (!res.ok) throw new Error("Không thể tải hồ sơ HLV.");
      const data = await res.json();
      setProfile(data.profile);
      if (data.profile) {
        setProfileForm({
          bio: data.profile.bio || "",
          experienceYears: data.profile.experienceYears || 0,
          hourlyRate: data.profile.hourlyRate || 200000,
          specialties: data.profile.specialties || [],
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi tải hồ sơ HLV.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      const res = await fetch("/api/coach/bookings", { cache: "no-store" });
      if (!res.ok) throw new Error("Không thể tải lịch dạy.");
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi tải lịch dạy.");
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchAvailabilities = async () => {
    try {
      setLoadingAvail(true);
      const res = await fetch("/api/coach/availability", { cache: "no-store" });
      if (!res.ok) throw new Error("Không thể tải ca rảnh.");
      const data = await res.json();
      setAvailabilities(data.availabilities || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi tải ca rảnh.");
    } finally {
      setLoadingAvail(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetch("/api/venues", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.venues)) {
            setAllVenues(data.venues);
          }
        })
        .catch(() => {});
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (profile && profile.status === "ACTIVE") {
      if (activeTab === "bookings") fetchBookings();
      if (activeTab === "availability") fetchAvailabilities();
    }
  }, [profile, activeTab]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/coach/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lưu hồ sơ thất bại.");
      toast.success("Đã cập nhật hồ sơ HLV thành công!");
      fetchProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi lưu hồ sơ");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!availForm.venueId) {
      toast.error("Vui lòng chọn cơ sở sân.");
      return;
    }
    setAddingAvail(true);
    try {
      const startsAt = new Date(`${availForm.date}T${availForm.startTime}:00+07:00`).toISOString();
      const endsAt = new Date(`${availForm.date}T${availForm.endTime}:00+07:00`).toISOString();

      const res = await fetch("/api/coach/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId: availForm.venueId,
          startsAt,
          endsAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Tạo ca rảnh thất bại.");
      toast.success("Đã tạo ca rảnh thành công!");
      setShowAddAvail(false);
      fetchAvailabilities();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi tạo ca rảnh");
    } finally {
      setAddingAvail(false);
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa ca rảnh này không?")) return;
    try {
      const res = await fetch(`/api/coach/availability?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Xóa ca rảnh thất bại.");
      toast.success("Đã xóa ca rảnh!");
      fetchAvailabilities();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi xóa ca rảnh");
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;
    if (!cancelReason.trim()) {
      toast.error("Vui lòng nhập lý do hủy ca dạy.");
      return;
    }
    setCancelling(true);
    try {
      const res = await fetch(`/api/coach/bookings/${cancelModalBooking.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Hủy buổi dạy thất bại.");
      toast.success("Đã hủy buổi dạy. 100% học phí đã được ghi nhận hoàn trả cho khách hàng.");
      setCancelModalBooking(null);
      setCancelReason("");
      fetchBookings();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi hủy buổi dạy");
    } finally {
      setCancelling(false);
    }
  };

  const handleRegisterVenue = async (venueId: string) => {
    try {
      const res = await fetch("/api/coach/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Đăng ký cơ sở thất bại.");
      toast.success("Đã liên kết cơ sở hoạt động thành công!");
      fetchProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi liên kết cơ sở");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <p className="text-muted">Đang tải Cổng Huấn luyện viên...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <UserCheck size={48} className="mx-auto text-court-600" />
        <h1 className="mt-4 text-2xl font-bold">Cổng Thông Tin Huấn Luyện Viên</h1>
        <p className="mt-2 text-sm text-muted">
          Vui lòng đăng nhập tài khoản để đăng ký hoặc quản lý lịch giảng dạy của bạn.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-control bg-court-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-court-700"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  // Chưa đăng ký hồ sơ HLV
  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="rounded-card border border-border bg-surface p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-control bg-court-50 text-court-600 dark:bg-court-950">
              <UserCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink">Đăng Ký Trở Thành Huấn Luyện Viên</h1>
              <p className="text-xs text-muted">
                Dạy cầu lông, kết nối với hàng nghìn học viên tại các cụm sân chất lượng cao.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase">
                Giới thiệu bản thân & Thành tích
              </label>
              <textarea
                required
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                placeholder="VD: Cựu vận động viên cấp tỉnh, 5 năm kinh nghiệm huấn luyện chuyên sâu..."
                rows={3}
                className="mt-1 w-full rounded-control border border-border bg-bg p-3 text-sm text-ink outline-none focus:border-court-500"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase">
                  Số năm kinh nghiệm
                </label>
                <input
                  required
                  type="number"
                  min={0}
                  max={50}
                  value={profileForm.experienceYears}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, experienceYears: Number(e.target.value) })
                  }
                  className="mt-1 w-full rounded-control border border-border bg-bg p-3 text-sm text-ink outline-none focus:border-court-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase">
                  Học phí / giờ dạy (VND)
                </label>
                <input
                  required
                  type="number"
                  min={0}
                  step={10000}
                  value={profileForm.hourlyRate}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, hourlyRate: Number(e.target.value) })
                  }
                  className="mt-1 w-full rounded-control border border-border bg-bg p-3 text-sm text-ink outline-none focus:border-court-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase mb-1.5">
                Chuyên môn huấn luyện
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {SPECIALTY_OPTIONS.map((spec) => (
                  <label key={spec} className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileForm.specialties.includes(spec)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProfileForm({
                            ...profileForm,
                            specialties: [...profileForm.specialties, spec],
                          });
                        } else {
                          setProfileForm({
                            ...profileForm,
                            specialties: profileForm.specialties.filter((s) => s !== spec),
                          });
                        }
                      }}
                      className="rounded border-border text-court-600 focus:ring-court-500"
                    />
                    <span>{spec}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              disabled={savingProfile}
              className="mt-4 w-full rounded-control bg-court-600 p-3.5 text-sm font-bold text-white shadow hover:bg-court-700 disabled:opacity-50"
            >
              {savingProfile ? "Đang gửi hồ sơ..." : "Nộp hồ sơ Huấn luyện viên"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Đã có hồ sơ HLV
  return (
    <div className="min-h-screen bg-bg pb-20">
      {/* Banner HLV */}
      <section className="border-b border-border bg-surface px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-content flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-court-50 font-bold text-court-700 dark:bg-court-950 dark:text-court-300">
              <UserCheck size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-ink sm:text-2xl">{user.name}</h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    profile.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : profile.status === "PENDING"
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                  }`}
                >
                  {profile.status === "ACTIVE"
                    ? "Đang hoạt động"
                    : profile.status === "PENDING"
                    ? "Chờ duyệt hồ sơ"
                    : "Tạm ngưng"}
                </span>
              </div>
              <p className="text-xs text-muted">
                Học phí: <strong>{formatVND(profile.hourlyRate)}/giờ</strong> · {profile.experienceYears} năm kinh nghiệm ·{" "}
                {profile.venues.length} cơ sở hoạt động
              </p>
            </div>
          </div>

          {profile.status === "ACTIVE" && (
            <button
              onClick={() => setShowAddAvail(true)}
              className="inline-flex items-center gap-1.5 rounded-control bg-court-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-court-700"
            >
              <Plus size={16} />
              Mở ca rảnh mới
            </button>
          )}
        </div>

        {profile.status === "PENDING" && (
          <div className="mx-auto mt-6 max-w-content rounded-control bg-amber-50 p-4 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <p className="flex items-center gap-1.5 font-bold">
              <Clock size={16} />
              Hồ sơ Huấn luyện viên đang chờ duyệt
            </p>
            <p className="mt-1 text-muted">
              Ban Quản trị sẽ thẩm định thông tin và chứng chỉ chuyên môn của bạn trong vòng 24h.
            </p>
          </div>
        )}
      </section>

      {/* Tabs */}
      {profile.status === "ACTIVE" && (
        <div className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-content gap-6 px-4 sm:px-6">
            <button
              onClick={() => setActiveTab("bookings")}
              className={`flex items-center gap-2 border-b-2 py-3.5 text-xs font-bold transition ${
                activeTab === "bookings"
                  ? "border-court-600 text-court-600"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              <Calendar size={16} />
              Lịch dạy & Đơn đặt ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab("availability")}
              className={`flex items-center gap-2 border-b-2 py-3.5 text-xs font-bold transition ${
                activeTab === "availability"
                  ? "border-court-600 text-court-600"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              <Clock size={16} />
              Ca rảnh ({availabilities.length})
            </button>
            <button
              onClick={() => setActiveTab("venues")}
              className={`flex items-center gap-2 border-b-2 py-3.5 text-xs font-bold transition ${
                activeTab === "venues"
                  ? "border-court-600 text-court-600"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              <Building2 size={16} />
              Cơ sở hoạt động ({profile.venues.length})
            </button>
          </div>
        </div>
      )}

      {/* Nội dung các Tab */}
      <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
        {/* Tab 1: Lịch dạy */}
        {activeTab === "bookings" && profile.status === "ACTIVE" && (
          <div className="space-y-4">
            {loadingBookings ? (
              <p className="text-xs text-muted">Đang tải lịch dạy...</p>
            ) : bookings.length === 0 ? (
              <div className="rounded-card border border-dashed border-border p-8 text-center">
                <Calendar size={32} className="mx-auto text-muted" />
                <p className="mt-2 text-sm font-semibold">Chưa có buổi dạy nào được đặt</p>
                <p className="text-xs text-muted">
                  Hãy mở thêm các ca rảnh tại các cơ sở sân để học viên dễ dàng đặt lịch cùng bạn.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-card border border-border bg-surface">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-bg font-semibold text-muted uppercase">
                    <tr>
                      <th className="p-3.5">Mã đơn / Khách hàng</th>
                      <th className="p-3.5">Cơ sở & Sân</th>
                      <th className="p-3.5">Thời gian</th>
                      <th className="p-3.5">Học phí (Net)</th>
                      <th className="p-3.5">Trạng thái</th>
                      <th className="p-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-bg/50">
                        <td className="p-3.5">
                          <p className="font-mono font-bold text-court-600">{b.bookingCode}</p>
                          <p className="text-ink font-semibold">{b.customerName}</p>
                          <p className="text-[11px] text-muted">{b.customerPhone}</p>
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-ink">{b.venueName}</p>
                          <p className="text-muted">{b.courtName}</p>
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-ink">
                            {new Date(b.startsAt).toLocaleDateString("vi-VN")}
                          </p>
                          <p className="text-muted">
                            {new Date(b.startsAt).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            –{" "}
                            {new Date(b.endsAt).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </td>
                        <td className="p-3.5">
                          <p className="font-bold text-ink">{formatVND(b.fee)}</p>
                          <p className="text-[11px] text-muted">
                            Hoa hồng sàn: {formatVND(b.commissionAmount)}
                          </p>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`rounded-full px-2 py-0.5 font-bold ${
                              b.status === "CONFIRMED"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : b.status === "HELD"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                : b.status === "COMPLETED"
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            }`}
                          >
                            {b.status === "CONFIRMED"
                              ? "Đã xác nhận"
                              : b.status === "HELD"
                              ? "Đang giữ chỗ"
                              : b.status === "COMPLETED"
                              ? "Đã hoàn thành"
                              : "Đã hủy"}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {(b.status === "CONFIRMED" || b.status === "HELD") && (
                            <button
                              onClick={() => {
                                setCancelModalBooking(b);
                                setCancelReason("");
                              }}
                              className="rounded-control bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 dark:bg-rose-950/60"
                            >
                              Hủy buổi dạy
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Quản lý ca rảnh */}
        {activeTab === "availability" && profile.status === "ACTIVE" && (
          <div className="space-y-6">
            {/* Modal / Form thêm ca rảnh */}
            {showAddAvail && (
              <div className="rounded-card border border-court-200 bg-surface p-6 shadow-md dark:border-court-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-ink">Mở Khung Giờ Rảnh Mới</h3>
                  <button
                    onClick={() => setShowAddAvail(false)}
                    className="text-xs text-muted hover:text-ink"
                  >
                    Đóng [X]
                  </button>
                </div>

                <form onSubmit={handleAddAvailability} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase">
                      Cơ sở sân giảng dạy *
                    </label>
                    <select
                      required
                      value={availForm.venueId}
                      onChange={(e) => setAvailForm({ ...availForm, venueId: e.target.value })}
                      className="mt-1 w-full rounded-control border border-border bg-bg p-2.5 text-sm text-ink outline-none focus:border-court-500"
                    >
                      <option value="">-- Chọn cơ sở --</option>
                      {profile.venues.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.address})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase">
                        Ngày dạy *
                      </label>
                      <input
                        required
                        type="date"
                        value={availForm.date}
                        onChange={(e) => setAvailForm({ ...availForm, date: e.target.value })}
                        className="mt-1 w-full rounded-control border border-border bg-bg p-2.5 text-sm text-ink outline-none focus:border-court-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase">
                        Giờ bắt đầu *
                      </label>
                      <input
                        required
                        type="time"
                        value={availForm.startTime}
                        onChange={(e) => setAvailForm({ ...availForm, startTime: e.target.value })}
                        className="mt-1 w-full rounded-control border border-border bg-bg p-2.5 text-sm text-ink outline-none focus:border-court-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase">
                        Giờ kết thúc *
                      </label>
                      <input
                        required
                        type="time"
                        value={availForm.endTime}
                        onChange={(e) => setAvailForm({ ...availForm, endTime: e.target.value })}
                        className="mt-1 w-full rounded-control border border-border bg-bg p-2.5 text-sm text-ink outline-none focus:border-court-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddAvail(false)}
                      className="rounded-control border border-border px-4 py-2 text-xs font-semibold text-muted hover:text-ink"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={addingAvail}
                      className="rounded-control bg-court-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-court-700 disabled:opacity-50"
                    >
                      {addingAvail ? "Đang lưu..." : "Lưu ca rảnh"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Danh sách ca rảnh */}
            {loadingAvail ? (
              <p className="text-xs text-muted">Đang tải ca rảnh...</p>
            ) : availabilities.length === 0 ? (
              <div className="rounded-card border border-dashed border-border p-8 text-center">
                <Clock size={32} className="mx-auto text-muted" />
                <p className="mt-2 text-sm font-semibold">Chưa có ca rảnh nào được tạo</p>
                <p className="text-xs text-muted">
                  Bấm &quot;Mở ca rảnh mới&quot; để học viên có thể đặt lịch học với bạn.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {availabilities.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-card border border-border bg-surface p-4 shadow-sm"
                  >
                    <div>
                      <p className="font-semibold text-ink text-sm">{a.venueName}</p>
                      <p className="text-xs text-muted">
                        {new Date(a.startsAt).toLocaleDateString("vi-VN")}
                      </p>
                      <p className="text-xs font-mono font-bold text-court-600">
                        {new Date(a.startsAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        –{" "}
                        {new Date(a.endsAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteAvailability(a.id)}
                      className="rounded-control p-2 text-muted hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Xóa ca rảnh"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Cơ sở hoạt động */}
        {activeTab === "venues" && profile.status === "ACTIVE" && (
          <div className="space-y-6">
            <div className="rounded-card border border-border bg-surface p-6">
              <h3 className="font-bold text-ink">Cơ Sở Sân Đang Giảng Dạy</h3>
              <p className="text-xs text-muted mt-1">
                Bạn chỉ có thể mở ca rảnh tại những cơ sở sân đã được liên kết vào hồ sơ.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {profile.venues.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 rounded-control border border-border bg-bg p-3.5"
                  >
                    <Building2 size={20} className="text-court-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-ink text-xs sm:text-sm">{v.name}</p>
                      <p className="text-[11px] text-muted">{v.address}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Thêm cơ sở */}
              <div className="mt-6 border-t border-border pt-4">
                <h4 className="text-xs font-bold text-ink uppercase mb-2">
                  Liên kết thêm cơ sở mới
                </h4>
                <div className="flex gap-2 max-w-md">
                  <select
                    id="newVenueSelect"
                    className="flex-1 rounded-control border border-border bg-bg p-2 text-xs text-ink outline-none focus:border-court-500"
                  >
                    <option value="">-- Chọn cụm sân muốn dạy --</option>
                    {allVenues
                      .filter((v) => !profile.venues.some((pv) => pv.id === v.id))
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() => {
                      const sel = document.getElementById("newVenueSelect") as HTMLSelectElement;
                      if (sel && sel.value) handleRegisterVenue(sel.value);
                    }}
                    className="rounded-control bg-court-600 px-4 text-xs font-bold text-white hover:bg-court-700"
                  >
                    Liên kết
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal xác nhận Hủy buổi dạy */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertCircle size={20} />
              <h3 className="font-bold text-ink">Xác Nhận Hủy Buổi Dạy</h3>
            </div>
            <p className="mt-2 text-xs text-muted">
              Buổi dạy đơn <strong>{cancelModalBooking.bookingCode}</strong> ({cancelModalBooking.customerName}) sẽ bị hủy.
              Theo quy định, <strong>100% học phí ({formatVND(cancelModalBooking.fee)})</strong> sẽ được tự động hoàn trả cho khách hàng. Sân đấu của khách vẫn được giữ nguyên.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-muted uppercase">
                Lý do hủy buổi dạy *
              </label>
              <textarea
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="VD: HLV bị ốm đột xuất / sự cố ngoài ý muốn..."
                rows={3}
                className="mt-1 w-full rounded-control border border-border bg-bg p-2.5 text-xs text-ink outline-none focus:border-court-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="rounded-control border border-border px-4 py-2 text-xs font-semibold text-muted hover:text-ink"
              >
                Quay lại
              </button>
              <button
                type="button"
                disabled={cancelling || !cancelReason.trim()}
                onClick={handleCancelBooking}
                className="rounded-control bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {cancelling ? "Đang xử lý..." : "Xác nhận hủy & hoàn tiền 100%"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
