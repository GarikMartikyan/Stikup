"use client";

import Image from "next/image";
import { Check, ImageIcon, X } from "lucide-react";
import type { DragEvent } from "react";
import type { FileState } from "./types";

type DropZoneProps = {
  state: FileState;
  dragOver: boolean;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent) => void;
  onPick: () => void;
  onReset: () => void;
};

export function DropZone({
  state,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onPick,
  onReset,
}: DropZoneProps) {
  const fileReady = state.kind === "ready";

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`relative overflow-hidden rounded-3xl border-2 border-dashed bg-[var(--color-bg-elev)] transition ${
        dragOver
          ? "border-[var(--color-brand)] bg-[var(--color-brand)]/5"
          : "border-[var(--color-border-strong)]"
      }`}
    >
      {!fileReady ? (
        <button
          type="button"
          onClick={onPick}
          className="flex w-full flex-col items-center justify-center gap-4 px-6 py-10 text-center md:py-14"
        >
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-full bg-[var(--color-brand)]/15 blur-2xl" />
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] text-white shadow-[var(--shadow-glow)]">
              <ImageIcon className="h-9 w-9" strokeWidth={1.8} />
            </div>
          </div>
          <div>
            <div className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
              Drop a selfie or tap to pick
            </div>
            <div className="mt-1 text-sm text-[var(--color-fg-muted)]">
              JPEG · PNG · HEIC · up to 10 MB
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[var(--color-fg-subtle)]">
            <span className="rounded-full border border-[var(--color-border)] px-2.5 py-1">
              <kbd className="font-mono">Drag & drop</kbd>
            </span>
            <span className="rounded-full border border-[var(--color-border)] px-2.5 py-1">
              <kbd className="font-mono">Paste</kbd>
            </span>
            <span className="rounded-full border border-[var(--color-border)] px-2.5 py-1">
              <kbd className="font-mono">Open camera</kbd>
            </span>
          </div>
        </button>
      ) : (
        <div className="relative">
          <div className="grid h-[300px] place-items-center bg-[var(--color-bg-sunk)] md:h-[400px]">
            <Image
              src={state.url}
              alt="Your selfie preview"
              width={520}
              height={520}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <button
            type="button"
            onClick={onReset}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-[var(--color-fg)] text-[var(--color-bg)] shadow-lg hover:opacity-90"
            aria-label="Remove photo"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center gap-3 rounded-2xl bg-[var(--color-bg-elev)]/95 px-4 py-3 shadow-[var(--shadow-card)] backdrop-blur">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-success)]/15 px-2.5 py-1 text-xs font-bold text-[var(--color-success)]">
              <Check className="h-3 w-3" strokeWidth={3} />
              Looks good
            </span>
            <span className="truncate text-sm text-[var(--color-fg-muted)]">
              {state.file.name}
            </span>
            <span className="ml-auto font-mono text-[10px] text-[var(--color-fg-subtle)]">
              {(state.file.size / 1024 / 1024).toFixed(1)} MB
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
