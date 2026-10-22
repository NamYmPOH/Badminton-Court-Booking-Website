"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import BusinessOperations from "@/components/BusinessOperations";
import { useAuth } from "@/context/AuthContext";
import { formatVND } from "@/lib/utils";
import { formatHour } from "@/lib/booking";
import {
  QrCode,
  Play,
  CheckCircle,
  PlusCircle,
  DollarSign,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  Edit3,
  Trash2,
  Plus,
  Move,
  Sparkles,
  Layers,
  RotateCw,
  PauseCircle,
  PlayCircle,
  Archive,
  MapPin,
  Save,
  Check,
} from "lucide-react";
import type { CourtDetail } from "@/services/court.service";

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
  const [activeTab, setActiveTab] = useState<"ORDERS" | "SCAN_TICKET" | "SESSIONS" | "REFUNDS" | "COURTS">("ORDERS");

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
  const surchargeRequestId = useRef<string | null>(null);

  // Refunds state
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [loadingRefunds, setLoadingRefunds] = useState(false);
  const [completeRefundModal, setCompleteRefundModal] = useState<RefundItem | null>(null);
  const [refundBankRef, setRefundBankRef] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [refundProcessing, setRefundProcessing] = useState(false);

  // Courts Management State (§1 & §2)
  const [venues, setVenues] = useState<{ id: string; name: string; slug: string; status: string; ownerId: string }[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>("");
  const [courts, setCourts] = useState<CourtDetail[]>([]);
  const [loadingCourts, setLoadingCourts] = useState<boolean>(false);
  const [courtModal, setCourtModal] = useState<{ mode: "CREATE" | "EDIT"; court?: CourtDetail } | null>(null);
  const [courtFormName, setCourtFormName] = useState("");
  const [courtFormDescription, setCourtFormDescription] = useState("");
  const [courtFormSurface, setCourtFormSurface] = useState("");
  const [courtFormStatus, setCourtFormStatus] = useState<"ACTIVE" | "MAINTENANCE" | "INACTIVE">("ACTIVE");
  const [courtFormRow, setCourtFormRow] = useState(1);
  const [courtFormCol, setCourtFormCol] = useState(1);
  const [courtFormOrientation, setCourtFormOrientation] = useState<"HORIZONTAL" | "VERTICAL">("HORIZONTAL");
  const [courtFormSortOrder, setCourtFormSortOrder] = useState(0);
  const [courtSubmitting, setCourtSubmitting] = useState(false);
  const [layoutDirty, setLayoutDirty] = useState(false);
  const [savingLayout, setSavingLayout] = useState(false);

  const allowed = !!user && ["ADMIN", "OWNER", "STAFF"].includes(user.role);

  const refreshOrders = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`/api/venue-operations?q=${encodeURIComponent(filter)}`, { cache: "no-store", signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      if (!signal?.aborted) {
        setOrders(data.bookings || []);
        if (Array.isArray(data.venues) && data.venues.length > 0) {
          setVenues(data.venues);
          setSelectedVenueId((prev) => prev || data.venues[0].id);
        }
        setError("");
      }
    } catch (err) {
      if (!signal?.aborted) setError(err instanceof Error ? err.message : "Không tải được danh sách đơn.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [filter]);

  const refreshCourts = useCallback(async (venueId: string) => {
    if (!venueId) return;
    setLoadingCourts(true);
    try {
      const res = await fetch(`/api/venue-operations/courts?venueId=${encodeURIComponent(venueId)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không tải được danh sách sân.");
      setCourts(data.courts || []);
      setLayoutDirty(false);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Không tải được danh sách sân.");
    } finally {
      setLoadingCourts(false);
    }
  }, []);

  const refreshRefunds = useCallback(async () => {
    setLoadingRefunds(true);
    try {
      const res = await fetch("/api/venue-operations/refunds", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không tải được yêu cầu hoàn tiền.");
      setRefunds(data.requests || []);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Không tải được yêu cầu hoàn tiền.");
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
    surchargeRequestId.current ??= crypto.randomUUID();
    try {
      const res = await fetch("/api/venue-operations/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_SURCHARGE",
          requestId: surchargeRequestId.current,
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
      surchargeRequestId.current = null;
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

  useEffect(() => {
    if (selectedVenueId && activeTab === "COURTS") {
      void refreshCourts(selectedVenueId);
    }
  }, [selectedVenueId, activeTab, refreshCourts]);

  // Mở modal thêm sân con mới
  function handleOpenCreateCourt() {
    setCourtFormName("");
    setCourtFormDescription("");
    setCourtFormSurface("Thảm PVC tiêu chuẩn");
    setCourtFormStatus("ACTIVE");
    setCourtFormRow(courts.length > 0 ? Math.floor(courts.length / 3) + 1 : 1);
    setCourtFormCol(courts.length > 0 ? (courts.length % 3) + 1 : 1);
    setCourtFormOrientation("HORIZONTAL");
    setCourtFormSortOrder(courts.length + 1);
    setCourtModal({ mode: "CREATE" });
  }

  // Mở modal sửa sân con
  function handleOpenEditCourt(court: CourtDetail) {
    setCourtFormName(court.name);
    setCourtFormDescription(court.description || "");
    setCourtFormSurface(court.surface || "Thảm PVC tiêu chuẩn");
    setCourtFormStatus(court.status);
    setCourtFormRow(court.positionRow);
    setCourtFormCol(court.positionCol);
    setCourtFormOrientation(court.orientation);
    setCourtFormSortOrder(court.sortOrder);
    setCourtModal({ mode: "EDIT", court });
  }

  // Lưu thông tin sân con (Tạo mới hoặc Sửa)
  async function handleSaveCourt(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVenueId || courtSubmitting) return;
    setCourtSubmitting(true);
    setNotice("");
    try {
      if (courtModal?.mode === "CREATE") {
        const res = await fetch("/api/venue-operations/courts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            venueId: selectedVenueId,
            name: courtFormName.trim(),
            description: courtFormDescription.trim() || undefined,
            surface: courtFormSurface.trim() || undefined,
            positionRow: courtFormRow,
            positionCol: courtFormCol,
            orientation: courtFormOrientation,
            sortOrder: courtFormSortOrder,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Không thêm được sân con mới.");
        setNotice(`Đã thêm sân "${courtFormName}" thành công.`);
      } else if (courtModal?.mode === "EDIT" && courtModal.court) {
        const res = await fetch(`/api/venue-operations/courts/${courtModal.court.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: courtFormName.trim(),
            description: courtFormDescription.trim() || undefined,
            surface: courtFormSurface.trim() || undefined,
            status: courtFormStatus,
            positionRow: courtFormRow,
            positionCol: courtFormCol,
            orientation: courtFormOrientation,
            sortOrder: courtFormSortOrder,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Không cập nhật được sân con.");
        setNotice(`Đã cập nhật thông tin sân "${courtFormName}" thành công.`);
      }
      setCourtModal(null);
      await refreshCourts(selectedVenueId);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Thao tác sân con thất bại.");
    } finally {
      setCourtSubmitting(false);
    }
  }

  // Thay đổi nhanh trạng thái sân (ACTIVE / MAINTENANCE / INACTIVE)
  async function handleChangeCourtStatus(court: CourtDetail, nextStatus: "ACTIVE" | "MAINTENANCE" | "INACTIVE") {
    setNotice("");
    try {
      const res = await fetch(`/api/venue-operations/courts/${court.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không đổi được trạng thái sân.");
      const statusLabel =
        nextStatus === "ACTIVE"
          ? "Kích hoạt hoạt động"
          : nextStatus === "MAINTENANCE"
          ? "Tạm ngừng / Bảo trì"
          : "Lưu trữ / Ngừng hoạt động";
      setNotice(`Đã chuyển sân "${court.name}" sang: ${statusLabel}.`);
      await refreshCourts(selectedVenueId);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Không đổi được trạng thái sân.");
    }
  }

  // Xóa sân con
  async function handleDeleteCourt(court: CourtDetail) {
    if (court.totalBookingsCount > 0) {
      alert(
        `Sân "${court.name}" đã có ${court.totalBookingsCount} lượt đặt trong lịch sử. Theo quy định toàn vẹn dữ liệu, không được xóa vĩnh viễn dữ liệu này. Hãy chọn "Lưu trữ / Ngừng hoạt động" để ẩn sân.`
      );
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn sân "${court.name}"? Thao tác này không thể hoàn tác.`)) {
      return;
    }
    setNotice("");
    try {
      const res = await fetch(`/api/venue-operations/courts/${court.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Xóa sân thất bại.");
      setNotice(`Đã xóa sân "${court.name}" thành công.`);
      await refreshCourts(selectedVenueId);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Xóa sân thất bại.");
    }
  }

  // Di chuyển sân trên sơ đồ (hàng, cột)
  function moveCourt(courtId: string, dRow: number, dCol: number) {
    setCourts((prevCourts) => {
      const target = prevCourts.find((c) => c.id === courtId);
      if (!target) return prevCourts;

      const nextRow = Math.max(1, target.positionRow + dRow);
      const nextCol = Math.max(1, target.positionCol + dCol);

      const collision = prevCourts.find(
        (c) => c.id !== courtId && c.positionRow === nextRow && c.positionCol === nextCol
      );
      if (collision) {
        setNotice(`Vị trí Hàng ${nextRow}, Cột ${nextCol} đã có ${collision.name}. Không thể xếp đè.`);
        return prevCourts;
      }

      setLayoutDirty(true);
      return prevCourts.map((c) => (c.id === courtId ? { ...c, positionRow: nextRow, positionCol: nextCol } : c));
    });
  }

  // Xoay chiều sân ngang / dọc
  function toggleOrientation(courtId: string) {
    setCourts((prevCourts) => {
      setLayoutDirty(true);
      return prevCourts.map((c) =>
        c.id === courtId
          ? { ...c, orientation: c.orientation === "VERTICAL" ? "HORIZONTAL" : "VERTICAL" }
          : c
      );
    });
  }

  // Sắp xếp tự động bố cục sân dạng lưới 3 cột
  function autoArrangeLayout() {
    setCourts((prevCourts) => {
      setLayoutDirty(true);
      return prevCourts.map((c, index) => ({
        ...c,
        positionRow: Math.floor(index / 3) + 1,
        positionCol: (index % 3) + 1,
      }));
    });
    setNotice("Đã xếp tự động dạng lưới 3 cột. Nhấn 'Lưu bố cục sơ đồ' để áp dụng.");
  }

  // Lưu bố cục sơ đồ sân lên database
  async function handleSaveLayout() {
    if (!selectedVenueId || savingLayout) return;
    setSavingLayout(true);
    setNotice("");
    try {
      const res = await fetch("/api/venue-operations/courts/layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId: selectedVenueId,
          layout: courts.map((c) => ({
            courtId: c.id,
            positionRow: c.positionRow,
            positionCol: c.positionCol,
            orientation: c.orientation,
            sortOrder: c.sortOrder,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lưu bố cục thất bại.");
      setLayoutDirty(false);
      setNotice("Đã lưu bố cục sơ đồ sân thành công. Khách hàng sẽ thấy đúng sơ đồ này.");
      await refreshCourts(selectedVenueId);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Lưu bố cục thất bại.");
    } finally {
      setSavingLayout(false);
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
          onClick={() => setActiveTab("COURTS")}
          className={`flex-1 border-b-2 py-3 text-center transition ${
            activeTab === "COURTS" ? "border-court-600 text-court-600" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          🏸 Quản lý sân & Sơ đồ 2D ({courts.length})
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

      {activeTab === "ORDERS" && <BusinessOperations />}

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

      {/* TAB 4: QUẢN LÝ SÂN CON & SƠ ĐỒ 2D (§1 & §2) */}
      {activeTab === "COURTS" && (
        <section className="space-y-6">
          {/* Thanh chọn cơ sở & hành động quản lý */}
          <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-bold text-muted">Cơ sở đang quản lý:</label>
              {venues.length > 1 ? (
                <select
                  value={selectedVenueId}
                  onChange={(e) => {
                    setSelectedVenueId(e.target.value);
                    void refreshCourts(e.target.value);
                  }}
                  className="rounded-control border border-border bg-bg px-3 py-1.5 text-xs font-bold text-ink outline-none focus:border-court-500"
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              ) : venues.length === 1 ? (
                <span className="font-bold text-ink text-sm">{venues[0].name}</span>
              ) : (
                <span className="text-xs text-muted">Đang tải cơ sở...</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenCreateCourt}
                className="inline-flex items-center gap-1.5 rounded-control bg-court-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-court-700"
              >
                <Plus size={14} strokeWidth={2.5} />
                Thêm sân con mới
              </button>

              <button
                type="button"
                disabled={!layoutDirty || savingLayout}
                onClick={handleSaveLayout}
                className="inline-flex items-center gap-1.5 rounded-control bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save size={14} />
                {savingLayout ? "Đang lưu..." : layoutDirty ? "Lưu bố cục sơ đồ *" : "Đã lưu bố cục"}
              </button>

              <button
                type="button"
                onClick={autoArrangeLayout}
                className="inline-flex items-center gap-1.5 rounded-control border border-border bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-elevated transition"
                title="Tự động sắp xếp các sân theo lưới 3 cột"
              >
                <Layers size={13} />
                Tự xếp 3 cột
              </button>

              <button
                type="button"
                onClick={() => selectedVenueId && void refreshCourts(selectedVenueId)}
                className="rounded-control border border-border px-3 py-2 text-xs font-semibold hover:bg-surface-elevated"
              >
                Làm mới
              </button>
            </div>
          </div>

          {loadingCourts ? (
            <p className="py-8 text-center text-xs text-muted">Đang tải danh sách sân...</p>
          ) : !courts.length ? (
            <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center space-y-3">
              <p className="text-sm text-muted">Cơ sở này hiện chưa có sân con nào được cấu hình.</p>
              <button
                type="button"
                onClick={handleOpenCreateCourt}
                className="rounded-control bg-court-600 px-4 py-2 text-xs font-bold text-white hover:bg-court-700"
              >
                + Thêm sân đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* KHỐI 1: SƠ ĐỒ 2D TRỰC QUAN CHO CHỦ SÂN */}
              <div className="rounded-card border border-border bg-surface p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-ink">Bố cục sơ đồ 2D của cơ sở</h2>
                    <p className="text-xs text-muted">
                      Điều chỉnh hàng/cột và xoay ngang/dọc cho từng sân. Khách hàng sẽ thấy đúng sơ đồ này khi đặt lịch.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Hoạt động
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Tạm ngừng/Bảo trì
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> Ngừng hoạt động
                    </span>
                  </div>
                </div>

                {/* Grid layout tương tác */}
                <div
                  className="grid gap-4 overflow-x-auto p-2"
                  style={{
                    gridTemplateColumns: `repeat(${Math.max(1, ...courts.map((c) => c.positionCol))}, minmax(180px, 1fr))`,
                    gridTemplateRows: `repeat(${Math.max(1, ...courts.map((c) => c.positionRow))}, minmax(130px, auto))`,
                  }}
                >
                  {courts.map((court) => {
                    const isVertical = court.orientation === "VERTICAL";
                    const isMaintenance = court.status === "MAINTENANCE";
                    const isInactive = court.status === "INACTIVE";

                    return (
                      <div
                        key={court.id}
                        style={{
                          gridRowStart: court.positionRow,
                          gridColumnStart: court.positionCol,
                        }}
                        className={`relative flex flex-col justify-between rounded-card border p-3.5 shadow-sm transition ${
                          isMaintenance
                            ? "border-amber-300 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20"
                            : isInactive
                            ? "border-slate-300 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900/40 opacity-75"
                            : "border-border bg-white dark:bg-surface hover:border-court-300"
                        }`}
                      >
                        {/* Header của thẻ sân */}
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-ink text-sm sm:text-base">{court.name}</span>
                            {court.hasCustomPricing ? (
                              <span
                                title="Sân có cấu hình biểu giá riêng"
                                className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-900 dark:bg-amber-950 dark:text-amber-300"
                              >
                                <Sparkles size={9} /> Giá riêng
                              </span>
                            ) : (
                              <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] text-muted dark:bg-slate-800">
                                Giá chung
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                            <span>
                              Hàng {court.positionRow} · Cột {court.positionCol}
                            </span>
                            <span>•</span>
                            <span className="font-medium text-ink">
                              {court.orientation === "VERTICAL" ? "Xoay dọc" : "Xoay ngang"}
                            </span>
                          </div>

                          {court.activeBookingsCount > 0 && (
                            <p className="mt-1 text-[11px] font-semibold text-court-600">
                              ⚡ {court.activeBookingsCount} đơn đang hiệu lực
                            </p>
                          )}
                        </div>

                        {/* Mô phỏng sân cầu lông mini */}
                        <div className="my-1.5 flex items-center justify-center">
                          <div
                            className={`relative rounded border border-court-400/50 bg-court-500/10 ${
                              isVertical ? "h-10 w-6" : "h-6 w-12"
                            }`}
                          >
                            <div
                              className={`absolute bg-court-400/50 ${
                                isVertical ? "top-1/2 left-0 right-0 h-px" : "left-1/2 top-0 bottom-0 w-px"
                              }`}
                            />
                          </div>
                        </div>

                        {/* Thanh điều hướng vị trí và xoay */}
                        <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs">
                          {/* Nút di chuyển vị trí 4 hướng */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveCourt(court.id, -1, 0)}
                              title="Dịch lên trên"
                              disabled={court.positionRow <= 1}
                              className="rounded border border-border p-1 hover:bg-surface-elevated disabled:opacity-30"
                            >
                              ⬆️
                            </button>
                            <button
                              type="button"
                              onClick={() => moveCourt(court.id, 1, 0)}
                              title="Dịch xuống dưới"
                              className="rounded border border-border p-1 hover:bg-surface-elevated"
                            >
                              ⬇️
                            </button>
                            <button
                              type="button"
                              onClick={() => moveCourt(court.id, 0, -1)}
                              title="Dịch sang trái"
                              disabled={court.positionCol <= 1}
                              className="rounded border border-border p-1 hover:bg-surface-elevated disabled:opacity-30"
                            >
                              ⬅️
                            </button>
                            <button
                              type="button"
                              onClick={() => moveCourt(court.id, 0, 1)}
                              title="Dịch sang phải"
                              className="rounded border border-border p-1 hover:bg-surface-elevated"
                            >
                              ➡️
                            </button>
                          </div>

                          {/* Nút xoay và sửa */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => toggleOrientation(court.id)}
                              title="Xoay chiều sân ngang / dọc"
                              className="rounded border border-border p-1 hover:bg-surface-elevated text-[11px]"
                            >
                              <RotateCw size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditCourt(court)}
                              title="Chỉnh sửa thông tin sân"
                              className="rounded border border-border p-1 hover:bg-surface-elevated text-[11px] text-court-600"
                            >
                              <Edit3 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* KHỐI 2: BẢNG DANH SÁCH CHI TIẾT SÂN CON */}
              <div className="rounded-card border border-border bg-surface p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h2 className="text-base font-bold text-ink">Danh sách sân con ({courts.length} sân)</h2>
                  <span className="text-xs text-muted">
                    Sân đã có lịch sử đặt sẽ được bảo toàn và không thể xóa vĩnh viễn
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted">
                        <th className="py-2.5 font-bold">Tên sân</th>
                        <th className="py-2.5 font-bold">Trạng thái</th>
                        <th className="py-2.5 font-bold">Biểu giá</th>
                        <th className="py-2.5 font-bold">Vị trí sơ đồ</th>
                        <th className="py-2.5 font-bold">Đơn hiệu lực</th>
                        <th className="py-2.5 font-bold">Tổng lượt đặt</th>
                        <th className="py-2.5 text-right font-bold">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {courts.map((court) => (
                        <tr key={court.id} className="hover:bg-surface-elevated transition">
                          <td className="py-3 font-bold text-ink">
                            <div>{court.name}</div>
                            {court.description && (
                              <div className="text-[11px] font-normal text-muted line-clamp-1">{court.description}</div>
                            )}
                          </td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                court.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : court.status === "MAINTENANCE"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                  : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {court.status === "ACTIVE"
                                ? "● Đang hoạt động"
                                : court.status === "MAINTENANCE"
                                ? "⚠ Tạm ngừng/Bảo trì"
                                : "✕ Lưu trữ/Ngừng"}
                            </span>
                          </td>
                          <td className="py-3">
                            {court.hasCustomPricing ? (
                              <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400">
                                <Sparkles size={11} /> Biểu giá riêng
                              </span>
                            ) : (
                              <span className="text-muted">Theo giá cơ sở</span>
                            )}
                          </td>
                          <td className="py-3 font-medium text-ink">
                            Hàng {court.positionRow}, Cột {court.positionCol} ({court.orientation === "VERTICAL" ? "Dọc" : "Ngang"})
                          </td>
                          <td className="py-3">
                            {court.activeBookingsCount > 0 ? (
                              <span className="font-bold text-court-600">{court.activeBookingsCount} đơn</span>
                            ) : (
                              <span className="text-muted">0</span>
                            )}
                          </td>
                          <td className="py-3 text-muted">{court.totalBookingsCount} lượt</td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditCourt(court)}
                                className="rounded border border-border px-2 py-1 text-court-600 hover:bg-surface-elevated font-semibold"
                              >
                                Sửa
                              </button>

                              {court.status === "ACTIVE" ? (
                                <button
                                  type="button"
                                  onClick={() => handleChangeCourtStatus(court, "MAINTENANCE")}
                                  className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 font-semibold"
                                  title="Tạm ngừng hoạt động để bảo trì"
                                >
                                  Tạm ngừng
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleChangeCourtStatus(court, "ACTIVE")}
                                  className="rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold"
                                >
                                  Kích hoạt
                                </button>
                              )}

                              {court.status !== "INACTIVE" && (
                                <button
                                  type="button"
                                  onClick={() => handleChangeCourtStatus(court, "INACTIVE")}
                                  className="rounded border border-slate-300 px-2 py-1 text-muted hover:bg-surface-elevated"
                                  title="Lưu trữ sân này khi không còn sử dụng"
                                >
                                  Lưu trữ
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteCourt(court)}
                                className="rounded border border-border p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="Xóa sân (chỉ khi chưa có lịch sử đặt)"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MODAL THÊM / CHỈNH SỬA SÂN CON */}
          {courtModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <form
                onSubmit={handleSaveCourt}
                className="w-full max-w-lg rounded-card border border-border bg-surface p-6 shadow-2xl space-y-4 text-xs"
              >
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h3 className="text-base font-bold text-ink">
                    {courtModal.mode === "CREATE" ? "Thêm sân con mới" : `Chỉnh sửa: ${courtModal.court?.name}`}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCourtModal(null)}
                    className="text-muted hover:text-ink text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="block font-bold text-ink">
                    Tên / Số sân <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    maxLength={50}
                    placeholder="VD: Sân 1, Sân 2, Sân VIP 1..."
                    value={courtFormName}
                    onChange={(e) => setCourtFormName(e.target.value)}
                    className="mt-1 w-full rounded-control border border-border bg-bg p-2.5 font-bold text-ink outline-none focus:border-court-500"
                  />
                  <p className="mt-1 text-[11px] text-muted">Tên sân là duy nhất trong cùng cơ sở.</p>
                </div>

                <div>
                  <label className="block font-semibold text-muted">Mô tả sân</label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    placeholder="Ghi chú về vị trí, ánh sáng, độ bám thảm..."
                    value={courtFormDescription}
                    onChange={(e) => setCourtFormDescription(e.target.value)}
                    className="mt-1 w-full rounded-control border border-border bg-bg p-2 text-ink outline-none focus:border-court-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-muted">Loại mặt sân</label>
                    <input
                      placeholder="VD: Thảm PVC, Gỗ..."
                      value={courtFormSurface}
                      onChange={(e) => setCourtFormSurface(e.target.value)}
                      className="mt-1 w-full rounded-control border border-border bg-bg p-2 text-ink outline-none focus:border-court-500"
                    />
                  </div>

                  {courtModal.mode === "EDIT" && (
                    <div>
                      <label className="block font-semibold text-muted">Trạng thái sân</label>
                      <select
                        value={courtFormStatus}
                        onChange={(e) =>
                          setCourtFormStatus(e.target.value as "ACTIVE" | "MAINTENANCE" | "INACTIVE")
                        }
                        className="mt-1 w-full rounded-control border border-border bg-bg p-2 text-ink outline-none focus:border-court-500 font-bold"
                      >
                        <option value="ACTIVE">Hoạt động bình thường</option>
                        <option value="MAINTENANCE">Tạm ngừng / Bảo trì</option>
                        <option value="INACTIVE">Lưu trữ / Ngừng hoạt động</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="border-t border-border/60 pt-3">
                  <span className="font-bold text-ink">Bố cục trên sơ đồ 2D</span>
                  <div className="mt-2 grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted">Hàng (Row ≥ 1)</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        required
                        value={courtFormRow}
                        onChange={(e) => setCourtFormRow(Math.max(1, parseInt(e.target.value) || 1))}
                        className="mt-1 w-full rounded-control border border-border bg-bg p-2 text-ink"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-muted">Cột (Col ≥ 1)</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        required
                        value={courtFormCol}
                        onChange={(e) => setCourtFormCol(Math.max(1, parseInt(e.target.value) || 1))}
                        className="mt-1 w-full rounded-control border border-border bg-bg p-2 text-ink"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-muted">Hướng xoay</label>
                      <select
                        value={courtFormOrientation}
                        onChange={(e) =>
                          setCourtFormOrientation(e.target.value as "HORIZONTAL" | "VERTICAL")
                        }
                        className="mt-1 w-full rounded-control border border-border bg-bg p-2 text-ink font-semibold"
                      >
                        <option value="HORIZONTAL">Ngang</option>
                        <option value="VERTICAL">Dọc</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
                  <button
                    type="button"
                    onClick={() => setCourtModal(null)}
                    className="rounded-control border border-border px-4 py-2 text-muted hover:text-ink font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={courtSubmitting}
                    className="rounded-control bg-court-600 px-5 py-2 font-bold text-white hover:bg-court-700 disabled:opacity-50"
                  >
                    {courtSubmitting ? "Đang lưu..." : courtModal.mode === "CREATE" ? "Thêm sân" : "Lưu thay đổi"}
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
