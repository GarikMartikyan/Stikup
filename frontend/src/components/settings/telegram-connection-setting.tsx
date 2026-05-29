"use client";

import { useEffect, useState } from "react";

import { useT } from "@/components/language-provider";
import {
  useGetMeQuery,
  useStartTelegramLinkMutation,
  useUnlinkTelegramMutation,
} from "@/lib/store/auth-api";

export function TelegramConnectionSetting() {
  const t = useT();
  const { data: me, refetch } = useGetMeQuery();
  const [startTelegramLink, { isLoading: isConnecting }] =
    useStartTelegramLinkMutation();
  const [unlinkTelegram, { isLoading: isDisconnecting }] =
    useUnlinkTelegramMutation();
  const [error, setError] = useState<string | null>(null);

  const channels = me?.channels ?? [];
  const telegram = channels.find((c) => c.channel === "telegram");
  const connected = !!telegram;
  const canUnlink = channels.length > 1;

  // Refetch /auth/me when the window regains focus after the user goes to Telegram
  useEffect(() => {
    function handleFocus() {
      void refetch();
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetch]);

  async function handleConnect() {
    setError(null);
    try {
      const { url } = await startTelegramLink().unwrap();
      const popup = window.open(url, "_blank", "noopener,noreferrer");
      if (!popup) {
        window.location.href = url;
      }
    } catch {
      setError(t("settings.telegram.error_failed"));
    }
  }

  async function handleDisconnect() {
    if (!canUnlink || isDisconnecting) return;
    setError(null);
    try {
      await unlinkTelegram().unwrap();
    } catch (err: unknown) {
      const status =
        err !== null &&
        typeof err === "object" &&
        "status" in err
          ? (err as { status: unknown }).status
          : undefined;
      if (status === 409) {
        setError(t("settings.telegram.error_last_method"));
      } else {
        setError(t("settings.telegram.error_failed"));
      }
    }
  }

  const handle = telegram?.username
    ? `@${telegram.username}`
    : (telegram?.displayName ?? null);

  if (connected) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-[var(--color-fg)]">
            {handle
              ? t("settings.telegram.connected_as", { handle })
              : t("settings.telegram.connected")}
          </p>
          {!canUnlink && (
            <p className="text-xs text-[var(--color-fg-muted)]">
              {t("settings.telegram.last_method_hint")}
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="text-xs font-semibold text-[var(--color-danger)]"
            >
              {error}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleDisconnect}
          disabled={!canUnlink || isDisconnecting}
          className="inline-flex items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-4 py-2 text-sm font-bold text-[var(--color-fg)] transition hover:bg-[var(--color-bg-sunk)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDisconnecting
            ? t("settings.telegram.disconnecting")
            : t("settings.telegram.disconnect_button")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-[var(--color-fg-muted)]">
          {t("settings.telegram.connect_hint")}
        </p>
        {error && (
          <p
            role="alert"
            className="text-xs font-semibold text-[var(--color-danger)]"
          >
            {error}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={handleConnect}
        disabled={isConnecting}
        className="connect-pulse inline-flex items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-4 py-2 text-sm font-bold text-[var(--color-fg)] transition hover:bg-[var(--color-bg-sunk)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isConnecting
          ? t("settings.telegram.connecting")
          : t("settings.telegram.connect_button")}
      </button>
    </div>
  );
}
