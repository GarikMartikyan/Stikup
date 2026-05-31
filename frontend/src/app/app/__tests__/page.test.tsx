import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// ---------------------------------------------------------------------------
// Shared mocks
// ---------------------------------------------------------------------------

const mockRouterReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
}));

// We'll override these per-test.
let mockIsTelegram = false;
let mockStatus: "idle" | "authenticating" | "authed" | "error" = "idle";
let mockRetry = vi.fn();

vi.mock("@/components/telegram/telegram-provider", () => ({
  useTelegram: () => ({
    isTelegram: mockIsTelegram,
    telegramResolved: true,
    user: null,
    status: mockStatus,
    retry: mockRetry,
  }),
}));

vi.mock("@/lib/telegram/webapp", () => ({
  isTelegramEnv: () => mockIsTelegram,
}));

// We'll set fetchSpy per-test.
let fetchSpy = vi.fn();

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockRouterReplace.mockClear();
  mockRetry = vi.fn();
  fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function renderPage() {
  // Dynamic import so module-level mocks are in place when it executes.
  const { default: TelegramAppPage } = await import("../page");
  return render(
    <React.Suspense fallback={null}>
      <TelegramAppPage />
    </React.Suspense>,
  );
}

describe("/app page — not in Telegram", () => {
  beforeEach(() => {
    mockIsTelegram = false;
    mockStatus = "idle";
  });

  it("redirects to / immediately when not in Telegram", async () => {
    await renderPage();
    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/");
    });
  });

  it("shows a loading state (not blank) while redirecting out of Telegram", async () => {
    const { container } = await renderPage();
    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/");
    });
    // The page renders a loading spinner (not null) to avoid a blank flash
    // during the redirect off the Mini App entry route.
    expect(container.querySelector("main")).not.toBeNull();
  });
});

describe("/app page — inside Telegram, status=authed, has packs", () => {
  beforeEach(() => {
    mockIsTelegram = true;
    mockStatus = "authed";
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => [{ id: "pack-1" }],
    });
  });

  it("redirects to /my-stickers when packs exist", async () => {
    await renderPage();
    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/my-stickers");
    });
  });
});

describe("/app page — inside Telegram, status=authed, no packs", () => {
  beforeEach(() => {
    mockIsTelegram = true;
    mockStatus = "authed";
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => [],
    });
  });

  it("redirects to /upload when packs array is empty", async () => {
    await renderPage();
    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/upload");
    });
  });
});

describe("/app page — inside Telegram, status=error", () => {
  beforeEach(() => {
    mockIsTelegram = true;
    mockStatus = "error";
  });

  it("shows the error UI with a retry button and a login link", async () => {
    await renderPage();
    // The error title should appear.
    await waitFor(() => {
      expect(screen.getByText(/couldn't sign you in/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
  });

  it("calls retry() when the Retry button is clicked", async () => {
    const user = userEvent.setup();
    await renderPage();
    await waitFor(() => screen.getByRole("button", { name: /retry/i }));
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(mockRetry).toHaveBeenCalledOnce();
  });
});
