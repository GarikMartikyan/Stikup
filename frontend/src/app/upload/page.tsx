"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { DropZone } from "@/components/upload/drop-zone";
import { ErrorBanner } from "@/components/upload/error-banner";
import { TipsPanel } from "@/components/upload/tips-panel";
import { UploadActions } from "@/components/upload/upload-actions";
import { UploadIntro } from "@/components/upload/upload-intro";
import {
  ACCEPTED,
  MAX_BYTES,
  type FileState,
} from "@/components/upload/types";

export default function UploadPage() {
  const galleryRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<FileState>({ kind: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const acceptFile = useCallback((file: File) => {
    if (!ACCEPTED.includes(file.type) && !/\.heic$|\.heif$/i.test(file.name)) {
      setState({
        kind: "error",
        message: "Use a JPEG, PNG, or HEIC photo.",
      });
      return;
    }
    if (file.size > MAX_BYTES) {
      setState({
        kind: "error",
        message: "File is over 10 MB. Try a smaller export.",
      });
      return;
    }
    const url = URL.createObjectURL(file);
    setState({ kind: "ready", file, url });
  }, []);

  const onPick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) acceptFile(f);
    },
    [acceptFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) acceptFile(f);
    },
    [acceptFile],
  );

  const reset = useCallback(() => {
    if (state.kind === "ready") URL.revokeObjectURL(state.url);
    setState({ kind: "idle" });
    if (galleryRef.current) galleryRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }, [state]);

  const submit = useCallback(() => {
    if (state.kind !== "ready") return;
    setSubmitting(true);
    // TODO: wire to backend upload + generation kick-off; for now navigate to demo result.
    setTimeout(() => {
      window.location.href = "/result/demo";
    }, 600);
  }, [state]);

  const fileReady = state.kind === "ready";

  return (
    <div className="relative flex min-h-dvh flex-col">
      <AppHeader
        right={
          <Link
            href="/"
            className="hidden items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] md:inline-flex"
          >
            <ArrowLeft className="h-3 w-3" /> Back
          </Link>
        }
      />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-5 py-6 md:py-10">
        <UploadIntro />

        <div className="mt-6 grid gap-5 md:mt-8 md:grid-cols-[1.4fr_1fr]">
          <div className="reveal" style={{ animationDelay: "80ms" }}>
            <DropZone
              state={state}
              dragOver={dragOver}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onPick={() => galleryRef.current?.click()}
              onReset={reset}
            />

            {/* Gallery picker — no `capture` attribute so mobile opens the photo library, not the camera. */}
            <input
              ref={galleryRef}
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif"
              className="sr-only"
              onChange={onPick}
            />
            {/* Camera picker — `capture="user"` forces the front camera on mobile. */}
            <input
              ref={cameraRef}
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif"
              capture="user"
              className="sr-only"
              onChange={onPick}
            />

            {state.kind === "error" && <ErrorBanner message={state.message} />}

            <UploadActions
              fileReady={fileReady}
              submitting={submitting}
              onPickGallery={() => galleryRef.current?.click()}
              onPickCamera={() => cameraRef.current?.click()}
              onSubmit={submit}
              onReset={reset}
            />
          </div>

          <TipsPanel />
        </div>
      </main>
    </div>
  );
}
