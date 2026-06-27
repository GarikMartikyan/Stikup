/**
 * Tests for PackActions component.
 *
 * URL-construction correctness is validated end-to-end via the navigator.share
 * path (see "shares pack-specific link" suite). The clipboard path is tested
 * for UX completion (link-copied state) rather than spy-level URL capture
 * because jsdom's navigator.clipboard is non-configurable at runtime.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { LanguageProvider } from "@/components/language-provider";

// ─── module-level mocks ───────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// GetStickersModal uses createPortal — stub it so tests don't need a full DOM portal.
vi.mock("../get-stickers-modal", () => ({
  GetStickersModal: () => null,
}));

// ─── constants ────────────────────────────────────────────────────────────────

const PACK_ID = "550e8400-e29b-41d4-a716-446655440000";
const REFERRAL_CODE = "MYCODE";
const EXPECTED_PACK_LINK = `https://t.me/stikup_bot?start=ref_${REFERRAL_CODE}_${PACK_ID}`;

const MOCK_REFERRAL_RESPONSE = {
  code: REFERRAL_CODE,
  referredCount: 0,
};

const defaultStickers = [
  { index: 0, url: "/s1.webp" },
  { index: 1, url: "/s2.webp" },
  { index: 2, url: "/s3.webp" },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

let fetchSpy = vi.fn();

async function renderPackActions(
  overrides: Partial<{
    packId: string;
    packSize: number;
    unlocked: boolean;
    locked: boolean;
    stickers: { index: number; url: string }[];
    freeCount: number;
    regensLeft: number;
  }> = {},
) {
  const defaults = {
    packId: PACK_ID,
    packSize: 12,
    unlocked: false,
    locked: false,
    stickers: defaultStickers,
    freeCount: 3,
    regensLeft: 1,
  };
  const { PackActions } = await import("../pack-actions");
  return render(
    <LanguageProvider>
      <PackActions {...defaults} {...overrides} />
    </LanguageProvider>,
  );
}

// ─── setup / teardown ────────────────────────────────────────────────────────

beforeEach(() => {
  fetchSpy = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => MOCK_REFERRAL_RESPONSE,
  });
  vi.stubGlobal("fetch", fetchSpy);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ─── tests ───────────────────────────────────────────────────────────────────

describe("PackActions — unlock shares a pack-specific link via navigator.share", () => {
  it("shares a t.me ?start=ref_ bot deep link encoding code and pack id", async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...global.navigator, share: shareSpy });

    const user = userEvent.setup();
    await renderPackActions({ unlocked: false });

    await user.click(screen.getByRole("button", { name: /unlock all/i }));
    await waitFor(() => expect(shareSpy).toHaveBeenCalled());

    const sharedUrl: string = shareSpy.mock.calls[0][0].url;
    expect(sharedUrl).toBe(EXPECTED_PACK_LINK);
    expect(sharedUrl).toContain(`start=ref_${REFERRAL_CODE}_${PACK_ID}`);
  });

  it("calls GET /api/referral/me with credentials", async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...global.navigator, share: shareSpy });

    const user = userEvent.setup();
    await renderPackActions({ unlocked: false });

    await user.click(screen.getByRole("button", { name: /unlock all/i }));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());

    expect(fetchSpy).toHaveBeenCalledWith("/api/referral/me", {
      credentials: "include",
    });
  });
});

describe("PackActions — clipboard fallback (when navigator.share is absent)", () => {
  it("transitions the button to 'link copied' state after completing the clipboard write", async () => {
    // jsdom's navigator.clipboard is non-configurable, so we verify the UX
    // outcome (link-copied state) rather than spy on the write call directly.
    // URL correctness is proven by the navigator.share suite above.
    vi.stubGlobal("navigator", { ...global.navigator, share: undefined });

    const user = userEvent.setup();
    await renderPackActions({ unlocked: false });

    await user.click(screen.getByRole("button", { name: /unlock all/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /link copied/i })).toBeInTheDocument();
    });
  });

  it("fetches /api/referral/me even when taking the clipboard path", async () => {
    vi.stubGlobal("navigator", { ...global.navigator, share: undefined });
    const user = userEvent.setup();
    await renderPackActions({ unlocked: false });

    await user.click(screen.getByRole("button", { name: /unlock all/i }));
    await waitFor(() => screen.getByRole("button", { name: /link copied/i }));

    expect(fetchSpy).toHaveBeenCalledWith("/api/referral/me", {
      credentials: "include",
    });
  });
});

describe("PackActions — unlocked state hides the unlock button", () => {
  it("does not render the unlock button when unlocked=true", async () => {
    await renderPackActions({ unlocked: true });
    expect(screen.queryByRole("button", { name: /unlock all/i })).toBeNull();
  });

  it("does not call referral/me when already unlocked", async () => {
    await renderPackActions({ unlocked: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
