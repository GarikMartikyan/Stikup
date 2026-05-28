"use client";

import { X } from "lucide-react";
import { useT } from "@/components/language-provider";

export function ErrorBanner({ message }: { message: string }) {
  const t = useT();
  return (
    <div className="mt-3 flex items-start gap-2 rounded-2xl border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-3 text-sm text-[var(--color-danger)]">
      <X className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <div className="font-semibold">{t("upload.error.photo_not_accepted")}</div>
        <div className="text-[var(--color-danger)]/90">{message}</div>
      </div>
    </div>
  );
}
