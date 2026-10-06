export function validCoordinates(venue: { lat: number; lng: number }) {
  return Number.isFinite(venue.lat) && Number.isFinite(venue.lng) && Math.abs(venue.lat) <= 85.05112878 && Math.abs(venue.lng) <= 180;
}

export function directionsUrl(venue: { lat: number; lng: number }) {
  return `https://www.google.com/maps/dir/?${new URLSearchParams({ api: "1", destination: `${venue.lat},${venue.lng}`, travelmode: "driving" })}`;
}

export function venuesHref(current: Record<string, string | undefined>, overrides: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...overrides })) {
    if (value && ["q", "district", "view", "sort", "hasSlotTonight", "amenity", "maxPrice"].includes(key)) params.set(key, value);
  }
  return `/venues?${params}`;
}
