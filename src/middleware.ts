import { NextResponse, type NextRequest } from "next/server";
import {
  getAdminAllowedIps,
  getAdminSecret,
  isAdminEnabled,
  SESSION_COOKIE,
} from "@/lib/admin/config";
import { verifySessionTokenEdge } from "@/lib/admin/session-edge";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "";
  }
  return request.headers.get("x-real-ip")?.trim() ?? "";
}

function isIpAllowed(request: NextRequest): boolean {
  const allowlist = getAdminAllowedIps();
  if (allowlist.length === 0) {
    return true;
  }

  const clientIp = getClientIp(request);
  return allowlist.includes(clientIp);
}

function isPublicAdminPath(pathname: string): boolean {
  return pathname === "/admin/login" || pathname === "/api/admin/login";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  if (!isAdminEnabled()) {
    return new NextResponse(null, { status: 404 });
  }

  if (!isIpAllowed(request)) {
    return new NextResponse(null, { status: 403 });
  }

  if (isPublicAdminPath(pathname)) {
    return withAdminRouteHeader(NextResponse.next());
  }

  if (pathname === "/api/admin/login" && request.method === "POST") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const valid = await verifySessionTokenEdge(token, getAdminSecret());

  if (!valid) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set("x-admin-route", "1");
  return response;
}

function withAdminRouteHeader(response: NextResponse): NextResponse {
  response.headers.set("x-admin-route", "1");
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
