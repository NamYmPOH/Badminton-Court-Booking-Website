"use client";
import { useEffect, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
type Data = { booking: { code: string; status: string; customerName: string; customerPhone: string; cancelRequestedAt: string | null; cancelApprovedAt: string | null; cancelReason: string | null }; received: number; available: number; refunds: { id: string; amount: number; completedAmount: number; txnRef: string }[] };
const control = "w-full rounded-lg border border-border bg-surface p-2";
const button = "rounded-lg border border-border px-3 py-2 font-semibold disabled:opacity-50";
const money = (n: number) => n.toLocaleString("vi-VN") + " đ";
export default function CancellationManageModal({ id, onClose }: { id: string; onClose: () => void }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/cancellations?id=${encodeURIComponent(id)}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    setData(json); setAmount(json.available);
  }, [id]);
  useEffect(() => { load().catch(e => setError(e.message)); }, [load]);
  async function submit(body: object) {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/admin/cancellations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, id }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Không lưu được."); } finally { setBusy(false); }
  }
  return <Dialog.Root open onOpenChange={open => { if (!open && !busy) onClose(); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%_-_2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-surface p-6 text-ink">
    <Dialog.Title className="text-xl font-bold">Duyệt hủy & hoàn tiền {data?.booking.code}</Dialog.Title>
    <Dialog.Description className="my-3 text-sm text-muted">Xem xét yêu cầu trong 24 giờ. Hoàn tiền thủ công: liên hệ người đã trả tiền để xác minh ngân hàng, số tài khoản và chủ tài khoản; chỉ xác nhận sau khi chuyển tiền thành công.</Dialog.Description>
    {error && <p role="alert" className="my-3 text-red-500">{error}</p>}
    {!data ? <button className={button} onClick={() => load().catch(e => setError(e.message))}>Tải thông tin</button> : <fieldset disabled={busy} className="space-y-4">
      <p>{data.booking.customerName} · {data.booking.customerPhone}</p>
      <p>Lý do hủy: {data.booking.cancelReason || "Chưa ghi nhận"}</p>
      {data.booking.cancelRequestedAt && !data.booking.cancelApprovedAt && <p className="text-amber-600">Chờ duyệt · Hạn: {new Date(new Date(data.booking.cancelRequestedAt).getTime() + 86400000).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}{Date.now() > new Date(data.booking.cancelRequestedAt).getTime() + 86400000 ? " · Đã quá hạn xử lý" : ""}</p>}
      <p>Thực thu: {money(data.received)} · Còn được duyệt hoàn: {money(data.available)}</p>
      {!data.booking.cancelApprovedAt && ["CANCELLED", "CONFIRMED", "PENDING_PAYMENT"].includes(data.booking.status) && <form className="space-y-3" onSubmit={e => { e.preventDefault(); void submit({ action: "approve", amount, reason }); }}>
        <label className="block">Số tiền duyệt hoàn bổ sung<input className={control} type="number" required min={0} max={data.available} value={amount} onChange={e => setAmount(Number(e.target.value))} /></label>
        <label className="block">Lý do phê duyệt<textarea className={control} required minLength={5} maxLength={500} value={reason} onChange={e => setReason(e.target.value)} /></label>
        <button className={button}>Duyệt hủy sân</button>
      </form>}
      {data.booking.cancelApprovedAt && <p className="text-emerald-600">Đã duyệt hủy. {data.received === 0 ? "Không có tiền thực thu để hoàn." : "Theo dõi các khoản hoàn bên dưới."}</p>}
      {data.refunds.map(r => <form key={r.id} className="space-y-3 rounded-lg border border-border p-3" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); void submit({ action: "refund", refundId: r.id, amount: Number(form.get("amount")), reference: String(form.get("reference")), reason: String(form.get("reason")) }); }}>
        <p>Giao dịch thu: {r.txnRef}</p><p>Đã hoàn {money(r.completedAmount)} / {money(r.amount)}</p>
        {r.amount > r.completedAmount && <><label className="block">Số tiền đã chuyển<input className={control} name="amount" type="number" min={1} max={r.amount - r.completedAmount} defaultValue={r.amount - r.completedAmount} required /></label><label className="block">Mã giao dịch chuyển trả<input className={control} name="reference" minLength={5} maxLength={160} required /></label><label className="block">Ghi chú xác minh người nhận<textarea className={control} name="reason" minLength={5} maxLength={500} required /></label><button className={button}>Xác nhận đã chuyển tiền</button></>}
      </form>)}
    </fieldset>}
    <button className={`${button} mt-4`} disabled={busy} onClick={onClose}>Đóng</button>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
