"use client";

import {
  ArrowRight,
  ImageIcon,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useT } from "@/components/language-provider";

type UploadActionsProps = {
  fileReady: boolean;
  submitting: boolean;
  onPickGallery: () => void;
  onPickCamera?: () => void; // optional — no longer shown on upload page
  onSubmit: () => void;
};

export function UploadActions({
  fileReady,
  submitting,
  onPickGallery,
  onSubmit,
}: UploadActionsProps) {
  const t = useT();

  if (!fileReady) {
    return (
      /* Mobile-only: single primary CTA — grid images come from device, not camera. */
      <div className="mt-5 flex flex-col gap-3 md:hidden">
        <button
          type="button"
          onClick={onPickGallery}
          className="shimmer group inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-6 py-4 text-base font-bold text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition active:translate-y-0.5"
        >
          <ImageIcon className="h-5 w-5" /> {t("upload.actions.pick_from_device")}
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
        className="shimmer cta-pulse group inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-7 py-3.5 text-base font-bold text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-80"
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
    </div>
  );
}
