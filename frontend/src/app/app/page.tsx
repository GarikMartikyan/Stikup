"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { useT } from "@/components/language-provider";

export default function TelegramAppPage() {
  const t = useT();
  const router = useRouter();
  const { isTelegram, telegramResolved, status, retry } = useTelegram();
  // Use a ref to prevent duplicate smart-home fetches across re-renders.
  const redirectingRef = useRef(false);

  // Fix 3: Defer rendering decisions until after mount so the first client
  // render matches the server output (both produce the loading spinner).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot post-hydration gate
    setMounted(true);
  }, []);

  // Fix 2 (page-side): consume the provider's definitive telegramResolved flag
  // before acting on isTelegram.  The provider polls up to 2s for the SDK;
  // we stay on the spinner until it either finds the SDK or gives up.
  useEffect(() => {
    if (!mounted || !telegramResolved) return;
    if (!isTelegram) {
      router.replace("/");
    }
  }, [mounted, telegramResolved, isTelegram, router]);

  // Once authed, decide where to send the user.
  useEffect(() => {
    if (status !== "authed" || redirectingRef.current) return;
    redirectingRef.current = true;

    async function smartHome() {
      try {
        const res = await fetch("/api/packs", { credentials: "include" });
        if (res.ok) {
          const packs = (await res.json()) as unknown[];
          if (Array.isArray(packs) && packs.length > 0) {
            router.replace("/my-stickers");
          } else {
            router.replace("/upload");
          }
        } else {
          // Fix 4: On fetch failure we can't determine if the user has packs.
          // Default to /my-stickers which re-validates the session via
          // requireSession() and renders an empty state if /packs returns
          // nothing — strictly safer than assuming empty and sending to /upload.
          router.replace("/my-stickers");
        }
      } catch {
        // Fix 4: Same reasoning — network error ≠ no packs.
        router.replace("/my-stickers");
      }
    }

    smartHome();
  }, [status, router]);

  // Fix 3: Before mount, both server and client render the same loading
  // spinner — avoids null vs. spinner hydration mismatch.
  if (!mounted) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand)]" />
        <p className="text-sm text-[var(--color-fg-muted)]">
          {t("telegram_app.loading")}
        </p>
      </main>
    );
  }

  // Error state.
  if (status === "error") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <p className="text-lg font-semibold text-[var(--color-fg)]">
            {t("telegram_app.error_title")}
          </p>
          <p className="max-w-xs text-sm text-[var(--color-fg-muted)]">
            {t("telegram_app.error_body")}
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={retry}
            className="rounded-xl bg-[var(--color-brand)] px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {t("telegram_app.retry")}
          </button>
          <Link
            href="/login"
            className="text-sm text-[var(--color-fg-muted)] underline-offset-2 hover:underline"
          >
            {t("telegram_app.or_sign_in")}
          </Link>
        </div>
      </main>
    );
  }

  // Loading / authenticating / authed (redirect in-flight).
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand)]" />
      <p className="text-sm text-[var(--color-fg-muted)]">
        {status === "authenticating"
          ? t("telegram_app.signing_in")
          : t("telegram_app.loading")}
      </p>
    </main>
  );
}
