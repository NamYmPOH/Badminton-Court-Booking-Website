"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { formatVND } from "@/lib/utils";
import { formatHour } from "@/lib/booking";
import { QrCode, Play, CheckCircle, PlusCircle, DollarSign, RotateCcw, AlertTriangle, ShieldCheck } from "lucide-react";

type Order = {
  group?: { inviteToken: string; shares?: { id: string; position: number; amount: number; cashRequested: boolean; paymentId: string | null }[] } | null;
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  expiresAt: string | null;
  venue: { name: string; paymentMode: string };
  items: { id: string; date: string; startMin: number; endMin: number; court: { name: string } }[];
};

interface RefundItem {
  id: string;
  bookingId: string;
  amount: number;
  type: string;
  reason: string;
  status: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  bankName?: string;
  createdAt: string;
  booking: {
    code: string;
    customerName: string;
    customerPhone: string;
    total: number;
    venue: { name: string };
  };
  transactions: { id: string; amount: number; bankRef?: string; processedAt: string }[];
}

export default function VenueOperationsPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"ORDERS" | "SCAN_TICKET" | "SESSIONS" | "REFUNDS">("ORDERS");

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<{ id: string; action: string; title: string; amount: number } | null>(null);
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");
  const inFlight = useRef(false);

  // Scan Ticket state
  const [ticketPayload, setTicketPayload] = useState("");
  const [ticketResult, setTicketResult] = useState<{ success?: boolean; message?: string; ticket?: unknown } | null>(null);
  const [ticketScanning, setTicketScanning] = useState(false);

  // Sessions and Surcharge state
  const [surchargeModal, setSurchargeModal] = useState<{ sessionId: string; bookingCode: string } | null>(null);
  const [surchargeType, setSurchargeType] = useState<"OVERTIME" | "SERVICE" | "DAMAGE" | "OTHER">("OVERTIME");
  const [surchargeAmount, setSurchargeAmount] = useState<number>(50000);
  const [surchargeReason, setSurchargeReason] = useState("");
  const [surchargeSubmitting, setSurchargeSubmitting] = useState(false);

  // Refunds state
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [loadingRefunds, setLoadingRefunds] = useState(false);
  const [completeRefundModal, setCompleteRefundModal] = useState<RefundItem | null>(null);
  const [refundBankRef, setRefundBankRef] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [refundProcessing, setRefundProcessing] = useState(false);

  const allowed = !!user && ["ADMIN", "OWNER", "STAFF"].includes(user.role);

  const refreshOrders = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`/api/venue-operations?q=${encodeURIComponent(filter)}`, { cache: "no-store", signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      if (!signal?.aborted) {
        setOrders(data.bookings);
        setError("");
      }
    } catch (err) {
      if (!signal?.aborted) setError(err instanceof Error ? err.message : "Không tải được danh sách đơn.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [filter]);

  const refreshRefunds = useCallback(async () => {
    setLoadingRefunds(true);
    try {
      const res = await fetch("/api/venue-operations/refunds", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setRefunds(data.requests || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingRefunds(false);
    }
  }, []);

  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController();
    setLoading(true);
    void refreshOrders(controller.signal);
    void refreshRefunds();
    const timer = setInterval(() => {
      void refreshOrders(controller.signal);
      void refreshRefunds();
    }, 12000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [allowed, refreshOrders, refreshRefunds]);

  // Submit action cho order (CASH_PAID, CONFIRM, CANCEL, v.v.)
  async function submitAction(event: React.FormEvent) {
    event.preventDefault();
    if (!action || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/venue-operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: action.id, action: action.action, reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setNotice("Đã cập nhật đơn và lưu nhật ký thao tác thành công.");
      setAction(null);
      setReason("");
      await refreshOrders();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Không cập nhật được đơn. Hãy kiểm tra lại.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  // Quét vé check-in
  async function handleScanTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!ticketPayload.trim() || ticketScanning) return;
    setTicketScanning(true);
    setTicketResult(null);
    try {
      const res = await fetch("/api/tickets/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrPayload: ticketPayload.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Quét vé thất bại.");
      setTicketResult({ success: true, message: data.message, ticket: data.ticket });
      setTicketPayload("");
      await refreshOrders();
    } catch (err) {
      setTicketResult({
        success: false,
        message: err instanceof Error ? err.message : "Lỗi check-in vé.",
      });
    } finally {
      setTicketScanning(false);
    }
  }

  // Thêm phụ thu phiên sân
  async function handleAddSurcharge(e: React.FormEvent) {
    e.preventDefault();
    if (!surchargeModal || surchargeSubmitting) return;
    setSurchargeSubmitting(true);
    try {
      const res = await fetch("/api/venue-operations/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_SURCHARGE",
          sessionId: surchargeModal.sessionId,
          type: surchargeType,
          amount: surchargeAmount,
          reason: surchargeReason.trim(),
          isPaid: true,
          paymentMethod: "CASH",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thêm được phụ thu.");
      setNotice(`Đã thêm phụ thu ${formatVND(surchargeAmount)} cho đơn ${surchargeModal.bookingCode}.`);
      setSurchargeModal(null);
      setSurchargeReason("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lỗi thêm phụ thu.");
    } finally {
      setSurchargeSubmitting(false);
    }
  }

  // Phê duyệt hoàn tiền
  async function handleApproveRefund(requestId: string) {
    try {
      const res = await fetch("/api/venue-operations/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE", requestId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setNotice("Đã duyệt yêu cầu hoàn tiền. Vui lòng thực hiện chuyển khoản cho khách.");
      await refreshRefunds();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lỗi duyệt hoàn tiền");
    }
  }

  // Hoàn tất chuyển khoản hoàn tiền thủ công
  async function handleCompleteManualRefund(e: React.FormEvent) {
    e.preventDefault();
    if (!completeRefundModal || refundProcessing) return;
    setRefundProcessing(true);
    try {
      const res = await fetch("/api/venue-operations/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "COMPLETE_MANUAL",
          requestId: completeRefundModal.id,
          bankRef: refundBankRef.trim(),
          notes: refundNotes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setNotice(`Đã xác nhận hoàn tiền ${formatVND(completeRefundModal.amount)} thành công.`);
      setCompleteRefundModal(null);
      setRefundBankRef("");
      setRefundNotes("");
      await refreshRefunds();
      await refreshOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lỗi xác nhận hoàn tiền");
    } finally {
      setRefundProcessing(false);
    }
  }

  if (isLoading) return <p className="p-8">Đang kiểm tra quyền...</p>;
  if (!allowed)
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold">Quản lý tại sân</h1>
        <p className="my-4">Chỉ chủ sân, nhân viên được phân quyền và quản trị viên được truy cập.</p>
        <Link href="/login" className="underline">
          Đăng nhập
        </Link>
      </div>
    );

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Vận hành sân & Giao dịch</h1>
          <p className="text-sm text-muted">
            Quản lý nhận sân, quét vé QR, phụ thu và phê duyệt hoàn tiền theo chính sách
          </p>
        </div>
      </div>

      {/* Tabs chuyển đổi các chức năng vận hành */}
      <div className="flex border-b border-border text-sm font-semibold">
        <button
          onClick={() => setActiveTab("ORDERS")}
          className={`flex-1 border-b-2 py-3 text-center transition ${
            activeTab === "ORDERS" ? "border-court-600 text-court-600" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          📋 Đơn đặt sân & Tiền mặt
        </button>
        <button
          onClick={() => setActiveTab("SCAN_TICKET")}
          className={`flex-1 border-b-2 py-3 text-center transition ${
            activeTab === "SCAN_TICKET" ? "border-court-600 text-court-600" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          ⚡ Quét vé QR Check-in
        </button>
        <button
          onClick={() => setActiveTab("REFUNDS")}
          className={`flex-1 border-b-2 py-3 text-center transition ${
            activeTab === "REFUNDS" ? "border-court-600 text-court-600" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          🔄 Yêu cầu hoàn tiền ({refunds.filter((r) => r.status === "REQUESTED" || r.status === "PROCESSING").length})
        </button>
      </div>

      {notice && (
        <div className="rounded-card border border-emerald-300 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          ✓ {notice}
        </div>
      )}
      {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}

      {/* TAB 1: ĐƠN ĐẶT SÂN & TIỀN MẶT */}
      {activeTab === "ORDERS" && (
        <section className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setFilter(query.trim());
            }}
            className="flex gap-3"
          >
            <input
              aria-label="Tìm mã đơn"
              placeholder="Tìm mã đơn DATSAN..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-0 flex-1 rounded-control border border-border bg-surface p-3 text-ink"
            />
            <button className="rounded-control bg-court-600 px-4 font-semibold text-white">Tìm đơn</button>
            <button
              type="button"
              onClick={() => void refreshOrders()}
              className="rounded-control border border-border px-4 font-semibold"
            >
              Làm mới
            </button>
          </form>

          {action && (
            <form onSubmit={submitAction} className="space-y-3 rounded-card border border-court-600 bg-surface p-5 shadow-lg">
              <h2 className="font-bold">
                {action.title} · {formatVND(action.amount)}
              </h2>
              {action.action === "CASH_PAID" && (
                <p className="text-xs text-muted">
                  Xác nhận bạn đã nhận đủ số tiền trên bằng tiền mặt. Thao tác này sẽ ghi nhận đơn đã thanh toán.
                </p>
              )}
              <label className="block text-xs font-semibold text-muted">
                Lý do / Ghi chú kiểm toán
                <textarea
                  autoFocus
                  required
                  minLength={5}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-2 block w-full rounded-control border border-border bg-surface p-3 text-ink"
                />
              </label>
              <div className="flex gap-3 text-xs">
                <button
                  disabled={busy}
                  className="rounded-control bg-court-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
                >
                  {busy ? "Đang lưu..." : "Xác nhận"}
                </button>
                <button type="button" disabled={busy} onClick={() => setAction(null)} className="text-muted">
                  Đóng
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <p className="py-8 text-center text-xs text-muted">Đang tải danh sách đơn...</p>
          ) : !orders.length ? (
            <p className="py-8 text-center text-xs text-muted">Chưa có đơn đang xử lý tại sân bạn quản lý.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {orders.map((order) => {
                const cash = order.paymentMethod === "CASH" || (!order.paymentMethod && order.venue.paymentMode === "AT_VENUE");
                const paid = order.paymentStatus === "PAID";
                const pending = order.status === "PENDING_PAYMENT" && !!order.expiresAt && Date.parse(order.expiresAt) > Date.now();
                const button = (name: string, value: string) => (
                  <button
                    key={value}
                    disabled={busy || !!error}
                    onClick={() => {
                      setAction({ id: order.id, title: `${name} — ${order.code}`, action: value, amount: order.total });
                      setReason("");
                      setNotice("");
                    }}
                    className="rounded-control border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-elevated disabled:opacity-50"
                  >
                    {name}
                  </button>
                );

                return (
                  <article key={order.id} className="space-y-3 rounded-card border border-border bg-surface p-5 shadow-sm">
                    <div className="flex justify-between border-b border-border/60 pb-2">
                      <span className="font-mono text-xs font-bold text-court-600">{order.code}</span>
                      <span className="text-xs text-muted">{order.venue.name}</span>
                    </div>
                    <p className="font-bold text-ink">
                      {order.customerName} · {order.customerPhone}
                    </p>
                    {order.items.map((item, index) => (
                      <p key={index} className="text-xs text-muted">
                        {item.court.name} · {item.date.slice(0, 10)} · {formatHour(item.startMin)}–{formatHour(item.endMin)}
                      </p>
                    ))}
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-sm font-black text-court-600">{formatVND(order.total)}</p>
                      <span className="text-xs font-semibold text-muted">
                        {order.status === "CONFIRMED"
                          ? "● Đã xác nhận"
                          : order.status === "CHECKED_IN"
                          ? "⚡ Đã nhận sân"
                          : pending
                          ? "Đang giữ sân"
                          : order.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
                      {order.group ? (
                        <Link
                          href={`/groups/${order.group.inviteToken}`}
                          className="rounded-control bg-court-600 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Quản lý nhóm
                        </Link>
                      ) : (
                        <>
                          {pending && cash && button("Duyệt tiền mặt", "CONFIRM")}
                          {order.status === "CONFIRMED" && cash && !paid && button("Đã thu đủ tiền mặt", "CASH_PAID")}
                          {order.status === "CONFIRMED" && paid && button("Nhận sân thủ công", "CHECK_IN")}
                          {order.status === "CHECKED_IN" && paid && button("Hoàn tất", "COMPLETE")}
                          {(pending || order.status === "CONFIRMED") && button("Hủy đơn", "CANCEL")}
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: QUÉT VÉ QR CHECK-IN */}
      {activeTab === "SCAN_TICKET" && (
        <section className="mx-auto max-w-lg space-y-5 rounded-card border border-border bg-surface p-6 shadow-sm">
          <div className="text-center">
            <QrCode className="mx-auto text-court-600" size={48} />
            <h2 className="mt-2 text-lg font-bold text-ink">Quét vé QR nhận sân</h2>
            <p className="text-xs text-muted">Dùng máy quét mã vạch hoặc dán chuỗi vé ST.xxx để check-in</p>
          </div>

          <form onSubmit={handleScanTicket} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted">Mã vé QR (Định dạng: ST.&lt;ticketId&gt;.&lt;hmac&gt;)</label>
              <textarea
                required
                rows={3}
                placeholder="Dán nội dung quét từ mã QR của khách..."
                value={ticketPayload}
                onChange={(e) => setTicketPayload(e.target.value)}
                className="mt-1 w-full rounded-control border border-border bg-surface p-3 font-mono text-xs text-ink"
              />
            </div>

            <button
              type="submit"
              disabled={ticketScanning}
              className="w-full rounded-control bg-court-600 py-2.5 text-xs font-bold text-white hover:bg-court-700 disabled:opacity-50"
            >
              {ticketScanning ? "Đang xác thực vé..." : "Xác nhận Check-in"}
            </button>
          </form>

          {ticketResult && (
            <div
              className={`rounded-card border p-4 text-xs ${
                ticketResult.success
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {ticketResult.success ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
                <span>{ticketResult.message}</span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: YÊU CẦU HOÀN TIỀN */}
      {activeTab === "REFUNDS" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-ink">Danh sách yêu cầu hoàn tiền</h2>
            <button
              onClick={() => void refreshRefunds()}
              className="rounded-control border border-border px-3 py-1.5 text-xs font-medium"
            >
              Làm mới
            </button>
          </div>

          {loadingRefunds ? (
            <p className="py-8 text-center text-xs text-muted">Đang tải danh sách hoàn tiền...</p>
          ) : !refunds.length ? (
            <p className="py-8 text-center text-xs text-muted">Chưa có yêu cầu hoàn tiền nào tại cơ sở này.</p>
          ) : (
            <div className="space-y-3">
              {refunds.map((req) => (
                <div key={req.id} className="rounded-card border border-border bg-surface p-4 shadow-sm text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                    <div>
                      <span className="font-mono font-bold text-court-600">{req.booking.code}</span>
                      <span className="ml-2 text-muted">{req.booking.venue.name}</span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        req.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : req.status === "PROCESSING"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : req.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      }`}
                    >
                      {req.status === "REQUESTED"
                        ? "Chờ duyệt"
                        : req.status === "PROCESSING"
                        ? "Đã duyệt - Chờ chuyển khoản"
                        : req.status === "COMPLETED"
                        ? "Đã hoàn tất"
                        : "Đã từ chối"}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div>
                      <p>
                        <span className="text-muted">Khách hàng:</span> <strong>{req.booking.customerName}</strong> (
                        {req.booking.customerPhone})
                      </p>
                      <p className="text-rose-600 font-bold">Số tiền hoàn: {formatVND(req.amount)}</p>
                      <p className="text-muted">Lý do: {req.reason}</p>
                    </div>

                    <div className="rounded-control bg-surface-elevated p-2.5">
                      <p className="text-muted font-semibold">Tài khoản nhận hoàn tiền:</p>
                      <p className="font-bold">{req.bankName}</p>
                      <p className="font-mono font-bold text-court-600">{req.bankAccountNumber}</p>
                      <p>{req.bankAccountName}</p>
                    </div>
                  </div>

                  {req.status === "COMPLETED" && req.transactions.length > 0 && (
                    <div className="mt-2 text-[11px] text-emerald-600 font-medium">
                      ✓ Mã giao dịch chuyển khoản: {req.transactions[0].bankRef} (Ngày:{" "}
                      {new Date(req.transactions[0].processedAt).toLocaleDateString("vi-VN")})
                    </div>
                  )}

                  <div className="mt-3 flex justify-end gap-2 border-t border-border/50 pt-2">
                    {req.status === "REQUESTED" && (
                      <button
                        onClick={() => handleApproveRefund(req.id)}
                        className="rounded-control bg-court-600 px-3 py-1.5 font-semibold text-white hover:bg-court-700"
                      >
                        Duyệt yêu cầu
                      </button>
                    )}

                    {(req.status === "REQUESTED" || req.status === "PROCESSING") && (
                      <button
                        onClick={() => {
                          setCompleteRefundModal(req);
                          setRefundBankRef("");
                        }}
                        className="rounded-control bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700"
                      >
                        Xác nhận đã chuyển khoản
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MODAL HOÀN TẤT CHUYỂN KHOẢN THỦ CÔNG */}
          {completeRefundModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <form
                onSubmit={handleCompleteManualRefund}
                className="w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-2xl space-y-4 text-xs"
              >
                <h3 className="text-base font-bold text-ink">Xác nhận chuyển khoản hoàn tiền</h3>
                <p className="text-muted">
                  Đơn {completeRefundModal.booking.code} · Số tiền:{" "}
                  <strong className="text-rose-600">{formatVND(completeRefundModal.amount)}</strong>
                </p>

                <div className="rounded-control bg-surface-elevated p-3 space-y-1">
                  <p>
                    Ngân hàng: <strong>{completeRefundModal.bankName}</strong>
                  </p>
                  <p>
                    Số tài khoản: <strong>{completeRefundModal.bankAccountNumber}</strong>
                  </p>
                  <p>
                    Chủ tài khoản: <strong>{completeRefundModal.bankAccountName}</strong>
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-muted">
                    Mã tham chiếu ngân hàng (FT... / Mã giao dịch App ngân hàng) *
                  </label>
                  <input
                    required
                    placeholder="VD: FT261021987654321..."
                    value={refundBankRef}
                    onChange={(e) => setRefundBankRef(e.target.value)}
                    className="mt-1 w-full rounded-control border border-border bg-surface p-2.5 font-mono text-ink"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-muted">Ghi chú đối soát</label>
                  <textarea
                    rows={2}
                    placeholder="Ghi chú thêm nếu cần..."
                    value={refundNotes}
                    onChange={(e) => setRefundNotes(e.target.value)}
                    className="mt-1 w-full rounded-control border border-border bg-surface p-2 text-ink"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCompleteRefundModal(null)}
                    className="rounded-control border border-border px-3 py-2 text-muted"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={refundProcessing}
                    className="rounded-control bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {refundProcessing ? "Đang lưu..." : "Xác nhận hoàn tất"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
