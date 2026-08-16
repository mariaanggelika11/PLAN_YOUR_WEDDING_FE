import { dashboardRoute, ROUTES, type AppRole } from "@/shared/config/routes";
import { NextResponse, type NextRequest } from "next/server";

// TODO API: Validasi session user dan role dari backend/auth provider
export function middleware(request: NextRequest) {
  const role = request.cookies.get("pyw_role")?.value;
  const area = request.nextUrl.pathname.split("/")[1]?.toUpperCase();
  if (!role) {
    const loginUrl = new URL(ROUTES.login, request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  if (role !== area)
    return NextResponse.redirect(
      new URL(dashboardRoute(role.toLowerCase() as AppRole), request.url),
    );
  return NextResponse.next();
}

export const config = { matcher: ["/customer/:path*", "/vendor/:path*", "/admin/:path*"] };
