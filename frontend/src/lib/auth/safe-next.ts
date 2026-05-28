/**
 * Sanitize a `?next=` redirect target.
 *
 * Only same-origin absolute paths are allowed. A bare `startsWith("/")` check
 * is NOT enough: scheme-relative URLs like `//evil.com` and backslash tricks
 * like `/\evil.com` also start with "/" but browsers resolve them to an
 * external origin — an open-redirect vector when `next` comes from a
 * user-controlled query string. Anything suspicious falls back to `fallback`.
 */
export function safeNextPath(
  next: string | null | undefined,
  fallback = "/my-stickers",
): string {
  if (
    next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\")
  ) {
    return next;
  }
  return fallback;
}
