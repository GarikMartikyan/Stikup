"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/components/language-provider";
import type { StickerItem } from "./sticker-grid";

type StickerLightboxProps = {
  stickers: StickerItem[];
  /** Index into `stickers` array (NOT sticker.index), or null when closed. */
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export function StickerLightbox({
  stickers,
  index,
  onClose,
  onNavigate,
}: StickerLightboxProps) {
  const t = useT();
  const [mounted, setMounted] = useState(false);
  const open = index !== null;
  const total = stickers.length;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot post-hydration gate
    setMounted(true);
  }, []);

  const goPrev = useCallback(() => {
    if (index === null || total === 0) return;
    onNavigate((index - 1 + total) % total);
  }, [index, total, onNavigate]);

  const goNext = useCallback(() => {
    if (index === null || total === 0) return;
    onNavigate((index + 1) % total);
  }, [index, total, onNavigate]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowLeft") goPrev();
      else if (event.key === "ArrowRight") goNext();
    }
    if (open) document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose, goPrev, goNext]);

  if (!mounted || index === null) return null;

  const current = stickers[index];
  if (!current) return null;

  const src = current.url;
  const alt = `Sticker ${current.index + 1}`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("result.lightbox.label")}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
    >
      {/* Backdrop — click to close */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 bg-black/55 backdrop-blur-[4px] animate-[fade-in_180ms_ease-out]"
      />

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label={t("result.lightbox.close")}
        className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Previous arrow */}
      {total > 1 && (
        <button
          type="button"
          onClick={goPrev}
          aria-label={t("result.lightbox.prev")}
          className="absolute left-4 z-10 grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition hover:-translate-x-0.5 hover:bg-white/20 md:left-8"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Stage */}
      <div className="relative z-[5] flex flex-col items-center gap-5">
        <div className="grid place-items-center rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-md md:p-10">
          <Image
            key={src}
            src={src}
            alt={alt}
            width={420}
            height={420}
            priority
            className="h-[min(64vw,22rem)] w-[min(64vw,22rem)] animate-[pop-in_320ms_cubic-bezier(0.34,1.56,0.64,1)] object-contain"
          />
        </div>
        {total > 1 && (
          <div className="rounded-full bg-white/10 px-4 py-1.5 font-mono text-sm font-semibold text-white/90 backdrop-blur">
            {index + 1} / {total}
          </div>
        )}
      </div>

      {/* Next arrow */}
      {total > 1 && (
        <button
          type="button"
          onClick={goNext}
          aria-label={t("result.lightbox.next")}
          className="absolute right-4 z-10 grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition hover:translate-x-0.5 hover:bg-white/20 md:right-8"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>,
    document.body,
  );
}
