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
  // Set once a successful generation starts navigating away. Guards against a
  // stray second submit in the sub-frame window before the page unmounts — which
  // would otherwise skip the ad (adWatched is still true) and create a 2nd pack.
  const navigatingRef = useRef(false);
  const [state, setState] = useState<FileState>({ kind: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gated, setGated] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  // Server-side failure (429 / 5xx / network). Kept separate from `state` so the
  // uploaded grid stays in the `ready` state — the user can retry without
  // re-picking the file, and (since the ad was already watched) without a second
  // ad. `state.error` is reserved for problems that really are about the image.
  const [serverError, setServerError] = useState<{
    title: string;
    message: string;
  } | null>(null);
  // Whether the rewarded ad has already been watched for the current grid. Lets
  // a retry after an our-side failure skip a second ad view; reset whenever a new
  // file is chosen so each fresh generation still costs one ad.
  const [adWatched, setAdWatched] = useState(false);
  const t = useT();
  const router = useRouter();

  const showServerError = useCallback(
    (messageKey: string) => {
      fireSound("error");
      setServerError({
        title: t("upload.error.upload_failed_title"),
        message: t(messageKey),
      });
    },
    [t],
  );

  const acceptFile = useCallback(
    (file: File) => {
      // A new file is a fresh generation: clear any prior server error and require
      // a new ad view.
      setServerError(null);
      setAdWatched(false);
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
    },
    [t],
  );

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
    setServerError(null);
    setAdWatched(false);
    if (galleryRef.current) galleryRef.current.value = "";
  }, [state]);

  const submit = useCallback(async () => {
    if (navigatingRef.current) return;
    if (state.kind !== "ready") return;
    const file = state.file;

    // Web (outside Telegram): don't generate — funnel the user into Telegram.
    if (!isTelegramEnv()) {
      setGated(true);
      return;
    }

    setSubmitting(true);
    setAdError(null);
    setServerError(null);

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

    // Play a rewarded ad once per grid. If a previous attempt for THIS grid
    // already burned an ad (e.g. it failed on our side), don't make the user
    // watch another just to retry.
    if (!adWatched) {
      const ad = await showRewarded();
      if (ad !== "shown") {
        setAdError(t("upload.error.ad_required"));
        setSubmitting(false);
        return;
      }
      setAdWatched(true);
    }

    try {
      const form = new FormData();
      form.append("image", file);
      // NOTE: deliberately a single POST, not retried. POST /api/packs is
      // non-idempotent (it creates a Pack row + worker job per call with no
      // idempotency key), so an auto-retry on a lost response would create
      // duplicate packs.
      const res = await fetch("/api/packs", {
        method: "POST",
        body: form,
        credentials: "include",
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (res.ok) {
        let packId: string | undefined;
        try {
          ({ packId } = (await res.json()) as { packId: string });
        } catch {
          packId = undefined;
        }
        if (packId) {
          navigatingRef.current = true;
          router.push(`/result/${packId}`);
          return;
        }
        // 2xx but no usable id (e.g. a proxy returned a non-JSON interstitial):
        // treat as our fault and keep the grid so the user can retry.
        showServerError("upload.error.server_error");
        return;
      }

      if (res.status === 429) {
        // Rate-limited — not a bad image. Keep the grid; the user waits and retries.
        showServerError("upload.error.rate_limited");
        return;
      }
      if (res.status >= 500) {
        // Our fault — never blame the user's (valid) image. Keep the grid.
        showServerError("upload.error.server_error");
        return;
      }
      // A genuine 4xx: the image really is the problem (bad format, too large,
      // unreadable). Drop it so the user picks a fresh one.
      fireSound("error");
      setState({ kind: "error", message: t("upload.error.generation_failed") });
    } catch {
      // Network failure — a connection problem, not the image. Keep the grid.
      showServerError("upload.error.server_error");
    } finally {
      setSubmitting(false);
    }
  }, [state, router, t, adWatched, showServerError]);

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

            {/* Image-related problems blame the image (default heading); server-side
                problems use the neutral "upload failed" heading and keep the grid. */}
            {state.kind === "error" ? (
              <ErrorBanner message={state.message} />
            ) : serverError ? (
              <ErrorBanner message={serverError.message} title={serverError.title} />
            ) : null}

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
