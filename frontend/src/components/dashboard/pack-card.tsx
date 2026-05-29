"use client";

import Link from "next/link";
import { ArrowRight, Check, Lock } from "lucide-react";
import { StickerCard } from "@/components/sticker-card";
import type { DashboardPack } from "./data";
import { useT } from "@/components/language-provider";

export function PackCard({ pack }: { pack: DashboardPack }) {
  const t = useT();
  const unlockedCount = pack.unlocked ? pack.stickers.length : pack.freeCount;
  const lockedCount = Math.max(0, pack.stickers.length - unlockedCount);

  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 shadow-[var(--shadow-card)] md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
            {pack.createdAtLabel}
          </div>
          <div className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
            {t("dashboard.pack_card.title")}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success)]/15 px-2 py-0.5 font-bold text-[var(--color-success)]">
              <Check className="h-3 w-3" strokeWidth={3} /> {t("dashboard.pack_card.ready")}
            </span>
            {pack.unlocked ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)]/10 px-2 py-0.5 font-bold text-[var(--color-brand)]">
                {t("dashboard.pack_card.unlocked")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[var(--color-fg-muted)]">
                <Lock className="h-3 w-3" /> {t("dashboard.pack_card.locked_count", { count: lockedCount })}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-6 gap-2">
        {pack.stickers.map((s, i) => (
          <StickerCard
            key={s.index}
            src={s.url}
            alt={`Sticker ${s.index + 1}`}
            locked={!pack.unlocked && i >= pack.freeCount}
            rotate={(i % 2 === 0 ? 1 : -1) * (i % 3)}
          />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-4 text-xs">
        <span className="text-[var(--color-fg-muted)]">
          {t("dashboard.pack_card.sticker_total", { count: pack.stickers.length })}
        </span>
        <Link
          href={`/result/${pack.id}`}
          className="group ml-auto inline-flex items-center gap-1.5 rounded-full bg-[var(--color-fg)] px-4 py-1.5 font-bold text-[var(--color-bg)] transition hover:opacity-90"
        >
          {t("dashboard.pack_card.view")}
          <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
