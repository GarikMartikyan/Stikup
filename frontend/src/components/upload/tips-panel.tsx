"use client";

import { Camera, Sun, UserRound } from "lucide-react";
import { useT } from "@/components/language-provider";

export function TipsPanel() {
  const t = useT();

  const TIPS = [
    { icon: UserRound, key: "tip_face" as const },
    { icon: Sun, key: "tip_light" as const },
    { icon: Camera, key: "tip_camera" as const },
  ];

  return (
    <aside className="reveal space-y-4" style={{ animationDelay: "150ms" }}>
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-6 shadow-[var(--shadow-card)]">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
          {t("upload.tips.section_label")}
        </div>
        <ul className="mt-4 space-y-3 text-sm">
          {TIPS.map((tip) => (
            <li key={tip.key} className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--color-brand)]/12 text-[var(--color-brand)]">
                <tip.icon className="h-4 w-4" strokeWidth={2.2} />
              </span>
              <span className="text-[var(--color-fg)]">{t(`upload.tips.${tip.key}`)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-brand)]/10 via-[var(--color-bg-elev)] to-[var(--color-brand-2)]/10 p-6">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
          {t("upload.tips.free_preview_label")}
        </div>
        <div className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
          {t("upload.tips.free_preview_title")}
        </div>
        <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
          {t("upload.tips.free_preview_body")}
        </p>
      </div>

      <div className="rounded-3xl border border-dashed border-[var(--color-border-strong)] p-5 text-xs text-[var(--color-fg-muted)] md:hidden">
        {t("upload.tips.privacy_note")}
      </div>
    </aside>
  );
}

export function PrivacyNote({ className = "" }: { className?: string }) {
  const t = useT();
  return (
    <div
      className={`rounded-3xl border border-dashed border-[var(--color-border-strong)] p-5 text-xs text-[var(--color-fg-muted)] ${className}`}
    >
      {t("upload.tips.privacy_note")}
    </div>
  );
}
