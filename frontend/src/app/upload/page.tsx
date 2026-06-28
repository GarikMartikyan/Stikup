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
import { showRewarded } from "@/lib/ads/adsgram";
import { OpenInTelegram } from "@/components/upload/open-in-telegram";
import { fireSound } from "@/lib/sound";

export default function UploadPage() {
  const galleryRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<FileState>({ kind: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gated, setGated] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const t = useT();
  const router = useRouter();

  const acceptFile = useCallback((file: File) => {
    if (!ACCEPTED.includes(file.type)) {
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
    setAdError(null);
    if (galleryRef.current) galleryRef.current.value = "";
  }, [state]);

  const submit = useCallback(async () => {
    if (state.kind !== "ready") return;
    const file = state.file;

    // Web (outside Telegram): don't generate — funnel the user into Telegram.
    if (!isTelegramEnv()) {
      setGated(true);
      return;
    }

    setSubmitting(true);
    setAdError(null);

    // Verify the session BEFORE spending an ad view. An expired/missing session
    // would otherwise make the user watch a full rewarded ad and only then get
    // bounced to /login. A transient error on this pre-flight is non-fatal —
    // fall through and let the POST below surface real failures.
    try {
      const me = await fetch("/auth/me", { credentials: "include" });
      if (me.status === 401) {
        setSubmitting(false);
        router.push("/login");
        return;
      }
    } catch {
      // Network blip on the pre-flight — proceed; the POST handles real errors.
    }

    // Play a rewarded ad; only proceed to pack creation if fully watched.
    const ad = await showRewarded();
    if (ad !== "shown") {
      setAdError(t("upload.error.ad_required"));
      setSubmitting(false);
      return;
    }

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
        return;
      }
      if (!res.ok) {
        fireSound("error");
        setState({
          kind: "error",
          message: t("upload.error.generation_failed"),
        });
        return;
      }
      const { packId } = (await res.json()) as { packId: string };
      router.push(`/result/${packId}`);
    } catch {
      fireSound("error");
      setState({
        kind: "error",
        message: t("upload.error.generation_failed"),
      });
    } finally {
      setSubmitting(false);
    }
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
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={onPick}
            />

            {state.kind === "error" && <ErrorBanner message={state.message} />}

            {adError && (
              <p className="mt-3 text-sm text-[var(--color-danger)]">{adError}</p>
            )}

            <UploadActions
              fileReady={fileReady}
              submitting={submitting}
              onPickGallery={() => galleryRef.current?.click()}
              onSubmit={() => void submit()}
            />

            {gated && <OpenInTelegram />}
          </div>

          <TipsPanel />
        </div>
      </main>
    </div>
  );
}
