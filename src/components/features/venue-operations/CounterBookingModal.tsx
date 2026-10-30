"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Calendar, Clock, DollarSign, User, Phone, Mail, FileText, CheckCircle2 } from "lucide-react";
import { formatVND } from "@/lib/utils";
import { formatHour } from "@/lib/booking";

interface CourtOption {
  id: string;
  name: string;
  status: string;
}

interface CounterBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueId: string;
  venueName: string;
  onSuccess: () => void;
  initialCourtId?: string;
  initialDate?: string;
  initialStartMin?: number;
  initialEndMin?: number;
}

export default function CounterBookingModal({
  isOpen,
  onClose,
  venueId,
  venueName,
  onSuccess,
  initialCourtId,
  initialDate,
  initialStartMin,
  initialEndMin,
}: CounterBookingModalProps) {
  const [courts, setCourts] = useState<CourtOption[]>([]);
  const [loadingCourts, setLoadingCourts] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [courtId, setCourtId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [startHour, setStartHour] = useState("08:00");
  const [endHour, setEndHour] = useState("09:00");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER">("CASH");
  const [note, setNote] = useState("");
  const [requestId, setRequestId] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && venueId) {
      setRequestId(`counter_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
      setError("");
      setLoadingCourts(true);
      fetch(`/api/venue-courts?venueId=${venueId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.courts) {
            const activeCourts = data.courts.filter((c: CourtOption) => c.status === "ACTIVE");
            setCourts(activeCourts);
            if (activeCourts.length > 0) {
              setCourtId((prev) => prev || activeCourts[0].id);
            }
          }
        })
        .catch((e) => setError("Không tải được danh sách sân: " + e.message))
        .finally(() => setLoadingCourts(false));
    }
  }, [isOpen, venueId]);

  function timeToMin(timeStr: string): number {
    const [h, m] = timeStr.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    const startMin = timeToMin(startHour);
    const endMin = timeToMin(endHour);

    if (startMin >= endMin) {
      setError("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.");
      return;
    }
    if (!courtId) {
      setError("Vui lòng chọn sân con.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/venue-operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "COUNTER_BOOKING",
          venueId,
          courtId,
          date,
          startMin,
          endMin,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || null,
          note: note.trim() || null,
          paymentMethod,
          requestId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Tạo đơn thất bại.");
      }

      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra khi tạo đơn.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start justify-between border-b pb-4 dark:border-zinc-800">
            <div>
              <Dialog.Title className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Nhân viên tạo đơn tại quầy</span>
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-zinc-500">
                Cơ sở: <strong className="text-court-600 font-semibold">{venueName}</strong> · Đơn được tạo cho khách vãng lai, nhân viên không bị gán làm khách hàng.
              </Dialog.Description>
            </div>
            <Dialog.Close
              disabled={saving}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
            >
              <X size={20} />
            </Dialog.Close>
          </div>

          {error && (
            <div className="my-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Thông tin khách hàng */}
            <div className="rounded-xl border border-zinc-200 p-4 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-800/20 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <User size={14} /> Thông tin khách hàng
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Họ và tên khách *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Nguyễn Văn Khách"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Số điện thoại liên hệ *
                  </label>
                  <input
                    required
                    type="tel"
                    placeholder="09xxxxxxxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Email khách (không bắt buộc)
                  </label>
                  <input
                    type="email"
                    placeholder="khachhang@gmail.com (tùy chọn)"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
              </div>
            </div>

            {/* Chi tiết lịch đặt */}
            <div className="rounded-xl border border-zinc-200 p-4 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-800/20 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Calendar size={14} /> Sân & Khung giờ
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Chọn sân con *
                  </label>
                  <select
                    required
                    disabled={loadingCourts || courts.length === 0}
                    value={courtId}
                    onChange={(e) => setCourtId(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    {courts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Ngày sử dụng *
                  </label>
                  <input
                    required
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Giờ bắt đầu *
                  </label>
                  <input
                    required
                    type="time"
                    step="1800"
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Giờ kết thúc *
                  </label>
                  <input
                    required
                    type="time"
                    step="1800"
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
              </div>
            </div>

            {/* Thanh toán & Ghi chú */}
            <div className="rounded-xl border border-zinc-200 p-4 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-800/20 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <DollarSign size={14} /> Phương thức thanh toán
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${
                  paymentMethod === "CASH" ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20" : "border-zinc-200 dark:border-zinc-700"
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH"
                    checked={paymentMethod === "CASH"}
                    onChange={() => setPaymentMethod("CASH")}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <div className="text-xs font-bold">Tiền mặt tại sân</div>
                    <div className="text-[11px] text-zinc-500">Khách trả tiền mặt sau buổi chơi</div>
                  </div>
                </label>

                <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${
                  paymentMethod === "BANK_TRANSFER" ? "border-court-500 bg-court-50/50 dark:bg-court-950/20" : "border-zinc-200 dark:border-zinc-700"
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="BANK_TRANSFER"
                    checked={paymentMethod === "BANK_TRANSFER"}
                    onChange={() => setPaymentMethod("BANK_TRANSFER")}
                    className="text-court-600 focus:ring-court-500"
                  />
                  <div>
                    <div className="text-xs font-bold">Chuyển khoản SePay</div>
                    <div className="text-[11px] text-zinc-500">Thanh toán qua quét mã QR</div>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Ghi chú đơn (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Khách quen, mượn vợt, nước suối..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
            </div>

            <p className="text-xs text-zinc-500 italic">
              * Giá tiền sẽ được máy chủ tính toán chính xác theo bảng giá thời gian thực của cơ sở. Đơn tại quầy thanh toán tiền mặt sẽ không bị tự động hết hạn giữ chỗ.
            </p>

            <div className="flex justify-end gap-2 border-t pt-4 dark:border-zinc-800">
              <button
                type="button"
                disabled={saving}
                onClick={onClose}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving || !customerName.trim() || !customerPhone.trim() || !courtId}
                className="rounded-lg bg-court-600 px-5 py-2 text-xs font-bold text-white hover:bg-court-700 disabled:opacity-50"
              >
                {saving ? "Đang xử lý…" : "Tạo đơn tại quầy"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
