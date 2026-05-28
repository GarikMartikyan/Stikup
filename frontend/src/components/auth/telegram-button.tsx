"use client";

import { Send } from "lucide-react";
import { TELEGRAM_BOT_URL } from "@/lib/config";
import { useT } from "@/components/language-provider";

export function TelegramButton() {
  const t = useT();
  return (
    <a
      href={TELEGRAM_BOT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[#229ED9] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#229ED9]"
    >
      <Send className="h-4 w-4" aria-hidden="true" />
      {t("auth.login.telegram_button")}
    </a>
  );
}
