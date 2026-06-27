"use client";

import { Send } from "lucide-react";
import { telegramAppHref } from "@/lib/telegram/href";
import { useT } from "@/components/language-provider";

/**
 * Compact header CTA shown in a browser. The app is Telegram-only, so instead
 * of a Sign in / account control the web header funnels visitors straight into
 * the Telegram Mini App.
 */
export function OpenInTelegramButton() {
  const t = useT();
  return (
    <a
      href={telegramAppHref()}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-fg)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)] shadow-sm transition hover:opacity-90"
    >
      <Send className="h-4 w-4" aria-hidden="true" />
      {t("header.open_in_telegram")}
    </a>
  );
}
