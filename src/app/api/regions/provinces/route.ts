import { NextResponse } from "next/server";
import { getRegions } from "@/shared/server/regionProvider";

export async function GET() {
  try {
    return NextResponse.json({ data: await getRegions() });
  } catch {
    return NextResponse.json({ message: "Daftar provinsi gagal dimuat." }, { status: 502 });
  }
}
