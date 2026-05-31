"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { getWebApp, isTelegramEnv } from "@/lib/telegram/webapp";
import type { AuthMeResponse } from "@/lib/api-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TelegramStatus = "idle" | "authenticating" | "authed" | "error";

export type TelegramContextValue = {
  isTelegram: boolean;
  /**
   * True once the SDK detection poll has finished (either SDK found, or poll
   * timed out).  Consumers should wait for this before acting on isTelegram.
   */
  telegramResolved: boolean;
  user: AuthMeResponse | null;
  status: TelegramStatus;
  /** Call this to retry the auto-login flow after an error. */
  retry: () => void;
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const TelegramContext = createContext<TelegramContextValue>({
  isTelegram: false,
  telegramResolved: false,
  user: null,
  status: "idle",
  retry: () => {},
});

export function useTelegram(): TelegramContextValue {
  return useContext(TelegramContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/** Brand background colour applied to the Telegram header / background. */
const BRAND_BG = "#0f0f0f";

/** Home routes where the Telegram BackButton should be hidden. */
const HOME_ROUTES = new Set(["/app", "/upload", "/my-stickers"]);

/** Timeout (ms) for each auth fetch before treating it as an error. */
const FETCH_TIMEOUT_MS = 10_000;

/** Maximum time (ms) to wait for the Telegram SDK to attach to window. */
const SDK_POLL_TIMEOUT_MS = 2_000;

/** Interval (ms) to poll for the Telegram SDK. */
const SDK_POLL_INTERVAL_MS = 50;

async function fetchWithTimeout(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();
  const [status, setStatus] = useState<TelegramStatus>("idle");
  const [user, setUser] = useState<AuthMeResponse | null>(null);
  // Increment to re-trigger the login effect on retry.
  const [retryCount, setRetryCount] = useState(0);

  // Fix 1 & 2: isTelegram is always false on the first render (SSR + client
  // first render), so server and client agree.  The correct value is applied
  // after mount via a state update once we know the SDK is available.
  const [isInTelegram, setIsInTelegram] = useState(false);
  // telegramResolved becomes true once the SDK detection poll finishes
  // (SDK found OR poll timed out without finding it).
  const [telegramResolved, setTelegramResolved] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const retry = useCallback(() => {
    setStatus("idle");
    setRetryCount((c) => c + 1);
  }, []);

  // Keep a stable ref to the themeChanged handler so we can detach it.
  const themeHandlerRef = useRef<(() => void) | null>(null);

  // Fix 2: Wait up to SDK_POLL_TIMEOUT_MS for window.Telegram.WebApp to be
  // populated (afterInteractive scripts are high-priority but not
  // synchronously guaranteed before the first effect runs).
  useEffect(() => {
    let stopped = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

    function check() {
      if (stopped) return;
      if (isTelegramEnv()) {
        cleanup(true);
      }
    }

    function cleanup(found = false) {
      if (stopped) return;
      stopped = true;
      if (pollTimer !== null) clearInterval(pollTimer);
      if (timeoutTimer !== null) clearTimeout(timeoutTimer);
      if (found) setIsInTelegram(true);
      setTelegramResolved(true);
    }

    // Fast path: SDK already present.
    if (isTelegramEnv()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot SDK detection gate
      setIsInTelegram(true);
      setTelegramResolved(true);
      return;
    }

    // Slow path: poll until the SDK attaches or we time out.
    pollTimer = setInterval(check, SDK_POLL_INTERVAL_MS);
    timeoutTimer = setTimeout(() => cleanup(false), SDK_POLL_TIMEOUT_MS);

    return () => cleanup(false);
  }, []);

  // Main lifecycle + auto-login effect.
  useEffect(() => {
    if (!isInTelegram) return;

    const app = getWebApp()!;

    // --- SDK lifecycle ---
    app.ready();
    app.expand();

    // --- Theme sync ---
    setTheme(app.colorScheme === "dark" ? "dark" : "light");

    const handleThemeChange = () => {
      setTheme(app.colorScheme === "dark" ? "dark" : "light");
    };
    themeHandlerRef.current = handleThemeChange;
    app.onEvent("themeChanged", handleThemeChange);

    // Brand colours for the native Telegram chrome.
    try {
      app.setHeaderColor(BRAND_BG);
      app.setBackgroundColor(BRAND_BG);
    } catch {
      // Older SDK versions may not support these calls — ignore.
    }

    // --- Auto-login ---
    let cancelled = false;

    async function autoLogin() {
      setStatus("authenticating");

      // 1. Check if already authenticated.
      const meRes = await fetchWithTimeout("/auth/me", {
        credentials: "include",
      });

      if (cancelled) return;

      if (meRes.ok) {
        const profile = (await meRes.json()) as AuthMeResponse;
        setUser(profile);
        setStatus("authed");
        return;
      }

      // 2. Not authenticated — exchange Telegram initData for a session.
      const postRes = await fetchWithTimeout("/auth/telegram/webapp", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: app.initData }),
      });

      if (cancelled) return;

      if (postRes.ok) {
        // Backend returns the UserProfile directly — reuse it.
        const profile = (await postRes.json()) as AuthMeResponse;
        setUser(profile);
        setStatus("authed");
      } else {
        setStatus("error");
      }
    }

    autoLogin().catch(() => {
      if (!cancelled) setStatus("error");
    });

    return () => {
      cancelled = true;
      // Detach theme listener.
      if (themeHandlerRef.current) {
        app.offEvent("themeChanged", themeHandlerRef.current);
        themeHandlerRef.current = null;
      }
    };
    // retryCount intentionally re-runs the effect on retry.
    // setTheme is a stable useCallback([]) — safe to include for lint hygiene.
  }, [isInTelegram, retryCount, setTheme]);

  // Fix 5: Wire Telegram BackButton to drive in-app back navigation.
  // Shown on non-home routes inside Telegram; hidden on home routes.
  useEffect(() => {
    if (!isInTelegram) return;
    const app = getWebApp();
    if (!app) return;

    const handler = () => router.back();

    try {
      if (pathname && !HOME_ROUTES.has(pathname)) {
        app.BackButton.onClick(handler);
        app.BackButton.show();
      } else {
        app.BackButton.hide();
      }
    } catch {
      // Older SDK versions may not support BackButton — ignore.
    }

    return () => {
      try {
        app.BackButton.offClick(handler);
      } catch {
        // Ignore.
      }
    };
  }, [isInTelegram, pathname, router]);

  return (
    <TelegramContext.Provider
      value={{ isTelegram: isInTelegram, telegramResolved, user, status, retry }}
    >
      {children}
    </TelegramContext.Provider>
  );
}
