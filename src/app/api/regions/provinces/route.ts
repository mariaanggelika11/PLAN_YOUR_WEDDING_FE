import { NextResponse } from "next/server";

const PROVINCES_URL = "https://wilayah.id/api/provinces.json";

export async function GET() {
  try {
    const response = await fetch(PROVINCES_URL, { next: { revalidate: 86400 } });
    if (!response.ok) throw new Error("Region provider failed");
    const payload = (await response.json()) as { data: Array<{ code: string; name: string }> };
    return NextResponse.json({ data: payload.data.map(normalizeRegion) });
  } catch {
    return NextResponse.json({ message: "Daftar provinsi gagal dimuat." }, { status: 502 });
  }
}

function normalizeRegion(region: { code: string; name: string }) {
  return { code: region.code, name: region.name.trim() };
}
