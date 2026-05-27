"use client";

import { Check, Lock, Sparkles } from "lucide-react";
import { StickerCard } from "@/components/sticker-card";
import { ALL_STICKERS, FREE_COUNT, PACK_SIZE } from "./data";

type StickerGridProps = {
  selected: number | null;
  onSelect: (i: number) => void;
};

export function StickerGrid({ selected, onSelect }: StickerGridProps) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 shadow-[var(--shadow-card)] md:p-7">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)]">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          <span>{FREE_COUNT} unlocked</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-fg)] text-[var(--color-bg)]">
            <Lock className="h-3 w-3" />
          </span>
          <span>{PACK_SIZE - FREE_COUNT} locked</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {ALL_STICKERS.map((s, i) => {
          const locked = i >= FREE_COUNT;
          const isSel = selected === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => !locked && onSelect(i)}
              className={`group relative transition ${
                isSel ? "ring-2 ring-[var(--color-brand)] rounded-[20%]" : ""
              }`}
              aria-label={locked ? "Locked sticker" : `Sticker ${i + 1}`}
            >
              <StickerCard
                src={s.src}
                alt={s.alt}
                locked={locked}
                rotate={locked ? 0 : (i - 1) * 2}
                delay={i * 60}
                popIn
              />
              {!locked && (
                <div className="absolute -top-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-[var(--color-success)] text-white shadow-md">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-sunk)] p-4">
        <div className="flex items-start gap-3 text-sm">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand)]" />
          <div className="text-[var(--color-fg-muted)]">
            Locked stickers are real — they&apos;re already generated.
            Unlock instantly reveals all 9 with no second wait.
          </div>
        </div>
      </div>
    </div>
  );
}
