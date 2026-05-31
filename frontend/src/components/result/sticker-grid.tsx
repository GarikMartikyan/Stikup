"use client";

import { useState } from "react";
import { Check, Lock } from "lucide-react";
import { StickerCard } from "@/components/sticker-card";
import { StickerLightbox } from "./sticker-lightbox";
import { useT } from "@/components/language-provider";

export type StickerItem = {
  index: number;
  url: string;
};

type StickerGridProps = {
  stickers: StickerItem[];
  freeCount: number;
  unlocked: boolean;
  /** Forward to StickerCard — set true when images are served by the backend
   *  (/api/static/...) so Next.js image optimization is bypassed. */
  unoptimized?: boolean;
};

export function StickerGrid({ stickers, freeCount, unlocked, unoptimized = false }: StickerGridProps) {
  const t = useT();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const lockedCount = unlocked ? 0 : Math.max(0, stickers.length - freeCount);
  const unlockedCount = stickers.length - lockedCount;

  // Only available stickers can be opened in the lightbox.
  // When unlocked=true every sticker is available; otherwise only the first freeCount.
  const available = unlocked ? stickers : stickers.slice(0, freeCount);

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 shadow-[var(--shadow-card)] md:p-7">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)]">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          <span>{t("result.sticker_grid.unlocked", { count: unlockedCount })}</span>
        </div>
        {lockedCount > 0 && (
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-fg)] text-[var(--color-bg)]">
              <Lock className="h-3 w-3" />
            </span>
            <span>{t("result.sticker_grid.locked", { count: lockedCount })}</span>
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {stickers.map((s, i) => {
          const isLocked = !unlocked && i >= freeCount;
          return (
            <button
              key={s.index}
              type="button"
              onClick={() => !isLocked && setOpenIndex(i)}
              className="group relative transition"
              aria-label={
                isLocked
                  ? t("result.sticker_grid.locked_sticker")
                  : t("result.sticker_grid.sticker_n", { n: s.index + 1 })
              }
            >
              <StickerCard
                src={s.url}
                alt={`Sticker ${s.index + 1}`}
                locked={isLocked}
                rotate={isLocked ? 0 : (i - 1) * 2}
                delay={i * 60}
                popIn
                unoptimized={unoptimized}
              />
              {!isLocked && (
                <div className="absolute -top-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-[var(--color-success)] text-white shadow-md">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <StickerLightbox
        stickers={available}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
        unoptimized={unoptimized}
      />
    </div>
  );
}
