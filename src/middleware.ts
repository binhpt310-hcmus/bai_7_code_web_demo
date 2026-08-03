import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "./lib/session-edge";
import { SESSION_COOKIE_NAME } from "./lib/session-constants";

// "/admin/menu" is intentionally NOT owner-only: staff have read-only access
// there (RBAC A5), the page itself hides edit controls and the API guards
// mutations to owner-only. Only fully owner-restricted sections are gated here.
const OWNER_ONLY_PREFIXES = ["/admin/staff", "/admin/reports", "/admin/settings"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token, process.env.SESSION_SECRET!);

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const isOwnerOnly = OWNER_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
  if (isOwnerOnly && session.role !== "owner") {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/orders";
    url.searchParams.set("denied", "1");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
