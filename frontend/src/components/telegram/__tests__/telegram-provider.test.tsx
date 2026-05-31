import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import React from "react";
import { TelegramProvider, useTelegram } from "../telegram-provider";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock the theme provider so we don't need the real context. The returned
// object (and its setTheme) MUST be stable across renders: the provider's
// auto-login effect lists setTheme in its deps, and a fresh function each
// render would re-fire the effect forever (the real setTheme is a stable
// useCallback).
vi.mock("@/components/theme-provider", () => {
  const value = { setTheme: vi.fn(), theme: "light", resolved: "light", toggle: vi.fn() };
  return { useTheme: () => value };
});

// The provider calls useRouter()/usePathname() (for BackButton wiring), so the
// App Router hooks must be mocked. Return stable references for the same reason
// as above (the BackButton effect lists router in its deps).
vi.mock("next/navigation", () => {
  const router = { back: vi.fn() };
  return { useRouter: () => router, usePathname: () => "/" };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildWebApp(overrides: Partial<{
  initData: string;
  colorScheme: "light" | "dark";
}> = {}) {
  return {
    initData: overrides.initData ?? "query_id=abc&user=%7B%22id%22%3A1%7D",
    colorScheme: overrides.colorScheme ?? "light",
    initDataUnsafe: {},
    themeParams: {},
    BackButton: { isVisible: false, show: vi.fn(), hide: vi.fn(), onClick: vi.fn(), offClick: vi.fn() },
    ready: vi.fn(),
    expand: vi.fn(),
    setHeaderColor: vi.fn(),
    setBackgroundColor: vi.fn(),
    onEvent: vi.fn(),
    offEvent: vi.fn(),
  };
}

function setTelegramWebApp(webApp: ReturnType<typeof buildWebApp> | null) {
  if (webApp === null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).Telegram;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Telegram = { WebApp: webApp };
  }
}

// A simple consumer that exposes the context values via data attributes.
function Consumer() {
  const { isTelegram, status } = useTelegram();
  return (
    <div data-testid="consumer" data-is-telegram={String(isTelegram)} data-status={status} />
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TelegramProvider — outside Telegram", () => {
  beforeEach(() => {
    setTelegramWebApp(null);
  });

  afterEach(() => {
    setTelegramWebApp(null);
    vi.restoreAllMocks();
  });

  it("exposes isTelegram=false and status=idle when not in Telegram", () => {
    render(
      <TelegramProvider>
        <Consumer />
      </TelegramProvider>,
    );
    const el = screen.getByTestId("consumer");
    expect(el.dataset.isTelegram).toBe("false");
    expect(el.dataset.status).toBe("idle");
  });

  it("renders children even outside Telegram", () => {
    render(
      <TelegramProvider>
        <span data-testid="child">hello</span>
      </TelegramProvider>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});

describe("TelegramProvider — inside Telegram, auto-login", () => {
  let webApp: ReturnType<typeof buildWebApp>;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    webApp = buildWebApp();
    setTelegramWebApp(webApp);
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    setTelegramWebApp(null);
    vi.restoreAllMocks();
  });

  it("calls WebApp.ready() and WebApp.expand() on mount", async () => {
    // Simulate 401 then 401 so we don't need the full happy path here.
    fetchSpy.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });

    await act(async () => {
      render(
        <TelegramProvider>
          <Consumer />
        </TelegramProvider>,
      );
    });

    expect(webApp.ready).toHaveBeenCalledOnce();
    expect(webApp.expand).toHaveBeenCalledOnce();
  });

  it("sets status to authed when /auth/me returns 200 (already logged in)", async () => {
    const profile = { userId: "u1", email: "a@b.com", displayName: null, avatarUrl: null, channels: [] };
    fetchSpy.mockResolvedValue({ ok: true, status: 200, json: async () => profile });

    await act(async () => {
      render(
        <TelegramProvider>
          <Consumer />
        </TelegramProvider>,
      );
    });

    await waitFor(() => {
      const el = screen.getByTestId("consumer");
      expect(el.dataset.status).toBe("authed");
    });
    // Only /auth/me should have been called; no POST needed.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe("/auth/me");
  });

  it("POSTs initData when /auth/me returns 401 and sets status to authed on success", async () => {
    const profile = { userId: "u2", email: null, displayName: "Tg User", avatarUrl: null, channels: [] };
    fetchSpy
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })  // GET /auth/me → 401
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => profile }); // POST /auth/telegram/webapp → 200

    await act(async () => {
      render(
        <TelegramProvider>
          <Consumer />
        </TelegramProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("consumer").dataset.status).toBe("authed");
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[1][0]).toBe("/auth/telegram/webapp");
    expect(fetchSpy.mock.calls[1][1]).toMatchObject({ method: "POST" });
  });

  it("sets status to error when both /auth/me and POST return non-2xx", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });

    await act(async () => {
      render(
        <TelegramProvider>
          <Consumer />
        </TelegramProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("consumer").dataset.status).toBe("error");
    });
  });
});
