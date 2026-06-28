"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, RefreshCw, Send, X } from "lucide-react";
import { useT } from "@/components/language-provider";

type InviteFriendModalProps = {
  open: boolean;
  onClose: () => void;
  /** Pack count, used in the headline copy. */
  packSize: number;
  /** Pre-fetched referral deep link; null while it's still loading. */
  shareUrl: string | null;
  /** Hands off to the native share / Telegram picker / clipboard flow. */
  onSend: () => void;
  /** The send action is in flight. */
  sendBusy: boolean;
  /** Outcome of the send action, mirrored onto the send button. */
  sendFeedback: null | "shared" | "copied";
};

export function InviteFriendModal({
  open,
  onClose,
  packSize,
  shareUrl,
  onSend,
  sendBusy,
  sendFeedback,
}: InviteFriendModalProps) {
  const t = useT();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot post-hydration gate
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset copied flash when modal closes
      setCopied(false);
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  // Copy the link; only flash "Copied!" when the write actually lands so we
  // never claim success while the clipboard is empty.
  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard unavailable — no false success */
    }
  }, [shareUrl]);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop — click outside closes the modal */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-[3px] transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("result.invite_modal.title")}
        className={`fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-sm rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-2xl transition-all duration-300 sm:bottom-auto sm:top-1/2 sm:inset-x-auto sm:left-1/2 sm:w-full sm:-translate-x-1/2 sm:-translate-y-1/2 ${
          open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
            {t("result.invite_modal.title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("result.invite_modal.close")}
            className="grid h-8 w-8 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elev)] text-[var(--color-fg-muted)] transition hover:text-[var(--color-fg)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
          {t("result.invite_modal.description", { count: packSize })}
        </p>

        {/* Link row with inline copy button */}
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-1.5 pl-4">
          <span className="flex-1 truncate text-sm text-[var(--color-fg-muted)]">
            {shareUrl ?? `${t("result.invite_modal.loading")}…`}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!shareUrl}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm font-semibold text-[var(--color-fg)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" strokeWidth={3} />
                {t("result.invite_modal.copied")}
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" strokeWidth={2.2} />
                {t("result.invite_modal.copy")}
              </>
            )}
          </button>
        </div>

        {/* Send — the only action; carries the original unlock-all flow */}
        <button
          type="button"
          onClick={onSend}
          disabled={sendBusy}
          className="shimmer mt-4 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-80"
        >
          {sendFeedback === "shared" ? (
            <>
              <Check className="h-4 w-4" strokeWidth={3} />
              {t("result.actions.link_shared")}
            </>
          ) : sendFeedback === "copied" ? (
            <>
              <Check className="h-4 w-4" strokeWidth={3} />
              {t("result.actions.link_copied")}
            </>
          ) : sendBusy ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              {t("result.actions.sharing")}
            </>
          ) : (
            <>
              <Send className="h-4 w-4" strokeWidth={2.2} />
              {t("result.invite_modal.send")}
            </>
          )}
        </button>
      </div>
    </>,
    document.body,
  );
}
