import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/config";

/**
 * Auth gate for protected routes. Next 16 convention: file is `proxy.ts` and
 * the exported function is named `proxy`. Session cookie name comes from
 * `@/lib/config` so it stays in sync with backend env `SESSION_COOKIE_NAME`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);

  if (pathname === "/login" || pathname === "/register") {
    if (hasSession) {
      // Honour ?next= when redirecting an already-logged-in user.
      const next = request.nextUrl.searchParams.get("next");
      const url = request.nextUrl.clone();
      url.search = "";
      if (next && next.startsWith("/")) {
        url.pathname = next;
      } else {
        url.pathname = "/dashboard";
      }
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    const url = request.nextUrl.clone();
    const next = pathname;
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(next)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Protected routes + auth pages for redirect-if-logged-in logic.
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/upload",
    "/upload/:path*",
    "/login",
    "/register",
  ],
};
