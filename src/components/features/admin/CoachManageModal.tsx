"use client";
import { useCallback, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { COACH_SPECIALTIES } from "@/lib/coach-policy";

type Slot = { id: string; venueId: string; startsAt: string; endsAt: string; venue: { name: string } };
type Data = { coach: { user: { name: string; email: string; phone: string }; bio: string | null; hourlyRate: number; experienceYears: number; specialties: string[]; venues: { venueId: string; status: string; venue: { name: string; status: string } }[]; availabilities: Slot[]; bookings: { id: string; bookingItem: { court: { venue: { name: string } } }; startsAt: string; endsAt: string; status: string }[] }; venues: { id: string; name: string }[] };
const control = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-ink";
const button = "rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-surface disabled:opacity-50";
const time = (value: string) => new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" });
const local = (value: string) => new Date(new Date(value).getTime() + 7 * 3600000).toISOString().slice(0, 16);
const emptySlot = { id: "", venueId: "", startsAt: "", endsAt: "" };

export default function CoachManageModal({ coachId, onClose }: { coachId: string; onClose: () => void }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [venueId, setVenueId] = useState("");
  const [slot, setSlot] = useState(emptySlot);
  const [profile, setProfile] = useState({ bio: "", hourlyRate: 50000, experienceYears: 0, specialties: [] as string[] });
  const url = `/api/admin/coaches/${encodeURIComponent(coachId)}`;
  const load = useCallback(async (signal?: AbortSignal) => {
    const res = await fetch(url, { cache: "no-store", signal });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Không tải được thông tin HLV.");
    if (signal?.aborted) return;
    setData(result);
    setProfile({ bio: result.coach.bio || "", hourlyRate: result.coach.hourlyRate, experienceYears: result.coach.experienceYears, specialties: result.coach.specialties });
  }, [url]);
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [load]);
  async function save(body: unknown) {
    setBusy(true); setError(""); setNotice("");
    try {
      const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Không lưu được thay đổi.");
      setNotice("Đã lưu thay đổi.");
      await load();
      return true;
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể kết nối."); return false; }
    finally { setBusy(false); }
  }
  return <Dialog.Root open onOpenChange={open => { if (!open && !busy) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-surface p-5 text-ink shadow-xl sm:p-7">
      <div className="flex items-start justify-between gap-3"><Dialog.Title className="text-xl font-bold">Quản lý HLV{data ? `: ${data.coach.user.name}` : ""}</Dialog.Title><Dialog.Close disabled={busy} className={button}>Đóng</Dialog.Close></div>
      <Dialog.Description className="mt-2 text-sm text-muted">Chỉnh sửa hồ sơ, cơ sở hoạt động và ca rảnh. Tất cả thời gian theo giờ Việt Nam (UTC+7).</Dialog.Description>
      {error && <p role="alert" className="my-3 text-sm text-red-500">{error} <button className={button} disabled={busy} onClick={() => { setError(""); load().catch(e => setError(e.message)); }}>Tải lại</button></p>}
      {notice && <p role="status" className="my-3 text-sm text-emerald-600">{notice}</p>}
      {!data ? <p className="mt-6">{error ? "Chưa tải được dữ liệu." : "Đang tải thông tin…"}</p> : <fieldset disabled={busy} className="mt-6 space-y-7 disabled:opacity-70">
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); void save({ action: "profile", profile }); }}>
          <h3 className="font-bold">Thông tin huấn luyện viên</h3>
          <p className="text-sm text-muted">{data.coach.user.email || "Chưa có email"} · {data.coach.user.phone || "Chưa có số điện thoại"}</p>
          <label className="block text-sm">Giới thiệu<textarea className={control} maxLength={2000} value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} /></label>
          <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Học phí (đ/giờ)<input required type="number" className={control} value={profile.hourlyRate} onChange={e => setProfile({ ...profile, hourlyRate: Number(e.target.value) })} /></label><label className="text-sm">Số năm kinh nghiệm<input required type="number" min={0} max={50} className={control} value={profile.experienceYears} onChange={e => setProfile({ ...profile, experienceYears: Number(e.target.value) })} /></label></div>
          <fieldset><legend className="text-sm">Chuyên môn</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{Array.from(new Set([...COACH_SPECIALTIES, ...profile.specialties])).map(s => <label key={s} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={profile.specialties.includes(s)} onChange={e => setProfile({ ...profile, specialties: e.target.checked ? [...profile.specialties, s] : profile.specialties.filter(v => v !== s) })} />{s}</label>)}</div></fieldset>
          <button className={button}>Lưu thông tin</button>
        </form>
        <section className="space-y-3 border-t border-border pt-5"><h3 className="font-bold">Cơ sở hoạt động</h3><p className="text-sm text-muted">HLV chỉ xuất hiện khi đặt sân tại cơ sở đã duyệt. Tạm ngưng liên kết không hủy các đơn đã đặt.</p>
          {!data.coach.venues.length && <p className="text-sm">Chưa liên kết cơ sở nào.</p>}
          {data.coach.venues.map(v => <div key={v.venueId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"><div><p className="font-medium">{v.venue.name}</p><p className="text-sm text-muted">{({ ACTIVE: "Đã duyệt", PENDING: "Chờ duyệt", SUSPENDED: "Tạm ngưng", REJECTED: "Đã từ chối" } as Record<string,string>)[v.status] || v.status}</p></div><button type="button" className={button} onClick={() => void save({ action: "venue", venueId: v.venueId, status: v.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" })}>{v.status === "ACTIVE" ? "Tạm ngưng liên kết" : "Duyệt liên kết"}</button></div>)}
          <form className="flex flex-wrap items-end gap-2" onSubmit={e => { e.preventDefault(); void save({ action: "venue", venueId, status: "ACTIVE" }); }}><label className="min-w-0 flex-1 text-sm">Thêm cơ sở<select required className={control} value={venueId} onChange={e => setVenueId(e.target.value)}><option value="">Chọn cơ sở</option>{data.venues.filter(v => !data.coach.venues.some(link => link.venueId === v.id)).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label><button className={button}>Liên kết và duyệt</button></form>
        </section>
        <section className="space-y-3 border-t border-border pt-5"><h3 className="font-bold">Ca rảnh hiện tại và sắp tới</h3><p className="text-sm text-muted">Mỗi ca từ 30 phút đến 8 giờ. Khoảng đã có khách đặt bên dưới không còn trống.</p>
          {!data.coach.availabilities.length && <p className="text-sm">Chưa có ca rảnh sắp tới.</p>}
          {data.coach.availabilities.map(s => <div key={s.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-border p-3"><div><p className="font-medium">{s.venue.name}</p><p className="text-sm">{time(s.startsAt)} → {time(s.endsAt)}</p></div><div className="flex gap-2"><button type="button" className={button} onClick={() => setSlot({ id: s.id, venueId: s.venueId, startsAt: local(s.startsAt), endsAt: local(s.endsAt) })}>Sửa</button><button type="button" className={button} onClick={async () => { if (confirm("Xóa ca rảnh này?")) { if (await save({ action: "deleteSlot", id: s.id }) && slot.id === s.id) setSlot(emptySlot); } }}>Xóa</button></div></div>)}
          <form className="space-y-3 rounded-lg border border-border p-3" onSubmit={async e => { e.preventDefault(); if (await save({ action: "slot", ...(slot.id ? { id: slot.id } : {}), slot: { venueId: slot.venueId, startsAt: new Date(`${slot.startsAt}:00+07:00`).toISOString(), endsAt: new Date(`${slot.endsAt}:00+07:00`).toISOString() } })) setSlot(emptySlot); }}>
            <h4 className="font-semibold">{slot.id ? "Chỉnh sửa ca rảnh" : "Thêm ca rảnh"}</h4><label className="block text-sm">Cơ sở<select required className={control} value={slot.venueId} onChange={e => setSlot({ ...slot, venueId: e.target.value })}><option value="">Chọn cơ sở đã duyệt</option>{data.coach.venues.filter(v => v.status === "ACTIVE" && v.venue.status === "ACTIVE").map(v => <option key={v.venueId} value={v.venueId}>{v.venue.name}</option>)}</select></label>
            <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Bắt đầu<input required type="datetime-local" className={control} value={slot.startsAt} onChange={e => setSlot({ ...slot, startsAt: e.target.value })} /></label><label className="text-sm">Kết thúc<input required type="datetime-local" className={control} value={slot.endsAt} onChange={e => setSlot({ ...slot, endsAt: e.target.value })} /></label></div>
            <div className="flex gap-2"><button className={button}>Lưu ca rảnh</button>{slot.id && <button type="button" className={button} onClick={() => setSlot(emptySlot)}>Hủy sửa</button>}</div>
          </form>
        </section>
        <section className="space-y-2 border-t border-border pt-5"><h3 className="font-bold">Lịch khách đã đặt / đang giữ chỗ</h3>{!data.coach.bookings.length && <p className="text-sm">Chưa có lịch đặt sắp tới.</p>}{data.coach.bookings.map(b => <p key={b.id} className="rounded-lg border border-border p-3 text-sm">{b.bookingItem.court.venue.name} · {time(b.startsAt)} → {time(b.endsAt)} · {b.status === "HELD" ? "Đang giữ chỗ" : "Đã xác nhận"}</p>)}</section>
      </fieldset>}
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
