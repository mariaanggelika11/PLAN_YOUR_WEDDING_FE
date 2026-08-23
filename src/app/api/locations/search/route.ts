import { type NextRequest, NextResponse } from "next/server";

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 3 || query.length > 150) {
    return NextResponse.json(
      { message: "Masukkan minimal 3 karakter untuk mencari lokasi." },
      { status: 400 },
    );
  }

  const url = new URL(NOMINATIM_SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "id");

  try {
    const response = await fetch(url, {
      headers: {
        "Accept-Language": "id",
        "User-Agent": "PlanYourWedding/1.0 (location-picker)",
      },
      next: { revalidate: 86400 },
    });
    if (!response.ok) throw new Error("Location provider failed");
    const payload = (await response.json()) as NominatimResult[];
    return NextResponse.json({
      data: payload
        .map((item) => ({
          label: item.display_name,
          latitude: Number(item.lat),
          longitude: Number(item.lon),
        }))
        .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)),
    });
  } catch {
    return NextResponse.json(
      { message: "Pencarian lokasi sedang tidak tersedia." },
      { status: 502 },
    );
  }
}
