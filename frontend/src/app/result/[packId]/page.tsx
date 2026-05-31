"use client";

import { use, useEffect, useState } from "react";
import { ResultHeader } from "@/components/result/result-header";
import { StickerGrid } from "@/components/result/sticker-grid";
import { PackActions } from "@/components/result/pack-actions";
import { ALL_STICKERS, FREE_COUNT, PACK_SIZE } from "@/components/result/data";
import type { StickerItem } from "@/components/result/sticker-grid";

type Pack = {
  id: string;
  status: "generating" | "ready" | "failed";
  unlocked: boolean;
  locked: boolean;
  freeCount: number;
  packSize: number;
  stickers: StickerItem[];
  regensLeft: number;
};

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
  };
}

export default function ResultPage({
  params,
}: {
  params: Promise<{ packId: string }>;
}) {
  const { packId } = use(params);
  const [pack, setPack] = useState<Pack | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/packs/${encodeURIComponent(packId)}`, { credentials: "include" })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404 || res.status === 403) {
          setPack(buildDemoPack(packId));
          return;
        }
        if (!res.ok) {
          setPack(buildDemoPack(packId));
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
        };
        setPack({
          id: data.id,
          status: data.status,
          unlocked: data.unlocked,
          locked: data.locked ?? false,
          freeCount: data.freeCount,
          packSize: data.packSize,
          stickers: data.stickers,
          regensLeft: data.regensLeft ?? 1,
        });
      })
      .catch(() => {
        if (!cancelled) setPack(buildDemoPack(packId));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [packId]);

  return (
    <div className="relative flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-6 md:py-10">
        <ResultHeader />

        <section className="reveal mt-6 md:mt-8" style={{ animationDelay: "100ms" }}>
          {loading ? (
            <div className="flex items-center justify-center rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-20 shadow-[var(--shadow-card)]">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[var(--color-brand)]/30 border-t-[var(--color-brand)]" />
            </div>
          ) : pack ? (
            <>
              <StickerGrid
                stickers={pack.stickers}
                freeCount={pack.freeCount}
                unlocked={pack.unlocked}
              />
              <PackActions
                packId={packId}
                packSize={pack.packSize}
                unlocked={pack.unlocked}
                locked={pack.locked}
                stickers={pack.stickers}
                freeCount={pack.freeCount}
                regensLeft={pack.regensLeft}
              />
            </>
          ) : null}
        </section>
      </main>
    </div>
  );
}
