"use client";

import { useEffect, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertCircle, ShieldAlert, CheckCircle2, Clock, Calculator } from "lucide-react";

type Data = {
  booking: {
    code: string;
    status: string;
    paymentStatus: string;
    customerName: string;
    customerPhone: string;
    cancelRequestedAt: string | null;
    cancelApprovedAt: string | null;
    cancelReason: string | null;
    cancelExpectedRate: number | null;
    cancelExpectedAmount: number | null;
    cancelNonRefundable: number | null;
    cancelCalculation: {
      hoursRemaining?: number;
      refundRate?: number;
      availableBefore?: number;
      expectedRefund?: number;
      nonRefundable?: number;
      summary?: string;
    } | null;
    refundAmountApproved: number | null;
    refundCompletedAt: string | null;
  };
  cancellationStage: "PENDING_APPROVAL" | "APPROVED_WAITING_REFUND" | "REFUNDED" | "CANCELLED_NO_REFUND";
  received: number;
  available: number;
  approved: number;
  completed: number;
  pendingDisbursement: number;
  refunds: {
    id: string;
    amount: number;
    completedAmount: number;
    status: string;
    reference: string | null;
    txnRef: string;
  }[];
};

const control = "w-full rounded-lg border border-border bg-surface p-2 text-xs text-ink";
const button = "rounded-lg border border-border px-3 py-2 font-semibold text-xs disabled:opacity-50 transition";
const money = (n = 0) => n.toLocaleString("vi-VN") + " đ";

const stageBadges: Record<Data["cancellationStage"], { label: string; className: string }> = {
  PENDING_APPROVAL: {
    label: "Chờ duyệt hủy",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  },
  APPROVED_WAITING_REFUND: {
    label: "Đã duyệt, chờ hoàn tiền",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
  },
  REFUNDED: {
    label: "Đã hoàn tiền",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
  CANCELLED_NO_REFUND: {
    label: "Đã hủy, không được hoàn tiền",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
  },
};

export default function CancellationManageModal({ id, onClose }: { id: string; onClose: () => void }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [isOverride, setIsOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/cancellations?id=${encodeURIComponent(id)}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    setData(json);
    // Mặc định số tiền theo mức chính sách đã xác định
    setAmount(json.booking.cancelExpectedAmount ?? json.available);
    setReason("Duyệt hủy đơn theo chính sách hoàn tiền");
  }, [id]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  async function submit(body: object) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/cancellations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không lưu được thao tác.");
    } finally {
      setBusy(false);
    }
  }

  const reviewDueTime = data?.booking.cancelRequestedAt
    ? new Date(new Date(data.booking.cancelRequestedAt).getTime() + 86400000)
    : null;
  const isOverdue = reviewDueTime ? Date.now() > reviewDueTime.getTime() : false;

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100%_-_2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-surface p-6 text-ink shadow-2xl">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <div>
              <Dialog.Title className="text-lg font-bold">
                Xử lý hủy & hoàn tiền #{data?.booking.code}
              </Dialog.Title>
              {data && (
                <span className={`inline-block mt-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${stageBadges[data.cancellationStage].className}`}>
                  {stageBadges[data.cancellationStage].label}
                </span>
              )}
            </div>
            <button
              disabled={busy}
              onClick={onClose}
              className="rounded-full p-1 text-muted hover:bg-court-50"
            >
              ✕
            </button>
          </div>

          <Dialog.Description className="my-2.5 text-xs text-muted leading-relaxed">
            Xem xét yêu cầu trong <strong>24 giờ</strong>. Hoàn tiền thủ công: liên hệ người đã trả tiền để xác minh ngân hàng, số tài khoản và chủ tài khoản. Chỉ ghi nhận đã chi sau khi người vận hành chuyển tiền thành công bên ngoài website.
          </Dialog.Description>

          {error && (
            <div className="my-2.5 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {!data ? (
            <div className="py-8 text-center text-xs text-muted">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-court-600 border-t-transparent mx-auto mb-2" />
              Đang tải thông tin đơn...
            </div>
          ) : (
            <fieldset disabled={busy} className="space-y-4 text-xs">
              {/* Thông tin khách hàng & Lý do hủy */}
              <div className="rounded-lg bg-bg p-3 border border-border space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted">Khách đặt:</span>
                  <span className="font-semibold text-ink">{data.booking.customerName} ({data.booking.customerPhone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Lý do hủy:</span>
                  <span className="font-medium text-ink text-right max-w-xs">{data.booking.cancelReason || "Chưa ghi nhận"}</span>
                </div>
                {reviewDueTime && !data.booking.cancelApprovedAt && (
                  <div className="flex items-center justify-between pt-1 border-t border-border/60">
                    <span className="text-muted flex items-center gap-1">
                      <Clock size={12} className={isOverdue ? "text-rose-600" : "text-amber-600"} />
                      Hạn xử lý (24h):
                    </span>
                    <span className={`font-semibold ${isOverdue ? "text-rose-600" : "text-amber-600"}`}>
                      {reviewDueTime.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
                      {isOverdue ? " (Đã quá hạn)" : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Chi tiết phép tính theo chính sách */}
              {data.booking.cancelCalculation && (
                <div className="rounded-lg bg-court-50/50 dark:bg-court-950/20 p-3 border border-court-200 dark:border-court-800 space-y-2 text-[11px]">
                  <div className="flex items-center gap-1 font-bold text-court-700 dark:text-court-300">
                    <Calculator size={13} />
                    Phép tính theo chính sách lúc gửi yêu cầu:
                  </div>
                  <p className="text-muted">{data.booking.cancelCalculation.summary}</p>
                  <div className="grid grid-cols-3 gap-2 pt-1 font-medium">
                    <div className="rounded bg-surface p-1.5 border border-border/60">
                      <span className="text-muted block text-[10px]">Tỷ lệ hoàn:</span>
                      <span className="font-bold text-sm text-ink">{data.booking.cancelExpectedRate}%</span>
                    </div>
                    <div className="rounded bg-surface p-1.5 border border-border/60">
                      <span className="text-muted block text-[10px]">Dự kiến hoàn:</span>
                      <span className="font-bold text-sm text-emerald-600">{money(data.booking.cancelExpectedAmount ?? 0)}</span>
                    </div>
                    <div className="rounded bg-surface p-1.5 border border-border/60">
                      <span className="text-muted block text-[10px]">Không hoàn:</span>
                      <span className="font-bold text-sm text-rose-600">{money(data.booking.cancelNonRefundable ?? 0)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Thông tin tiền thực thu & khả dụng */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded bg-bg p-2.5 border border-border">
                  <span className="text-muted block">Tiền thực thu hợp lệ:</span>
                  <span className="font-bold text-sm text-ink">{money(data.received)}</span>
                </div>
                <div className="rounded bg-bg p-2.5 border border-border">
                  <span className="text-muted block">Còn có thể duyệt hoàn:</span>
                  <span className="font-bold text-sm text-court-600">{money(data.available)}</span>
                </div>
              </div>

              {/* Form phê duyệt hủy đơn */}
              {!data.booking.cancelApprovedAt && (
                <form
                  className="space-y-3 rounded-lg border border-border bg-bg/50 p-3.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submit({
                      action: "approve",
                      amount,
                      reason,
                      override: isOverride,
                      overrideReason: isOverride ? overrideReason : undefined,
                    });
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink">Phê duyệt hủy lịch</span>
                    <label className="flex items-center gap-1.5 text-[11px] text-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOverride}
                        onChange={(e) => {
                          setIsOverride(e.target.checked);
                          if (!e.target.checked) {
                            setAmount(data.booking.cancelExpectedAmount ?? data.available);
                          }
                        }}
                      />
                      <span>Áp dụng ngoại lệ khác chính sách</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-muted mb-1">
                      Số tiền duyệt hoàn {isOverride ? "(Chế độ ngoại lệ - cần lý do)" : "(Theo tỷ lệ chính sách)"}
                    </label>
                    <input
                      className={control}
                      type="number"
                      required
                      min={0}
                      max={data.available}
                      disabled={!isOverride}
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                    />
                    {!isOverride && (
                      <span className="text-[10px] text-muted mt-0.5 block">
                        Số tiền được cố định đúng mức chính sách đã tính ({money(data.booking.cancelExpectedAmount ?? data.available)}).
                      </span>
                    )}
                  </div>

                  {isOverride && (
                    <div>
                      <label className="block text-amber-800 dark:text-amber-300 font-semibold mb-1">
                        Lý do áp dụng ngoại lệ * (Bắt buộc ghi nhật ký riêng)
                      </label>
                      <textarea
                        className={`${control} border-amber-300`}
                        required
                        minLength={5}
                        maxLength={500}
                        placeholder="Ghi rõ lý do đặc biệt để phê duyệt số tiền khác chính sách..."
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-muted mb-1">Ghi chú phê duyệt *</label>
                    <textarea
                      className={control}
                      required
                      minLength={5}
                      maxLength={500}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end">
                    <button className={`${button} bg-court-600 text-white hover:bg-court-700`}>
                      Xác nhận duyệt hủy
                    </button>
                  </div>
                </form>
              )}

              {/* Thông báo sau khi đã duyệt hủy */}
              {data.booking.cancelApprovedAt && (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-3 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
                  <div className="flex items-center gap-1 font-bold">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Đơn đã được phê duyệt hủy
                  </div>
                  <p>
                    Số tiền duyệt hoàn: <strong>{money(data.booking.refundAmountApproved ?? 0)}</strong>.
                    {data.pendingDisbursement > 0
                      ? ` Còn ${money(data.pendingDisbursement)} chưa chi thực tế qua ngân hàng.`
                      : " Toàn bộ số tiền duyệt đã được ghi nhận chi trả thành công."}
                  </p>
                </div>
              )}

              {/* Danh sách các khoản hoàn tiền thủ công */}
              {data.refunds.length > 0 && (
                <div className="space-y-3 pt-1">
                  <h4 className="font-bold text-ink">Chứng từ hoàn tiền thủ công</h4>
                  {data.refunds.map((r) => (
                    <form
                      key={r.id}
                      className="space-y-2.5 rounded-lg border border-border p-3 bg-bg"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = new FormData(e.currentTarget);
                        void submit({
                          action: "refund",
                          refundId: r.id,
                          amount: Number(form.get("amount")),
                          reference: String(form.get("reference")),
                          reason: String(form.get("reason")),
                        });
                      }}
                    >
                      <div className="flex justify-between items-center text-[11px]">
                        <span>Giao dịch thu: <strong>{r.txnRef}</strong></span>
                        <span className={`font-bold ${r.status === "COMPLETED" ? "text-emerald-600" : "text-amber-600"}`}>
                          Đã hoàn {money(r.completedAmount)} / {money(r.amount)}
                        </span>
                      </div>

                      {r.amount > r.completedAmount ? (
                        <>
                          <div className="rounded bg-amber-50 p-2 text-amber-900 border border-amber-200 text-[10px]">
                            Chuyển khoản thủ công ngoài website cho khách, sau đó nhập mã giao dịch ngân hàng vào bên dưới.
                          </div>
                          <div>
                            <label className="block text-muted mb-0.5 text-[11px]">Số tiền thực chuyển (VND) *</label>
                            <input
                              className={control}
                              name="amount"
                              type="number"
                              min={1}
                              max={r.amount - r.completedAmount}
                              defaultValue={r.amount - r.completedAmount}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-muted mb-0.5 text-[11px]">Mã giao dịch ngân hàng / Ủy nhiệm chi *</label>
                            <input
                              className={control}
                              name="reference"
                              minLength={5}
                              maxLength={160}
                              placeholder="Ví dụ: FT24110500129384"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-muted mb-0.5 text-[11px]">Ghi chú đối soát người nhận *</label>
                            <textarea
                              className={control}
                              name="reason"
                              minLength={5}
                              maxLength={500}
                              placeholder="Đã chuyển vào STK ... Vietcombank chủ TK ..."
                              required
                            />
                          </div>
                          <div className="flex justify-end pt-1">
                            <button className={`${button} bg-emerald-600 text-white hover:bg-emerald-700`}>
                              Xác nhận đã chuyển tiền thành công
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-[11px] text-muted flex justify-between">
                          <span>Mã chứng từ chi: <strong>{r.reference || "—"}</strong></span>
                          <span className="text-emerald-600 font-semibold">✓ Đã hoàn tất</span>
                        </div>
                      )}
                    </form>
                  ))}
                </div>
              )}
            </fieldset>
          )}

          <div className="mt-4 flex justify-end border-t border-border/80 pt-3">
            <button className={`${button} bg-bg hover:bg-court-50`} disabled={busy} onClick={onClose}>
              Đóng
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
