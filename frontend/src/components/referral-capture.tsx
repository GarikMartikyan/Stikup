"use client";

import { useEffect } from "react";

/**
 * Reads the `?ref=` query parameter from the current URL and writes a
 * `stikup_ref` cookie so the backend can credit a referral on registration.
 * The cookie is intentionally non-httpOnly (set client-side) because the
 * backend reads it via the Cookie header on the register endpoint.
 * Max-age: 30 days (2592000 seconds).
 */
export function ReferralCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref && /^[\w-]{1,64}$/.test(ref)) {
      document.cookie = `stikup_ref=${encodeURIComponent(ref)}; path=/; max-age=2592000; samesite=lax`;
    }
  }, []);

  return null;
}
