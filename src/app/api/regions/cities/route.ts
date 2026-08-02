import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const provinceCode = request.nextUrl.searchParams.get("provinceCode") ?? "";
  if (!/^\d{2}$/.test(provinceCode)) {
    return NextResponse.json({ message: "Kode provinsi tidak valid." }, { status: 400 });
  }

  try {
    const response = await fetch(`https://wilayah.id/api/regencies/${provinceCode}.json`, {
      next: { revalidate: 86400 },
    });
    if (!response.ok) throw new Error("Region provider failed");
    const payload = (await response.json()) as { data: Array<{ code: string; name: string }> };
    return NextResponse.json({
      data: payload.data.map((region) => ({ code: region.code, name: region.name.trim() })),
    });
  } catch {
    return NextResponse.json({ message: "Daftar kota gagal dimuat." }, { status: 502 });
  }
}
