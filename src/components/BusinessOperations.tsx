"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Venue = { id: string; slug: string; name: string };
type Item = { id: string; date: string; startMin: number; endMin: number; court: { name: string }; booking: { code: string; venueId: string }; session: null | { id: string; status: string; surcharges: { id: string; amount: number; reason: string; status: string }[] } };
const hour = (n: number) => String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");
type SavedSchedule = { weeklySchedules: {dayOfWeek:number;openMin:number;closeMin:number;isClosed:boolean}[]; dateExceptions: {date:string;openMin:number|null;closeMin:number|null;isClosed:boolean;reason?:string}[] };
const minutes = (s: string) => Number(s.slice(0,2))*60+Number(s.slice(3,5));
async function api(url: string, body?: unknown) {
  const res = await fetch(url, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : { cache: "no-store" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Không xử lý được yêu cầu.");
  return data;
}
export default function BusinessOperations() {
  const [venues,setVenues] = useState<Venue[]>([]), [items,setItems] = useState<Item[]>([]);
  const [venueId,setVenueId] = useState(""), [message,setMessage] = useState(""), [busy,setBusy] = useState(false);
  const [schedule,setSchedule] = useState<SavedSchedule | null>(null);
  const [mode,setMode] = useState("EXCEPTION"), [date,setDate] = useState(""), [day,setDay] = useState(1);
  const [open,setOpen] = useState("05:00"), [close,setClose] = useState("22:00"), [closed,setClosed] = useState(false), [reason,setReason] = useState("");
  const [sessionId,setSessionId] = useState(""), [amount,setAmount] = useState(0), [surchargeReason,setSurchargeReason] = useState("");
  const requestKey = useRef<string | null>(null), inFlight = useRef(false);
  const load = useCallback(async () => { const data = await api("/api/venue-operations/sessions"); setVenues(data.venues); setItems(data.items); },[]);
  useEffect(() => { let active = true; api("/api/venue-operations/sessions").then(data => { if(active){setVenues(data.venues);setItems(data.items);} }).catch(e => {if(active)setMessage(e.message);}); return () => {active=false;}; },[]);
  const venue = venues.find(v=>v.id===venueId);
  useEffect(() => {
    if(!venue){setSchedule(null);return;}
    const controller = new AbortController();
    fetch("/api/venues/"+encodeURIComponent(venue.slug)+"/schedule",{signal:controller.signal,cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.message);return d;}).then(d=>{if(!controller.signal.aborted)setSchedule(d);}).catch(e=>{if(!controller.signal.aborted)setMessage(e.message);});
    return ()=>controller.abort();
  },[venue]);
  async function run(work:()=>Promise<void>) {
    if(inFlight.current)return;inFlight.current=true;setBusy(true);setMessage("");
    try { await work(); await load(); setMessage("Đã lưu thay đổi."); } catch(e){setMessage(e instanceof Error?e.message:"Không lưu được.");}
    finally{inFlight.current=false;setBusy(false);}
  }
  return <section className="space-y-4 rounded-card border border-border p-5">
    <h2 className="font-bold">Phiên sân và lịch hoạt động</h2>
    <p role="status" aria-live="polite">{message}</p>
    <label className="block">Cơ sở <select className="border p-2" value={venueId} onChange={e=>setVenueId(e.target.value)}><option value="">Chọn cơ sở</option>{venues.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
    {venue && <>
      <details><summary>Lịch đã lưu</summary>{!schedule ? <p>Đang tải lịch...</p> : <div className="space-y-1 text-sm">
        {!schedule.weeklySchedules.length && !schedule.dateExceptions.length && <p>Đang dùng giờ mở cửa mặc định của cơ sở.</p>}
        {schedule.weeklySchedules.map(s=><p key={s.dayOfWeek}>{s.dayOfWeek===7?"Chủ nhật":"Thứ "+(s.dayOfWeek+1)}: {s.isClosed?"Tạm nghỉ":hour(s.openMin)+"–"+hour(s.closeMin)}</p>)}
        {schedule.dateExceptions.map(s=><p key={s.date}>{s.date}: {s.isClosed?"Tạm nghỉ":(s.openMin===null?"Giờ mặc định":hour(s.openMin))+"–"+(s.closeMin===null?"Giờ mặc định":hour(s.closeMin))} {s.reason}</p>)}
      </div>}</details>
      <form className="flex flex-wrap items-end gap-3" onSubmit={e=>{e.preventDefault();void run(async()=>{
        const body = mode==="WEEKLY" ? {type:"WEEKLY",schedules:[{dayOfWeek:day,openMin:minutes(open),closeMin:minutes(close),isClosed:closed}]} : {type:"EXCEPTION",date,isClosed:closed,openMin:minutes(open),closeMin:minutes(close),reason};
        await api("/api/venues/"+encodeURIComponent(venue.slug)+"/schedule",body);
        const d=await api("/api/venues/"+encodeURIComponent(venue.slug)+"/schedule");setSchedule(d);
      });}}>
        <label>Loại lịch <select value={mode} onChange={e=>setMode(e.target.value)}><option value="EXCEPTION">Ngày cụ thể</option><option value="WEEKLY">Theo thứ</option></select></label>
        {mode==="EXCEPTION" ? <label>Ngày <input required type="date" value={date} onChange={e=>setDate(e.target.value)}/></label> : <label>Thứ <select value={day} onChange={e=>setDay(Number(e.target.value))}>{[1,2,3,4,5,6,7].map(d=><option key={d} value={d}>{d===7?"Chủ nhật":"Thứ "+(d+1)}</option>)}</select></label>}
        <label><input type="checkbox" checked={closed} onChange={e=>setClosed(e.target.checked)}/> Tạm nghỉ</label>
        <label>Mở cửa <input required disabled={closed} type="time" value={open} onChange={e=>setOpen(e.target.value)}/></label>
        <label>Đóng cửa <input required disabled={closed} type="time" value={close} onChange={e=>setClose(e.target.value)}/></label>
        <label>Lý do <input maxLength={500} value={reason} onChange={e=>setReason(e.target.value)}/></label>
        <button disabled={busy} className="border rounded p-2">Lưu lịch</button>
      </form>
      {!items.some(i=>i.booking.venueId===venueId) && <p>Chưa có phiên sân cần xử lý tại cơ sở này.</p>}
      <div className="space-y-3">{items.filter(i=>i.booking.venueId===venueId).map(i=><article key={i.id} className="border p-3 space-y-2">
        <p>{i.booking.code} · {i.court.name} · {i.date.slice(0,10)} · {hour(i.startMin)}–{hour(i.endMin)}</p>
        {!i.session ? <button disabled={busy} className="border p-2" onClick={()=>void run(async()=>{await api("/api/venue-operations/sessions",{action:"START_SESSION",bookingItemId:i.id});})}>Nhận sân</button> : <>
          <p>{i.session.status==="ACTIVE"?"Đang sử dụng":"Đã trả sân"}</p>
          {i.session.status==="ACTIVE" && <button disabled={busy} className="border p-2" onClick={()=>void run(async()=>{await api("/api/venue-operations/sessions",{action:"COMPLETE_SESSION",sessionId:i.session!.id});})}>Trả sân</button>}
          <button disabled={busy} className="border p-2" onClick={()=>{setSessionId(i.session!.id);setAmount(0);setSurchargeReason("");requestKey.current=null;}}>Thêm phụ thu</button>
          {i.session.surcharges.map(s=><p key={s.id}>{s.reason}: {s.amount.toLocaleString("vi-VN")}đ · {s.status==="PAID"?"Đã thu":"Chưa thu"} {s.status==="UNPAID" && <button disabled={busy} className="border p-1" onClick={()=>void run(async()=>{await api("/api/venue-operations/sessions",{action:"PAY_SURCHARGE",surchargeId:s.id,paymentMethod:"CASH"});})}>Xác nhận đã thu tiền mặt</button>}</p>)}
        </>}
      </article>)}</div>
      {sessionId && <form className="flex flex-wrap gap-3" onSubmit={e=>{e.preventDefault();requestKey.current??=crypto.randomUUID();void run(async()=>{await api("/api/venue-operations/sessions",{action:"ADD_SURCHARGE",requestId:requestKey.current,sessionId,type:"OTHER",amount,reason:surchargeReason,isPaid:false});setSessionId("");requestKey.current=null;});}}>
        <label>Số tiền phụ thu (đ) <input required type="number" min={1} max={100000000} value={amount} onChange={e=>{setAmount(Number(e.target.value));requestKey.current=null;}}/></label>
        <label>Lý do phụ thu <input required minLength={3} maxLength={500} value={surchargeReason} onChange={e=>{setSurchargeReason(e.target.value);requestKey.current=null;}}/></label>
        <button disabled={busy} className="border p-2">Ghi khoản chưa thu</button><button type="button" disabled={busy} onClick={()=>setSessionId("")}>Đóng</button>
      </form>}
    </>}
  </section>;
}
