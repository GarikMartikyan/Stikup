"use client";

import { useT } from "@/components/language-provider";

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 shadow-[var(--shadow-card)]">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
        {label}
      </div>
      <div className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight">
        {value}
      </div>
      <div className="mt-1 text-xs text-[var(--color-fg-muted)]">{hint}</div>
    </div>
  );
}

export function StatsRow({ packCount }: { packCount: number }) {
  const t = useT();
  return (
    <div className="reveal mt-8 grid gap-4 md:grid-cols-4" style={{ animationDelay: "120ms" }}>
      <Stat label={t("dashboard.stats.packs_label")} value={String(packCount)} hint={t("dashboard.stats.packs_hint")} />
      <Stat label={t("dashboard.stats.stickers_label")} value={String(packCount * 12)} hint={t("dashboard.stats.stickers_hint")} />
      <Stat label={t("dashboard.stats.regens_label")} value={t("dashboard.stats.regens_value")} hint={t("dashboard.stats.regens_hint")} />
      <Stat label={t("dashboard.stats.subscription_label")} value={t("dashboard.stats.subscription_value")} hint={t("dashboard.stats.subscription_hint")} />
    </div>
  );
}
