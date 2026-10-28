"use client";

import { useState, useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus, Trash2, Edit2, Lock, Unlock, AlertCircle, ShieldCheck } from "lucide-react";
import { formatVND } from "@/lib/utils";
import { formatHour } from "@/lib/booking";

interface Court {
  id: string;
  name: string;
  sortOrder: number;
  surface: string | null;
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
}

interface PricingRule {
  id: string;
  label: string | null;
  daysOfWeek: number[];
  startMin: number;
  endMin: number;
  walkInPrice: number;
  fixedPrice: number;
}

interface CourtBlock {
  id: string;
  courtId: string;
  courtName: string;
  date: string;
  startMin: number;
  endMin: number;
  reason: string | null;
  createdAt: string;
}

interface VenueCourtsModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueId: string;
  venueName: string;
  onUpdated?: () => void;
}

export default function VenueCourtsModal({
  isOpen,
  onClose,
  venueId,
  venueName,
  onUpdated,
}: VenueCourtsModalProps) {
  const [tab, setTab] = useState<"courts" | "pricing" | "blocks">("courts");
  const [courts, setCourts] = useState<Court[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [courtBlocks, setCourtBlocks] = useState<CourtBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // Form states: Thêm sân con
  const [newCourtName, setNewCourtName] = useState("");
  const [newCourtSurface, setNewCourtSurface] = useState("Thảm PVC cao cấp");

  // Form states: Thêm quy tắc giá
  const [priceLabel, setPriceLabel] = useState("Giờ thường");
  const [priceDays, setPriceDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [priceStartHour, setPriceStartHour] = useState("05:00");
  const [priceEndHour, setPriceEndHour] = useState("17:00");
  const [walkInPrice, setWalkInPrice] = useState(80000);

  // Form states: Khóa khung giờ
  const [blockCourtId, setBlockCourtId] = useState("");
  const [blockDate, setBlockDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [blockStartHour, setBlockStartHour] = useState("12:00");
  const [blockEndHour, setBlockEndHour] = useState("13:00");
  const [blockReason, setBlockReason] = useState("Bảo trì sân / Vệ sinh định kỳ");

  function timeToMin(timeStr: string): number {
    const [h, m] = timeStr.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  const loadData = useCallback(async () => {
    if (!venueId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/venue-courts?venueId=${venueId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không tải được thông tin sân.");
      setCourts(data.courts || []);
      setPricingRules(data.pricingRules || []);
      setCourtBlocks(data.courtBlocks || []);
      if (data.courts?.length > 0 && !blockCourtId) {
        setBlockCourtId(data.courts[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [venueId, blockCourtId]);

  useEffect(() => {
    if (isOpen && venueId) {
      loadData();
      setError("");
      setMessage("");
    }
  }, [isOpen, venueId, loadData]);

  // Thêm sân con
  async function handleAddCourt(e: React.FormEvent) {
    e.preventDefault();
    if (!newCourtName.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/venue-courts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_COURT",
          venueId,
          name: newCourtName.trim(),
          surface: newCourtSurface.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể tạo sân con.");
      setMessage(`Đã tạo thành công ${data.court.name}`);
      setNewCourtName("");
      await loadData();
      onUpdated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
    } finally {
      setBusy(false);
    }
  }

  // Đổi trạng thái sân con
  async function handleUpdateCourtStatus(courtId: string, nextStatus: "ACTIVE" | "MAINTENANCE" | "INACTIVE") {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/venue-courts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_COURT",
          courtId,
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể cập nhật sân con.");
      setMessage(`Đã cập nhật trạng thái sân thành ${nextStatus}`);
      await loadData();
      onUpdated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
    } finally {
      setBusy(false);
    }
  }

  // Thêm quy tắc giá
  async function handleAddPricing(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const startMin = timeToMin(priceStartHour);
    const endMin = timeToMin(priceEndHour);
    if (startMin >= endMin) {
      setError("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/venue-courts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPSERT_PRICING",
          venueId,
          label: priceLabel.trim(),
          daysOfWeek: priceDays,
          startMin,
          endMin,
          walkInPrice,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể thêm bảng giá.");
      setMessage("Đã cập nhật bảng giá thành công (không làm thay đổi số tiền các đơn cũ).");
      await loadData();
      onUpdated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
    } finally {
      setBusy(false);
    }
  }

  // Xóa quy tắc giá
  async function handleDeletePricing(pricingRuleId: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/venue-courts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_PRICING",
          pricingRuleId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể xóa quy tắc giá.");
      setMessage("Đã xóa quy tắc giá.");
      await loadData();
      onUpdated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
    } finally {
      setBusy(false);
    }
  }

  // Khóa khung giờ
  async function handleLockSlot(e: React.FormEvent) {
    e.preventDefault();
    if (!blockCourtId || busy) return;
    const startMin = timeToMin(blockStartHour);
    const endMin = timeToMin(blockEndHour);
    if (startMin >= endMin) {
      setError("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/venue-courts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LOCK_SLOT",
          courtId: blockCourtId,
          date: blockDate,
          startMin,
          endMin,
          reason: blockReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể khóa khung giờ.");
      setMessage("Đã khóa khung giờ thành công.");
      await loadData();
      onUpdated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
    } finally {
      setBusy(false);
    }
  }

  // Mở khóa khung giờ
  async function handleUnlockSlot(courtBlockId: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/venue-courts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UNLOCK_SLOT",
          courtBlockId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể mở khóa khung giờ.");
      setMessage("Đã mở khóa khung giờ thành công.");
      await loadData();
      onUpdated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start justify-between border-b pb-4 dark:border-zinc-800">
            <div>
              <Dialog.Title className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <ShieldCheck size={20} className="text-court-600" />
                <span>Quản lý sân con, bảng giá & khóa khung giờ</span>
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-zinc-500">
                Cơ sở: <strong className="text-court-600 font-semibold">{venueName}</strong> (Chỉ dành cho Chủ cơ sở và Quản trị viên)
              </Dialog.Description>
            </div>
            <Dialog.Close
              disabled={busy}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
            >
              <X size={20} />
            </Dialog.Close>
          </div>

          {/* Tab navigation */}
          <div className="mt-4 flex border-b border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setTab("courts")}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                tab === "courts"
                  ? "border-court-600 text-court-600 dark:border-court-400 dark:text-court-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              Sân con ({courts.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("pricing")}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                tab === "pricing"
                  ? "border-court-600 text-court-600 dark:border-court-400 dark:text-court-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              Bảng giá ({pricingRules.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("blocks")}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                tab === "blocks"
                  ? "border-court-600 text-court-600 dark:border-court-400 dark:text-court-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              Khóa khung giờ ({courtBlocks.length})
            </button>
          </div>

          {error && (
            <div className="my-3 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}
          {message && (
            <div className="my-3 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
              {message}
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-500">Đang tải dữ liệu…</div>
          ) : (
            <div className="mt-4 space-y-4">
              {/* TAB 1: SÂN CON */}
              {tab === "courts" && (
                <div className="space-y-4">
                  {/* Form thêm sân con */}
                  <form onSubmit={handleAddCourt} className="flex flex-wrap gap-2 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                    <input
                      required
                      type="text"
                      placeholder="Tên sân (VD: Sân 4, Sân VIP)..."
                      value={newCourtName}
                      onChange={(e) => setNewCourtName(e.target.value)}
                      className="flex-1 min-w-[180px] rounded-lg border border-zinc-200 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                    />
                    <input
                      type="text"
                      placeholder="Mặt sân (VD: Thảm PVC)..."
                      value={newCourtSurface}
                      onChange={(e) => setNewCourtSurface(e.target.value)}
                      className="w-48 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                    />
                    <button
                      type="submit"
                      disabled={busy || !newCourtName.trim()}
                      className="inline-flex items-center gap-1 rounded-lg bg-court-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-court-700 disabled:opacity-50"
                    >
                      <Plus size={14} /> Thêm sân
                    </button>
                  </form>

                  {/* Danh sách sân con */}
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border rounded-xl overflow-hidden">
                    {courts.map((court) => (
                      <div key={court.id} className="flex items-center justify-between p-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 text-xs">
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">{court.name}</div>
                          <div className="text-zinc-500">Bề mặt: {court.surface || "Tiêu chuẩn"} · Thứ tự: {court.sortOrder}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            court.status === "ACTIVE"
                              ? "bg-emerald-500/15 text-emerald-600"
                              : court.status === "MAINTENANCE"
                              ? "bg-amber-500/15 text-amber-600"
                              : "bg-red-500/15 text-red-600"
                          }`}>
                            {court.status === "ACTIVE" ? "Hoạt động" : court.status === "MAINTENANCE" ? "Bảo trì" : "Ngừng hoạt động"}
                          </span>

                          <select
                            value={court.status}
                            disabled={busy}
                            onChange={(e) => handleUpdateCourtStatus(court.id, e.target.value as "ACTIVE" | "MAINTENANCE" | "INACTIVE")}
                            className="rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                          >
                            <option value="ACTIVE">Hoạt động</option>
                            <option value="MAINTENANCE">Bảo trì</option>
                            <option value="INACTIVE">Ngừng sân</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: BẢNG GIÁ */}
              {tab === "pricing" && (
                <div className="space-y-4">
                  {/* Form thêm quy tắc giá */}
                  <form onSubmit={handleAddPricing} className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Thêm quy tắc bảng giá mới</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Tên nhãn khung giờ</label>
                        <input
                          required
                          type="text"
                          value={priceLabel}
                          onChange={(e) => setPriceLabel(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Giờ bắt đầu</label>
                        <input
                          required
                          type="time"
                          value={priceStartHour}
                          onChange={(e) => setPriceStartHour(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Giờ kết thúc</label>
                        <input
                          required
                          type="time"
                          value={priceEndHour}
                          onChange={(e) => setPriceEndHour(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Giá thuê vãng lai (VND / giờ)</label>
                        <input
                          required
                          type="number"
                          step="1000"
                          min="1000"
                          value={walkInPrice}
                          onChange={(e) => setWalkInPrice(Number(e.target.value))}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Áp dụng các ngày</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {[
                            { day: 1, label: "T2" },
                            { day: 2, label: "T3" },
                            { day: 3, label: "T4" },
                            { day: 4, label: "T5" },
                            { day: 5, label: "T6" },
                            { day: 6, label: "T7" },
                            { day: 7, label: "CN" },
                          ].map(({ day, label }) => {
                            const selected = priceDays.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => {
                                  if (selected) {
                                    if (priceDays.length > 1) setPriceDays(priceDays.filter((d) => d !== day));
                                  } else {
                                    setPriceDays([...priceDays, day]);
                                  }
                                }}
                                className={`px-2 py-1 text-[11px] rounded font-bold ${
                                  selected
                                    ? "bg-court-600 text-white"
                                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={busy}
                        className="rounded-lg bg-court-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-court-700 disabled:opacity-50"
                      >
                        {busy ? "Đang lưu…" : "Thêm quy tắc giá"}
                      </button>
                    </div>
                  </form>

                  {/* Danh sách bảng giá */}
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border rounded-xl overflow-hidden">
                    {pricingRules.map((rule) => {
                      const dayLabels = rule.daysOfWeek
                        .map((d) => (d === 7 ? "CN" : `T${d + 1}`))
                        .join(", ");

                      return (
                        <div key={rule.id} className="flex items-center justify-between p-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 text-xs">
                          <div>
                            <div className="font-bold text-zinc-900 dark:text-zinc-100">
                              {rule.label || "Khung giá"} · <span className="text-court-600 font-semibold">{formatVND(rule.walkInPrice)}/giờ</span>
                            </div>
                            <div className="text-zinc-500">
                              Khung giờ: {formatHour(rule.startMin)} - {formatHour(rule.endMin)} · Ngày: {dayLabels}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleDeletePricing(rule.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded dark:hover:bg-red-950/30"
                            title="Xóa quy tắc giá"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: KHÓA KHUNG GIỜ */}
              {tab === "blocks" && (
                <div className="space-y-4">
                  {/* Form khóa khung giờ */}
                  <form onSubmit={handleLockSlot} className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Khóa khung giờ (Court Block)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Sân con *</label>
                        <select
                          required
                          value={blockCourtId}
                          onChange={(e) => setBlockCourtId(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                        >
                          {courts.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Ngày khóa *</label>
                        <input
                          required
                          type="date"
                          value={blockDate}
                          onChange={(e) => setBlockDate(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Từ giờ</label>
                        <input
                          required
                          type="time"
                          value={blockStartHour}
                          onChange={(e) => setBlockStartHour(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Đến giờ</label>
                        <input
                          required
                          type="time"
                          value={blockEndHour}
                          onChange={(e) => setBlockEndHour(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-zinc-500 mb-1">Lý do khóa sân</label>
                        <input
                          type="text"
                          placeholder="Bảo trì, lau sân, tổ chức giải đấu..."
                          value={blockReason}
                          onChange={(e) => setBlockReason(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={busy || !blockCourtId}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                      >
                        <Lock size={14} /> Khóa khung giờ này
                      </button>
                    </div>
                  </form>

                  {/* Danh sách các khung giờ bị khóa */}
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border rounded-xl overflow-hidden">
                    {courtBlocks.length === 0 ? (
                      <div className="p-4 text-center text-xs text-zinc-500">
                        Không có khung giờ nào đang bị khóa.
                      </div>
                    ) : (
                      courtBlocks.map((block) => (
                        <div key={block.id} className="flex items-center justify-between p-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 text-xs">
                          <div>
                            <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              <Lock size={12} className="text-amber-600" />
                              <span>{block.courtName} · {block.date}</span>
                            </div>
                            <div className="text-zinc-500">
                              Khung giờ: {formatHour(block.startMin)} - {formatHour(block.endMin)} · Lý do: {block.reason || "Khóa thủ công"}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleUnlockSlot(block.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                          >
                            <Unlock size={14} /> Mở khóa
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end border-t pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700"
            >
              Đóng
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
