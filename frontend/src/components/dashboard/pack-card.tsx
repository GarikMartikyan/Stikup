import Link from "next/link";
import { Check, ExternalLink, RefreshCw } from "lucide-react";
import { StickerCard } from "@/components/sticker-card";
import { ALL_STICKERS, type DashboardPack } from "./data";

export function PackCard({ pack }: { pack: DashboardPack }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 shadow-[var(--shadow-card)] md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
            {pack.createdAt}
          </div>
          <div className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
            {pack.name}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success)]/15 px-2 py-0.5 font-bold text-[var(--color-success)]">
              <Check className="h-3 w-3" strokeWidth={3} /> ready
            </span>
            <span className="text-[var(--color-fg-muted)]">12/12 stickers</span>
          </div>
        </div>
        <a
          href={`https://t.me/addstickers/${pack.name}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-fg)] px-3 py-1.5 text-xs font-bold text-[var(--color-bg)] hover:opacity-90"
        >
          Install
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="mt-4 grid grid-cols-6 gap-2">
        {ALL_STICKERS.map((s, i) => (
          <StickerCard
            key={i}
            src={s.src}
            alt={s.alt}
            rotate={(i % 2 === 0 ? 1 : -1) * (i % 3)}
          />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-4 text-xs">
        <span className="text-[var(--color-fg-muted)]">
          Regenerations: {pack.regenLeft} left
        </span>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-3 py-1.5 font-bold text-[var(--color-fg)] hover:bg-[var(--color-bg-sunk)]"
          >
            <RefreshCw className="h-3 w-3" /> Regenerate
          </button>
          <Link
            href={`/result/${pack.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-3 py-1.5 font-bold text-[var(--color-fg)] hover:bg-[var(--color-bg-sunk)]"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
