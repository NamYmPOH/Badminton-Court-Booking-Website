"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  CalendarDays,
  Wallet,
  Users,
  History,
  RefreshCw,
  ArrowRightLeft,
  LayoutDashboard,
  X,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

const tabs = [
  ["overview", "Tổng quan", LayoutDashboard],
  ["venues", "Duyệt cơ sở", Building2],
  ["bookings", "Đặt sân", CalendarDays],
  ["payments", "Thanh toán", Wallet],
  ["receipts", "Đối soát SePay", ArrowRightLeft],
  ["users", "Tài khoản & quyền", Users],
  ["audit", "Nhật ký", History],
] as const;
type Tab = (typeof tabs)[number][0];
type Row = {
  id: string;
  name?: string;
  code?: string;
  slug?: string;
  status?: string;
  role?: string;
  email?: string;
  phone?: string;
  address?: string;
  district?: string;
  paymentMode?: string;
  paymentStatus?: string;
  customerName?: string;
  customerPhone?: string;
  total?: number;
  amount?: number;
  txnRef?: string;
  provider?: string;
  result?: string;
  content?: string;
  gateway?: string;
  accountLast4?: string;
  bookingCode?: string;
  expiresAt?: string;
  createdAt?: string;
  receivedAt?: string;
  paidAt?: string;
  actorName?: string;
  action?: string;
  reason?: string;
  entityId?: string;
  details?: unknown;
  venue?: { name: string; paymentMode: string };
  owner?: { name: string };
  booking?: { code: string; customerName: string };
  _count?: { courts: number; pricing: number };
  items?: {
    date: string;
    startMin: number;
    endMin: number;
    court: { name: string };
  }[];
};
type Action = {
  action: string;
  id: string;
  title: string;
  status?: string;
  role?: string;
  bookingCode?: string;
};
const labels: Record<string, string> = {
  ACTIVE: "Hoạt động",
  PENDING: "Chờ duyệt",
  SUSPENDED: "Tạm ngưng",
  BLOCKED: "Đã khóa",
  ADMIN: "Quản trị viên",
  OWNER: "Chủ sân",
  STAFF: "Nhân viên",
  CUSTOMER: "Khách hàng",
  PENDING_PAYMENT: "Chờ thanh toán",
  CONFIRMED: "Đã xác nhận",
  CHECKED_IN: "Đã nhận sân",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
  NO_SHOW: "Không đến",
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  REFUND_PENDING: "Chờ hoàn tiền",
  REFUNDED: "Đã hoàn tiền",
  FAILED: "Thất bại",
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
  ONLINE_FULL: "Thanh toán online",
  AT_VENUE: "Trả tại sân",
  REVIEW_BOOKING_CODE: "Thiếu / sai mã đơn",
  REVIEW_BOOKING_NOT_FOUND: "Không tìm thấy đơn",
  REVIEW_BOOKING_NOT_PENDING: "Đơn không chờ thanh toán",
  REVIEW_EXPIRED: "Đơn đã hết hạn",
  REVIEW_AMOUNT_MISMATCH: "Lệch số tiền",
  REVIEW_SLOT_RELEASED: "Đã nhả sân",
  REVIEW_WRONG_ACCOUNT: "Sai tài khoản nhận",
  IGNORED_OUTGOING: "Tiền ra",
  PAID_MANUAL_MATCH: "Đã ghép giao dịch",
  VENUE_STATUS: "Duyệt trạng thái cơ sở",
  USER_ACCESS: "Thay đổi quyền",
  MATCH_RECEIPT: "Ghép giao dịch",
  CASH_PAID: "Ghi nhận tiền mặt",
  CANCEL: "Hủy đơn",
  CONFIRM: "Xác nhận đơn",
  CHECK_IN: "Nhận sân",
  COMPLETE: "Hoàn tất đơn",
  IMPORT_CATALOG: "Nhập danh sách sân",
  BOOTSTRAP_ADMIN: "Thiết lập quản trị viên",
};
const money = (n = 0) => n.toLocaleString("vi-VN") + " đ";
const date = (s?: string) =>
  s
    ? new Date(s).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
    : "—";
const time = (n: number) =>
  `${Math.floor(n / 60)
    .toString()
    .padStart(2, "0")}:${(n % 60).toString().padStart(2, "0")}`;
const button =
  "rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-court-500/10 disabled:opacity-40 disabled:cursor-not-allowed";
const field =
  "w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink";
function Badge({ value = "" }: { value?: string }) {
  const good = [
    "ACTIVE",
    "PAID",
    "CONFIRMED",
    "COMPLETED",
    "PAID_MANUAL_MATCH",
  ].includes(value);
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${good ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-700 dark:text-amber-400"}`}
    >
      {labels[value] || value}
    </span>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [actor, setActor] = useState({ id: "", name: "" });
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    setError("");
    setRows([]);
    fetch(
      `/api/admin?${new URLSearchParams({ tab, page: String(page), q: search, pending: String(pending) })}`,
      { cache: "no-store", signal: abort.signal },
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Không tải được dữ liệu.");
        return data;
      })
      .then((data) => {
        setActor(data.actor);
        setRows(data.rows || []);
        setStats(data.stats || {});
        setHasMore(data.hasMore || false);
      })
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [tab, page, search, pending, refresh]);
  const choose = (next: Tab) => {
    setTab(next);
    setPage(1);
    setPending(false);
    setQ("");
    setSearch("");
    setMessage("");
  };
  const open = (next: Action) => {
    setAction(next);
    setReason("");
    setActionError("");
  };
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!action || saving) return;
    setSaving(true);
    setActionError("");
    try {
      const { title, ...body } = action;
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, reason }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Không thực hiện được thao tác.");
      setAction(null);
      setMessage(`${title}: đã lưu và ghi nhật ký.`);
      setRefresh((v) => v + 1);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
    } finally {
      setSaving(false);
    }
  }
  const actionButton = (
    title: string,
    next: Omit<Action, "title">,
    disabled = false,
  ) => (
    <button
      key={title}
      disabled={disabled}
      className={button}
      onClick={() => open({ ...next, title })}
    >
      {title}
    </button>
  );
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-6">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-court-500">
            <ShieldCheck size={18} /> SMASHBOOK / QUẢN TRỊ
          </p>
          <h1 className="text-3xl font-bold text-ink">Trung tâm quản trị</h1>
          <p className="mt-2 text-sm text-muted">
            {actor.name
              ? `${actor.name} · Quản trị viên`
              : "Đang kiểm tra quyền truy cập…"}
          </p>
        </div>
        <Link href="/" className={button}>
          Về website ↗
        </Link>
      </div>
      <nav
        aria-label="Chức năng quản trị"
        className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-2"
      >
        {tabs.map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => choose(key)}
            aria-current={tab === key ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium ${tab === key ? "bg-court-600 text-white" : "text-muted hover:bg-court-500/10"}`}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>
      {message && (
        <p
          role="status"
          className="mb-4 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-600"
        >
          {message}
        </p>
      )}
      {tab !== "overview" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(q.trim());
          }}
          className="mb-5 flex flex-wrap items-center gap-3"
        >
          <input
            aria-label="Tìm kiếm"
            placeholder="Tìm tên, mã đơn hoặc mã giao dịch…"
            maxLength={80}
            className={`${field} sm:max-w-sm`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className={button}>Tìm kiếm</button>
          {["venues", "bookings", "receipts", "payments"].includes(tab) && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pending}
                onChange={(e) => {
                  setPending(e.target.checked);
                  setPage(1);
                }}
              />
              {tab === "payments"
                ? "Chờ hoàn tiền"
                : tab === "receipts"
                  ? "Cần đối soát"
                  : tab === "bookings"
                    ? "Đang chờ thanh toán"
                    : "Chờ duyệt"}
            </label>
          )}
          <button
            type="button"
            aria-label="Tải lại"
            className={button}
            onClick={() => setRefresh((v) => v + 1)}
          >
            <RefreshCw size={17} />
          </button>
        </form>
      )}
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-400/40 p-6 text-red-500"
        >
          {error}
          <button
            className={`${button} ml-4`}
            onClick={() => setRefresh((v) => v + 1)}
          >
            Thử lại
          </button>
        </div>
      ) : loading ? (
        <p role="status" className="py-16 text-center text-muted">
          Đang tải dữ liệu…
        </p>
      ) : (
        <>
          {tab === "overview" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["venues", "Cơ sở hoạt động"],
                  ["pendingVenues", "Cơ sở chờ duyệt"],
                  ["bookings", "Đơn đang xử lý"],
                  ["reviewPayments", "Giao dịch cần đối soát"],
                  ["refundPending", "Đơn chờ hoàn tiền"],
                  ["users", "Tài khoản"],
                ].map(([key, label]) => (
                  <div
                    key={key}
                    className="rounded-xl border border-border bg-surface p-5"
                  >
                    <p className="text-sm text-muted">{label}</p>
                    <p className="mt-3 text-3xl font-bold tabular-nums">
                      {stats[key] || 0}
                    </p>
                  </div>
                ))}
                <div className="rounded-xl border border-border bg-surface p-5 sm:col-span-2">
                  <p className="text-sm text-muted">
                    Tổng tiền của giao dịch ở trạng thái đã thanh toán
                  </p>
                  <p className="mt-3 text-3xl font-bold text-court-500">
                    {money(stats.revenue)}
                  </p>
                </div>
              </div>
              <div className="mt-6 rounded-xl border border-border bg-surface p-6">
                <h2 className="font-semibold">Quyền quản trị đang áp dụng</h2>
                <p className="mt-2 text-sm leading-7 text-muted">
                  Chỉ tài khoản ADMIN đang hoạt động được truy cập trang này và
                  API quản trị. Chủ sân, nhân viên và khách hàng không được tự
                  duyệt cơ sở, sửa giao dịch hoặc nâng quyền. Mọi thay đổi phải
                  ghi lý do và lưu nhật ký.
                </p>
                <Link
                  href="/venues/register"
                  className="mt-4 inline-block text-sm text-court-500 underline"
                >
                  Mở biểu mẫu đăng ký cơ sở mới →
                </Link>
              </div>
            </>
          )}
          {tab === "payments" && (
            <p className="mb-4 text-sm text-muted">
              Hủy đơn đã trả tiền chỉ tạo trạng thái chờ hoàn tiền. Website chưa
              thực hiện chuyển tiền hoàn qua ngân hàng.
            </p>
          )}
          {tab === "receipts" && (
            <p className="mb-4 text-sm text-muted">
              Chỉ ghép giao dịch tiền vào đúng tài khoản, đúng số tiền, với đơn
              chưa hết hạn. Giao dịch đã xử lý không được sử dụng lại.
            </p>
          )}
          {tab !== "overview" && !rows.length && (
            <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted">
              Không có dữ liệu phù hợp.
            </div>
          )}
          <div className="space-y-3">
            {rows.map((r) => (
              <article
                key={r.id}
                className="rounded-xl border border-border bg-surface p-5"
              >
                {tab === "venues" && (
                  <>
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <h2 className="font-bold">{r.name}</h2>
                        <p className="mt-1 text-sm text-muted">
                          {r.address} · {r.district}
                        </p>
                        <p className="mt-2 text-sm text-muted">
                          Chủ cơ sở: {r.owner?.name} · {r._count?.courts} sân ·{" "}
                          {r._count?.pricing} khung giá
                        </p>
                        <p className="text-sm text-muted">
                          {labels[r.paymentMode || ""]} · Liên hệ:{" "}
                          {r.phone || "Chưa bổ sung"}
                        </p>
                      </div>
                      <Badge value={r.status} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {r.status !== "ACTIVE" &&
                        actionButton("Duyệt / kích hoạt", {
                          action: "VENUE_STATUS",
                          id: r.id,
                          status: "ACTIVE",
                        })}
                      {r.status !== "SUSPENDED" &&
                        actionButton(
                          r.status === "PENDING"
                            ? "Từ chối đăng ký"
                            : "Tạm ngưng",
                          {
                            action: "VENUE_STATUS",
                            id: r.id,
                            status: "SUSPENDED",
                          },
                        )}
                      {r.status === "ACTIVE" && (
                        <Link
                          className={button}
                          href={`/venues/${r.slug}/book`}
                        >
                          Mở đặt sân ↗
                        </Link>
                      )}
                    </div>
                  </>
                )}
                {tab === "bookings" && (
                  <>
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <h2 className="font-bold">
                          {r.code} · {r.customerName}
                        </h2>
                        <p className="mt-1 text-sm text-muted">
                          {r.venue?.name} · {r.customerPhone}
                        </p>
                        <p className="mt-1 text-lg font-semibold">
                          {money(r.total)}
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Badge
                          value={
                            r.status === "PENDING_PAYMENT" &&
                            r.expiresAt &&
                            new Date(r.expiresAt) <= new Date()
                              ? "EXPIRED"
                              : r.status
                          }
                        />
                        <Badge value={r.paymentStatus} />
                      </div>
                    </div>
                    <div className="my-3 text-sm text-muted">
                      {r.items?.map((i, n) => (
                        <p key={n}>
                          {i.court.name} ·{" "}
                          {new Date(i.date).toLocaleDateString("vi-VN", {
                            timeZone: "UTC",
                          })}{" "}
                          · {time(i.startMin)}–{time(i.endMin)}
                        </p>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {r.status === "PENDING_PAYMENT" &&
                        r.expiresAt &&
                        new Date(r.expiresAt) > new Date() && (
                          <>
                            {(r.paymentStatus === "PAID" ||
                              r.venue?.paymentMode === "AT_VENUE") &&
                              actionButton("Xác nhận đặt sân", {
                                action: "CONFIRM",
                                id: r.id,
                              })}
                            {actionButton("Hủy đơn", {
                              action: "CANCEL",
                              id: r.id,
                            })}
                          </>
                        )}
                      {r.status === "CONFIRMED" && (
                        <>
                          {r.venue?.paymentMode === "AT_VENUE" &&
                            ["UNPAID", "PENDING"].includes(
                              r.paymentStatus || "",
                            ) &&
                            actionButton("Đã thu tiền mặt", {
                              action: "CASH_PAID",
                              id: r.id,
                            })}
                          {r.paymentStatus === "PAID" &&
                            actionButton("Xác nhận nhận sân", {
                              action: "CHECK_IN",
                              id: r.id,
                            })}
                          {actionButton("Hủy đơn", {
                            action: "CANCEL",
                            id: r.id,
                          })}
                        </>
                      )}
                      {r.status === "CHECKED_IN" &&
                        r.paymentStatus === "PAID" &&
                        actionButton("Hoàn tất", {
                          action: "COMPLETE",
                          id: r.id,
                        })}
                    </div>
                  </>
                )}
                {tab === "payments" && (
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <h2 className="font-bold">
                        {r.booking?.code} · {money(r.amount)}
                      </h2>
                      <p className="mt-1 text-sm text-muted">
                        {r.booking?.customerName} ·{" "}
                        {labels[r.provider || ""] || r.provider}
                      </p>
                      <p className="mt-1 break-all text-xs text-muted">
                        {r.txnRef} · {date(r.paidAt)}
                      </p>
                    </div>
                    <Badge value={r.status} />
                  </div>
                )}
                {tab === "receipts" && (
                  <>
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <h2 className="font-bold">
                          #{r.id} · {money(r.amount)}
                        </h2>
                        <p className="mt-1 text-sm text-muted">
                          {r.gateway} · ****{r.accountLast4} ·{" "}
                          {date(r.receivedAt)}
                        </p>
                        <p className="mt-2 break-words text-sm">{r.content}</p>
                        <p className="text-xs text-muted">
                          Mã đơn: {r.bookingCode || "Chưa xác định"}
                        </p>
                      </div>
                      <Badge value={r.result} />
                    </div>
                    {r.result?.startsWith("REVIEW_") && (
                      <div className="mt-4">
                        {actionButton("Ghép với đơn đặt sân", {
                          action: "MATCH_RECEIPT",
                          id: r.id,
                          bookingCode: r.bookingCode || "",
                        })}
                      </div>
                    )}
                  </>
                )}
                {tab === "users" && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-bold">
                        {r.name}
                        {r.id === actor.id && " (bạn)"}
                      </h2>
                      <p className="mt-1 text-sm text-muted">
                        {r.phone || r.email || "Chưa có liên hệ"}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <Badge value={r.role} />
                        <Badge value={r.status} />
                      </div>
                    </div>
                    {actionButton("Sửa quyền / trạng thái", {
                      action: "USER_ACCESS",
                      id: r.id,
                      role: r.role,
                      status: r.status,
                    })}
                  </div>
                )}
                {tab === "audit" && (
                  <>
                    <div className="flex flex-wrap justify-between gap-2">
                      <h2 className="font-semibold">
                        {labels[r.action || ""] || r.action}
                      </h2>
                      <span className="text-xs text-muted">
                        {date(r.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">
                      {r.actorName} · {r.reason}
                    </p>
                    <p className="mt-1 break-all text-xs text-muted">
                      Đối tượng: {r.entityId}
                    </p>
                    <details className="mt-3 text-xs text-muted">
                      <summary className="cursor-pointer">
                        Chi tiết thay đổi
                      </summary>
                      <pre className="mt-2 overflow-auto whitespace-pre-wrap break-all">
                        {JSON.stringify(r.details, null, 2)}
                      </pre>
                    </details>
                  </>
                )}
              </article>
            ))}
          </div>
          {tab !== "overview" && (
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                className={button}
                disabled={page === 1}
                onClick={() => setPage((v) => v - 1)}
              >
                Trước
              </button>
              <span className="text-sm">Trang {page}</span>
              <button
                className={button}
                disabled={!hasMore}
                onClick={() => setPage((v) => v + 1)}
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
      <Dialog.Root
        open={!!action}
        onOpenChange={(open) => {
          if (!open && !saving) setAction(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <Dialog.Title className="pr-8 text-xl font-bold">
              {action?.title}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted">
              Kiểm tra thông tin và ghi lý do. Thao tác sẽ được lưu vào nhật ký
              quản trị.
            </Dialog.Description>
            <Dialog.Close
              disabled={saving}
              aria-label="Đóng"
              className="absolute right-4 top-4"
            >
              <X size={20} />
            </Dialog.Close>
            <form onSubmit={submit} className="mt-5 space-y-4">
              {action?.action === "USER_ACCESS" && (
                <>
                  <label className="block text-sm">
                    Vai trò
                    <select
                      className={`${field} mt-1`}
                      value={action.role}
                      onChange={(e) =>
                        setAction({ ...action, role: e.target.value })
                      }
                    >
                      {["CUSTOMER", "STAFF", "OWNER", "ADMIN"].map((v) => (
                        <option key={v} value={v}>
                          {labels[v]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm">
                    Trạng thái
                    <select
                      className={`${field} mt-1`}
                      value={action.status}
                      onChange={(e) =>
                        setAction({ ...action, status: e.target.value })
                      }
                    >
                      {["ACTIVE", "BLOCKED"].map((v) => (
                        <option key={v} value={v}>
                          {labels[v]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="text-xs text-muted">
                    ADMIN có toàn quyền hệ thống. Những vai trò còn lại không
                    truy cập trang quản trị.
                  </p>
                </>
              )}
              {action?.action === "MATCH_RECEIPT" && (
                <label className="block text-sm">
                  Mã đơn nhận thanh toán
                  <input
                    required
                    pattern="DATSAN[0-9]{1,10}"
                    placeholder="DATSAN1234567890"
                    className={`${field} mt-1`}
                    value={action.bookingCode}
                    onChange={(e) =>
                      setAction({
                        ...action,
                        bookingCode: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </label>
              )}
              {action?.action === "CASH_PAID" && (
                <p className="text-sm text-amber-600">
                  Chỉ xác nhận khi bạn đã thực nhận đủ tiền mặt cho đơn này.
                </p>
              )}
              {action?.action === "CANCEL" && (
                <p className="text-sm text-amber-600">
                  Đơn sẽ bị hủy và nhả sân. Nếu đã thanh toán, đơn chuyển sang
                  chờ hoàn tiền.
                </p>
              )}
              <label className="block text-sm">
                Lý do / ghi chú
                <textarea
                  required
                  minLength={5}
                  maxLength={500}
                  rows={3}
                  className={`${field} mt-1`}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              {actionError && (
                <p role="alert" className="text-sm text-red-500">
                  {actionError}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={saving}
                  className={button}
                  onClick={() => setAction(null)}
                >
                  Đóng
                </button>
                <button
                  disabled={saving || reason.trim().length < 5}
                  className="rounded-lg bg-court-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {saving ? "Đang lưu…" : "Xác nhận"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
