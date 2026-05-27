"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ImageIcon,
  RefreshCw,
  Sparkles,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED = ["image/jpeg", "image/png", "image/heic", "image/heif"];

type FileState =
  | { kind: "idle" }
  | { kind: "ready"; file: File; url: string }
  | { kind: "error"; message: string };

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
  const errored = state.kind === "error";

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
        <div className="reveal max-w-xl">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
            Step 01 of 03
          </span>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-[-0.02em] md:text-4xl">
            Drop in one photo.
          </h1>
          <p className="mt-2 text-base text-[var(--color-fg-muted)] md:text-lg">
            Front-facing, well-lit, one face in frame. We&apos;ll handle the rest.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:mt-8 md:grid-cols-[1.4fr_1fr]">
          {/* DROPZONE / PREVIEW */}
          <div
            className="reveal"
            style={{ animationDelay: "80ms" }}
          >
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
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
                  onClick={() => galleryRef.current?.click()}
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
                    onClick={reset}
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

            {errored && (
              <div className="mt-3 flex items-start gap-2 rounded-2xl border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-3 text-sm text-[var(--color-danger)]">
                <X className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <div className="font-semibold">Photo not accepted</div>
                  <div className="text-[var(--color-danger)]/90">
                    {state.message}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              {!fileReady ? (
                <>
                  <button
                    type="button"
                    onClick={() => galleryRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-5 py-3 text-sm font-bold text-[var(--color-fg)] hover:bg-[var(--color-bg-sunk)]"
                  >
                    <ImageIcon className="h-4 w-4" /> Pick from device
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-5 py-3 text-sm font-bold text-[var(--color-fg)] hover:bg-[var(--color-bg-sunk)]"
                  >
                    <Camera className="h-4 w-4" /> Use camera
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={submitting}
                    className="shimmer group inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-7 py-3.5 text-base font-bold text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-80"
                  >
                    {submitting ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-5 w-5" />
                    )}
                    <span>
                      {submitting ? "Sending to AI…" : "Generate my pack"}
                    </span>
                    {!submitting && (
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-5 py-3.5 text-sm font-bold text-[var(--color-fg)] hover:bg-[var(--color-bg-sunk)]"
                  >
                    <RefreshCw className="h-4 w-4" /> Choose another
                  </button>
                </>
              )}
            </div>
          </div>

          {/* TIPS PANEL */}
          <aside
            className="reveal space-y-4"
            style={{ animationDelay: "150ms" }}
          >
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-6 shadow-[var(--shadow-card)]">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
                For best likeness
              </div>
              <ul className="mt-4 space-y-3 text-sm">
                {[
                  { icon: UserRound, text: "One face, facing the camera" },
                  { icon: Sun, text: "Even, natural light" },
                  { icon: Camera, text: "Phone-camera resolution or higher" },
                ].map((tip) => (
                  <li key={tip.text} className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--color-brand)]/12 text-[var(--color-brand)]">
                      <tip.icon className="h-4 w-4" strokeWidth={2.2} />
                    </span>
                    <span className="text-[var(--color-fg)]">{tip.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-brand)]/10 via-[var(--color-bg-elev)] to-[var(--color-brand-2)]/10 p-6">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
                Free preview
              </div>
              <div className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
                3 stickers free.<br />Unlock 9 more for $5.99.
              </div>
              <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
                Your full pack of 12 generates upfront. After you see it, you
                decide whether to take the 3 free, unlock all 12, or
                regenerate.
              </p>
              <div className="mt-5 flex items-center gap-2 text-xs text-[var(--color-fg-subtle)]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                You have 1 free generation available
              </div>
            </div>

            <div className="rounded-3xl border border-dashed border-[var(--color-border-strong)] p-5 text-xs text-[var(--color-fg-muted)]">
              We never share or sell your photo. It&apos;s stored only while
              your account exists and removed instantly when you delete it.
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
