"use client";

import {
  ArrowRight,
  Camera,
  ImageIcon,
  RefreshCw,
  Sparkles,
} from "lucide-react";

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
  if (!fileReady) {
    return (
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onPickGallery}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-5 py-3 text-sm font-bold text-[var(--color-fg)] hover:bg-[var(--color-bg-sunk)]"
        >
          <ImageIcon className="h-4 w-4" /> Pick from device
        </button>
        <button
          type="button"
          onClick={onPickCamera}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-5 py-3 text-sm font-bold text-[var(--color-fg)] hover:bg-[var(--color-bg-sunk)]"
        >
          <Camera className="h-4 w-4" /> Use camera
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
        <span>{submitting ? "Sending to AI…" : "Generate my pack"}</span>
        {!submitting && (
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        )}
      </button>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-5 py-3.5 text-sm font-bold text-[var(--color-fg)] hover:bg-[var(--color-bg-sunk)]"
      >
        <RefreshCw className="h-4 w-4" /> Choose another
      </button>
    </div>
  );
}
