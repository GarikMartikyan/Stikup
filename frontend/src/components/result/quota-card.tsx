"use client";

import { Heart } from "lucide-react";
import { useT } from "@/components/language-provider";

function Quota({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = total === 0 ? 0 : Math.min(100, (used / total) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between text-[10px] uppercase tracking-wide">
        <span className="text-[var(--color-fg-muted)]">{label}</span>
        <span className="font-mono text-[var(--color-fg)]">
          {used}/{total}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-bg-sunk)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-2)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function QuotaCard() {
  const t = useT();
  return (
    <div className="rounded-3xl border border-dashed border-[var(--color-border-strong)] p-5 text-xs text-[var(--color-fg-muted)]">
      <div className="flex items-center gap-2 font-semibold text-[var(--color-fg)]">
        <Heart className="h-3.5 w-3.5 text-[var(--color-brand)]" />
        {t("result.quota.title")}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Quota label={t("result.quota.generations")} used={1} total={1} />
        <Quota label={t("result.quota.regenerations")} used={0} total={1} />
      </div>
      <div className="mt-3 text-[10px]">
        {t("result.quota.note")}
      </div>
    </div>
  );
}
