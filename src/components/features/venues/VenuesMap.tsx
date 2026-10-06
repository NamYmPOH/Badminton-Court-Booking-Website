"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type * as Leaflet from "leaflet";
import type { Venue } from "@/types/venue";
import { formatVND } from "@/lib/utils";
import { validCoordinates, directionsUrl } from "@/lib/venue-map";

export function VenuesMap({ venues }: { venues: Venue[] }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const markers = useRef(new Map<string, Leaflet.Marker>());
  const tiles = useRef<Leaflet.TileLayer | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [tileError, setTileError] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const locationLayer = useRef<Leaflet.LayerGroup | null>(null);
  const selected = venues.find(v => v.id === selectedId);

  useEffect(() => {
    let cancelled = false;
    const registry = markers.current;
    let instance: Leaflet.Map | null = null;
    let observer: ResizeObserver | null = null;
    setReady(false);
    setError("");
    setTileError(false);
    setSelectedId(null);
    setLocationStatus("");
    const visible = venues.filter(validCoordinates);

    async function initialize() {
      try {
        const L = await import("leaflet");
        if (cancelled || !container.current) return;
        instance = L.map(container.current, { scrollWheelZoom: false, zoomAnimation: false, markerZoomAnimation: false });
        if (visible.length) instance.fitBounds(L.latLngBounds(visible.map(v => [v.lat, v.lng])), { padding: [40, 40], maxZoom: 15 });
        else instance.setView([21.0285, 105.8542], 12);
        map.current = instance;
        tiles.current = L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILE_URL || "/api/map/tiles/{z}/{x}/{y}", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        }).addTo(instance);
        tiles.current.on("loading", () => { if (!cancelled) setTileError(false); });
        tiles.current.on("tileerror", () => { if (!cancelled) setTileError(true); });
        L.control.scale({ imperial: false }).addTo(instance);
        registry.clear();

        visible.forEach((venue) => {
          const index = venues.indexOf(venue);
          const icon = L.divIcon({ className: "venue-map-marker", html: `<span><b>${index + 1}</b></span>`, iconSize: [32, 38], iconAnchor: [16, 38], popupAnchor: [0, -36] });
          const marker = L.marker([venue.lat, venue.lng], { icon, title: venue.name, alt: venue.name, keyboard: true }).addTo(instance!);
          const popup = document.createElement("div");
          const name = document.createElement("strong");
          name.textContent = venue.name;
          const address = document.createElement("p");
          address.textContent = `${venue.address}, ${venue.district}`;
          const price = document.createElement("p");
          price.textContent = `Từ ${formatVND(venue.priceFrom)}/giờ · ★ ${venue.ratingAvg}`;
          const detail = document.createElement("a");
          detail.href = `/venues/${encodeURIComponent(venue.slug)}`;
          detail.textContent = "Xem sân và đặt lịch →";
          popup.append(name, address, price, detail);
          marker.bindPopup(popup, { maxWidth: 280 });
          marker.on("click", () => setSelectedId(venue.id));
          marker.on("popupopen", () => setSelectedId(venue.id));
          const element = marker.getElement();
          element?.setAttribute("aria-label", `Ghim ${index + 1}: ${venue.name}`);
          registry.set(venue.id, marker);
        });
        observer = new ResizeObserver(() => instance?.invalidateSize());
        observer.observe(container.current);
        setReady(true);
      } catch {
        if (!cancelled) setError("Không khởi tạo được bản đồ. Vui lòng tải lại trang hoặc chọn sân trong danh sách.");
      }
    }
    void initialize();
    return () => {
      cancelled = true;
      observer?.disconnect();
      instance?.stop();
      instance?.remove();
      map.current = null;
      tiles.current = null;
      registry.clear();
      locationLayer.current = null;
    };
  }, [venues]);

  useEffect(() => {
    markers.current.forEach((marker, id) => marker.getElement()?.classList.toggle("is-selected", id === selectedId));
  }, [selectedId]);

  function selectVenue(venue: Venue) {
    setSelectedId(venue.id);
    if (!validCoordinates(venue)) return;
    map.current?.setView([venue.lat, venue.lng], 16);
    markers.current.get(venue.id)?.openPopup();
  }

  async function showAll() {
    const L = await import("leaflet");
    const visible = venues.filter(validCoordinates);
    if (visible.length) map.current?.fitBounds(L.latLngBounds(visible.map(v => [v.lat, v.lng])), { padding: [40, 40], maxZoom: 15 });
    else map.current?.setView([21.0285, 105.8542], 12);
  }

  function locate() {
    if (!navigator.geolocation) { setLocationStatus("Trình duyệt không hỗ trợ định vị."); return; }
    setLocationStatus("Đang xác định vị trí...");
    const currentMap = map.current;
    navigator.geolocation.getCurrentPosition(async position => {
      if (!currentMap || currentMap !== map.current) return;
      const L = await import("leaflet");
      if (currentMap !== map.current) return;
      const { latitude, longitude, accuracy } = position.coords;
      locationLayer.current?.remove();
      locationLayer.current = L.layerGroup([
        L.circle([latitude, longitude], { radius: accuracy, color: "#2563eb", fillOpacity: 0.08 }),
        L.circleMarker([latitude, longitude], { radius: 7, color: "#fff", fillColor: "#2563eb", fillOpacity: 1 }).bindTooltip("Vị trí của bạn"),
      ]).addTo(currentMap);
      currentMap.setView([latitude, longitude], 15);
      setLocationStatus("Đã hiển thị vị trí của bạn. Vị trí chỉ dùng trong phiên bản đồ này.");
    }, failure => {
      if (currentMap !== map.current) return;
      setLocationStatus(failure.code === 1 ? "Chưa được cấp quyền định vị. Bạn vẫn có thể tìm sân theo quận." : "Không lấy được vị trí. Vui lòng thử lại.");
    }, { timeout: 10000, maximumAge: 60000 });
  }

  return (
    <section className="mt-6" aria-label="Bản đồ và danh sách sân">
      <p className="mb-4 rounded-control border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Nền bản đồ thực tế. Các ghim dùng tọa độ trong danh mục mẫu, chưa xác minh vị trí từng sân. Vui lòng kiểm tra với cơ sở trước khi đến.</p>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <div className="mb-3 flex flex-wrap gap-2">
            <button disabled={!ready} onClick={() => void showAll()} className="rounded-control border border-border bg-surface px-3 py-2 text-xs font-semibold disabled:opacity-50">Xem tất cả ghim</button>
            <button disabled={!ready} onClick={locate} className="rounded-control border border-border bg-surface px-3 py-2 text-xs font-semibold disabled:opacity-50">Vị trí của tôi</button>
            <span className="self-center text-xs text-muted">{venues.filter(validCoordinates).length} ghim · Bấm ghim để xem sân</span>
          </div>
          <div className="relative isolate overflow-hidden rounded-card border border-border">
            <div ref={container} className="venue-map h-[420px] w-full sm:h-[540px]" role="region" aria-label="Bản đồ sân cầu lông OpenStreetMap" />
            {!ready && <p role="status" className="absolute inset-0 z-[1000] flex items-center justify-center bg-surface/90 p-6 text-center text-sm">{error || "Đang tải bản đồ..."}</p>}
          </div>
          {tileError && <p role="alert" className="mt-2 text-xs text-rose-600">Không tải được một số ô bản đồ. Kiểm tra kết nối hoặc <button className="underline" onClick={() => { setTileError(false); tiles.current?.redraw(); }}>thử lại</button>. Các ghim và danh sách sân vẫn sử dụng được.</p>}
          {locationStatus && <p role="status" className="mt-2 text-xs text-muted">{locationStatus}</p>}
          {venues.some(v => !validCoordinates(v)) && <p className="mt-2 text-xs text-muted">Một số sân chưa có tọa độ hợp lệ nên chỉ xuất hiện trong danh sách.</p>}
        </div>
        <aside className="min-w-0 space-y-3" aria-label="Sân trên bản đồ">
          {selected && <div className="rounded-card border border-court-500 bg-surface p-4 shadow-sm" aria-live="polite">
            <p className="text-xs font-semibold text-court-600">Đang chọn</p>
            <h2 className="mt-1 font-bold">{selected.name}</h2>
            <p className="mt-2 text-xs text-muted">{selected.address}, {selected.district}, {selected.city}</p>
            <p className="mt-2 text-sm font-semibold">{formatVND(selected.priceFrom)}/giờ · ★ {selected.ratingAvg}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
              <Link className="rounded-control bg-court-600 px-3 py-2 text-white" href={`/venues/${selected.slug}`}>Xem sân và đặt lịch</Link>
              {validCoordinates(selected) && <a className="rounded-control border border-border px-3 py-2" target="_blank" rel="noopener noreferrer" href={directionsUrl(selected)}>Chỉ đường ↗</a>}
            </div>
          </div>}
          <h2 className="text-sm font-semibold">{venues.length} sân theo bộ lọc</h2>
          {!venues.length && <p role="status" className="rounded-card border border-dashed border-border p-6 text-sm text-muted">Không tìm thấy sân phù hợp. Thử đổi quận hoặc bộ lọc.</p>}
          <div className="space-y-2 lg:max-h-[540px] lg:overflow-y-auto lg:pr-1">
            {venues.map((venue, index) => <div key={venue.id} className={`rounded-control border p-3 ${venue.id === selectedId ? "border-court-500 bg-court-50 dark:bg-court-950" : "border-border bg-surface"}`}>
              <button onClick={() => selectVenue(venue)} className="w-full text-left" aria-pressed={venue.id === selectedId} aria-label={`Xem trên bản đồ: ${venue.name}`}>
                <span className="text-xs font-semibold text-court-600">{index + 1}. {venue.district}</span>
                <span className="mt-1 block text-sm font-bold">{venue.name}</span>
                <span className="mt-1 block text-xs text-muted">{venue.address}</span>
                <span className="mt-2 block text-xs">Từ {formatVND(venue.priceFrom)}/giờ · ★ {venue.ratingAvg}</span>
              </button>
              <Link href={`/venues/${venue.slug}`} className="mt-2 inline-block text-xs font-semibold text-court-600 underline">Xem chi tiết</Link>
            </div>)}
          </div>
        </aside>
      </div>
    </section>
  );
}
