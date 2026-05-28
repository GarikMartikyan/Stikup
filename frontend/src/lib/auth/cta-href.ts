/**
 * Where the primary "make stickers" CTA should point. Logged-out visitors are
 * sent to /login with a `next` param so they bounce back to /upload after
 * signing in (the proxy gate would do this anyway, but routing directly avoids
 * the extra redirect and makes intent legible in the URL).
 *
 * This file is intentionally free of server-only imports so it can be used
 * safely in client components.
 */
export function uploadCtaHref(loggedIn: boolean): string {
  return loggedIn ? "/upload" : "/login?next=%2Fupload";
}
