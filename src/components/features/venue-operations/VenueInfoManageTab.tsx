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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { AMENITIES, AMENITY_LABELS, type Amenity } from "@/lib/config/constants";
import { formatHour } from "@/lib/booking";

interface CourtConfig {
  id: string;
  name: string;
  surface: string | null;
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
  sortOrder: number;
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
  amenities: Amenity[];
  images: string[];
  status: string;
  courts: CourtConfig[];
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

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [ward, setWard] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState("Hà Nội");
  const [phone, setPhone] = useState("");
  const [lat, setLat] = useState<number>(21.0285);
  const [lng, setLng] = useState<number>(105.8542);
  const [openTimeStr, setOpenTimeStr] = useState("05:00");
  const [closeTimeStr, setCloseTimeStr] = useState("22:00");
  const [selectedAmenities, setSelectedAmenities] = useState<Amenity[]>([]);
  const [courts, setCourts] = useState<CourtConfig[]>([]);

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
      setOpenTimeStr(minToTimeStr(v.openMin));
      setCloseTimeStr(minToTimeStr(v.closeMin));
      setSelectedAmenities(v.amenities || []);
      setCourts(v.courts || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    void loadVenueData();
  }, [loadVenueData]);

  const handleToggleAmenity = (amenity: Amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleCourtChange = (index: number, field: "name" | "surface" | "status", value: string) => {
    setCourts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
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
    setOpenTimeStr(minToTimeStr(data.openMin));
    setCloseTimeStr(minToTimeStr(data.closeMin));
    setSelectedAmenities(data.amenities || []);
    setCourts(data.courts || []);
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

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        address: address.trim(),
        ward: ward.trim() || null,
        district: district.trim(),
        province: province.trim(),
        phone: phone.trim(),
        lat: Number(lat),
        lng: Number(lng),
        openMin,
        closeMin,
        amenities: selectedAmenities,
        courts: courts.map((c) => ({
          id: c.id,
          name: c.name.trim(),
          surface: c.surface ? c.surface.trim() : null,
          status: c.status,
        })),
      };

      const res = await fetch(`/api/venues/${venueId}/manage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Không lưu được thông tin.");
      }

      toast.success("Đã cập nhật thông tin cơ sở và tiện ích thành công!");
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
        <p>Đang tải thông tin cấu hình cơ sở...</p>
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
        <div className="rounded-control border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Thông tin chung cơ sở */}
      <section className="rounded-card border border-border bg-surface p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-border/80 pb-3">
          <Building2 size={18} className="text-court-600" />
          <h3 className="text-sm font-bold text-ink">Thông tin giới thiệu & liên hệ</h3>
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
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-court-500 focus:ring-1 focus:ring-court-500"
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

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Tọa độ Latitude (Vĩ độ) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              value={lat}
              onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-court-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Tọa độ Longitude (Kinh độ) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              value={lng}
              onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-court-500"
            />
          </div>

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
        </div>
      </section>

      {/* 2. Tiện ích chung cơ sở (Venue.amenities) */}
      <section className="rounded-card border border-border bg-surface p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-ink">Tiện ích phục vụ tại cơ sở</h3>
              <p className="text-[11px] text-muted">
                Đồng bộ tự động lên thẻ sân (VenueCard), trang chi tiết và bộ lọc tìm kiếm.
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

      {/* 3. Danh sách sân con & cấu hình mặt sân (Court.surface) */}
      <section className="rounded-card border border-border bg-surface p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-border/80 pb-3">
          <Layers size={18} className="text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-ink">Danh sách sân con & loại thảm thi đấu</h3>
            <p className="text-[11px] text-muted">
              Cấu hình tên hiển thị và loại mặt sân riêng cho từng sân con.
            </p>
          </div>
        </div>

        {courts.length === 0 ? (
          <p className="text-xs text-muted py-4 text-center">Chưa có sân con nào.</p>
        ) : (
          <div className="space-y-3">
            {courts.map((court, idx) => (
              <div
                key={court.id}
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
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Hành động Lưu / Khôi phục */}
      <div className="flex items-center justify-end gap-3 pt-2">
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
          className="inline-flex items-center gap-2 rounded-control bg-racket-500 px-6 py-2.5 text-xs font-bold text-court-950 shadow-sm transition hover:bg-racket-600 active:scale-95 disabled:opacity-50"
        >
          <Save size={15} />
          <span>{saving ? "Đang lưu cấu hình..." : "Lưu thay đổi"}</span>
        </button>
      </div>
    </form>
  );
}
