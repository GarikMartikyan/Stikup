"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Send, Settings, X } from "lucide-react";
import Link from "next/link";
import { useConnectionStatus } from "@/lib/hooks/use-connection-status";
import { useT } from "@/components/language-provider";
import type { StickerItem } from "./sticker-grid";

type GetStickersModalProps = {
  packId: string;
  stickers: StickerItem[];
  open: boolean;
  onClose: () => void;
  /** Fired when the user accepts the pack (gets it on Telegram or downloads it). */
  onAccept?: () => void;
};

export function GetStickersModal({
  packId,
  stickers,
  open,
  onClose,
  onAccept,
}: GetStickersModalProps) {
  const t = useT();
  const { telegramConnected } = useConnectionStatus();
  const [mounted, setMounted] = useState(false);
  const [telegramBusy, setTelegramBusy] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [packLink, setPackLink] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot post-hydration gate
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset stale link when modal closes
      setPackLink(null);
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

  async function handleTelegram() {
    if (telegramBusy) return;

    if (!telegramConnected) {
      // Not connected — settings prompt is shown in the modal UI instead.
      return;
    }

    setTelegramBusy(true);
    try {
      const res = await fetch(
        `/api/packs/${encodeURIComponent(packId)}/deliver-telegram`,
        { method: "POST", credentials: "include", keepalive: true },
      );
      if (!res.ok) throw new Error(`deliver-telegram ${res.status}`);
      const data = (await res.json()) as {
        delivered: boolean;
        botUrl: string;
        needsTelegram?: boolean;
        stickerSetUrl?: string;
      };
      // If the backend says Telegram isn't connected, treat as unconnected.
      if (data.needsTelegram) {
        setTelegramBusy(false);
        return;
      }
      setPackLink(data.stickerSetUrl ?? data.botUrl);
      setTelegramBusy(false);
      // Getting the pack on Telegram is an acceptance — lock regeneration.
      if (data.delivered) onAccept?.();
    } catch {
      setTelegramBusy(false);
    }
  }

  async function handleDownload() {
    if (downloadBusy) return;
    // Nothing to download → don't register an acceptance / lock the user.
    if (stickers.length === 0) return;
    setDownloadBusy(true);

    // Downloading is an acceptance — register it FIRST so the server lock is
    // recorded even if the blob saves are interrupted. The lock is what gates
    // regeneration, so make it reliable: await it and retry once on failure
    // rather than fire-and-forget.
    let locked = false;
    for (let attempt = 0; attempt < 2 && !locked; attempt++) {
      try {
        const res = await fetch(
          `/api/packs/${encodeURIComponent(packId)}/download`,
          { method: "POST", credentials: "include", keepalive: true },
        );
        locked = res.ok;
      } catch {
        // retry once
      }
    }

    for (const sticker of stickers) {
      try {
        const res = await fetch(sticker.url);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sticker_${sticker.index + 1}.webp`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        // best-effort per sticker
      }
    }

    onAccept?.();
    setDownloadBusy(false);
    onClose();
  }

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
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
        aria-label={t("result.get_stickers_modal.title")}
        className={`fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-sm rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-2xl transition-all duration-300 sm:bottom-auto sm:top-1/2 sm:inset-x-auto sm:left-1/2 sm:w-full sm:-translate-x-1/2 sm:-translate-y-1/2 ${
          open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
            {t("result.get_stickers_modal.title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("result.get_stickers_modal.close")}
            className="grid h-8 w-8 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elev)] text-[var(--color-fg-muted)] transition hover:text-[var(--color-fg)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {/* Get in Telegram option */}
          {packLink ? (
            <a
              href={packLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-start gap-4 rounded-2xl border border-[var(--color-brand)] bg-[var(--color-brand)]/5 p-4 text-left transition hover:bg-[var(--color-brand)]/10"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                <Send className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div>
                <div className="font-semibold text-[var(--color-brand)]">
                  {t("result.get_stickers_modal.pack_ready")}
                </div>
                <div className="mt-0.5 text-sm text-[var(--color-fg-muted)]">
                  {t("result.get_stickers_modal.open_pack")}
                </div>
              </div>
            </a>
          ) : telegramConnected ? (
            <button
              type="button"
              onClick={handleTelegram}
              disabled={telegramBusy}
              className="flex w-full items-start gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4 text-left transition hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)]/5 disabled:cursor-wait disabled:opacity-70"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                <Send className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div>
                <div className="font-semibold text-[var(--color-fg)]">
                  {telegramBusy
                    ? t("result.actions.sending_telegram")
                    : t("result.get_stickers_modal.get_in_telegram")}
                </div>
                <div className="mt-0.5 text-sm text-[var(--color-fg-muted)]">
                  {t("result.get_stickers_modal.get_in_telegram_desc")}
                </div>
              </div>
            </button>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] p-4">
              <div className="flex items-start gap-3">
                <Settings className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-fg-muted)]" />
                <div>
                  <p className="text-sm text-[var(--color-fg-muted)]">
                    {t("result.get_stickers_modal.connect_telegram_prompt")}
                  </p>
                  <Link
                    href="/settings"
                    onClick={onClose}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-fg)] px-4 py-1.5 text-sm font-semibold text-[var(--color-bg)] transition hover:opacity-90"
                  >
                    {t("result.get_stickers_modal.go_to_settings")}
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Download option */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloadBusy}
            className="flex w-full items-start gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4 text-left transition hover:border-[var(--color-border-strong)] disabled:cursor-wait disabled:opacity-70"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-bg-sunk)] text-[var(--color-fg)]">
              <Download className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <div className="font-semibold text-[var(--color-fg)]">
                {downloadBusy
                  ? t("result.get_stickers_modal.downloading")
                  : t("result.get_stickers_modal.download")}
              </div>
              <div className="mt-0.5 text-sm text-[var(--color-fg-muted)]">
                {t("result.get_stickers_modal.download_desc")}
              </div>
            </div>
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
