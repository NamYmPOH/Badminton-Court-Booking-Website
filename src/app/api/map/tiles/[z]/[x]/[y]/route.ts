const SITE = "https://badminton-court-booking-website-five.vercel.app";
const WEEK = 7 * 24 * 60 * 60;

// A fixed upstream and bounded XYZ coordinates keep this from being an open proxy.
export async function GET(request: Request, { params }: { params: { z: string; x: string; y: string } }) {
  const { z, x, y } = params;
  if (![z, x, y].every(value => /^(0|[1-9]\d*)$/.test(value))) return new Response("Invalid tile", { status: 400 });
  const zoom = Number(z);
  if (zoom > 19 || Number(x) >= 2 ** zoom || Number(y) >= 2 ** zoom) return new Response("Invalid tile", { status: 400 });

  try {
    const referer = request.headers.get("referer") || `${SITE}/venues`;
    const upstream = await fetch(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`, {
      headers: {
        "User-Agent": `SmashBook/1.0 (+${SITE}; https://github.com/NamYmPOH/Badminton-Court-Booking-Website)`,
        "Referer": referer,
      },
      // OSM requires at least seven days when using a fixed cache TTL.
      next: { revalidate: WEEK },
      signal: AbortSignal.timeout(12000),
    });
    if (!upstream.ok || !upstream.headers.get("content-type")?.startsWith("image/png")) {
      return new Response("Map temporarily unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    return new Response(await upstream.arrayBuffer(), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": `public, max-age=${WEEK}, s-maxage=${WEEK}`,
      },
    });
  } catch {
    return new Response("Map temporarily unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
