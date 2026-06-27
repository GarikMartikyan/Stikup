"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTelegram } from "@/components/telegram/telegram-provider";

/**
 * Enforces the Telegram-only experience on the web.
 *
 * In a plain browser only the marketing home page ("/") is meant to be visible;
 * its CTAs funnel visitors into the Telegram Mini App. Any deeper route a
 * visitor lands on (typed URL, bookmark, stale share link) is bounced back to
 * the home page.
 *
 * Inside the Telegram Mini App this is a no-op — every route works normally.
 * We wait for `telegramResolved` so we never redirect before SDK detection has
 * had its chance to run (otherwise a real Mini App load could be misread as a
 * browser during the first frames).
 */
export function BrowserGuard() {
  const { isTelegram, telegramResolved } = useTelegram();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!telegramResolved || isTelegram) return;
    if (pathname && pathname !== "/") {
      router.replace("/");
    }
  }, [telegramResolved, isTelegram, pathname, router]);

  return null;
}
