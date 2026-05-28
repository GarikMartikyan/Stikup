"use client";

import Image from "next/image";
import { Download, Share2 } from "lucide-react";
import { ALL_STICKERS } from "./data";
import { useT } from "@/components/language-provider";

export function PreviewPanel({ selected }: { selected: number | null }) {
  const t = useT();
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 shadow-[var(--shadow-card)]">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
        {selected === null ? t("result.preview_panel.preview_label") : t("result.preview_panel.sticker_n", { n: selected + 1 })}
      </div>
      <div className="mt-3 grid place-items-center rounded-2xl bg-[var(--color-bg-sunk)] p-4">
        {selected === null ? (
          <div className="text-center text-sm text-[var(--color-fg-muted)]">
            {t("result.preview_panel.tap_to_preview")}
          </div>
        ) : (
          <Image
            src={ALL_STICKERS[selected].src}
            alt={ALL_STICKERS[selected].alt}
            width={240}
            height={240}
            className="h-40 w-40 object-contain"
          />
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={selected === null}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-4 py-2 text-xs font-bold transition hover:bg-[var(--color-bg-sunk)] disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" /> {t("result.preview_panel.download")}
        </button>
        <button
          type="button"
          disabled={selected === null}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-4 py-2 text-xs font-bold transition hover:bg-[var(--color-bg-sunk)] disabled:opacity-50"
        >
          <Share2 className="h-3.5 w-3.5" /> {t("result.preview_panel.share")}
        </button>
      </div>
    </div>
  );
}
