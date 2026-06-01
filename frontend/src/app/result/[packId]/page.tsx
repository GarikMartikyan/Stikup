"use client";

import { use, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";
import { ResultHeader } from "@/components/result/result-header";
import { StickerGrid } from "@/components/result/sticker-grid";
import { PackActions } from "@/components/result/pack-actions";
import { ALL_STICKERS, FREE_COUNT, PACK_SIZE } from "@/components/result/data";
import { useT } from "@/components/language-provider";
import type { StickerItem } from "@/components/result/sticker-grid";

// Safety timeout: stop polling after 3 minutes and treat as failed.
const POLL_TIMEOUT_MS = 3 * 60 * 1000;
// Interval between polls (awaited sequentially, not overlapping).
const POLL_INTERVAL_MS = 2000;
// Fallback shown in the generating card when the uploaded selfie isn't
// available yet (or fails to load).
const STOCK_SRC = "/assets/real_image.webp";

type Pack = {
  id: string;
  status: "generating" | "ready" | "failed";
  unlocked: boolean;
  locked: boolean;
  freeCount: number;
  packSize: number;
  stickers: StickerItem[];
  regensLeft: number;
  selfieUrl: string | null;
};

type PageState =
  | { kind: "loading" }
  | { kind: "generating"; selfieUrl: string | null }
  | { kind: "ready"; pack: Pack }
  | { kind: "failed" }
  | { kind: "demo"; pack: Pack };

function buildDemoPack(packId: string): Pack {
  return {
    id: packId,
    status: "ready",
    unlocked: false,
    locked: false,
    freeCount: FREE_COUNT,
    packSize: PACK_SIZE,
    stickers: ALL_STICKERS.map((s, i) => ({ index: i, url: s.src })),
    regensLeft: 1,
    selfieUrl: null,
  };
}

function parsePack(data: {
  id: string;
  status: "generating" | "ready" | "failed";
  unlocked: boolean;
  locked?: boolean;
  freeCount: number;
  packSize: number;
  stickers: Array<{ index: number; url: string }>;
  regensLeft: number;
  selfieUrl?: string | null;
}): Pack {
  return {
    id: data.id,
    status: data.status,
    unlocked: data.unlocked,
    locked: data.locked ?? false,
    freeCount: data.freeCount,
    packSize: data.packSize,
    stickers: data.stickers,
    regensLeft: data.regensLeft ?? 1,
    selfieUrl: data.selfieUrl ?? null,
  };
}

/** Detect whether the sticker URLs come from the backend (need unoptimized). */
function isBackendPack(pack: Pack): boolean {
  return pack.stickers.length > 0 && pack.stickers[0].url.startsWith("/api/");
}

// ---------------------------------------------------------------------------
// Generating state
// ---------------------------------------------------------------------------

function GeneratingState({ selfieUrl }: { selfieUrl: string | null }) {
  const t = useT();
  const [errored, setErrored] = useState(false);
  const src = selfieUrl && !errored ? selfieUrl : STOCK_SRC;
  const isApiSrc = src.startsWith("/api/");

  return (
    <div
      className="flex flex-col items-center justify-center gap-6 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-12 shadow-[var(--shadow-card)]"
      aria-label={t("result.generating.label")}
      role="status"
    >
      {/* The user's uploaded selfie with a sweeping scan overlay to convey
          that it's being processed into stickers. */}
      <div className="relative h-44 w-44 overflow-hidden rounded-[1.5rem] ring-2 ring-[var(--color-brand)]/30 shadow-[var(--shadow-card)]">
        <Image
          src={src}
          alt=""
          width={240}
          height={240}
          className="h-full w-full object-cover object-center"
          unoptimized={isApiSrc}
          onError={() => setErrored(true)}
        />
        <div className="pointer-events-none absolute inset-0 animate-pulse bg-[var(--color-brand)]/10" />
        <div className="pointer-events-none absolute inset-0 bg-[length:200%_100%] bg-gradient-to-r from-transparent via-white/45 to-transparent [animation:shimmer-x_1.8s_linear_infinite]" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-[var(--color-brand)]/30 border-t-[var(--color-brand)]" />
        <p className="font-semibold text-[var(--color-fg)]">
          {t("result.generating.title")}
        </p>
      </div>
      <p className="-mt-2 text-center text-sm text-[var(--color-fg-muted)]">
        {t("result.generating.description")}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Failed state
// ---------------------------------------------------------------------------

function FailedState() {
  const t = useT();
  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-14 text-center shadow-[var(--shadow-card)]">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
        <AlertCircle className="h-7 w-7" strokeWidth={1.8} />
      </span>
      <div>
        <p className="font-semibold text-[var(--color-fg)]">
          {t("result.failed.title")}
        </p>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          {t("result.failed.description")}
        </p>
      </div>
      <Link
        href="/upload"
        className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand)] px-5 py-2 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5"
      >
        <RefreshCw className="h-4 w-4" strokeWidth={2.2} />
        {t("result.failed.retry")}
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ResultPage({
  params,
}: {
  params: Promise<{ packId: string }>;
}) {
  const { packId } = use(params);
  const [state, setState] = useState<PageState>({ kind: "loading" });
  // Ref so the polling loop can read the latest cancelled flag without
  // needing the value in its dependency array.
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const deadlineId = setTimeout(() => {
      // Safety timeout: treat as failed after POLL_TIMEOUT_MS.
      cancelledRef.current = true;
      setState({ kind: "failed" });
    }, POLL_TIMEOUT_MS);

    async function poll() {
      try {
        const res = await fetch(`/api/packs/${encodeURIComponent(packId)}`, {
          credentials: "include",
        });

        if (cancelledRef.current) return;

        if (res.status === 404 || res.status === 403) {
          setState({ kind: "demo", pack: buildDemoPack(packId) });
          return;
        }

        if (!res.ok) {
          // A real backend error (401/429/500/…) must surface as failure, not
          // be masked by demo content. The demo fallback is reserved for the
          // 404/403 (no such pack) case above and network errors (catch below).
          setState({ kind: "failed" });
          return;
        }

        const data = (await res.json()) as {
          id: string;
          status: "generating" | "ready" | "failed";
          unlocked: boolean;
          locked?: boolean;
          freeCount: number;
          packSize: number;
          stickers: Array<{ index: number; url: string }>;
          regensLeft: number;
          selfieUrl?: string | null;
        };

        if (cancelledRef.current) return;

        if (data.status === "generating") {
          setState({ kind: "generating", selfieUrl: data.selfieUrl ?? null });
          // Schedule next poll, but don't overlap — await the full interval.
          timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
          return;
        }

        if (data.status === "failed") {
          setState({ kind: "failed" });
          return;
        }

        // status === "ready"
        setState({ kind: "ready", pack: parsePack(data) });
      } catch {
        if (cancelledRef.current) return;
        // Network/fetch error — use demo so local dev without backend works.
        setState({ kind: "demo", pack: buildDemoPack(packId) });
      }
    }

    void poll();

    return () => {
      cancelledRef.current = true;
      clearTimeout(deadlineId);
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [packId]);

  const activePack =
    state.kind === "ready" || state.kind === "demo" ? state.pack : null;
  const unoptimized = activePack ? isBackendPack(activePack) : false;
  // Show the user's uploaded selfie in the header during generation too — not
  // just once the pack is ready (the selfie thumbnail is available immediately).
  const headerSelfieUrl =
    activePack?.selfieUrl ??
    (state.kind === "generating" ? state.selfieUrl : null);

  return (
    <div className="relative flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-6 md:py-10">
        <ResultHeader selfieUrl={headerSelfieUrl} />

        <section className="reveal mt-6 md:mt-8" style={{ animationDelay: "100ms" }}>
          {state.kind === "loading" ? (
            <div className="flex items-center justify-center rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-20 shadow-[var(--shadow-card)]">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[var(--color-brand)]/30 border-t-[var(--color-brand)]" />
            </div>
          ) : state.kind === "generating" ? (
            <GeneratingState selfieUrl={state.selfieUrl} />
          ) : state.kind === "failed" ? (
            <FailedState />
          ) : activePack ? (
            <>
              <StickerGrid
                stickers={activePack.stickers}
                freeCount={activePack.freeCount}
                unlocked={activePack.unlocked}
                unoptimized={unoptimized}
              />
              <PackActions
                packId={packId}
                packSize={activePack.packSize}
                unlocked={activePack.unlocked}
                locked={activePack.locked}
                stickers={activePack.stickers}
                freeCount={activePack.freeCount}
                regensLeft={activePack.regensLeft}
              />
            </>
          ) : null}
        </section>
      </main>
    </div>
  );
}
