/** Thứ tự tọa độ sao chép từ Google Maps: vĩ độ, kinh độ. */
export function parseCoordinates(value: string): { lat: number; lng: number } | null {
  const match = value.trim().match(/^([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}
