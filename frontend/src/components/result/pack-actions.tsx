"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, RefreshCw, Unlock } from "lucide-react";
import { GetStickersModal } from "./get-stickers-modal";
import { useT } from "@/components/language-provider";
import type { StickerItem } from "./sticker-grid";

type PackActionsProps = {
  packId: string;
  packSize: number;
  unlocked: boolean;
  /** The user has already accepted this pack (got/downloaded/unlocked) — no regenerating. */
  locked: boolean;
  stickers: StickerItem[];
  freeCount: number;
  regensLeft: number;
};

export function PackActions({ packId, packSize, unlocked, locked: lockedInitial, stickers, freeCount, regensLeft }: PackActionsProps) {
  // Only available (unlocked) stickers can be downloaded.
  const available = unlocked ? stickers : stickers.slice(0, freeCount);
  const t = useT();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [regenBusy, setRegenBusy] = useState(false);
  // Accepting the pack (get on Telegram / download) locks regeneration. Seed
  // from the server value and flip locally the moment the user accepts.
  const [locked, setLocked] = useState(lockedInitial);

  const handleUnlock = useCallback(async () => {
    if (unlocked || unlockBusy) return;
    setUnlockBusy(true);

    try {
      const res = await fetch("/api/referral/me", { credentials: "include" });
      if (!res.ok) throw new Error(`referral/me ${res.status}`);
      const data = (await res.json()) as { code: string; link: string; unlocked: boolean };

      // Try Web Share API first (mobile browsers), fall back to clipboard.
      const shared =
        typeof navigator.share === "function"
          ? await navigator
              .share({ url: data.link })
              .then(() => true)
              .catch(() => false)
          : false;

      if (!shared) {
        await navigator.clipboard.writeText(data.link);
      }

      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      // best-effort
    } finally {
      setUnlockBusy(false);
    }
  }, [unlocked, unlockBusy]);

  const handleRegenerate = useCallback(async () => {
    if (regenBusy) return;
    setRegenBusy(true);
    // Best-effort DELETE — ignore failure, user wants to start over.
    await fetch(`/api/packs/${encodeURIComponent(packId)}`, {
      method: "DELETE",
      credentials: "include",
    }).catch(() => {});
    router.push("/upload");
  }, [packId, regenBusy, router]);

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        {/* Unlock all / Unlocked check */}
        {unlocked ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 px-4 py-2 text-sm font-semibold text-[var(--color-success)]">
            <Check className="h-4 w-4" strokeWidth={3} />
            {t("result.actions.unlocked")}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleUnlock}
            disabled={unlockBusy}
            className="shimmer inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-5 py-2 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-80"
          >
            {linkCopied ? (
              <>
                <Check className="h-4 w-4" strokeWidth={3} />
                {t("result.actions.link_copied")}
              </>
            ) : unlockBusy ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                {t("result.actions.copying_link")}
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4" strokeWidth={2.2} />
                {t("result.actions.unlock_all", { count: packSize })}
              </>
            )}
          </button>
        )}

        {/* Get stickers */}
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-5 py-2 text-sm font-semibold text-[var(--color-fg)] transition hover:-translate-y-0.5 hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
        >
          <Download className="h-4 w-4" strokeWidth={2.2} />
          {t("result.actions.get_stickers")}
        </button>

        {/* Regenerate — hidden once the pack is accepted (locked) or the
            regeneration quota is exhausted. */}
        {locked ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 px-4 py-2 text-sm font-semibold text-[var(--color-success)] select-none">
            <Check className="h-4 w-4" strokeWidth={3} />
            {t("result.actions.claimed")}
          </div>
        ) : regensLeft <= 0 ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-transparent px-5 py-2 text-sm font-semibold text-[var(--color-fg-subtle)] opacity-50 cursor-not-allowed select-none">
            <RefreshCw className="h-4 w-4" strokeWidth={2.2} />
            {t("result.actions.no_regens")}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenBusy}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-transparent px-5 py-2 text-sm font-semibold text-[var(--color-fg-muted)] transition hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)] disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${regenBusy ? "animate-spin" : ""}`} strokeWidth={2.2} />
            {t("result.actions.regenerate")}
          </button>
        )}
      </div>

      <GetStickersModal
        packId={packId}
        stickers={available}
        open={showModal}
        onClose={() => setShowModal(false)}
        onAccept={() => setLocked(true)}
      />
    </>
  );
}
