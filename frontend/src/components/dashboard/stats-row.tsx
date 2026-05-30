"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Layers, Sparkles, RefreshCw, Crown } from "lucide-react";
import { useT } from "@/components/language-provider";

type Accent = {
  /** Icon tint + glow color */
  color: string;
  /** Soft background wash behind the icon chip */
  soft: string;
};

function Stat({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  delay,
  href,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  accent: Accent;
  delay: number;
  /** When set, the whole card becomes a link to this route. */
  href?: string;
}) {
  const className =
    "reveal group relative block overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4 shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-1 hover:border-[var(--color-border-strong)] hover:shadow-[0_18px_44px_-16px_rgba(26,20,16,0.28)] md:p-5";

  const content = (
    <>
      {/* Accent glow that warms up on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: accent.color }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
          {label}
        </div>
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition duration-300 group-hover:scale-110"
          style={{ background: accent.soft, color: accent.color }}
        >
          <Icon className="h-[1.05rem] w-[1.05rem]" />
        </span>
      </div>

      <div className="relative mt-4 font-[family-name:var(--font-display)] text-4xl font-extrabold leading-none tracking-tight">
        {value}
      </div>
      <div className="relative mt-2 text-xs text-[var(--color-fg-muted)]">{hint}</div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} style={{ animationDelay: `${delay}ms` }}>
        {content}
      </Link>
    );
  }

  return (
    <div className={className} style={{ animationDelay: `${delay}ms` }}>
      {content}
    </div>
  );
}

export function StatsRow({
  packCount,
  regensLeft,
}: {
  packCount: number;
  regensLeft: number;
}) {
  const t = useT();
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      <Stat
        label={t("dashboard.stats.packs_label")}
        value={String(packCount)}
        hint={t("dashboard.stats.packs_hint")}
        icon={Layers}
        accent={{ color: "var(--color-brand)", soft: "color-mix(in oklab, var(--color-brand) 14%, transparent)" }}
        delay={80}
      />
      <Stat
        label={t("dashboard.stats.stickers_label")}
        value={String(packCount * 12)}
        hint={t("dashboard.stats.stickers_hint")}
        icon={Sparkles}
        accent={{ color: "var(--color-brand-2)", soft: "color-mix(in oklab, var(--color-brand-2) 16%, transparent)" }}
        delay={160}
      />
      <Stat
        label={t("dashboard.stats.regens_label")}
        value={String(regensLeft)}
        hint={t("dashboard.stats.regens_hint")}
        icon={RefreshCw}
        accent={{ color: "#6366f1", soft: "color-mix(in oklab, #6366f1 14%, transparent)" }}
        delay={240}
      />
      <Stat
        label={t("dashboard.stats.subscription_label")}
        value={t("dashboard.stats.subscription_value")}
        hint={t("dashboard.stats.subscription_hint")}
        icon={Crown}
        accent={{ color: "var(--color-success)", soft: "color-mix(in oklab, var(--color-success) 14%, transparent)" }}
        delay={320}
        href="/subscribe"
      />
    </div>
  );
}
