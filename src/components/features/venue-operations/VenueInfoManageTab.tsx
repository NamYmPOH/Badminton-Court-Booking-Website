"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  MapPin,
  Phone,
  Clock,
  Sparkles,
  Layers,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Wind,
  Car,
  Wifi,
  Coffee,
  Droplets,
  Lock,
  ShoppingBag,
  Plus,
  Trash2,
  Tag,
  ShieldAlert,
  Info,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { AMENITIES, AMENITY_LABELS, type Amenity } from "@/lib/config/constants";
import { parseCoordinates } from "@/lib/coordinates";

interface CourtConfig {
  id?: string;
  name: string;
  surface: string | null;
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
  sortOrder: number;
}

interface PricingRuleConfig {
  id?: string;
  label: string | null;
  daysOfWeek: number[];
  startMin: number;
  endMin: number;
  walkInPrice: number;
  fixedPrice: number;
}

interface VenueManageData {
  id: string;
  slug: string;
  name: string;
  description: string;
  address: string;
  ward: string;
  district: string;
  province: string;
  phone: string;
  lat: number;
  lng: number;
  openMin: number;
  closeMin: number;
  cancelBeforeHours: number;
  slotMinutes: number;
  minBookingMin: number;
  maxBookingMin: number;
  advanceDays: number;
  priceFrom: number;
  amenities: Amenity[];
  images: string[];
  status: string;
  courts: CourtConfig[];
  pricingRules: PricingRuleConfig[];
}

interface VenueInfoManageTabProps {
  venueId: string;
  venueName: string;
  onUpdated?: () => void;
}

const AMENITY_ICONS: Record<Amenity, LucideIcon> = {
  AIRCON: Wind,
  PARKING: Car,
  WIFI: Wifi,
  CANTEEN: Coffee,
  SHOWER: Droplets,
  RACKET_RENTAL: Layers,
  SHUTTLE_SALE: ShoppingBag,
  LOCKER: Lock,
};

const DAY_LABELS = [
  { value: 1, label: "T2" },
  { value: 2, label: "T3" },
  { value: 3, label: "T4" },
  { value: 4, label: "T5" },
  { value: 5, label: "T6" },
  { value: 6, label: "T7" },
  { value: 7, label: "CN" },
];

function minToTimeStr(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function timeStrToMin(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export default function VenueInfoManageTab({
  venueId,
  venueName,
  onUpdated,
}: VenueInfoManageTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<VenueManageData | null>(null);

  // Form states: Thông tin cơ sở
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [ward, setWard] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState("Hà Nội");
  const [phone, setPhone] = useState("");
  const [coordinatesInput, setCoordinatesInput] = useState("");
  const [lat, setLat] = useState<number>(21.0285);
  const [lng, setLng] = useState<number>(105.8542);
  const [openTimeStr, setOpenTimeStr] = useState("05:00");
  const [closeTimeStr, setCloseTimeStr] = useState("22:00");

  // Form states: Chính sách đặt sân
  const [cancelBeforeHours, setCancelBeforeHours] = useState(4);
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [minBookingMin, setMinBookingMin] = useState(60);
  const [maxBookingMin, setMaxBookingMin] = useState(240);
  const [advanceDays, setAdvanceDays] = useState(30);

  // Tiện ích & Sân con & Bảng giá
  const [selectedAmenities, setSelectedAmenities] = useState<Amenity[]>([]);
  const [courts, setCourts] = useState<CourtConfig[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRuleConfig[]>([]);

  const loadVenueData = useCallback(async () => {
    if (!venueId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/venues/${venueId}/manage`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Không tải được thông tin cơ sở.");
      }
      const v: VenueManageData = json.data;
      setData(v);
      setName(v.name || "");
      setDescription(v.description || "");
      setAddress(v.address || "");
      setWard(v.ward || "");
      setDistrict(v.district || "");
      setProvince(v.province || "Hà Nội");
      setPhone(v.phone || "");
      setLat(v.lat || 21.0285);
      setLng(v.lng || 105.8542);
      setCoordinatesInput(`${v.lat || 21.0285}, ${v.lng || 105.8542}`);
      setOpenTimeStr(minToTimeStr(v.openMin));
      setCloseTimeStr(minToTimeStr(v.closeMin));
      setCancelBeforeHours(v.cancelBeforeHours ?? 4);
      setSlotMinutes(v.slotMinutes ?? 30);
      setMinBookingMin(v.minBookingMin ?? 60);
      setMaxBookingMin(v.maxBookingMin ?? 240);
      setAdvanceDays(v.advanceDays ?? 30);
      setSelectedAmenities(v.amenities || []);
      setCourts(v.courts || []);
      setPricingRules(v.pricingRules || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    void loadVenueData();
  }, [loadVenueData]);

  // Xử lý khi thay đổi ô dán tọa độ
  const handleCoordinatesChange = (val: string) => {
    setCoordinatesInput(val);
    const parsed = parseCoordinates(val);
    if (parsed) {
      setLat(parsed.lat);
      setLng(parsed.lng);
    }
  };

  const handleToggleAmenity = (amenity: Amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  // Quản lý sân con
  const handleCourtChange = (index: number, field: keyof CourtConfig, value: unknown) => {
    setCourts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddCourt = () => {
    const nextNum = courts.length + 1;
    setCourts((prev) => [
      ...prev,
      {
        name: `Sân ${nextNum}`,
        surface: "Thảm PVC tiêu chuẩn BWF",
        status: "ACTIVE",
        sortOrder: nextNum,
      },
    ]);
  };

  const handleRemoveCourt = (index: number) => {
    setCourts((prev) => prev.filter((_, i) => i !== index));
  };

  // Quản lý bảng giá
  const handleAddPricingRule = () => {
    setPricingRules((prev) => [
      ...prev,
      {
        label: "Khung giờ tiêu chuẩn",
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        startMin: 300,
        endMin: 1320,
        walkInPrice: 100000,
        fixedPrice: 90000,
      },
    ]);
  };

  const handleRemovePricingRule = (index: number) => {
    setPricingRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePricingRuleChange = (index: number, field: keyof PricingRuleConfig, value: unknown) => {
    setPricingRules((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleToggleDayOfWeek = (ruleIndex: number, day: number) => {
    setPricingRules((prev) => {
      const updated = [...prev];
      const rule = { ...updated[ruleIndex] };
      const currentDays = rule.daysOfWeek || [];
      if (currentDays.includes(day)) {
        if (currentDays.length > 1) {
          rule.daysOfWeek = currentDays.filter((d) => d !== day);
        } else {
          toast.warning("Mỗi khung giá phải áp dụng cho ít nhất 1 ngày.");
        }
      } else {
        rule.daysOfWeek = [...currentDays, day].sort((a, b) => a - b);
      }
      updated[ruleIndex] = rule;
      return updated;
    });
  };

  const handleReset = () => {
    if (!data) return;
    setName(data.name || "");
    setDescription(data.description || "");
    setAddress(data.address || "");
    setWard(data.ward || "");
    setDistrict(data.district || "");
    setProvince(data.province || "Hà Nội");
    setPhone(data.phone || "");
    setLat(data.lat || 21.0285);
    setLng(data.lng || 105.8542);
    setCoordinatesInput(`${data.lat || 21.0285}, ${data.lng || 105.8542}`);
    setOpenTimeStr(minToTimeStr(data.openMin));
    setCloseTimeStr(minToTimeStr(data.closeMin));
    setCancelBeforeHours(data.cancelBeforeHours ?? 4);
    setSlotMinutes(data.slotMinutes ?? 30);
    setMinBookingMin(data.minBookingMin ?? 60);
    setMaxBookingMin(data.maxBookingMin ?? 240);
    setAdvanceDays(data.advanceDays ?? 30);
    setSelectedAmenities(data.amenities || []);
    setCourts(data.courts || []);
    setPricingRules(data.pricingRules || []);
    toast.info("Đã khôi phục dữ liệu ban đầu.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const openMin = timeStrToMin(openTimeStr);
    const closeMin = timeStrToMin(closeTimeStr);

    if (openMin >= closeMin) {
      setError("Giờ mở cửa phải trước giờ đóng cửa.");
      setSaving(false);
      return;
    }

    // Kiểm tra tọa độ
    const parsedCoords = parseCoordinates(coordinatesInput);
    if (!parsedCoords) {
      setError("Tọa độ không hợp lệ. Vui lòng nhập định dạng 'Vĩ độ, Kinh độ' (VD: 21.0285, 105.8542).");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        address: address.trim(),
        ward: ward.trim() || null,
        district: district.trim(),
        province: province.trim(),
        phone: phone.trim(),
        lat: parsedCoords.lat,
        lng: parsedCoords.lng,
        openMin,
        closeMin,
        cancelBeforeHours: Number(cancelBeforeHours),
        slotMinutes: Number(slotMinutes),
        minBookingMin: Number(minBookingMin),
        maxBookingMin: Number(maxBookingMin),
        advanceDays: Number(advanceDays),
        amenities: selectedAmenities,
        courts: courts.map((c, i) => ({
          ...(c.id ? { id: c.id } : {}),
          name: c.name.trim(),
          surface: c.surface ? c.surface.trim() : null,
          status: c.status,
          sortOrder: i + 1,
        })),
        pricingRules: pricingRules.map((r) => ({
          ...(r.id ? { id: r.id } : {}),
          label: r.label ? r.label.trim() : null,
          daysOfWeek: r.daysOfWeek,
          startMin: r.startMin,
          endMin: r.endMin,
          walkInPrice: Number(r.walkInPrice),
          fixedPrice: Number(r.fixedPrice),
        })),
      };

      const res = await fetch(`/api/venues/${venueId}/manage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Không lưu được thông tin cơ sở.");
      }

      toast.success("Đã cập nhật toàn bộ thông tin cơ sở, sân con và bảng giá thành công!");
      void loadVenueData();
      if (onUpdated) onUpdated();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi khi cập nhật cơ sở.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-muted flex flex-col items-center justify-center gap-2">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-court-600 border-t-transparent" />
        <p>Đang tải thông tin cấu hình quản trị cơ sở...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-card border border-rose-200 bg-rose-50/60 p-6 text-center text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
        <AlertCircle size={20} className="mx-auto mb-2 text-rose-600" />
        <p className="font-semibold">{error}</p>
        <button
          type="button"
          onClick={() => void loadVenueData()}
          className="mt-3 rounded-control bg-rose-600 px-3 py-1.5 text-white font-medium hover:bg-rose-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-control border border-rose-300 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Lưu không thành công:</span> {error}
          </div>
        </div>
      )}

      {/* 1. Thông tin chung & Liên hệ */}
      <section className="rounded-card border border-border bg-surface p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-border/80 pb-3">
          <Building2 size={18} className="text-court-600" />
          <div>
            <h3 className="text-sm font-bold text-ink">Thông tin giới thiệu & Liên hệ cơ sở</h3>
            <p className="text-[11px] text-muted">
              Hiển thị trên thẻ cơ sở, bản đồ và trang chi tiết dành cho khách hàng
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-ink mb-1">
              Tên cơ sở sân <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-court-500 focus:ring-1 focus:ring-court-500"
              placeholder="VD: Sân Cầu Lông SmashBook Cầu Giấy"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-ink mb-1">
              Mô tả chi tiết cơ sở
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-court-500 focus:ring-1 focus:ring-court-500"
              placeholder="Giới thiệu về hệ thống ánh sáng, không gian, bảo dưỡng, dịch vụ kèm theo..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Số điện thoại hotline <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-court-500"
              placeholder="VD: 0912345678"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Tỉnh / Thành phố <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-court-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Quận / Huyện <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-court-500"
              placeholder="VD: Cầu Giấy"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Phường / Xã
            </label>
            <input
              type="text"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-court-500"
              placeholder="VD: Dịch Vọng Hậu"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-ink mb-1">
              Địa chỉ số nhà, ngõ đường <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-court-500"
              placeholder="VD: Số 18 phố Duy Tân"
            />
          </div>

          {/* Ô dán tọa độ trực tiếp từ Google Maps */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-ink">
                Tọa độ Google Maps (Vĩ độ, Kinh độ) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-muted">
                Dán trực tiếp tọa độ sao chép từ Google Maps
              </span>
            </div>
            <div className="relative">
              <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-court-600" />
              <input
                type="text"
                required
                value={coordinatesInput}
                onChange={(e) => handleCoordinatesChange(e.target.value)}
                placeholder="VD: 21.0285, 105.8542"
                className="w-full rounded-control border border-border bg-surface pl-9 pr-3 py-2 text-xs text-ink font-mono outline-none focus:border-court-500"
              />
            </div>
            {parseCoordinates(coordinatesInput) ? (
              <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} />
                Tọa độ hợp lệ: Vĩ độ {lat.toFixed(5)}, Kinh độ {lng.toFixed(5)}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-rose-500">
                Định dạng hợp lệ: &apos;21.0285, 105.8542&apos;
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 2. Giờ hoạt động & Chính sách đặt/hủy sân */}
      <section className="rounded-card border border-border bg-surface p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-border/80 pb-3">
          <Clock size={18} className="text-court-600" />
          <div>
            <h3 className="text-sm font-bold text-ink">Giờ mở cửa & Chính sách đặt / hủy sân</h3>
            <p className="text-[11px] text-muted">
              Kiểm tra xung đột tự động với các đơn đặt sân sắp tới trước khi áp dụng
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Giờ mở cửa hàng ngày <span className="text-rose-500">*</span>
            </label>
            <input
              type="time"
              required
              value={openTimeStr}
              onChange={(e) => setOpenTimeStr(e.target.value)}
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-court-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Giờ đóng cửa hàng ngày <span className="text-rose-500">*</span>
            </label>
            <input
              type="time"
              required
              value={closeTimeStr}
              onChange={(e) => setCloseTimeStr(e.target.value)}
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-court-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Thời hạn hủy trước (giờ)
            </label>
            <input
              type="number"
              min={0}
              max={168}
              value={cancelBeforeHours}
              onChange={(e) => setCancelBeforeHours(Number(e.target.value))}
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-court-500"
            />
            <p className="mt-0.5 text-[10px] text-muted">Cho phép khách hủy đơn trước giờ chơi</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Bước nhảy ô đặt (phút)
            </label>
            <select
              value={slotMinutes}
              onChange={(e) => setSlotMinutes(Number(e.target.value))}
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-court-500"
            >
              <option value={30}>30 phút (chuẩn SmashBook)</option>
              <option value={60}>60 phút (1 giờ)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Đặt tối thiểu (phút)
            </label>
            <input
              type="number"
              min={30}
              step={30}
              value={minBookingMin}
              onChange={(e) => setMinBookingMin(Number(e.target.value))}
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-court-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Đặt tối đa (phút)
            </label>
            <input
              type="number"
              min={60}
              step={30}
              value={maxBookingMin}
              onChange={(e) => setMaxBookingMin(Number(e.target.value))}
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-court-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Số ngày mở trước
            </label>
            <input
              type="number"
              min={1}
              max={90}
              value={advanceDays}
              onChange={(e) => setAdvanceDays(Number(e.target.value))}
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-court-500"
            />
          </div>
        </div>
      </section>

      {/* 3. Tiện ích phục vụ tại cơ sở */}
      <section className="rounded-card border border-border bg-surface p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-ink">Tiện ích phục vụ tại cơ sở</h3>
              <p className="text-[11px] text-muted">
                Đồng bộ tự động lên thẻ sân, trang chi tiết và bộ lọc tìm kiếm
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-court-700 bg-court-50 dark:bg-court-950 px-2 py-0.5 rounded">
            Đã chọn: {selectedAmenities.length} tiện ích
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {AMENITIES.map((amenity) => {
            const isChecked = selectedAmenities.includes(amenity);
            const Icon = AMENITY_ICONS[amenity] || Sparkles;
            return (
              <label
                key={amenity}
                className={`flex items-center gap-2.5 rounded-control border p-3 cursor-pointer transition select-none ${
                  isChecked
                    ? "border-court-600 bg-court-50 text-court-900 font-bold dark:border-court-500 dark:bg-court-950/60 dark:text-court-200 shadow-xs"
                    : "border-border bg-surface text-muted hover:border-court-300 hover:text-ink"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleAmenity(amenity)}
                  className="rounded text-court-600 focus:ring-court-500 h-4 w-4"
                />
                <Icon size={16} className={isChecked ? "text-court-600" : "text-muted"} />
                <span className="text-xs">{AMENITY_LABELS[amenity]}</span>
              </label>
            );
          })}
        </div>
      </section>

      {/* 4. Quản lý danh sách sân con & Mặt sân */}
      <section className="rounded-card border border-border bg-surface p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-ink">Danh sách sân con & Loại thảm thi đấu</h3>
              <p className="text-[11px] text-muted">
                Thêm, sửa sân, cấu hình tên hiển thị và loại mặt sân. Sân có lịch sử đặt sẽ được lưu bảo toàn.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddCourt}
            className="inline-flex items-center gap-1.5 rounded-control bg-court-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-court-700 transition"
          >
            <Plus size={14} />
            <span>Thêm sân mới</span>
          </button>
        </div>

        {courts.length === 0 ? (
          <p className="text-xs text-muted py-4 text-center">Chưa có sân con nào.</p>
        ) : (
          <div className="space-y-3">
            {courts.map((court, idx) => (
              <div
                key={court.id || `new-${idx}`}
                className="flex flex-wrap items-center gap-3 rounded-control border border-border bg-surface/60 p-3"
              >
                <div className="w-8 text-xs font-bold text-muted">#{idx + 1}</div>

                <div className="flex-1 min-w-[140px]">
                  <label className="block text-[10px] font-semibold text-muted mb-0.5">Tên sân</label>
                  <input
                    type="text"
                    required
                    value={court.name}
                    onChange={(e) => handleCourtChange(idx, "name", e.target.value)}
                    className="w-full rounded-control border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink outline-none focus:border-court-500"
                  />
                </div>

                <div className="flex-1 min-w-[180px]">
                  <label className="block text-[10px] font-semibold text-muted mb-0.5">Loại thảm / Mặt sân</label>
                  <input
                    type="text"
                    value={court.surface || ""}
                    onChange={(e) => handleCourtChange(idx, "surface", e.target.value)}
                    placeholder="VD: Thảm PVC Enlio tiêu chuẩn BWF"
                    className="w-full rounded-control border border-border bg-surface px-2.5 py-1.5 text-xs text-ink outline-none focus:border-court-500"
                  />
                </div>

                <div className="w-[130px]">
                  <label className="block text-[10px] font-semibold text-muted mb-0.5">Trạng thái</label>
                  <select
                    value={court.status}
                    onChange={(e) => handleCourtChange(idx, "status", e.target.value)}
                    className="w-full rounded-control border border-border bg-surface px-2 py-1.5 text-xs text-ink outline-none focus:border-court-500"
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="MAINTENANCE">Bảo trì</option>
                    <option value="INACTIVE">Tạm ngưng</option>
                  </select>
                </div>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => handleRemoveCourt(idx)}
                    className="text-muted hover:text-rose-600 transition p-1"
                    title="Xóa sân con này"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Bảng giá theo khung giờ & ngày trong tuần (Pricing Rules) */}
      <section className="rounded-card border border-border bg-surface p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-ink">Bảng giá theo khung giờ & Ngày trong tuần</h3>
              <p className="text-[11px] text-muted">
                Giá vãng lai và giá cố định (VND/giờ). Đổi giá không ảnh hưởng đến đơn đặt đã chốt.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddPricingRule}
            className="inline-flex items-center gap-1.5 rounded-control bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
          >
            <Plus size={14} />
            <span>Thêm khung giá</span>
          </button>
        </div>

        {pricingRules.length === 0 ? (
          <p className="text-xs text-muted py-4 text-center">Chưa có khung giá nào.</p>
        ) : (
          <div className="space-y-4">
            {pricingRules.map((rule, idx) => (
              <div
                key={rule.id || `rule-${idx}`}
                className="rounded-control border border-border bg-surface/60 p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs font-bold text-muted">#{idx + 1}</span>
                    <input
                      type="text"
                      value={rule.label || ""}
                      onChange={(e) => handlePricingRuleChange(idx, "label", e.target.value)}
                      placeholder="Tên khung giá (VD: Giờ vàng, Buổi sáng...)"
                      className="rounded-control border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-ink outline-none focus:border-court-500 flex-1 max-w-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemovePricingRule(idx)}
                    className="text-muted hover:text-rose-600 transition p-1"
                    title="Xóa khung giá này"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Ngày áp dụng */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-muted mr-1">Áp dụng ngày:</span>
                  {DAY_LABELS.map((day) => {
                    const isSelected = rule.daysOfWeek?.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleToggleDayOfWeek(idx, day.value)}
                        className={`h-7 w-8 rounded text-[11px] font-bold transition ${
                          isSelected
                            ? "bg-court-600 text-white"
                            : "border border-border bg-surface text-muted hover:border-court-400"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>

                {/* Khung giờ & Giá */}
                <div className="grid gap-3 sm:grid-cols-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-muted mb-0.5">Từ giờ</label>
                    <input
                      type="time"
                      value={minToTimeStr(rule.startMin)}
                      onChange={(e) =>
                        handlePricingRuleChange(idx, "startMin", timeStrToMin(e.target.value))
                      }
                      className="w-full rounded-control border border-border bg-surface px-2.5 py-1.5 text-xs text-ink outline-none focus:border-court-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-muted mb-0.5">Đến giờ</label>
                    <input
                      type="time"
                      value={minToTimeStr(rule.endMin)}
                      onChange={(e) =>
                        handlePricingRuleChange(idx, "endMin", timeStrToMin(e.target.value))
                      }
                      className="w-full rounded-control border border-border bg-surface px-2.5 py-1.5 text-xs text-ink outline-none focus:border-court-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-muted mb-0.5">
                      Giá vãng lai (đ/giờ)
                    </label>
                    <input
                      type="number"
                      step={5000}
                      min={0}
                      value={rule.walkInPrice}
                      onChange={(e) =>
                        handlePricingRuleChange(idx, "walkInPrice", Number(e.target.value))
                      }
                      className="w-full rounded-control border border-border bg-surface px-2.5 py-1.5 text-xs font-bold text-court-600 outline-none focus:border-court-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-muted mb-0.5">
                      Giá cố định (đ/giờ)
                    </label>
                    <input
                      type="number"
                      step={5000}
                      min={0}
                      value={rule.fixedPrice}
                      onChange={(e) =>
                        handlePricingRuleChange(idx, "fixedPrice", Number(e.target.value))
                      }
                      className="w-full rounded-control border border-border bg-surface px-2.5 py-1.5 text-xs font-bold text-ink outline-none focus:border-court-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Hành động Lưu / Khôi phục */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={handleReset}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-control border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-muted hover:bg-court-50 hover:text-ink transition"
        >
          <RotateCcw size={14} />
          <span>Khôi phục</span>
        </button>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-control bg-court-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-court-700 active:scale-95 disabled:opacity-50"
        >
          <Save size={15} />
          <span>{saving ? "Đang kiểm tra & lưu cấu hình..." : "Lưu thay đổi toàn bộ"}</span>
        </button>
      </div>
    </form>
  );
}
