import { cookies } from "next/headers";
import { cache } from "react";

import { BACKEND_URL, SESSION_COOKIE_NAME } from "@/lib/config";

/**
 * Server-side check for a valid session. Returns true only when the session
 * cookie resolves to a real backend session — guards against stale cookies
 * (session revoked, DB reset, expired) which would otherwise look "logged in"
 * to a naive cookie-presence check.
 *
 * Memoized via React `cache` so multiple callers in the same SSR render share
 * one backend call.
 */
export const hasSession = cache(async (): Promise<boolean> => {
  const store = await cookies();
  if (!store.has(SESSION_COOKIE_NAME)) return false;

  const cookieHeader = store.toString();
  const res = await fetch(`${BACKEND_URL}/auth/me`, {
    cache: "no-store",
    headers: { cookie: cookieHeader },
  });
  return res.ok;
});

// Re-exported for server component convenience.
export { uploadCtaHref } from "@/lib/auth/cta-href";
