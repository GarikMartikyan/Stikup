"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { useT } from "@/components/language-provider";
import { isTelegramEnv } from "@/lib/telegram/webapp";
import { showInterstitial } from "@/lib/ads/adsgram";
import { OpenInTelegram } from "@/components/upload/open-in-telegram";

export default function UploadPage() {
  const galleryRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<FileState>({ kind: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gated, setGated] = useState(false);
  const t = useT();
  const router = useRouter();

  const acceptFile = useCallback((file: File) => {
    if (!ACCEPTED.includes(file.type) && !/\.heic$|\.heif$/i.test(file.name)) {
      setState({
        kind: "error",
        message: t("upload.error.invalid_format"),
      });
      return;
    }
    if (file.size > MAX_BYTES) {
      setState({
        kind: "error",
        message: t("upload.error.too_large"),
      });
      return;
    }
    const url = URL.createObjectURL(file);
    setState({ kind: "ready", file, url });
  }, [t]);

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
    setGated(false);
    if (galleryRef.current) galleryRef.current.value = "";
  }, [state]);

  const submit = useCallback(async () => {
    if (state.kind !== "ready") return;
    const file = state.file;

    // Web (outside Telegram): don't generate — funnel the user into Telegram,
    // where the interstitial ad runs.
    if (!isTelegramEnv()) {
      setGated(true);
      return;
    }

    setSubmitting(true);

    const createPack = async (): Promise<string | null> => {
      try {
        const form = new FormData();
        form.append("image", file);
        const res = await fetch("/api/packs", {
          method: "POST",
          body: form,
          credentials: "include",
        });
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        if (res.status === 403) {
          setState({ kind: "error", message: t("upload.error.no_generations") });
          return null;
        }
        if (!res.ok) {
          setState({
            kind: "error",
            message: t("upload.error.generation_failed"),
          });
          return null;
        }
        const { packId } = (await res.json()) as { packId: string };
        return packId;
      } catch {
        setState({ kind: "error", message: t("upload.error.generation_failed") });
        return null;
      }
    };

    // Upload starts immediately; ad plays concurrently. After the ad closes,
    // navigate instantly if the upload is already done, otherwise wait for it.
    const packIdPromise = createPack();
    await showInterstitial();
    const packId = await packIdPromise;

    if (packId) {
      router.push(`/result/${packId}`);
      return;
    }
    setSubmitting(false);
  }, [state, router, t]);

  const fileReady = state.kind === "ready";

  return (
    <div className="relative flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-5 py-6 md:py-10">
        <UploadIntro />

        <div className="mt-6 grid gap-5 md:mt-8 md:grid-cols-[1.4fr_1fr]">
          <div className="reveal" style={{ animationDelay: "80ms" }}>
            {/* Dropzone: desktop primary affordance — hidden on mobile where
                drag/paste don't apply. Once a file is ready its preview card is
                useful on mobile too, so reveal it there as the uploaded-photo preview. */}
            <div className={fileReady ? "block" : "hidden md:block"}>
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
            </div>

            {/* Gallery input — shared between the dropzone button and "Pick from device" button. */}
            <input
              ref={galleryRef}
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif"
              className="sr-only"
              onChange={onPick}
            />

            {state.kind === "error" && <ErrorBanner message={state.message} />}

            <UploadActions
              fileReady={fileReady}
              submitting={submitting}
              onPickGallery={() => galleryRef.current?.click()}
              onSubmit={submit}
            />

            {gated && <OpenInTelegram />}
          </div>

          <TipsPanel />
        </div>
      </main>
    </div>
  );
}
