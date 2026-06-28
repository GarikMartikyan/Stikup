"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, RefreshCw, Unlock } from "lucide-react";
import { GetStickersModal } from "./get-stickers-modal";
import { InviteFriendModal } from "./invite-friend-modal";
import { useT } from "@/components/language-provider";
import { telegramReferralHref } from "@/lib/telegram/href";
import { getWebApp } from "@/lib/telegram/webapp";
import type { StickerItem } from "./sticker-grid";
import { fireSound } from "@/lib/sound";

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
  const [showInviteModal, setShowInviteModal] = useState(false);
  // null = idle, "shared" = handed off to a share target, "copied" = clipboard fallback.
  const [feedback, setFeedback] = useState<null | "shared" | "copied">(null);
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [regenBusy, setRegenBusy] = useState(false);
  // The pack-specific Telegram referral deep link, pre-fetched on mount. Having
  // it ready lets navigator.share() fire SYNCHRONOUSLY inside the tap handler —
  // the Web Share API needs transient user activation, which is consumed by any
  // `await` that runs before it (iOS / Telegram WebView are strict about this).
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  // Accepting the pack (get on Telegram / download) locks regeneration. Seed
  // from the server value and flip locally the moment the user accepts.
  const [locked, setLocked] = useState(lockedInitial);

  const fetchReferralUrl = useCallback(async (): Promise<string> => {
    const res = await fetch("/api/referral/me", { credentials: "include" });
    if (!res.ok) throw new Error(`referral/me ${res.status}`);
    const data = (await res.json()) as { code: string; referredCount: number };
    // Tapping this link opens the bot, records a pending referral, then opens
    // the Mini App; the referral is credited when the friend registers.
    return telegramReferralHref(data.code, packId);
  }, [packId]);

  // Pre-fetch the referral link as soon as an unlockable pack renders so the
  // share sheet can open instantly (and synchronously) on tap.
  useEffect(() => {
    if (unlocked) return;
    let cancelled = false;
    fetchReferralUrl()
      .then((url) => {
        if (!cancelled) setShareUrl(url);
      })
      .catch(() => {
        /* best-effort; handler will retry on tap */
      });
    return () => {
      cancelled = true;
    };
  }, [unlocked, fetchReferralUrl]);

  const flash = useCallback((kind: "shared" | "copied") => {
    setFeedback(kind);
    setTimeout(() => setFeedback(null), 2500);
  }, []);

  // Copy the link and only claim "copied" when the write actually lands — a
  // swallowed failure must NOT flash a false "Link copied!" (the user would
  // think they have the link when the clipboard is empty).
  const copyToClipboard = useCallback(
    async (url: string) => {
      try {
        await navigator.clipboard.writeText(url);
        flash("copied");
        fireSound("unlock");
      } catch {
        /* clipboard unavailable — no success claim, nothing more we can do */
      }
    },
    [flash],
  );

  const handleUnlock = useCallback(async () => {
    if (unlocked || unlockBusy) return;
    fireSound("tap");
    setUnlockBusy(true);

    try {
      // Prefer the pre-fetched link; only fetch inline if it hasn't landed yet.
      // (The inline-fetch path loses the tap's activation, so native share may
      // be skipped there — acceptable for that rare cold case.)
      let url = shareUrl;
      if (!url) {
        url = await fetchReferralUrl();
        setShareUrl(url);
      }

      const shareText = t("result.actions.share_text");

      // 1) Phone-native OS share sheet — the primary path. Called with no
      //    intervening `await` when the link is pre-fetched, so activation holds.
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({ text: shareText, url });
          flash("shared");
          fireSound("unlock");
          return;
        } catch (err) {
          // User cancelled the sheet → still hand them the link via the
          // clipboard (so they're never left empty-handed), but don't open the
          // intrusive Telegram picker for an action they explicitly declined.
          if ((err as Error)?.name === "AbortError") {
            await copyToClipboard(url);
            return;
          }
          // Share genuinely unavailable (e.g. Telegram WebView) → fall through.
        }
      }

      // 2) Inside Telegram → its native "send to a chat" picker. The picker UI
      //    IS the feedback; openTelegramLink is fire-and-forget (no send/cancel
      //    signal) and backgrounds the Mini App, so claiming "Shared!" here
      //    would be a false success — leave the button untouched.
      const tg = getWebApp();
      if (typeof tg?.openTelegramLink === "function") {
        const picker = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`;
        tg.openTelegramLink(picker);
        fireSound("unlock");
        return;
      }

      // 3) Last resort → clipboard (only flashes "copied" on a successful write).
      await copyToClipboard(url);
    } catch {
      // best-effort
    } finally {
      setUnlockBusy(false);
    }
  }, [unlocked, unlockBusy, shareUrl, fetchReferralUrl, t, flash, copyToClipboard]);

  const handleRegenerate = useCallback(async () => {
    if (regenBusy) return;
    fireSound("tap");
    setRegenBusy(true);
    // Best-effort DELETE — ignore failure, user wants to start over.
    await fetch(`/api/packs/${encodeURIComponent(packId)}`, {
      method: "DELETE",
      credentials: "include",
    }).catch(() => {});
    router.push("/create");
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
            onClick={() => { fireSound("tap"); setShowInviteModal(true); }}
            className="shimmer inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-5 py-2 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5"
          >
            <Unlock className="h-4 w-4" strokeWidth={2.2} />
            {t("result.actions.unlock_all", { count: packSize })}
          </button>
        )}

        {/* Get stickers */}
        <button
          type="button"
          onClick={() => { fireSound("tap"); setShowModal(true); }}
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

      {!unlocked && (
        <InviteFriendModal
          open={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          packSize={packSize}
          shareUrl={shareUrl}
          onSend={handleUnlock}
          sendBusy={unlockBusy}
          sendFeedback={feedback}
        />
      )}
    </>
  );
}
