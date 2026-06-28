/**
 * Tests for PackActions component.
 *
 * "Unlock all" no longer shares directly — it opens the InviteFriendModal, and
 * the share/copy/Telegram-picker flow now lives behind the modal's "Send"
 * button. Each share-path test therefore opens the modal first, then clicks
 * Send. URL-construction correctness is validated end-to-end via the
 * navigator.share path; the clipboard path is tested for UX completion
 * (link-copied state) rather than spy-level URL capture because jsdom's
 * navigator.clipboard is non-configurable at runtime.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
import React from "react";
import { LanguageProvider } from "@/components/language-provider";

// ─── module-level mocks ───────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// GetStickersModal uses createPortal — stub it so tests don't need a full DOM
// portal. InviteFriendModal is intentionally NOT mocked: its Send button is
// what now drives the share flow under test.
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

/** Open the invite modal, then trigger the share flow via its Send button. */
async function openModalAndSend(user: UserEvent) {
  await user.click(screen.getByRole("button", { name: /unlock all/i }));
  await user.click(await screen.findByRole("button", { name: /^send$/i }));
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

describe("PackActions — unlock opens the invite modal", () => {
  it("shows the invite copy and the referral link, and does not share until Send", async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...global.navigator, share: shareSpy });

    const user = userEvent.setup();
    await renderPackActions({ unlocked: false });

    await user.click(screen.getByRole("button", { name: /unlock all/i }));

    // Modal is open with the invite instruction and the pack link.
    expect(await screen.findByText(/invite your friend via this link/i)).toBeInTheDocument();
    expect(await screen.findByText(EXPECTED_PACK_LINK)).toBeInTheDocument();
    // Opening the modal must NOT have shared anything yet.
    expect(shareSpy).not.toHaveBeenCalled();
  });

  it("closes the modal when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    await renderPackActions({ unlocked: false });

    await user.click(screen.getByRole("button", { name: /unlock all/i }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.className).not.toContain("pointer-events-none");

    const backdrop = document.querySelector(".inset-0") as HTMLElement;
    await user.click(backdrop);

    await waitFor(() => expect(dialog.className).toContain("pointer-events-none"));
  });
});

describe("PackActions — Send shares a pack-specific link via navigator.share", () => {
  it("shares a t.me ?start=ref_ bot deep link encoding code and pack id", async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...global.navigator, share: shareSpy });

    const user = userEvent.setup();
    await renderPackActions({ unlocked: false });

    await openModalAndSend(user);
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

    await openModalAndSend(user);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());

    expect(fetchSpy).toHaveBeenCalledWith("/api/referral/me", {
      credentials: "include",
    });
  });
});

describe("PackActions — copy button (inside the invite modal)", () => {
  it("copies the referral link and flashes a copied state on the copy button", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      ...global.navigator,
      share: undefined,
      clipboard: { writeText },
    });

    await renderPackActions({ unlocked: false });

    await user.click(screen.getByRole("button", { name: /unlock all/i }));
    const copyButton = await screen.findByRole("button", { name: /^copy$/i });
    await user.click(copyButton);

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(EXPECTED_PACK_LINK));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /copied!/i })).toBeInTheDocument(),
    );
  });
});

describe("PackActions — clipboard fallback on Send (when navigator.share is absent)", () => {
  it("transitions the Send button to 'link copied' after a successful clipboard write", async () => {
    // setup() BEFORE stubbing navigator: userEvent installs its own
    // navigator.clipboard stub at setup, so our spy must be applied afterward.
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      ...global.navigator,
      share: undefined,
      clipboard: { writeText },
    });

    await renderPackActions({ unlocked: false });

    await openModalAndSend(user);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /link copied/i })).toBeInTheDocument();
    });
    expect(writeText).toHaveBeenCalledWith(EXPECTED_PACK_LINK);
  });

  it("does NOT claim 'link copied' when the clipboard write fails", async () => {
    // Regression guard: a swallowed clipboard error must not flash a false
    // success — the user would believe they hold a link they never received.
    const user = userEvent.setup();
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    vi.stubGlobal("navigator", {
      ...global.navigator,
      share: undefined,
      clipboard: { writeText },
    });

    await renderPackActions({ unlocked: false });

    await openModalAndSend(user);

    await waitFor(() => expect(writeText).toHaveBeenCalled());
    // Send falls back to its idle label, never "link copied".
    expect(screen.queryByRole("button", { name: /link copied/i })).toBeNull();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^send$/i })).toBeInTheDocument(),
    );
  });
});

describe("PackActions — cancelling the native share sheet", () => {
  it("falls back to copying the link (not the Telegram picker) when share is aborted", async () => {
    // Regression guard: dismissing the OS share sheet must still deliver the
    // link via the clipboard, without opening the intrusive Telegram picker.
    const user = userEvent.setup();
    const shareSpy = vi.fn().mockRejectedValue(
      Object.assign(new Error("cancelled"), { name: "AbortError" }),
    );
    const writeText = vi.fn().mockResolvedValue(undefined);
    const openTelegramLink = vi.fn();
    (window as unknown as { Telegram: unknown }).Telegram = { WebApp: { openTelegramLink } };
    vi.stubGlobal("navigator", {
      ...global.navigator,
      share: shareSpy,
      clipboard: { writeText },
    });

    await renderPackActions({ unlocked: false });

    await openModalAndSend(user);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /link copied/i })).toBeInTheDocument(),
    );
    expect(writeText).toHaveBeenCalledWith(EXPECTED_PACK_LINK);
    expect(openTelegramLink).not.toHaveBeenCalled();

    delete (window as unknown as { Telegram?: unknown }).Telegram;
  });
});

describe("PackActions — Telegram picker fallback (share absent, inside Telegram)", () => {
  afterEach(() => {
    delete (window as unknown as { Telegram?: unknown }).Telegram;
  });

  it("opens the Telegram share picker with the encoded referral link", async () => {
    vi.stubGlobal("navigator", { ...global.navigator, share: undefined });
    const openTelegramLink = vi.fn();
    (window as unknown as { Telegram: unknown }).Telegram = { WebApp: { openTelegramLink } };

    const user = userEvent.setup();
    await renderPackActions({ unlocked: false });

    await openModalAndSend(user);
    await waitFor(() => expect(openTelegramLink).toHaveBeenCalled());

    const picker: string = openTelegramLink.mock.calls[0][0];
    expect(picker).toContain("https://t.me/share/url?url=");
    expect(picker).toContain(encodeURIComponent(EXPECTED_PACK_LINK));
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
