import { type NextRequest, NextResponse } from "next/server";
import { getRegions } from "@/shared/server/regionProvider";

export async function GET(request: NextRequest) {
  const provinceCode = request.nextUrl.searchParams.get("provinceCode") ?? "";
  if (!/^\d{2}$/.test(provinceCode)) {
    return NextResponse.json({ message: "Kode provinsi tidak valid." }, { status: 400 });
  }

  try {
    return NextResponse.json({ data: await getRegions(provinceCode) });
  } catch {
    return NextResponse.json({ message: "Daftar kota gagal dimuat." }, { status: 502 });
  }
}
