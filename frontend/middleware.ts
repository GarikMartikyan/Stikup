import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/config";

/**
 * Auth gate for protected routes.
 *
 * Note: in Next 16 the `middleware` file convention is deprecated in favor of
 * `proxy.ts` (same shape, different export name). We keep `middleware.ts`
 * here for now because nothing else in this codebase needs proxy-specific
 * features and Next still supports the legacy name.
 *
 * The session cookie name comes from `@/lib/config` so it stays in sync with
 * `backend/src/config/session.config.ts` (env: `SESSION_COOKIE_NAME`).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);

  if (pathname === "/login" || pathname === "/register") {
    if (hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Protected routes + auth pages for redirect-if-logged-in logic.
  matcher: ["/dashboard", "/dashboard/:path*", "/login", "/register"],
};
