"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { formatVND } from "@/lib/utils";
import { formatHour } from "@/lib/booking";
import {
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  UserCheck,
  UserX,
  UserPlus,
  RefreshCw,
  Plus,
  Settings,
  CalendarDays,
  Layers,
  ListOrdered,
  Printer,
  ChevronRight,
  Info,
} from "lucide-react";
import CounterBookingModal from "@/components/features/venue-operations/CounterBookingModal";
import VenueCourtsModal from "@/components/features/venue-operations/VenueCourtsModal";
import RefundModal from "@/components/features/venue-operations/RefundModal";
import VenueScheduleTimeline from "@/components/features/venue-operations/VenueScheduleTimeline";
import VenueAllBookingsSection, {
  type BookingOrderItem,
} from "@/components/features/venue-operations/VenueAllBookingsSection";
import ReceiptPrintModal, {
  type ReceiptOrder,
  type ReceiptVenue,
} from "@/components/features/venue-operations/ReceiptPrintModal";
import type { TimelineSchedule, TimelineSlot } from "@/app/api/venue-operations/route";

interface CourtInfo {
  id: string;
  name: string;
  sortOrder: number;
  status: "AVAILABLE" | "IN_USE" | "OVERDUE";
  currentBooking?: {
    id: string;
    code: string;
    customerName: string;
    customerPhone: string;
    startMin: number;
    endMin: number;
    remainingMin: number;
    isOverdue: boolean;
    total: number;
    remainingAmount: number;
    paymentStatus: string;
    sessionStatus: string;
  };
  conflictWarning?: string;
}

interface Order {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  total: number;
  status: string;
  sessionStatus: string;
  paymentStatus: string;
  paymentMethod: string | null;
  hasCashPayment: boolean;
  totalPaid: number;
  remaining: number;
  isFullyPaid: boolean;
  isOverdue: boolean;
  endTimestamp: number;
  expiresAt: string | null;
  cancelRequestedAt?: string | null;
  cancelApprovedAt?: string | null;
  refundAmountApproved?: number | null;
  refundAvailable: number;
  refundPending: number;
  refundNeedsReview: boolean;
  refunds: Array<{
    id: string;
    amount: number;
    completedAmount: number;
    remaining: number;
    txnRef: string;
    provider: string;
  }>;
  refundCompletedAt?: string | null;
  source?: string;
  venue: { id: string; name: string; paymentMode: string };
  items: { date: string; startMin: number; endMin: number; court: { id: string; name: string } }[];
  group?: {
    inviteToken: string;
    shares?: { id: string; position: number; amount: number; cashRequested: boolean; paymentId: string | null }[];
  } | null;
}

interface StaffMember {
  userId: string;
  venueId: string;
  name: string;
  phone: string | null;
  email: string | null;
  userStatus: string;
  role: string;
  isActive: boolean;
  isOnShift: boolean;
  createdAt: string;
}

interface VenueMeta {
  id: string;
  name: string;
  slug: string;
  paymentMode: string;
  ownerId: string;
}

interface SelectedVenueDetailed extends ReceiptVenue {
  slug: string;
  openMin: number;
  closeMin: number;
  paymentMode: string;
}

const LAST_VENUE_KEY = "smashbook_last_venue_id";

// Lấy ngày hiện tại theo giờ Việt Nam (UTC+7)
function getTodayVN(): string {
  const nowVN = new Date(Date.now() + 7 * 3600000);
  return nowVN.toISOString().slice(0, 10);
}

export default function VenueOperationsPage() {
  const { user, isLoading } = useAuth();

  // Tab view điều khiển
  const [activeTab, setActiveTab] = useState<"OPERATIONS" | "TIMELINE" | "ALL_BOOKINGS">("OPERATIONS");

  // Dữ liệu cơ sở & phiên trực tiếp
  const [orders, setOrders] = useState<Order[]>([]);
  const [venues, setVenues] = useState<VenueMeta[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>("");
  const [selectedVenueMeta, setSelectedVenueMeta] = useState<SelectedVenueDetailed | null>(null);
  const [courtsByVenue, setCourtsByVenue] = useState<Record<string, CourtInfo[]>>({});
  const [shiftsByVenue, setShiftsByVenue] = useState<Record<string, { myShiftId: string | null; hasActiveShift: boolean }>>({});

  // Dữ liệu Timeline Lịch Sân
  const [timelineDate, setTimelineDate] = useState<string>(getTodayVN());
  const [timelineSchedule, setTimelineSchedule] = useState<TimelineSchedule | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Dữ liệu Toàn Bộ Đơn Đặt Sân
  const [allBookingsData, setAllBookingsData] = useState<{
    items: BookingOrderItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  });
  const [allBookingsPage, setAllBookingsPage] = useState<number>(1);
  const [allStatusFilter, setAllStatusFilter] = useState<string>("");
  const [allCourtFilter, setAllCourtFilter] = useState<string>("");
  const [allDateFilter, setAllDateFilter] = useState<string>("");
  const [allSearchInput, setAllSearchInput] = useState<string>("");
  const [allSearchSubmitted, setAllSearchSubmitted] = useState<string>("");
  const [allBookingsLoading, setAllBookingsLoading] = useState(false);

  // Quản lý nhân viên
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [showStaffTab, setShowStaffTab] = useState(false);
  const [newStaffIdentifier, setNewStaffIdentifier] = useState("");
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState("");

  // Tìm kiếm danh sách phiên trực tiếp
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  // Modals
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterInitialData, setCounterInitialData] = useState<{
    courtId?: string;
    date?: string;
    startMin?: number;
    endMin?: number;
  }>({});
  const [showCourtsModal, setShowCourtsModal] = useState(false);
  const [refundModal, setRefundModal] = useState<{
    booking: Order;
    mode: "APPROVE" | "RECORD";
  } | null>(null);

  // Modal In Hóa Đơn Nhiệt 80mm
  const [printOrder, setPrintOrder] = useState<ReceiptOrder | null>(null);

  // Modal Xác Nhận Thu Tiền Mặt (Bước 1)
  const [cashModal, setCashModal] = useState<{
    orderId: string;
    orderCode: string;
    courtName: string;
    remaining: number;
  } | null>(null);
  const [cashNote, setCashNote] = useState("Đã nhận đủ tiền mặt trực tiếp tại quầy");

  // Hộp thoại xác nhận các thao tác khác (CONFIRM, CHECK_IN, COMPLETE, CANCEL, CANCEL_REQUEST)
  const [actionModal, setActionModal] = useState<{
    id: string;
    action: string;
    title: string;
  } | null>(null);
  const [actionReason, setActionReason] = useState("");

  const inFlight = useRef(false);
  const allowed = !!user && ["ADMIN", "OWNER", "STAFF"].includes(user.role);

  // Tải dữ liệu tổng thể từ API
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      if (signal?.aborted) return;
      try {
        const currentVenueParam =
          selectedVenueId ||
          (typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("venueId") ||
              localStorage.getItem(LAST_VENUE_KEY)
            : null);

        const params = new URLSearchParams();
        if (currentVenueParam) params.set("venueId", currentVenueParam);
        if (filter) params.set("q", filter);
        if (timelineDate) params.set("timelineDate", timelineDate);
        params.set("allPage", String(allBookingsPage));
        params.set("allPageSize", "10");
        if (allStatusFilter) params.set("allStatus", allStatusFilter);
        if (allCourtFilter) params.set("allCourtId", allCourtFilter);
        if (allDateFilter) params.set("allDate", allDateFilter);
        if (allSearchSubmitted) params.set("allQ", allSearchSubmitted);

        const response = await fetch(`/api/venue-operations?${params.toString()}`, {
          cache: "no-store",
          signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Không tải được danh sách.");

        if (!signal?.aborted) {
          const returnedVenues: VenueMeta[] = data.venues || [];
          setVenues(returnedVenues);
          setOrders(data.bookings || []);
          setCourtsByVenue(data.courtsByVenue || {});
          setShiftsByVenue(data.shiftsByVenue || {});

          if (data.selectedVenue) {
            setSelectedVenueMeta(data.selectedVenue);
          }
          if (data.timelineSchedule) {
            setTimelineSchedule(data.timelineSchedule);
          }
          if (data.allBookings) {
            setAllBookingsData(data.allBookings);
          }

          // Xử lý lưu và chọn cơ sở ưu tiên
          if (returnedVenues.length > 0) {
            let activeId = selectedVenueId;
            if (!activeId) {
              const urlVenueId = new URLSearchParams(window.location.search).get("venueId");
              const storedVenueId = localStorage.getItem(LAST_VENUE_KEY);
              const matched =
                returnedVenues.find((v) => v.id === urlVenueId || v.slug === urlVenueId) ||
                returnedVenues.find((v) => v.id === storedVenueId || v.slug === storedVenueId);

              activeId = matched ? matched.id : data.selectedVenueId || returnedVenues[0].id;
              setSelectedVenueId(activeId);
            }
            localStorage.setItem(LAST_VENUE_KEY, activeId);
          }

          setError("");
        }
      } catch (err) {
        if (!signal?.aborted) {
          setError(err instanceof Error ? err.message : "Không tải được dữ liệu.");
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setTimelineLoading(false);
          setAllBookingsLoading(false);
        }
      }
    },
    [
      filter,
      selectedVenueId,
      timelineDate,
      allBookingsPage,
      allStatusFilter,
      allCourtFilter,
      allDateFilter,
      allSearchSubmitted,
    ]
  );

  // Đổi cơ sở
  const handleVenueChange = (newVenueId: string) => {
    setSelectedVenueId(newVenueId);
    if (typeof window !== "undefined") {
      localStorage.setItem(LAST_VENUE_KEY, newVenueId);
      const url = new URL(window.location.href);
      url.searchParams.set("venueId", newVenueId);
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Tải danh sách nhân viên cơ sở (chuẩn hóa contract và xử lý an toàn)
  const refreshStaff = useCallback(async () => {
    if (!selectedVenueId || user?.role === "STAFF") return;
    setStaffLoading(true);
    setStaffError("");
    try {
      const res = await fetch(`/api/venue-staff?venueId=${encodeURIComponent(selectedVenueId)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const list = Array.isArray(data.staffMembers)
          ? data.staffMembers
          : Array.isArray(data.staff)
          ? data.staff
          : Array.isArray(data.staff?.staff)
          ? data.staff.staff
          : [];
        setStaffList(list);
      } else {
        setStaffError(data.message || "Không tải được danh sách nhân viên.");
      }
    } catch (e) {
      console.error("Lỗi tải nhân viên:", e);
      setStaffError("Lỗi kết nối khi tải danh sách nhân viên.");
    } finally {
      setStaffLoading(false);
    }
  }, [selectedVenueId, user?.role]);

  // Polling chu kỳ 15 giây
  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController();
    setLoading(true);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      await refresh(controller.signal);
      if (!controller.signal.aborted) timer = setTimeout(poll, 15000);
    };
    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [allowed, refresh]);

  useEffect(() => {
    if (showStaffTab && selectedVenueId) {
      void refreshStaff();
    }
  }, [showStaffTab, selectedVenueId, refreshStaff]);

  // Bắt đầu / Kết thúc ca trực
  async function toggleShift(actionType: "START_SHIFT" | "END_SHIFT") {
    if (!selectedVenueId || busy) return;
    setBusy(true);
    setNotice("");
    try {
      const res = await fetch("/api/venue-operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          venueId: selectedVenueId,
          note: actionType === "START_SHIFT" ? "Bắt đầu ca trực lễ tân" : "Kết thúc ca trực lễ tân",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể cập nhật ca trực.");
      setNotice(actionType === "START_SHIFT" ? "Đã bắt đầu ca trực thành công!" : "Đã kết thúc ca trực thành công!");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra khi đổi ca.");
    } finally {
      setBusy(false);
    }
  }

  // Xác nhận thu tiền mặt (Bước 1)
  async function submitCashPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!cashModal || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setNotice("");
    setError("");

    try {
      const res = await fetch("/api/venue-operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CASH_PAID",
          id: cashModal.orderId,
          expectedAmount: cashModal.remaining,
          reason: cashNote.trim() || "Xác nhận đã nhận đủ tiền mặt tại quầy",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể xác nhận tiền mặt.");
      setNotice(`Đã thu ${formatVND(cashModal.remaining)} tiền mặt cho đơn ${cashModal.orderCode}.`);
      setCashModal(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi xác nhận tiền mặt.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  // Xác nhận Hoàn tất bàn giao (Bước 2) hoặc các thao tác khác
  async function submitAction(e: React.FormEvent) {
    e.preventDefault();
    if (!actionModal || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setNotice("");
    setError("");

    try {
      const res = await fetch("/api/venue-operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionModal.action,
          id: actionModal.id,
          reason: actionReason.trim() || "Nhân viên xác nhận hoàn tất và bàn giao sân",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Thao tác thất bại.");
      setNotice("Đã cập nhật trạng thái đơn thành công!");
      setActionModal(null);
      setActionReason("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi cập nhật.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  // Thêm nhân viên mới
  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVenueId || !newStaffIdentifier.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/venue-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId: selectedVenueId,
          identifier: newStaffIdentifier.trim(),
          role: "RECEPTIONIST",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể thêm nhân viên.");
      setNotice(`Đã thêm nhân viên ${data.staff?.name || data.staffMembers?.[0]?.name || "mới"} vào cụm sân!`);
      setNewStaffIdentifier("");
      await refreshStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi gán nhân viên.");
    } finally {
      setBusy(false);
    }
  }

  // Bật/tắt kích hoạt nhân viên
  async function handleToggleStaffActive(targetUserId: string, currentActive: boolean) {
    if (!selectedVenueId || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/venue-staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId: selectedVenueId,
          userId: targetUserId,
          isActive: !currentActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể đổi trạng thái nhân viên.");
      setNotice(
        currentActive
          ? "Đã vô hiệu hóa quyền làm việc của nhân viên tại cụm sân."
          : "Đã kích hoạt lại quyền làm việc của nhân viên!"
      );
      await refreshStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi cập nhật.");
    } finally {
      setBusy(false);
    }
  }

  // Nhấp ô trống trên Timeline -> mở CounterBookingModal với thông tin điền sẵn
  const handleCreateBookingFromTimeline = (
    courtId: string,
    _courtName: string,
    date: string,
    startMin: number,
    endMin: number
  ) => {
    if (user?.role === "STAFF" && !isOnShift) {
      setError("Bạn cần bấm 'Bắt đầu ca trực' trước khi tạo đơn tại quầy cho khách.");
      return;
    }
    setCounterInitialData({ courtId, date, startMin, endMin });
    setShowCounterModal(true);
  };

  // Nhấp ô đã đặt trên Timeline -> mở in hóa đơn hoặc xem chi tiết
  const handleSelectSlotFromTimeline = (slot: TimelineSlot) => {
    if (slot.bookingId) {
      const matched =
        orders.find((o) => o.id === slot.bookingId) ||
        allBookingsData.items.find((b) => b.id === slot.bookingId);
      if (matched) {
        if (matched.remaining === 0) {
          setPrintOrder(matched as ReceiptOrder);
        } else {
          setNotice(`Đơn ${matched.code} còn thiếu ${formatVND(matched.remaining)}. Hãy thu tiền mặt trước khi in hóa đơn.`);
        }
      }
    }
  };

  // Xử lý action từ danh sách toàn bộ đơn
  const handleActionFromAllBookings = (
    booking: BookingOrderItem,
    actionType: "CHECK_IN" | "CASH" | "COMPLETE" | "CANCEL" | "PRINT"
  ) => {
    if (actionType === "PRINT") {
      if (booking.remaining > 0 || booking.status === "CANCELLED") {
        setError(`Đơn ${booking.code} chưa hoàn tất thanh toán hoặc đã bị hủy, không thể in hóa đơn.`);
        return;
      }
      setPrintOrder(booking as ReceiptOrder);
      return;
    }

    if (actionType === "CASH") {
      setCashModal({
        orderId: booking.id,
        orderCode: booking.code,
        courtName: booking.items.map((i) => i.court.name).join(", "),
        remaining: booking.remaining,
      });
      return;
    }

    if (actionType === "CHECK_IN") {
      setActionModal({
        id: booking.id,
        action: "CHECK_IN",
        title: `Xác nhận nhận sân cho đơn ${booking.code}`,
      });
      return;
    }

    if (actionType === "COMPLETE") {
      setActionModal({
        id: booking.id,
        action: "COMPLETE",
        title: `Xác nhận hoàn tất và bàn giao sân cho đơn ${booking.code}`,
      });
      return;
    }

    if (actionType === "CANCEL") {
      setActionModal({
        id: booking.id,
        action: "CANCEL",
        title: `Hủy đơn ${booking.code}`,
      });
      return;
    }
  };

  if (isLoading) return <p className="p-8 text-center text-sm text-muted">Đang kiểm tra quyền...</p>;

  if (!allowed) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-bold text-ink">Quản lý tại sân</h1>
        <p className="my-4 text-sm text-muted">
          Chỉ chủ sân, nhân viên được phân quyền và quản trị viên được truy cập khu vực này.
        </p>
        <Link href="/login" className="inline-block rounded-control bg-court-600 px-4 py-2 text-xs font-semibold text-white">
          Đăng nhập lại
        </Link>
      </div>
    );
  }

  // Trường hợp STAFF chưa có cơ sở nào được gán
  if (user?.role === "STAFF" && !loading && venues.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-card border border-amber-300 bg-amber-50/60 p-8 dark:border-amber-900/60 dark:bg-amber-950/20 shadow-sm">
          <ShieldCheck size={48} className="mx-auto text-amber-600 mb-3" />
          <h1 className="text-xl font-bold text-ink">Chưa được phân công cơ sở</h1>
          <p className="mt-3 text-sm text-ink leading-relaxed">
            Tài khoản nhân viên <span className="font-semibold">{user.name}</span> ({user.phone || user.email}) hiện chưa được gán vào cơ sở nào trên SmashBook.
          </p>
          <p className="mt-2 text-xs text-muted">
            Vui lòng liên hệ Chủ sân hoặc Quản trị viên để được cấp quyền làm việc tại cơ sở.
          </p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-6 inline-flex items-center gap-1.5 rounded-control bg-court-600 px-4 py-2 text-xs font-semibold text-white hover:bg-court-700"
          >
            <RefreshCw size={13} /> Thử tải lại
          </button>
        </div>
      </main>
    );
  }

  const currentShiftMeta = shiftsByVenue[selectedVenueId];
  const isOnShift = !!currentShiftMeta?.myShiftId;
  const venueCourts = courtsByVenue[selectedVenueId] || [];

  // Danh sách các sân con dạng id, name phục vụ bộ lọc
  const courtFilterOptions = venueCourts.map((c) => ({ id: c.id, name: c.name }));

  // Venue metadata phục vụ in phiếu
  const activeReceiptVenue: ReceiptVenue | null = selectedVenueMeta
    ? {
        id: selectedVenueMeta.id,
        name: selectedVenueMeta.name,
        address: selectedVenueMeta.address,
        phone: selectedVenueMeta.phone,
      }
    : venues.find((v) => v.id === selectedVenueId)
    ? {
        id: selectedVenueId,
        name: venues.find((v) => v.id === selectedVenueId)!.name,
      }
    : null;

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      {/* Header & Thanh chọn Cơ sở */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-ink">Quản lý & Bàn giao sân</h1>
            {user?.role === "STAFF" && (
              <span className="rounded bg-court-100 px-2 py-0.5 text-xs font-semibold text-court-700 dark:bg-court-950 dark:text-court-300">
                Lễ tân
              </span>
            )}
          </div>
          <p className="text-sm text-muted">
            Theo dõi phiên sử dụng, thu tiền mặt, in hóa đơn và bàn giao sân chính xác theo thời gian thực.
          </p>
        </div>

        {venues.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted">Cụm sân:</span>
            <select
              value={selectedVenueId}
              onChange={(e) => handleVenueChange(e.target.value)}
              className="rounded-control border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink focus:border-court-500 focus:outline-none"
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Thông báo trạng thái */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-control bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-control bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          <CheckCircle size={16} />
          <span>{notice}</span>
        </div>
      )}

      {/* Thanh Ca Trực Lễ Tân & Các Nút Thao Tác Nhanh */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              isOnShift
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            <Clock size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink">
                {isOnShift ? "Bạn đang đứng ca trực tại cụm sân này" : "Bạn chưa vào ca trực"}
              </span>
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  isOnShift ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
                }`}
              />
            </div>
            <p className="text-xs text-muted">
              {isOnShift
                ? "Các phiên hết giờ sẽ chờ bạn xác nhận thu tiền và bấm hoàn tất thủ công."
                : currentShiftMeta?.hasActiveShift
                ? "Có đồng nghiệp đang đứng ca trực tại cơ sở này."
                : "Không có ca trực nào: các đơn online đã trả đủ sẽ tự hoàn tất sau 1 phút hết giờ."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Nút "Nhân viên tạo đơn" */}
          <button
            type="button"
            onClick={() => {
              if (user.role === "STAFF" && !isOnShift) {
                setError("Bạn cần bấm 'Bắt đầu ca trực' trước khi tạo đơn tại quầy cho khách.");
                return;
              }
              setCounterInitialData({});
              setShowCounterModal(true);
            }}
            className="rounded-control bg-court-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-court-700 shadow-sm inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Nhân viên tạo đơn
          </button>

          {isOnShift ? (
            <button
              disabled={busy}
              onClick={() => void toggleShift("END_SHIFT")}
              className="rounded-control border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
            >
              {busy ? "Đang lưu..." : "Kết thúc ca trực"}
            </button>
          ) : (
            <button
              disabled={busy}
              onClick={() => void toggleShift("START_SHIFT")}
              className="rounded-control border border-court-600 bg-court-50 px-3 py-1.5 text-xs font-semibold text-court-700 hover:bg-court-100 dark:bg-court-950/40 dark:text-court-300"
            >
              {busy ? "Đang lưu..." : "Bắt đầu ca trực"}
            </button>
          )}

          {["ADMIN", "OWNER"].includes(user.role) && (
            <>
              <button
                type="button"
                onClick={() => setShowCourtsModal(true)}
                className="rounded-control border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-court-50 inline-flex items-center gap-1"
              >
                <Settings size={13} /> Sân & Bảng giá
              </button>
              <button
                onClick={() => setShowStaffTab(!showStaffTab)}
                className="rounded-control border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-court-50"
              >
                {showStaffTab ? "Ẩn nhân viên" : "Nhân viên cụm sân"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Khu Vực Quản Lý Nhân Viên Dành Riêng Cho Chủ Sân */}
      {showStaffTab && ["ADMIN", "OWNER"].includes(user.role) && (
        <section className="space-y-4 rounded-card border border-court-500/30 bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink">
              <ShieldCheck size={18} className="text-court-600" />
              <span>Quản lý nhân viên cơ sở</span>
            </h2>
            <button
              type="button"
              onClick={() => void refreshStaff()}
              className="flex items-center gap-1 text-xs text-court-600 hover:underline"
            >
              <RefreshCw size={12} className={staffLoading ? "animate-spin" : ""} /> Làm mới
            </button>
          </div>

          <form onSubmit={handleAddStaff} className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Nhập số điện thoại hoặc email nhân viên..."
              value={newStaffIdentifier}
              onChange={(e) => setNewStaffIdentifier(e.target.value)}
              className="min-w-[280px] flex-1 rounded-control border border-border bg-surface px-3 py-2 text-xs text-ink focus:border-court-500 focus:outline-none"
              required
            />
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-control bg-court-600 px-4 py-2 text-xs font-semibold text-white hover:bg-court-700"
            >
              <UserPlus size={14} /> Thêm nhân viên
            </button>
          </form>

          {staffError && (
            <p className="text-xs font-semibold text-rose-600">{staffError}</p>
          )}

          <div className="divide-y divide-border/60 text-xs">
            {staffLoading ? (
              <p className="py-3 text-muted">Đang tải danh sách nhân viên...</p>
            ) : !staffList.length ? (
              <p className="py-3 text-muted">Chưa có nhân viên nào được gán vào cụm sân này.</p>
            ) : (
              staffList.map((st) => (
                <div key={st.userId} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <span className="font-bold text-ink">{st.name}</span> ·{" "}
                    <span className="text-muted">{st.phone || st.email}</span>
                    <span className="ml-2 inline-block rounded bg-court-100 px-1.5 py-0.5 text-[10px] font-semibold text-court-700 dark:bg-court-950 dark:text-court-300">
                      {st.role}
                    </span>
                    {st.isOnShift && (
                      <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Đang trong ca trực
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleToggleStaffActive(st.userId, st.isActive)}
                    className={`inline-flex items-center gap-1 rounded-control px-3 py-1 font-semibold ${
                      st.isActive
                        ? "border border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    {st.isActive ? (
                      <>
                        <UserX size={12} /> Vô hiệu hóa
                      </>
                    ) : (
                      <>
                        <UserCheck size={12} /> Kích hoạt lại
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Trạng Thái Sân Con Theo Thời Gian Thực (Quick overview) */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
          Trạng thái sân theo thời gian thực
        </h2>

        {!venueCourts.length ? (
          <p className="text-xs text-muted">Không có dữ liệu sân cho cơ sở này.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {venueCourts.map((court) => {
              const isOverdue = court.status === "OVERDUE";
              const inUse = court.status === "IN_USE";

              return (
                <div
                  key={court.id}
                  className={`relative rounded-card border p-4 shadow-sm transition-all ${
                    isOverdue
                      ? "border-rose-400 bg-rose-50/50 dark:bg-rose-950/20"
                      : inUse
                      ? "border-amber-400 bg-amber-50/40 dark:bg-amber-950/20"
                      : "border-border bg-surface"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink">{court.name}</span>
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                        isOverdue
                          ? "bg-rose-600 text-white"
                          : inUse
                          ? "bg-amber-500 text-white"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      }`}
                    >
                      {isOverdue ? "Hết giờ – chờ hoàn tất" : inUse ? "Đang sử dụng" : "Trống"}
                    </span>
                  </div>

                  {court.currentBooking && (
                    <div className="mt-3 space-y-1 text-xs">
                      <p className="font-semibold text-ink">
                        {court.currentBooking.code} · {court.currentBooking.customerName}
                      </p>
                      <p className="text-muted">
                        Khung giờ: {formatHour(court.currentBooking.startMin)} - {formatHour(court.currentBooking.endMin)}
                      </p>
                      {inUse && (
                        <p className="font-medium text-amber-600 dark:text-amber-400">
                          Còn lại: {court.currentBooking.remainingMin} phút
                        </p>
                      )}
                      {court.currentBooking.remainingAmount > 0 ? (
                        <p className="font-semibold text-rose-600">
                          Còn thiếu: {formatVND(court.currentBooking.remainingAmount)}
                        </p>
                      ) : (
                        <p className="font-semibold text-emerald-600">Đã thanh toán đủ</p>
                      )}
                    </div>
                  )}

                  {court.conflictWarning && (
                    <div className="mt-2 rounded bg-rose-100 p-1.5 text-[11px] font-bold text-rose-800 dark:bg-rose-950/80 dark:text-rose-200">
                      ⚠️ {court.conflictWarning}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Tabs Chuyển Đổi Khu Vực Quản Lý */}
      <div className="flex border-b border-border/70">
        <button
          type="button"
          onClick={() => setActiveTab("OPERATIONS")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-colors ${
            activeTab === "OPERATIONS"
              ? "border-court-600 text-court-600"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          <Layers size={16} />
          <span>Phiên sử dụng & Chờ bàn giao</span>
          <span className="rounded-full bg-court-100 px-2 py-0.5 text-xs font-semibold text-court-700 dark:bg-court-950 dark:text-court-300">
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TIMELINE")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-colors ${
            activeTab === "TIMELINE"
              ? "border-court-600 text-court-600"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          <CalendarDays size={16} />
          <span>Lịch sân thời gian thực (Timeline)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ALL_BOOKINGS")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-colors ${
            activeTab === "ALL_BOOKINGS"
              ? "border-court-600 text-court-600"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          <ListOrdered size={16} />
          <span>Danh sách đơn đặt sân</span>
          <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {allBookingsData.total}
          </span>
        </button>
      </div>

      {/* TAB 1: PHIÊN SỬ DỤNG & CHỜ BÀN GIAO */}
      {activeTab === "OPERATIONS" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
              Danh sách phiên sử dụng & chờ bàn giao ({orders.length})
            </h2>

            {/* Tìm kiếm đơn */}
            <div className="flex w-full sm:w-auto items-center gap-2">
              <input
                aria-label="Tìm mã đơn"
                placeholder="Tìm mã đơn DATSAN, tên hoặc SĐT..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setFilter(query.trim());
                }}
                className="w-full sm:w-64 rounded-control border border-border bg-surface p-2 text-xs text-ink focus:border-court-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setFilter(query.trim())}
                className="rounded-control border border-border px-3 py-2 text-xs font-semibold text-ink hover:bg-court-50"
              >
                Tìm
              </button>
              <button
                type="button"
                onClick={() => void refresh()}
                className="rounded-control border border-border px-3 py-2 text-xs font-semibold text-ink hover:bg-court-50"
              >
                Làm mới
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted">Đang tải danh sách đơn...</p>
          ) : !orders.length ? (
            <div className="rounded-card border border-border bg-surface p-8 text-center text-sm text-muted">
              Không có đơn nào đang trong phiên sử dụng hoặc chờ bàn giao tại cơ sở này.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {orders.map((order) => {
                const courtNames = order.items.map((i) => i.court.name).join(", ");
                const canComplete = order.isOverdue && order.remaining === 0;

                return (
                  <article
                    key={order.id}
                    className={`space-y-3 rounded-card border bg-surface p-5 shadow-sm transition-all ${
                      order.sessionStatus === "OVERDUE_PENDING"
                        ? "border-rose-400/80 bg-rose-50/20"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-ink">
                          {order.code} · {courtNames}
                        </h3>
                        <p className="text-xs text-muted">
                          {order.customerName} · {order.customerPhone}
                        </p>
                      </div>

                      <span
                        className={`rounded px-2.5 py-1 text-xs font-bold ${
                          order.sessionStatus === "OVERDUE_PENDING"
                            ? "bg-rose-600 text-white"
                            : order.status === "CHECKED_IN"
                            ? "bg-emerald-600 text-white"
                            : "bg-court-600 text-white"
                        }`}
                      >
                        {order.sessionStatus === "OVERDUE_PENDING"
                          ? "Hết giờ – Chờ hoàn tất"
                          : order.status === "CHECKED_IN"
                          ? "Đã nhận sân"
                          : "Đã xác nhận"}
                      </span>
                    </div>

                    {/* Lịch sân */}
                    <div className="space-y-1 rounded bg-court-50/40 p-2.5 text-xs text-muted dark:bg-surface">
                      {order.items.map((item, idx) => (
                        <p key={idx}>
                          {item.court.name} · {item.date.slice(0, 10)} · {formatHour(item.startMin)} – {formatHour(item.endMin)}
                        </p>
                      ))}
                    </div>

                    {/* Chi tiết tài chính & thanh toán */}
                    <div className="flex flex-wrap items-center justify-between border-t border-border/60 pt-2 text-xs">
                      <div>
                        <p className="text-muted">
                          Tổng tiền: <span className="font-bold text-ink">{formatVND(order.total)}</span>
                        </p>
                        <p className="text-muted">
                          Đã thu: <span className="font-semibold text-emerald-600">{formatVND(order.totalPaid)}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        {order.remaining > 0 ? (
                          <p className="font-bold text-rose-600">
                            Còn thiếu: {formatVND(order.remaining)}
                          </p>
                        ) : (
                          <p className="font-bold text-emerald-600">
                            Đã thanh toán đủ (100%)
                          </p>
                        )}
                        <p className="text-[11px] text-muted">
                          Phương thức: {order.paymentMethod || "Tiền mặt tại sân"}
                        </p>
                      </div>
                    </div>

                    {/* Thanh điều khiển thao tác */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                      {/* Duyệt đơn (CONFIRM) cho đơn chờ thanh toán */}
                      {order.status === "PENDING_PAYMENT" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            setActionModal({
                              id: order.id,
                              action: "CONFIRM",
                              title: `Duyệt xác nhận đơn ${order.code}`,
                            })
                          }
                          className="rounded-control bg-court-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-court-700"
                        >
                          Duyệt đơn
                        </button>
                      )}

                      {/* Bước 1: Thu tiền mặt nếu còn thiếu */}
                      {order.remaining > 0 && order.status !== "CANCELLED" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            setCashModal({
                              orderId: order.id,
                              orderCode: order.code,
                              courtName: courtNames,
                              remaining: order.remaining,
                            })
                          }
                          className="rounded-control bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                        >
                          Đã thu tiền mặt ({formatVND(order.remaining)})
                        </button>
                      )}

                      {/* Nhận sân */}
                      {order.status === "CONFIRMED" &&
                        (order.remaining === 0 || order.hasCashPayment || order.paymentMethod === "CASH") && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              setActionModal({
                                id: order.id,
                                action: "CHECK_IN",
                                title: `Xác nhận nhận sân cho đơn ${order.code}`,
                              })
                            }
                            className="rounded-control bg-court-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-court-700"
                          >
                            Nhận sân
                          </button>
                        )}

                      {/* Bước 2: Nút Hoàn tất & Bàn giao sân */}
                      <button
                        type="button"
                        disabled={busy || !canComplete}
                        onClick={() =>
                          setActionModal({
                            id: order.id,
                            action: "COMPLETE",
                            title: `Xác nhận hoàn tất và bàn giao sân cho đơn ${order.code}`,
                          })
                        }
                        className={`rounded-control px-3.5 py-1.5 text-xs font-bold text-white transition-all ${
                          canComplete
                            ? "bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                            : "bg-zinc-400 cursor-not-allowed opacity-60"
                        }`}
                        title={
                          !order.isOverdue
                            ? "Chưa hết giờ thực tế của booking"
                            : order.remaining > 0
                            ? "Cần thu đủ tiền trước khi hoàn tất"
                            : "Sẵn sàng bàn giao sân"
                        }
                      >
                        Hoàn tất & Bàn giao sân
                      </button>

                      {/* In hóa đơn nhiệt 80mm nếu đã thanh toán đủ 100% */}
                      {order.remaining === 0 && order.status !== "CANCELLED" && (
                        <button
                          type="button"
                          onClick={() => setPrintOrder(order as unknown as ReceiptOrder)}
                          className="inline-flex items-center gap-1 rounded-control border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-court-50"
                          title="In hóa đơn nhiệt 80mm"
                        >
                          <Printer size={13} /> In phiếu
                        </button>
                      )}

                      {order.refundNeedsReview && (
                        <span className="text-xs text-amber-700">
                          Khoản hoàn cũ cần đối soát chứng từ trước khi chi tiền.
                        </span>
                      )}

                      {/* Quy trình hoàn tiền */}
                      {order.refundPending > 0 && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setRefundModal({ booking: order, mode: "RECORD" })}
                          className="rounded-control bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                        >
                          Ghi nhận hoàn tiền ({formatVND(order.refundPending)})
                        </button>
                      )}

                      {/* Nếu có yêu cầu hủy chờ duyệt và là OWNER / ADMIN */}
                      {order.cancelRequestedAt &&
                        ["PENDING_PAYMENT", "CONFIRMED"].includes(order.status) &&
                        !order.refundNeedsReview &&
                        !order.cancelApprovedAt &&
                        ["ADMIN", "OWNER"].includes(user.role) && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setRefundModal({ booking: order, mode: "APPROVE" })}
                            className="rounded-control bg-court-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-court-700 shadow-sm"
                          >
                            Duyệt hủy & hoàn tiền
                          </button>
                        )}

                      {order.cancelRequestedAt && !order.cancelApprovedAt && user.role === "STAFF" && (
                        <span className="rounded bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Chờ chủ sân duyệt hủy
                        </span>
                      )}

                      {/* Hủy đơn / Yêu cầu hủy */}
                      {["PENDING_PAYMENT", "CONFIRMED"].includes(order.status) && !order.cancelRequestedAt && (
                        order.totalPaid > 0 ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              if (["ADMIN", "OWNER"].includes(user.role)) {
                                setRefundModal({ booking: order, mode: "APPROVE" });
                              } else {
                                setActionModal({
                                  id: order.id,
                                  action: "CANCEL_REQUEST",
                                  title: `Gửi yêu cầu hủy đơn đã thanh toán ${order.code}`,
                                });
                              }
                            }}
                            className="rounded-control border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            {["ADMIN", "OWNER"].includes(user.role) ? "Hủy & Duyệt hoàn tiền" : "Yêu cầu hủy"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              setActionModal({
                                id: order.id,
                                action: "CANCEL",
                                title: `Hủy đơn chưa thanh toán ${order.code}`,
                              })
                            }
                            className="rounded-control border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            Hủy đơn
                          </button>
                        )
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: LỊCH SÂN THỜI GIAN THỰC (TIMELINE GRID) */}
      {activeTab === "TIMELINE" && (
        <VenueScheduleTimeline
          schedule={timelineSchedule}
          selectedDate={timelineDate}
          onSelectDate={(newDate) => {
            setTimelineDate(newDate);
            setTimelineLoading(true);
          }}
          onSelectSlot={handleSelectSlotFromTimeline}
          onCreateBookingAtSlot={handleCreateBookingFromTimeline}
          loading={timelineLoading}
          onRefresh={() => void refresh()}
        />
      )}

      {/* TAB 3: DANH SÁCH TOÀN BỘ ĐƠN ĐẶT SÂN */}
      {activeTab === "ALL_BOOKINGS" && (
        <VenueAllBookingsSection
          bookings={allBookingsData.items}
          total={allBookingsData.total}
          page={allBookingsData.page}
          pageSize={allBookingsData.pageSize}
          totalPages={allBookingsData.totalPages}
          onPageChange={(p) => {
            setAllBookingsPage(p);
            setAllBookingsLoading(true);
          }}
          courts={courtFilterOptions}
          statusFilter={allStatusFilter}
          onStatusFilterChange={(s) => {
            setAllStatusFilter(s);
            setAllBookingsPage(1);
          }}
          courtFilter={allCourtFilter}
          onCourtFilterChange={(c) => {
            setAllCourtFilter(c);
            setAllBookingsPage(1);
          }}
          dateFilter={allDateFilter}
          onDateFilterChange={(d) => {
            setAllDateFilter(d);
            setAllBookingsPage(1);
          }}
          searchQuery={allSearchInput}
          onSearchQueryChange={(q) => setAllSearchInput(q)}
          onSearchSubmit={(e) => {
            e.preventDefault();
            setAllSearchSubmitted(allSearchInput.trim());
            setAllBookingsPage(1);
          }}
          loading={allBookingsLoading}
          onAction={handleActionFromAllBookings}
        />
      )}

      {/* MODAL BƯỚC 1: XÁC NHẬN THU TIỀN MẶT */}
      {cashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-card border border-border bg-surface p-6 shadow-xl">
            <h2 className="text-lg font-bold text-ink">Xác nhận đã nhận tiền mặt</h2>
            <p className="text-sm leading-relaxed text-ink">
              Bạn có chắc chắn đã nhận đủ{" "}
              <span className="font-bold text-court-600">{formatVND(cashModal.remaining)}</span>{" "}
              tiền mặt cho sân <span className="font-semibold">{cashModal.courtName}</span>, booking{" "}
              <span className="font-semibold">{cashModal.orderCode}</span> chưa?
            </p>

            <form onSubmit={submitCashPayment} className="space-y-4">
              <label className="block text-xs font-semibold text-muted">
                Ghi chú thu tiền (tùy chọn)
                <input
                  type="text"
                  value={cashNote}
                  onChange={(e) => setCashNote(e.target.value)}
                  className="mt-1 w-full rounded-control border border-border bg-surface p-2.5 text-xs text-ink focus:border-court-500 focus:outline-none"
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setCashModal(null)}
                  className="rounded-control border border-border px-4 py-2 text-xs font-semibold text-muted hover:bg-court-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-control bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {busy ? "Đang lưu..." : "Xác nhận đã nhận tiền"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BƯỚC 2: XÁC NHẬN HOÀN TẤT / THAO TÁC KHÁC */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-card border border-border bg-surface p-6 shadow-xl">
            <h2 className="text-lg font-bold text-ink">{actionModal.title}</h2>
            {actionModal.action === "COMPLETE" && (
              <p className="text-xs text-muted">
                Sân sẽ được tính toán lại trạng thái khả dụng cho lịch tiếp theo sau khi bạn hoàn tất bàn giao.
              </p>
            )}

            <form onSubmit={submitAction} className="space-y-4">
              <label className="block text-xs font-semibold text-muted">
                Ghi chú thao tác
                <textarea
                  required
                  minLength={5}
                  maxLength={500}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Ghi rõ lý do hoặc biên bản bàn giao (tối thiểu 5 ký tự)..."
                  className="mt-1 w-full rounded-control border border-border bg-surface p-2.5 text-xs text-ink focus:border-court-500 focus:outline-none"
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setActionModal(null)}
                  className="rounded-control border border-border px-4 py-2 text-xs font-semibold text-muted hover:bg-court-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-control bg-court-600 px-4 py-2 text-xs font-bold text-white hover:bg-court-700 disabled:opacity-50"
                >
                  {busy ? "Đang lưu..." : "Xác nhận thực hiện"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nhân viên tạo đơn tại quầy */}
      <CounterBookingModal
        isOpen={showCounterModal}
        onClose={() => {
          setShowCounterModal(false);
          setCounterInitialData({});
        }}
        venueId={selectedVenueId}
        venueName={venues.find((v) => v.id === selectedVenueId)?.name || "Cụm sân"}
        initialCourtId={counterInitialData.courtId}
        initialDate={counterInitialData.date}
        initialStartMin={counterInitialData.startMin}
        initialEndMin={counterInitialData.endMin}
        onSuccess={() => {
          setNotice("Đã tạo đơn tại quầy cho khách thành công!");
          void refresh();
        }}
      />

      {/* Modal Quản lý sân con, bảng giá & khóa khung giờ */}
      <VenueCourtsModal
        isOpen={showCourtsModal}
        onClose={() => setShowCourtsModal(false)}
        venueId={selectedVenueId}
        venueName={venues.find((v) => v.id === selectedVenueId)?.name || "Cụm sân"}
        onUpdated={() => {
          void refresh();
        }}
      />

      {/* Modal Duyệt hủy & Hoàn tiền 2 bước */}
      <RefundModal
        key={refundModal ? `${refundModal.booking.id}:${refundModal.mode}` : "closed"}
        isOpen={Boolean(refundModal)}
        onClose={() => setRefundModal(null)}
        booking={refundModal?.booking || null}
        mode={refundModal?.mode || "APPROVE"}
        onSuccess={() => {
          setNotice("Đã cập nhật trạng thái hủy và hoàn tiền thành công!");
          void refresh();
        }}
      />

      {/* Modal In Hóa Đơn Nhiệt 80mm */}
      <ReceiptPrintModal
        isOpen={Boolean(printOrder)}
        onClose={() => setPrintOrder(null)}
        booking={printOrder}
        venue={activeReceiptVenue}
        staffName={user?.name || "Lễ tân SmashBook"}
      />
    </main>
  );
}
