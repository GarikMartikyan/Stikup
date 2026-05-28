import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { BACKEND_URL, SESSION_COOKIE_NAME } from "@/lib/config";
import { safeNextPath } from "@/lib/auth/safe-next";

/**
 * Auth gate for protected routes. Next 16 convention: file is `proxy.ts` and
 * the exported function is named `proxy`. Session cookie name comes from
 * `@/lib/config` so it stays in sync with backend env `SESSION_COOKIE_NAME`.
 *
 * Validates the session against the backend (not just cookie presence) so a
 * stale cookie — session revoked, DB reset, expired — doesn't masquerade as
 * "logged in" and bounce the user into protected pages they can't actually
 * use.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  let isLoggedIn = false;
  if (sessionCookie) {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/me`, {
        cache: "no-store",
        headers: { cookie: `${SESSION_COOKIE_NAME}=${sessionCookie.value}` },
      });
      isLoggedIn = res.ok;
    } catch {
      // Backend unreachable: never 500 the navigation. Degrade to cookie
      // presence and let the page's own session check make the final call.
      isLoggedIn = true;
    }
  }
  const staleCookie = Boolean(sessionCookie) && !isLoggedIn;

  function clearStaleCookie(response: NextResponse): NextResponse {
    if (staleCookie) response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  if (pathname === "/login" || pathname === "/register") {
    if (isLoggedIn) {
      // Honour ?next= when redirecting an already-logged-in user.
      const next = request.nextUrl.searchParams.get("next");
      const url = request.nextUrl.clone();
      url.search = "";
      url.pathname = safeNextPath(next);
      return NextResponse.redirect(url);
    }
    return clearStaleCookie(NextResponse.next());
  }

  if (!isLoggedIn) {
    const url = request.nextUrl.clone();
    const next = pathname;
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(next)}`;
    return clearStaleCookie(NextResponse.redirect(url));
  }
  return NextResponse.next();
}

export const config = {
  // Protected routes + auth pages for redirect-if-logged-in logic.
  matcher: [
    "/my-stickers",
    "/my-stickers/:path*",
    "/settings",
    "/settings/:path*",
    "/upload",
    "/upload/:path*",
    "/result",
    "/result/:path*",
    "/success",
    "/success/:path*",
    "/login",
    "/register",
  ],
};
