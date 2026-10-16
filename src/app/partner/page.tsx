"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Tag,
  BarChart3,
  Plus,
  Send,
  Clock,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatVND } from "@/lib/utils";
import { toast } from "sonner";

export interface PartnerProfile {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  myRole: "OWNER" | "MANAGER" | "STAFF";
  offersCount: number;
}

export interface PartnerOfferItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  budget: number;
  usedBudget: number;
  maxUsage: number | null;
  currentUsage: number;
  sponsor: string;
  reviewReason?: string | null;
  voucherCode?: string;
  voucherType?: "PERCENT" | "FIXED";
  voucherValue?: number;
  voucher: {
    code: string;
    type: "PERCENT" | "FIXED";
    value: number;
    maxDiscount: number | null;
    minAmount: number;
    validFrom: string;
    validTo: string;
    isActive: boolean;
  };
}

export interface PartnerReport {
  partnerId: string;
  partnerName: string;
  summary: {
    totalOffers: number;
    activeOffers: number;
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
    totalUsages: number;
    utilizationRate: number;
  };
  offers: {
    id: string;
    title: string;
    voucherCode: string;
    status: string;
    budget: number;
    spent: number;
    remaining: number;
    usageCount: number;
    maxUsage: number | null;
    utilizationRate: number;
  }[];
  recentUsages?: {
    id: string;
    bookingCode: string;
    bookingStatus: string;
    voucherCode: string;
    offerTitle: string;
    discountAmount: number;
    state: string;
    createdAt: string;
  }[];
}

export default function PartnerPortalPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [partners, setPartners] = useState<PartnerProfile[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"offers" | "reports">("offers");
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  // Đăng ký hồ sơ mới
  const [registerForm, setRegisterForm] = useState({
    name: "",
    slug: "",
    logoUrl: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [registering, setRegistering] = useState(false);

  // Danh sách offers
  const [offers, setOffers] = useState<PartnerOfferItem[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [creatingOffer, setCreatingOffer] = useState(false);
  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    voucherCode: "",
    type: "PERCENT" as "PERCENT" | "FIXED",
    value: 20,
    maxDiscount: 50000,
    minAmount: 100000,
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    budget: 1000000,
    maxUsage: 100,
  });

  // Báo cáo
  const [report, setReport] = useState<PartnerReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const currentPartner = partners.find((p) => p.id === selectedPartnerId) || partners[0] || null;

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/partner/profile", { cache: "no-store" });
      if (res.status === 404) {
        setPartners([]);
        setSelectedPartnerId(null);
        return;
      }
      if (!res.ok) throw new Error("Không thể tải hồ sơ đối tác.");
      const data = await res.json();
      const list: PartnerProfile[] = Array.isArray(data.partners)
        ? data.partners
        : data.partner
        ? [data.partner]
        : [];
      setPartners(list);
      if (list.length > 0) {
        setSelectedPartnerId((prev) => (list.some((p) => p.id === prev) ? prev : list[0].id));
      } else {
        setSelectedPartnerId(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi tải hồ sơ.");
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async (partnerId: string) => {
    try {
      setLoadingOffers(true);
      const res = await fetch(`/api/partner/offers?partnerId=${encodeURIComponent(partnerId)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Không thể tải danh sách ưu đãi.");
      }
      const data = await res.json();
      setOffers(data.offers || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi tải ưu đãi.");
    } finally {
      setLoadingOffers(false);
    }
  };

  const fetchReport = async (partnerId: string) => {
    try {
      setLoadingReport(true);
      const res = await fetch(`/api/partner/reports?partnerId=${encodeURIComponent(partnerId)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Không thể tải báo cáo hiệu quả.");
      }
      const data = await res.json();
      setReport(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi tải báo cáo.");
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (currentPartner && currentPartner.status === "ACTIVE") {
      if (activeTab === "offers") fetchOffers(currentPartner.id);
      if (activeTab === "reports") fetchReport(currentPartner.id);
    }
  }, [currentPartner, activeTab]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    try {
      const payload = {
        name: registerForm.name.trim(),
        slug: registerForm.slug.trim().toLowerCase(),
        logoUrl: registerForm.logoUrl.trim() || undefined,
        description: registerForm.description.trim() || undefined,
        contactEmail: registerForm.contactEmail.trim() || undefined,
        contactPhone: registerForm.contactPhone.trim() || undefined,
      };

      const res = await fetch("/api/partner/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Đăng ký thất bại.");
      toast.success("Đăng ký đối tác thành công! Hồ sơ đang chờ Quản trị viên duyệt.");
      setShowRegisterForm(false);
      setRegisterForm({
        name: "",
        slug: "",
        logoUrl: "",
        description: "",
        contactEmail: "",
        contactPhone: "",
      });
      await fetchProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi đăng ký");
    } finally {
      setRegistering(false);
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPartner) return;
    if (currentPartner.myRole === "STAFF") {
      toast.error("Chỉ Chủ sở hữu hoặc Quản lý thương hiệu mới có quyền tạo ưu đãi.");
      return;
    }

    setCreatingOffer(true);
    try {
      const payload = {
        partnerId: currentPartner.id,
        title: offerForm.title.trim(),
        description: offerForm.description.trim() || undefined,
        sponsor: "PARTNER" as const,
        budget: Number(offerForm.budget),
        maxUsage: offerForm.maxUsage ? Number(offerForm.maxUsage) : undefined,
        voucher: {
          code: offerForm.voucherCode.trim().toUpperCase(),
          type: offerForm.type,
          value: Number(offerForm.value),
          maxDiscount: offerForm.maxDiscount ? Number(offerForm.maxDiscount) : undefined,
          minAmount: Number(offerForm.minAmount) || 0,
          validFrom: new Date(offerForm.validFrom).toISOString(),
          validTo: new Date(offerForm.validTo).toISOString(),
        },
      };

      const res = await fetch("/api/partner/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Tạo ưu đãi thất bại.");
      toast.success("Đã tạo ưu đãi (Bản nháp). Bạn có thể gửi duyệt khi sẵn sàng!");
      setShowCreateOffer(false);
      setOfferForm({
        title: "",
        description: "",
        voucherCode: "",
        type: "PERCENT",
        value: 20,
        maxDiscount: 50000,
        minAmount: 100000,
        validFrom: new Date().toISOString().slice(0, 10),
        validTo: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        budget: 1000000,
        maxUsage: 100,
      });
      fetchOffers(currentPartner.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi tạo ưu đãi");
    } finally {
      setCreatingOffer(false);
    }
  };

  const handleSubmitOffer = async (offerId: string) => {
    if (!currentPartner) return;
    if (currentPartner.myRole === "STAFF") {
      toast.error("Chỉ Chủ sở hữu hoặc Quản lý thương hiệu mới có quyền gửi duyệt.");
      return;
    }

    try {
      const res = await fetch(`/api/partner/offers/${offerId}/submit`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gửi duyệt thất bại.");
      toast.success("Đã gửi yêu cầu phê duyệt đến Ban Quản trị!");
      fetchOffers(currentPartner.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi gửi duyệt");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return "Chủ sở hữu";
      case "MANAGER":
        return "Quản lý";
      case "STAFF":
      default:
        return "Nhân viên";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <p className="text-muted text-sm">Đang tải Cổng đối tác SmashBook...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Building2 size={48} className="mx-auto text-court-600" />
        <h1 className="mt-4 text-2xl font-bold">Cổng Thông Tin Đối Tác & Tài Trợ</h1>
        <p className="mt-2 text-sm text-muted">
          Vui lòng đăng nhập tài khoản để đăng ký hoặc quản lý chiến dịch ưu đãi của thương hiệu.
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

  // Chưa đăng ký hồ sơ đối tác nào, hoặc người dùng muốn đăng ký thêm đối tác mới
  if (!currentPartner || showRegisterForm) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="rounded-card border border-border bg-surface p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-control bg-court-50 text-court-600 dark:bg-court-950">
                <Building2 size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-ink">
                  {showRegisterForm ? "Đăng Ký Thêm Thương Hiệu Mới" : "Đăng Ký Thương Hiệu Đối Tác"}
                </h1>
                <p className="text-xs text-muted">
                  Đồng hành cùng SmashBook mang ưu đãi thể thao tới hàng nghìn vận động viên cầu lông.
                </p>
              </div>
            </div>
            {showRegisterForm && currentPartner && (
              <button
                type="button"
                onClick={() => setShowRegisterForm(false)}
                className="text-xs text-muted hover:text-ink font-semibold"
              >
                Quay lại
              </button>
            )}
          </div>

          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase">
                Tên thương hiệu / Doanh nghiệp *
              </label>
              <input
                required
                value={registerForm.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setRegisterForm({
                    ...registerForm,
                    name: val,
                    slug: val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
                  });
                }}
                placeholder="Yonex Vietnam"
                className="mt-1 w-full rounded-control border border-border bg-bg p-3 text-sm text-ink outline-none focus:border-court-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase">
                Mã định danh (Slug) *
              </label>
              <input
                required
                value={registerForm.slug}
                onChange={(e) => setRegisterForm({ ...registerForm, slug: e.target.value })}
                placeholder="yonex-vietnam"
                className="mt-1 w-full rounded-control border border-border bg-bg p-3 text-sm font-mono text-ink outline-none focus:border-court-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase">
                Logo URL (Tùy chọn)
              </label>
              <input
                value={registerForm.logoUrl}
                onChange={(e) => setRegisterForm({ ...registerForm, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="mt-1 w-full rounded-control border border-border bg-bg p-3 text-sm text-ink outline-none focus:border-court-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase">
                Mô tả giới thiệu thương hiệu (Tùy chọn)
              </label>
              <textarea
                value={registerForm.description}
                onChange={(e) => setRegisterForm({ ...registerForm, description: e.target.value })}
                placeholder="Nhà phân phối dụng cụ cầu lông hàng đầu..."
                rows={2}
                className="mt-1 w-full rounded-control border border-border bg-bg p-3 text-sm text-ink outline-none focus:border-court-500"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase">
                  Email liên hệ đại diện (Tùy chọn)
                </label>
                <input
                  type="email"
                  value={registerForm.contactEmail}
                  onChange={(e) => setRegisterForm({ ...registerForm, contactEmail: e.target.value })}
                  placeholder="contact@brand.com"
                  className="mt-1 w-full rounded-control border border-border bg-bg p-3 text-sm text-ink outline-none focus:border-court-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase">
                  Số điện thoại đại diện (Tùy chọn)
                </label>
                <input
                  type="tel"
                  value={registerForm.contactPhone}
                  onChange={(e) => setRegisterForm({ ...registerForm, contactPhone: e.target.value })}
                  placeholder="0988776655"
                  className="mt-1 w-full rounded-control border border-border bg-bg p-3 text-sm text-ink outline-none focus:border-court-500"
                />
              </div>
            </div>

            <button
              disabled={registering}
              className="mt-4 w-full rounded-control bg-court-600 p-3.5 text-sm font-bold text-white shadow hover:bg-court-700 disabled:opacity-50"
            >
              {registering ? "Đang gửi hồ sơ..." : "Đăng ký hồ sơ đối tác"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Đã có hồ sơ đối tác đang hoạt động / chờ duyệt
  return (
    <div className="min-h-screen bg-bg pb-20">
      {/* Banner thương hiệu */}
      <section className="border-b border-border bg-surface px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-content flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-card bg-court-50 font-bold text-court-700 dark:bg-court-950 dark:text-court-300">
              {currentPartner.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentPartner.logoUrl}
                  alt={currentPartner.name}
                  className="h-full w-full rounded-card object-cover"
                />
              ) : (
                <Building2 size={28} />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {partners.length > 1 ? (
                  <div className="relative inline-block">
                    <select
                      value={selectedPartnerId || currentPartner.id}
                      onChange={(e) => setSelectedPartnerId(e.target.value)}
                      className="cursor-pointer appearance-none rounded-control border border-border bg-bg py-1 pl-3 pr-8 text-lg font-bold text-ink outline-none focus:border-court-500"
                    >
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
                  </div>
                ) : (
                  <h1 className="text-xl font-bold text-ink sm:text-2xl">{currentPartner.name}</h1>
                )}

                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    currentPartner.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : currentPartner.status === "PENDING"
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                  }`}
                >
                  {currentPartner.status === "ACTIVE"
                    ? "Đang hoạt động"
                    : currentPartner.status === "PENDING"
                    ? "Chờ duyệt hồ sơ"
                    : "Tạm ngưng"}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                Slug: <code className="font-mono">{currentPartner.slug}</code> · Vai trò:{" "}
                <strong className="text-ink">{getRoleBadge(currentPartner.myRole)}</strong>
                {" · "}
                <button
                  type="button"
                  onClick={() => setShowRegisterForm(true)}
                  className="text-court-600 hover:underline"
                >
                  + Đăng ký thêm thương hiệu
                </button>
              </p>
            </div>
          </div>

          {currentPartner.status === "ACTIVE" && (
            <div>
              {currentPartner.myRole !== "STAFF" ? (
                <button
                  onClick={() => setShowCreateOffer(true)}
                  className="inline-flex items-center gap-1.5 rounded-control bg-court-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-court-700"
                >
                  <Plus size={16} />
                  Tạo chiến dịch ưu đãi
                </button>
              ) : (
                <span className="text-xs text-muted italic">Vai trò Nhân viên: Chế độ chỉ xem</span>
              )}
            </div>
          )}
        </div>

        {/* Thông báo trạng thái nếu PENDING */}
        {currentPartner.status === "PENDING" && (
          <div className="mx-auto mt-6 max-w-content rounded-control bg-amber-50 p-4 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <p className="flex items-center gap-1.5 font-bold">
              <Clock size={16} />
              Hồ sơ thương hiệu đang chờ Ban Quản trị xét duyệt
            </p>
            <p className="mt-1 text-muted">
              Ban Quản trị SmashBook sẽ thẩm định hồ sơ thương hiệu trong vòng 24h làm việc. Sau khi được kích hoạt,
              bạn có thể phát hành các chiến dịch tài trợ voucher trực tiếp cho người chơi cầu lông.
            </p>
          </div>
        )}
      </section>

      {/* Tabs điều hướng */}
      {currentPartner.status === "ACTIVE" && (
        <div className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-content gap-6 px-4 sm:px-6">
            <button
              onClick={() => setActiveTab("offers")}
              className={`flex items-center gap-2 border-b-2 py-3.5 text-xs font-bold transition ${
                activeTab === "offers"
                  ? "border-court-600 text-court-600"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              <Tag size={16} />
              Chiến dịch ưu đãi ({offers.length})
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`flex items-center gap-2 border-b-2 py-3.5 text-xs font-bold transition ${
                activeTab === "reports"
                  ? "border-court-600 text-court-600"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              <BarChart3 size={16} />
              Báo cáo hiệu quả tài trợ
            </button>
          </div>
        </div>
      )}

      {/* Nội dung chính */}
      <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
        {/* Tab 1: Quản lý ưu đãi */}
        {activeTab === "offers" && currentPartner.status === "ACTIVE" && (
          <div className="space-y-6">
            {/* Modal / Form tạo ưu đãi */}
            {showCreateOffer && (
              <div className="rounded-card border border-court-200 bg-surface p-6 shadow-md dark:border-court-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-ink">Thiết Lập Chiến Dịch Voucher Mới</h3>
                  <button
                    onClick={() => setShowCreateOffer(false)}
                    className="text-xs text-muted hover:text-ink"
                  >
                    Đóng [X]
                  </button>
                </div>

                <form onSubmit={handleCreateOffer} className="mt-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase">
                        Tên chiến dịch *
                      </label>
                      <input
                        required
                        value={offerForm.title}
                        onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                        placeholder="Yonex Giảm 20% Thuê Sân"
                        className="mt-1 w-full rounded-control border border-border bg-bg p-2.5 text-sm text-ink outline-none focus:border-court-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase">
                        Mã voucher phát hành *
                      </label>
                      <input
                        required
                        value={offerForm.voucherCode}
                        onChange={(e) =>
                          setOfferForm({ ...offerForm, voucherCode: e.target.value.toUpperCase() })
                        }
                        placeholder="YONEX20"
                        className="mt-1 w-full rounded-control border border-border bg-bg p-2.5 text-sm uppercase font-mono text-ink outline-none focus:border-court-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase">
                      Mô tả ưu đãi
                    </label>
                    <textarea
                      value={offerForm.description}
                      onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                      placeholder="Áp dụng giảm trừ trực tiếp vào giá thuê sân cho thành viên SmashBook..."
                      rows={2}
                      className="mt-1 w-full rounded-control border border-border bg-bg p-2.5 text-sm text-ink outline-none focus:border-court-500"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase">
                        Loại giảm giá *
                      </label>
                      <select
                        value={offerForm.type}
                        onChange={(e) =>
                          setOfferForm({
                            ...offerForm,
                            type: e.target.value as "PERCENT" | "FIXED",
                          })
                        }
                        className="mt-1 w-full rounded-control border border-border bg-bg p-2.5 text-sm text-ink outline-none focus:border-court-500"
                      >
                        <option value="PERCENT">Phần trăm (%)</option>
                        <option value="FIXED">Số tiền cố định (VND)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase">
                        Giá trị giảm *
                      </label>
                      <input
                        required
                        type="number"
                        min={1}
                        value={offerForm.value}
                        onChange={(e) => setOfferForm({ ...offerForm, value: Number(e.target.value) })}
                        className="mt-1 w-full rounded-control border border-border bg-bg p-2.5 text-sm text-ink outline-none focus:border-court-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase">
                        Giảm tối đa (VND)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={offerForm.maxDiscount}
                        onChange={(e) =>
                          setOfferForm({ ...offerForm, maxDiscount: Number(e.target.value) })
                        }
                        placeholder="50000"
                        className="mt-1 w-full rounded-control border border-border bg-bg p-2.5 text-sm text-ink outline-none focus:border-court-500"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase">
                        Ngân sách tài trợ (VND) *
                      </label>
                      <input
                        required
                        type="number"
                        min={100000}
                        step={100000}
                        value={offerForm.budget}
                        onChange={(e) =>
                          setOfferForm({ ...offerForm, budget: Number(e.target.value) })
                        }
                        className="mt-1 w-full rounded-control border border-border bg-bg p-2.5 text-sm text-ink outline-none focus:border-court-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase">
                        Giới hạn lượt dùng (Tùy chọn)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={offerForm.maxUsage}
                        onChange={(e) =>
                          setOfferForm({ ...offerForm, maxUsage: Number(e.target.value) })
                        }
                        className="mt-1 w-full rounded-control border border-border bg-bg p-2.5 text-sm text-ink outline-none focus:border-court-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase">
                        Đơn sân tối thiểu (VND)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={offerForm.minAmount}
                        onChange={(e) =>
                          setOfferForm({ ...offerForm, minAmount: Number(e.target.value) })
                        }
                        className="mt-1 w-full rounded-control border border-border bg-bg p-2.5 text-sm text-ink outline-none focus:border-court-500"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase">
                        Bắt đầu từ ngày *
                      </label>
                      <input
                        required
                        type="date"
                        value={offerForm.validFrom}
                        onChange={(e) =>
                          setOfferForm({ ...offerForm, validFrom: e.target.value })
                        }
                        className="mt-1 w-full rounded-control border border-border bg-bg p-2.5 text-sm text-ink outline-none focus:border-court-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase">
                        Kết thúc ngày *
                      </label>
                      <input
                        required
                        type="date"
                        value={offerForm.validTo}
                        onChange={(e) =>
                          setOfferForm({ ...offerForm, validTo: e.target.value })
                        }
                        className="mt-1 w-full rounded-control border border-border bg-bg p-2.5 text-sm text-ink outline-none focus:border-court-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateOffer(false)}
                      className="rounded-control border border-border px-4 py-2 text-xs font-semibold text-muted hover:text-ink"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={creatingOffer}
                      className="rounded-control bg-court-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-court-700 disabled:opacity-50"
                    >
                      {creatingOffer ? "Đang lưu..." : "Tạo ưu đãi (Lưu bản nháp)"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Bảng danh sách offers */}
            {loadingOffers ? (
              <p className="text-xs text-muted">Đang tải danh sách ưu đãi...</p>
            ) : offers.length === 0 ? (
              <div className="rounded-card border border-dashed border-border p-8 text-center">
                <Tag size={32} className="mx-auto text-muted" />
                <p className="mt-2 text-sm font-semibold">Chưa có chiến dịch ưu đãi nào</p>
                <p className="text-xs text-muted">
                  Bấm &quot;Tạo chiến dịch ưu đãi&quot; để thiết lập chương trình tài trợ đầu tiên của bạn.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-card border border-border bg-surface">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-bg font-semibold text-muted uppercase">
                    <tr>
                      <th className="p-3.5">Mã Voucher / Tiêu đề</th>
                      <th className="p-3.5">Mức giảm</th>
                      <th className="p-3.5">Ngân sách đã dùng</th>
                      <th className="p-3.5">Lượt dùng</th>
                      <th className="p-3.5">Trạng thái</th>
                      <th className="p-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {offers.map((o) => {
                      const vCode = o.voucher?.code || o.voucherCode || "N/A";
                      const vType = o.voucher?.type || o.voucherType || "PERCENT";
                      const vVal = o.voucher?.value ?? o.voucherValue ?? 0;
                      const maxD = o.voucher?.maxDiscount;

                      return (
                        <tr key={o.id} className="hover:bg-bg/50">
                          <td className="p-3.5">
                            <p className="font-mono font-bold text-court-600">{vCode}</p>
                            <p className="text-ink font-medium">{o.title}</p>
                          </td>
                          <td className="p-3.5 font-semibold text-ink">
                            {vType === "PERCENT"
                              ? `${vVal}% (Tối đa ${formatVND(maxD || 0)})`
                              : formatVND(vVal)}
                          </td>
                          <td className="p-3.5">
                            <p className="font-semibold text-ink">
                              {formatVND(o.usedBudget)} / {formatVND(o.budget)}
                            </p>
                            <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-border">
                              <div
                                className="h-full bg-court-500"
                                style={{
                                  width: `${Math.min(100, Math.round((o.usedBudget / o.budget) * 100))}%`,
                                }}
                              />
                            </div>
                          </td>
                          <td className="p-3.5 text-ink">
                            {o.currentUsage} {o.maxUsage ? `/ ${o.maxUsage}` : "lượt"}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`rounded-full px-2 py-0.5 font-bold ${
                                o.status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                  : o.status === "PENDING_REVIEW"
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                  : o.status === "DRAFT"
                                  ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                  : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              }`}
                            >
                              {o.status === "ACTIVE"
                                ? "Hoạt động"
                                : o.status === "PENDING_REVIEW"
                                ? "Chờ duyệt"
                                : o.status === "DRAFT"
                                ? "Bản nháp"
                                : o.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            {(o.status === "DRAFT" || o.status === "REJECTED") &&
                              currentPartner.myRole !== "STAFF" && (
                                <button
                                  onClick={() => handleSubmitOffer(o.id)}
                                  className="inline-flex items-center gap-1 rounded-control bg-court-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-court-700"
                                >
                                  <Send size={12} />
                                  Gửi duyệt
                                </button>
                              )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Báo cáo hiệu quả tài trợ */}
        {activeTab === "reports" && currentPartner.status === "ACTIVE" && (
          <div className="space-y-6">
            {loadingReport ? (
              <p className="text-xs text-muted">Đang tính toán dữ liệu báo cáo...</p>
            ) : !report ? (
              <p className="text-xs text-muted">Chưa có dữ liệu báo cáo.</p>
            ) : (
              <>
                {/* Metric Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
                    <p className="text-xs text-muted uppercase font-semibold">
                      Tổng ngân sách cam kết
                    </p>
                    <p className="mt-2 text-xl font-bold text-ink">
                      {formatVND(report.summary?.totalBudget ?? 0)}
                    </p>
                  </div>

                  <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
                    <p className="text-xs text-muted uppercase font-semibold">
                      Ngân sách tài trợ đã dùng
                    </p>
                    <p className="mt-2 text-xl font-bold text-court-600">
                      {formatVND(report.summary?.totalSpent ?? 0)}
                    </p>
                  </div>

                  <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
                    <p className="text-xs text-muted uppercase font-semibold">
                      Ngân sách còn lại
                    </p>
                    <p className="mt-2 text-xl font-bold text-ink">
                      {formatVND(report.summary?.totalRemaining ?? 0)}
                    </p>
                  </div>

                  <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
                    <p className="text-xs text-muted uppercase font-semibold">
                      Lượt khách hưởng ưu đãi
                    </p>
                    <p className="mt-2 text-xl font-bold text-ink">
                      {report.summary?.totalUsages ?? 0} lượt
                    </p>
                  </div>
                </div>

                {/* Bảng chi tiết từng chiến dịch */}
                <div className="overflow-x-auto rounded-card border border-border bg-surface">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-bg font-semibold text-muted uppercase">
                      <tr>
                        <th className="p-3.5">Chiến dịch</th>
                        <th className="p-3.5">Mã Voucher</th>
                        <th className="p-3.5">Ngân sách cam kết</th>
                        <th className="p-3.5">Ngân sách đã dùng</th>
                        <th className="p-3.5">Tỷ lệ sử dụng</th>
                        <th className="p-3.5">Lượt dùng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(report.offers || []).map((o) => (
                        <tr key={o.id}>
                          <td className="p-3.5 font-bold text-ink">{o.title}</td>
                          <td className="p-3.5 font-mono font-semibold text-court-600">
                            {o.voucherCode}
                          </td>
                          <td className="p-3.5 text-ink">{formatVND(o.budget)}</td>
                          <td className="p-3.5 font-semibold text-court-600">
                            {formatVND(o.spent)}
                          </td>
                          <td className="p-3.5 text-ink">{o.utilizationRate}%</td>
                          <td className="p-3.5 text-ink">{o.usageCount} lượt</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
