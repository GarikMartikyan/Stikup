"use client";

import { useEffect } from "react";

/**
 * Reads the `?ref=` (and optionally `?pack=`) query parameters from the
 * current URL and writes cookies so the backend can credit a referral and
 * unlock the correct pack on registration.
 *
 * Cookies (both intentionally non-httpOnly, set client-side):
 *   - `stikup_ref`      — referral code, read by the register endpoint
 *   - `stikup_ref_pack` — pack id to unlock, set only when `ref` is also present
 *
 * Max-age: 30 days (2592000 seconds).
 */
export function ReferralCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref && /^[\w-]{1,64}$/.test(ref)) {
      document.cookie = `stikup_ref=${encodeURIComponent(ref)}; path=/; max-age=2592000; samesite=lax`;

      // Only capture the pack id when a ref is present — a pack without a ref is meaningless.
      const pack = params.get("pack");
      if (pack && /^[\w-]{1,64}$/.test(pack)) {
        document.cookie = `stikup_ref_pack=${encodeURIComponent(pack)}; path=/; max-age=2592000; samesite=lax`;
      }
    }
  }, []);

  return null;
}
