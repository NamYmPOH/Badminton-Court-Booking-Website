"use client";

import { useState, useEffect } from "react";
import { X, CloudRain, CheckCircle2, AlertTriangle } from "lucide-react";

interface IncidentModalProps {
  isOpen: boolean;
  bookingCode: string;
  venueName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function IncidentModal({
  isOpen,
  bookingCode,
  venueName,
  onClose,
  onSuccess,
}: IncidentModalProps) {
  const [incidentType, setIncidentType] = useState<"HEAVY_RAIN" | "POWER_OUTAGE" | "COURT_MAINTENANCE" | "SYSTEM_ERROR" | "OTHER">("HEAVY_RAIN");
  const [requestType, setRequestType] = useState<"REFUND" | "RESCHEDULE">("RESCHEDULE");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIncidentType("HEAVY_RAIN");
      setRequestType("RESCHEDULE");
      setDescription("");
      setError("");
      setSuccess(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleReportIncident(e: React.FormEvent) {
    e.preventDefault();
    if (busy || description.trim().length < 5) return;

    setBusy(true);
    setError("");

    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(bookingCode)}/incident`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentType,
          requestType,
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Không thể gửi báo cáo sự cố.");
      }

      setSuccess(data.message || "Báo cáo sự cố đã được gửi tới quản lý sân.");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gửi báo cáo thất bại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="incident-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={!busy ? onClose : undefined}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-card border border-border bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 ease-out">
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-muted transition hover:bg-court-50 hover:text-ink"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5">
          <CloudRain className="text-amber-600" size={20} />
          <h3 id="incident-modal-title" className="text-base font-bold text-ink">
            Báo cáo sự cố bất khả kháng #{bookingCode}
          </h3>
        </div>
        <p className="mt-1 text-xs text-muted">
          Cơ sở: <strong>{venueName}</strong>
        </p>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {success ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl p-4 text-xs bg-amber-50 text-amber-900 border border-amber-200 flex items-start gap-2.5">
              <CheckCircle2 size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm mb-0.5">Đã tiếp nhận báo cáo</p>
                <p>{success}</p>
                <p className="mt-1.5 text-[11px] text-amber-800">
                  Quản lý cơ sở sẽ kiểm tra tình hình thực tế và quyết định phương án hỗ trợ theo chính sách cơ sở.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-control bg-court-600 px-5 py-2 text-xs font-semibold text-white hover:bg-court-700"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReportIncident} className="mt-4 space-y-3.5 text-xs">
            <div className="rounded bg-bg p-3 border border-border text-[11px] text-muted space-y-1">
              <div className="flex items-center gap-1 font-semibold text-ink">
                <AlertTriangle size={13} className="text-amber-600" />
                Nguyên tắc thẩm định sự cố:
              </div>
              <p>• Chủ sân / Quản trị viên phải <strong>xác nhận sự cố thực tế</strong> trước khi áp dụng ngoại lệ.</p>
              <p>• Khách không được tự ý chọn lý do sự cố để né tránh chính sách hủy thông thường.</p>
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1">Loại sự cố gặp phải *</label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value as unknown as typeof incidentType)}
                disabled={busy}
                className="w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-xs text-ink"
              >
                <option value="HEAVY_RAIN">🌧 Mưa lớn / Ngập lụt không thể đến sân</option>
                <option value="POWER_OUTAGE">⚡ Mất điện tại sân thi đấu</option>
                <option value="COURT_MAINTENANCE">🛠 Bảo trì sân đột xuất</option>
                <option value="SYSTEM_ERROR">💻 Lỗi hệ thống đặt sân</option>
                <option value="OTHER">❓ Lý do bất khả kháng khác</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1">Nguyện vọng giải quyết *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRequestType("RESCHEDULE")}
                  className={`rounded-lg border p-2 text-center font-medium transition ${
                    requestType === "RESCHEDULE"
                      ? "border-court-600 bg-court-50 text-court-700 dark:bg-court-950/60 dark:text-court-300 font-bold"
                      : "border-border text-muted hover:bg-bg"
                  }`}
                >
                  Đổi sang lịch khác
                </button>
                <button
                  type="button"
                  onClick={() => setRequestType("REFUND")}
                  className={`rounded-lg border p-2 text-center font-medium transition ${
                    requestType === "REFUND"
                      ? "border-court-600 bg-court-50 text-court-700 dark:bg-court-950/60 dark:text-court-300 font-bold"
                      : "border-border text-muted hover:bg-bg"
                  }`}
                >
                  Yêu cầu hoàn tiền
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1">
                Mô tả chi tiết sự cố * (ít nhất 5 ký tự)
              </label>
              <textarea
                required
                minLength={5}
                maxLength={1000}
                rows={3}
                placeholder="Mô tả cụ thể tình hình sự cố thực tế để ban quản lý sân xác minh..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={busy}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-ink"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                className="rounded-control border border-border px-4 py-2 text-xs font-semibold text-muted hover:bg-court-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={busy || description.trim().length < 5}
                className="rounded-control bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {busy ? "Đang gửi…" : "Gửi báo cáo sự cố"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

