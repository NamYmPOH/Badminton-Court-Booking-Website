"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { formatVND } from "@/lib/utils";
import { formatHour } from "@/lib/booking";
import type { getGroupView } from "@/services/group-payment.service";
import type { GroupAction } from "@/lib/group-payment";

type Group = Awaited<ReturnType<typeof getGroupView>>;
const button =
  "rounded-control border border-border px-4 py-2 disabled:opacity-50";
export default function GroupPaymentPage({
  params,
}: {
  params: { token: string };
}) {
  const { user, refreshUser } = useAuth();
  const autoJoined = useRef("");
  const [group, setGroup] = useState<Group | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [now, setNow] = useState(Date.now());
  const [inviteQr, setInviteQr] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [confirmation, setConfirmation] = useState<{
    action: "APPROVE_CASH" | "COLLECT_CASH" | "CANCEL";
    ids: string[];
    amount: number;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [ticketInput, setTicketInput] = useState("");
  const [refund, setRefund] = useState("");
  const [reference, setReference] = useState("");
  const mutation = useRef(false);
  const version = useRef(0);
  const endpoint = `/api/groups/${encodeURIComponent(params.token)}`;
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      const v = version.current;
      try {
        const response = await fetch(endpoint, { cache: "no-store", signal });
        const data = await response.json();
        if (response.status === 401 || response.status === 403) setGroup(null);
        if (!response.ok)
          throw new Error(data.message || "Không đọc được nhóm.");
        if (!signal?.aborted && !mutation.current && v === version.current) {
          setGroup(data.group);
          if (data.group.viewerId !== user?.id) void refreshUser();
          setError("");
        }
      } catch (e) {
        if (!signal?.aborted)
          setError(
            e instanceof Error
              ? e.message
              : "Mất kết nối. Kiểm tra trạng thái trước khi chuyển thêm tiền.",
          );
      }
    },
    [endpoint, user?.id, refreshUser],
  );
  useEffect(() => {
    version.current++;
    setGroup(null);
    setSelected([]);
    setConfirmation(null);
    const controller = new AbortController();
    void refresh(controller.signal);
    const interval = setInterval(() => {
      if (!mutation.current) void refresh(controller.signal);
    }, 4000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    setInviteUrl(window.location.origin + `/groups/${params.token}`);
    return () => {
      controller.abort();
      clearInterval(interval);
      clearInterval(clock);
    };
  }, [params.token, refresh]);
  useEffect(() => {
    let active = true;
    if (group?.isLeader && inviteUrl)
      void import("qrcode")
        .then(({ default: qr }) =>
          qr.toDataURL(inviteUrl, { width: 200, margin: 2 }),
        )
        .then((qr) => {
          if (active) setInviteQr(qr);
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [group?.isLeader, inviteUrl]);
  const act = useCallback(async (input: GroupAction) => {
    if (mutation.current) return;
    mutation.current = true;
    version.current++;
    setBusy(true);
    const requestVersion = version.current;
    setError("");
    setNotice("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (requestVersion !== version.current) return;
      if (!response.ok)
        throw new Error(data.message || "Không cập nhật được nhóm.");
      setGroup(data.group);
      setSelected([]);
      setConfirmation(null);
      setReason("");
      setRefund("");
      setReference("");
      setTicketInput("");
      setNotice("Đã cập nhật trạng thái từ hệ thống.");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Không kết nối được máy chủ. Hãy tải lại trước khi thử tiếp.",
      );
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  }, [endpoint]);
  useEffect(() => {
    if (!group || group.isMember || group.isOperator || !group.canJoin || !group.shares.some((s) => !s.joined)) return;
    const key = `${endpoint}:${group.viewerId}`;
    if (autoJoined.current === key) return;
    autoJoined.current = key;
    void act({ action: "JOIN" });
  }, [group, endpoint, act]);
  const own = group?.shares.find((s) => s.id === group.ownShareId);
  const remainingSeconds = group?.expiresAt
    ? Math.max(0, Math.ceil((Date.parse(group.expiresAt) - now) / 1000))
    : null;
  const timedOut =
    group?.status === "PENDING_PAYMENT" && remainingSeconds === 0;
  const payable = !!group?.canPay && !timedOut;
  const chosen =
    group?.shares.filter((s) => selected.includes(s.id) && !s.paid) || [];
  const amount = chosen.reduce((n, s) => n + s.amount, 0);
  const displayIntents =
    group?.intents.filter(
      (i) =>
        i.shareIds.length > 1 ||
        !own?.cashRequested ||
        !i.shareIds.includes(own.id),
    ) || [];
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <Link href="/bookings" className="text-court-600 underline">
        ← Lịch của tôi
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Chia tiền đặt sân</h1>
        <p className="mt-2 text-muted">
          Mỗi người một phần tiền · Cùng một lịch sân
        </p>
      </div>
      {error && (
        <div
          role="alert"
          className="space-y-2 rounded-control border border-rose-400 p-4 text-rose-600"
        >
          <p>{error}</p>
          <button className="underline" onClick={() => void refresh()}>
            Kiểm tra lại
          </button>
          {!group && (
            <Link
              className="ml-4 underline"
              href={`/login?callbackUrl=${encodeURIComponent(`/groups/${params.token}`)}`}
            >
              Đăng nhập để tham gia
            </Link>
          )}
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      {!group ? (
        !error && <p>Đang tải nhóm...</p>
      ) : (
        <>
          <section className="space-y-3 rounded-card border border-border bg-surface p-5">
            <h2 className="text-xl font-bold">{group.venueName}</h2>
            {group.code && <p className="font-mono text-sm">{group.code}</p>}
            {group.items.map((item, i) => (
              <p key={i} className="text-sm text-muted">
                {item.courtName} · {item.date} · {formatHour(item.startMin)}–
                {formatHour(item.endMin)}
              </p>
            ))}
            <p>
              Tổng tiền: <strong>{formatVND(group.total)}</strong>
            </p>
            {(group.isMember || group.isOperator) && (
              <>
                <div
                  className="h-3 overflow-hidden rounded-full bg-court-100"
                  role="progressbar"
                  aria-label="Tiền nhóm đã thu"
                  aria-valuemin={0}
                  aria-valuemax={group.total}
                  aria-valuenow={group.received}
                >
                  <div
                    className="h-full bg-court-600"
                    style={{
                      width: `${Math.min(100, (100 * group.received) / group.total)}%`,
                    }}
                  />
                </div>
                <p>
                  Đã thu {formatVND(group.received)} · Còn{" "}
                  {formatVND(group.remaining)}
                </p>
              </>
            )}
            {group.closed ? (
              <p className="text-rose-600">
                Đơn đã đóng. Không chuyển thêm vào các QR cũ. Các khoản đã thu
                được xử lý theo chính sách hoàn.
              </p>
            ) : group.paymentStatus === "PAID" ? (
              <p className="font-semibold text-emerald-600">
                Đã thu đủ tiền — vé cá nhân đã sẵn sàng.
              </p>
            ) : group.status === "CONFIRMED" ? (
              <p>
                Sân đã duyệt lịch. Còn {formatVND(group.remaining)} chưa thu; vé
                nhận sân chưa hoạt động.
              </p>
            ) : (
              <p role="status">
                {timedOut
                  ? "Đã hết hạn giữ sân. Không chuyển thêm tiền."
                  : `Giữ sân còn ${Math.floor((remainingSeconds || 0) / 60)}:${String((remainingSeconds || 0) % 60).padStart(2, "0")}. Cần trả đủ hoặc được sân duyệt phần còn lại.`}
              </p>
            )}
          </section>
          {group.isLeader && !group.closed && (
            <section className="flex flex-wrap items-center gap-5 rounded-card border border-border bg-surface p-5">
              <div className="min-w-0 flex-1">
                <h2 className="font-bold">Mời bạn vào nhóm</h2>
                <p className="my-2 text-sm text-muted">
                  Đây là QR tham gia nhóm. Mỗi người sẽ nhận QR thanh toán riêng
                  sau khi tham gia.
                </p>
                <input
                  aria-label="Liên kết mời nhóm"
                  readOnly
                  value={inviteUrl}
                  className="w-full rounded-control border border-border bg-surface p-2 text-ink"
                />
                <button
                  className={`${button} mt-3`}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(inviteUrl);
                      setNotice("Đã sao chép liên kết mời nhóm.");
                    } catch {
                      setNotice("Hãy chọn và sao chép liên kết trong ô trên.");
                    }
                  }}
                >
                  Sao chép liên kết
                </button>
              </div>
              {inviteQr && (
                <Image
                  unoptimized
                  src={inviteQr}
                  width={180}
                  height={180}
                  alt="QR tham gia nhóm"
                />
              )}
            </section>
          )}
          <section className="space-y-3 rounded-card border border-border bg-surface p-5">
            <h2 className="text-lg font-bold">Các phần thanh toán</h2>
            {(group.isMember || group.isOperator) && <p className="text-sm text-muted">{group.shares.filter((s) => s.paid).length}/{group.shares.length} phần đã thanh toán · {group.shares.filter((s) => !s.paid).length} phần chưa thanh toán</p>}
            {group.shares.map((s) => (
              <div
                key={s.id}
                className={`flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 last:border-0 ${s.paid ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-3">
                  {(group.isLeader || group.isOperator) &&
                    !s.paid &&
                    !group.closed && (
                      <input
                        type="checkbox"
                        aria-label={`Chọn phần ${s.position}`}
                        checked={selected.includes(s.id)}
                        onChange={(e) =>
                          setSelected((v) =>
                            e.target.checked
                              ? [...v, s.id]
                              : v.filter((id) => id !== s.id),
                          )
                        }
                      />
                    )}
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <strong className="text-base">
                        {s.label}
                      </strong>
                      {s.isLeader && s.label !== "Trưởng nhóm" && (
                        <span className="rounded bg-court-600/15 px-2 py-0.5 text-xs font-semibold text-court-700 dark:text-court-300">
                          Trưởng nhóm
                        </span>
                      )}
                      {s.id === own?.id && (
                        <span className="rounded bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                          (Bạn)
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted">
                      {!group.isMember && !group.isOperator ? (
                        "Tham gia để xem trạng thái"
                      ) : s.paid ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Đã thanh toán</span>
                      ) : s.cashApproved ? (
                        "Đã duyệt trả tại sân — chưa thu"
                      ) : s.cashRequested ? (
                        <span className="font-semibold text-amber-600 dark:text-amber-400">Chờ sân duyệt tiền mặt</span>
                      ) : s.coveredByLeader ? (
                        "Đang có người trả thay"
                      ) : (
                        "Chưa thanh toán"
                      )}
                      {!s.joined ? " · Chưa có người tham gia" : ""}
                      {s.checkedIn ? " · Đã nhận sân" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <strong>{formatVND(s.amount)}</strong>
                  {group.isOperator && group.canCollect && !timedOut && !s.paid && (
                    <button className={button} disabled={busy || !!error} onClick={() => {
                      setConfirmation({ action: "COLLECT_CASH", ids: [s.id], amount: s.amount });
                      setReason(`Đã thu tiền mặt phần ${s.position}: ${s.label}`);
                    }}>Xác nhận thu tiền mặt</button>
                  )}
                  {!group.isMember &&
                    !group.isOperator &&
                    !s.joined &&
                    !group.closed &&
                    !timedOut && (
                      <button
                        disabled={busy}
                        className={button}
                        onClick={() =>
                          void act({ action: "JOIN", position: s.position })
                        }
                      >
                        Nhận phần này
                      </button>
                    )}
                </div>
              </div>
            ))}
            {group.isLeader && payable && (
              <div className="flex flex-wrap gap-3 pt-3">
                <button
                  disabled={busy || !chosen.length || !!error}
                  className={button}
                  onClick={() =>
                    void act({
                      action: "COVER",
                      shareIds: chosen.map((s) => s.id),
                    })
                  }
                >
                  Tạo QR trả các phần đã chọn ({formatVND(amount)})
                </button>
                <button
                  disabled={busy || !!error}
                  className={button}
                  onClick={() => void act({ action: "REQUEST_CASH_ALL" })}
                >
                  Xin trả phần còn lại tại sân
                </button>
              </div>
            )}
          </section>
          {own && !own.paid && payable && (
            <section className="grid gap-4 md:grid-cols-[1fr_260px]">
              <div className="space-y-4 rounded-card border border-border bg-surface p-5">
                <h2 className="font-bold">Thanh toán online qua QR</h2>
                {displayIntents.length ? (
                  displayIntents.map((i) => (
                    <div key={i.id} className="space-y-2">
                      <p className="text-xl font-bold text-court-600">
                        {formatVND(i.amount)}
                        {i.shareIds.length > 1 ? " · Trả nhiều phần" : ""}
                      </p>
                      {!error && (
                        <Image
                          unoptimized
                          src={i.qrUrl}
                          width={300}
                          height={400}
                          alt={`QR thanh toán ${i.code}`}
                          className="mx-auto h-auto max-w-full rounded-control"
                        />
                      )}
                      <p>
                        {i.bank.name} · {i.bank.accountNo}
                      </p>
                      <p>{i.bank.accountName}</p>
                      <p className="break-all">
                        Nội dung:{" "}
                        <strong className="font-mono">{i.code}</strong>
                      </p>
                      <p className="text-sm text-muted">
                        Chuyển đúng số tiền và nội dung. Chờ hệ thống xác nhận
                        trước khi trả thêm.
                      </p>
                    </div>
                  ))
                ) : (
                  <p>
                    {own.cashRequested
                      ? "Bạn đã yêu cầu trả tiền mặt. Chờ sân duyệt; việc gửi yêu cầu chưa được tính là đã trả tiền."
                      : own.coveredByLeader
                        ? "Trưởng nhóm đang trả thay. Không chuyển thêm bằng mã cũ."
                        : "Chưa có QR thanh toán. Bạn có thể tải mã hoặc chọn tiền mặt."}
                  </p>
                )}
              </div>
              <aside className="space-y-3 rounded-card border border-border bg-surface p-5">
                <h2 className="font-bold">Phương thức khác</h2>
                <button
                  disabled={busy || !!error || own.coveredByLeader}
                  className={`${button} w-full`}
                  onClick={() =>
                    void act({
                      action: "METHOD",
                      method: own.cashRequested ? "BANK_TRANSFER" : "CASH",
                    })
                  }
                >
                  {own.cashRequested
                    ? "Thanh toán online qua QR"
                    : "Thanh toán bằng tiền mặt"}
                </button>
                {!own.cashRequested &&
                  !displayIntents.length &&
                  !own.coveredByLeader && (
                    <button
                      disabled={busy || !!error}
                      className={button}
                      onClick={() =>
                        void act({ action: "METHOD", method: "BANK_TRANSFER" })
                      }
                    >
                      Tải mã thanh toán
                    </button>
                  )}
                <p className="text-sm text-muted">
                  Chỉ nhân viên hoặc chủ sân mới được xác nhận đã thực thu tiền mặt.
                </p>
              </aside>
            </section>
          )}
          {/* A leader whose own share is paid can still cover other members. */}
          {own?.paid &&
            payable &&
            displayIntents.map((i) => (
              <section
                key={i.id}
                className="space-y-3 rounded-card border border-border bg-surface p-5"
              >
                <h2 className="font-bold">
                  QR trả thay · {formatVND(i.amount)}
                </h2>
                {!error && (
                  <Image
                    unoptimized
                    src={i.qrUrl}
                    width={300}
                    height={400}
                    alt={`QR trả thay ${i.code}`}
                    className="h-auto max-w-full"
                  />
                )}
                <p>
                  {i.bank.name} · {i.bank.accountNo} · {i.bank.accountName}
                </p>
                <p className="break-all font-mono">{i.code}</p>
              </section>
            ))}
          {group.ticketQr && (
            <section className="space-y-3 rounded-card border border-border bg-surface p-5">
              <h2 className="font-bold">Vé QR nhận sân của bạn</h2>
              <p className="text-sm text-muted">
                Xuất trình tại sân trong khung giờ đã đặt. Vé dùng một lần, khác
                với QR chuyển khoản.
              </p>
              <Image
                unoptimized
                src={group.ticketQr}
                width={240}
                height={240}
                alt="Vé QR nhận sân cá nhân"
              />
              <details>
                <summary className="cursor-pointer">
                  Mã vé để nhân viên nhập khi không quét được
                </summary>
                <p className="mt-2 break-all font-mono text-xs">
                  {group.ticket}
                </p>
              </details>
              {own?.checkedIn && <p>Vé đã được sử dụng.</p>}
            </section>
          )}
          {group.isOperator && (
            <section className="space-y-4 rounded-card border border-border bg-surface p-5">
              <h2 className="font-bold">Nhân viên / chủ sân</h2>
              {group.canCollect && !timedOut && (
                <div className="flex flex-wrap gap-3">
                  <button
                    disabled={
                      busy ||
                      !chosen.length ||
                      chosen.some((s) => !s.cashRequested) ||
                      !!error
                    }
                    className={button}
                    onClick={() => {
                      setConfirmation({
                        action: "APPROVE_CASH",
                        ids: chosen.map((s) => s.id),
                        amount,
                      });
                      setReason("");
                    }}
                  >
                    Duyệt tiền mặt các phần đã chọn
                  </button>
                  <button
                    disabled={
                      busy ||
                      !chosen.length ||
                      !!error
                    }
                    className={button}
                    onClick={() => {
                      setConfirmation({
                        action: "COLLECT_CASH",
                        ids: chosen.map((s) => s.id),
                        amount,
                      });
                      setReason("");
                    }}
                  >
                    Ghi nhận đã thu {formatVND(amount)}
                  </button>
                </div>
              )}
              <form
                className="flex flex-wrap gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void act({
                    action: "CHECK_IN_TICKET",
                    ticket: ticketInput.trim(),
                    reason: "Kiểm tra vé cá nhân tại sân",
                  });
                }}
              >
                <input
                  aria-label="Mã vé nhận sân"
                  placeholder="Quét bằng máy đọc hoặc dán mã GT..."
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  required
                  className="min-w-0 flex-1 rounded-control border border-border bg-surface p-3 text-ink"
                />
                <button disabled={busy || !!error} className={button}>
                  Kiểm tra và nhận sân
                </button>
              </form>
            </section>
          )}
          {(group.isLeader || group.isOperator) &&
            !group.closed &&
            ["PENDING_PAYMENT", "CONFIRMED"].includes(group.status) && (
              <button
                disabled={busy}
                className={button}
                onClick={() => {
                  setConfirmation({
                    action: "CANCEL",
                    ids: [],
                    amount: group.received,
                  });
                  setReason("");
                }}
              >
                Yêu cầu hủy đơn nhóm
              </button>
            )}
          {confirmation && (
            <form
              className="space-y-3 rounded-card border border-court-600 bg-surface p-5"
              onSubmit={(e) => {
                e.preventDefault();
                void act(
                  confirmation.action === "CANCEL"
                    ? { action: "CANCEL", reason }
                    : {
                        action: confirmation.action,
                        shareIds: confirmation.ids,
                        reason,
                      },
                );
              }}
            >
              <h2 className="font-bold">
                {confirmation.action === "COLLECT_CASH"
                  ? `Xác nhận đã thực nhận ${formatVND(confirmation.amount)} tiền mặt`
                  : confirmation.action === "APPROVE_CASH"
                    ? "Duyệt trả tiền tại sân — chưa ghi nhận đã thu"
                    : "Hủy đơn nhóm"}
              </h2>
              {confirmation.ids.length > 0 && <p>Phần được xác nhận: {group.shares.filter((s) => confirmation.ids.includes(s.id)).map((s) => `${s.position}. ${s.label}`).join(", ")}</p>}
              {confirmation.action === "CANCEL" && (
                <p className="text-sm">
                  Hủy trước giờ chơi trên 24 giờ: hoàn 100%; từ 12–24 giờ: 50%;
                  dưới 12 giờ: không hoàn. Nhóm hết hạn giữ chỗ được lập yêu cầu
                  hoàn toàn bộ tiền đã thu. Khoản hoàn cần được sân xử lý và xác
                  nhận.
                </p>
              )}
              <label className="block">
                Lý do / ghi chú
                <textarea
                  required
                  minLength={5}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-2 block w-full rounded-control border border-border bg-surface p-3 text-ink"
                />
              </label>
              <div className="flex gap-3">
                <button disabled={busy || !!error} className={button}>
                  Xác nhận
                </button>
                <button
                  type="button"
                  className={button}
                  onClick={() => setConfirmation(null)}
                >
                  Đóng
                </button>
              </div>
            </form>
          )}
          {!!group.refunds.length && (
            <section className="space-y-3 rounded-card border border-border bg-surface p-5">
              <h2 className="font-bold">Theo dõi hoàn tiền</h2>
              {group.refunds.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap justify-between gap-3"
                >
                  <p>
                    {formatVND(r.amount)} ·{" "}
                    {r.status === "COMPLETED"
                      ? "Đã xác nhận hoàn"
                      : "Chờ xử lý hoàn"}
                    {r.txnRef ? ` · ${r.txnRef}` : ""}
                  </p>
                  {group.isOperator && r.status === "PENDING" && (
                    <button className={button} onClick={() => setRefund(r.id)}>
                      Ghi nhận đã hoàn
                    </button>
                  )}
                </div>
              ))}
              {refund && (
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void act({
                      action: "REFUND_DONE",
                      refundId: refund,
                      reference,
                      reason: "Đã kiểm tra chứng từ hoàn cho giao dịch gốc",
                    });
                  }}
                >
                  <label className="block">
                    Mã chứng từ hoàn thực tế
                    <input
                      required
                      minLength={5}
                      maxLength={200}
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="ml-3 rounded-control border border-border bg-surface p-2 text-ink"
                    />
                  </label>
                  <p className="text-sm">
                    Chỉ xác nhận sau khi đã hoàn cho người thực trả theo giao
                    dịch gốc.
                  </p>
                  <button disabled={busy || !!error} className={button}>
                    Xác nhận đã hoàn
                  </button>
                </form>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}
