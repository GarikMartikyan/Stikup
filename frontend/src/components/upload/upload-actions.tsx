"use client";

import {
  ArrowRight,
  Camera,
  ImageIcon,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useT } from "@/components/language-provider";

type UploadActionsProps = {
  fileReady: boolean;
  submitting: boolean;
  onPickGallery: () => void;
  onPickCamera: () => void;
  onSubmit: () => void;
  onReset: () => void;
};

export function UploadActions({
  fileReady,
  submitting,
  onPickGallery,
  onPickCamera,
  onSubmit,
  onReset,
}: UploadActionsProps) {
  const t = useT();

  if (!fileReady) {
    return (
      /* Mobile-only: stacked primary + secondary CTAs — these are the only
         entry points on touch (no dropzone), so they need to read as the
         main action. On desktop the dropzone handles everything so we hide
         these. */
      <div className="mt-5 flex flex-col gap-3 md:hidden">
        <button
          type="button"
          onClick={onPickGallery}
          className="shimmer group inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-6 py-4 text-base font-bold text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition active:translate-y-0.5"
        >
          <ImageIcon className="h-5 w-5" /> {t("upload.actions.pick_from_device")}
        </button>
        <button
          type="button"
          onClick={onPickCamera}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-fg)] px-6 py-4 text-base font-bold text-[var(--color-bg)] shadow-[0_10px_28px_-14px_rgba(0,0,0,0.45)] transition active:translate-y-0.5"
        >
          <Camera className="h-5 w-5" /> {t("upload.actions.use_camera")}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="shimmer group inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-7 py-3.5 text-base font-bold text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-80"
      >
        {submitting ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-5 w-5" />
        )}
        <span>{submitting ? t("upload.actions.sending") : t("upload.actions.generate")}</span>
        {!submitting && (
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        )}
      </button>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-5 py-3.5 text-sm font-bold text-[var(--color-fg)] hover:bg-[var(--color-bg-sunk)]"
      >
        <RefreshCw className="h-4 w-4" /> {t("upload.actions.choose_another")}
      </button>
    </div>
  );
}
