import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";

import { SoundProvider } from "@/components/sound-provider";
import { LanguageProvider } from "@/components/language-provider";
import { SoundSetting } from "../sound-setting";

// Mock the sound engine so audio/haptic side-effects don't escape in tests.
vi.mock("@/lib/sound", () => ({
  playSound: vi.fn(),
  triggerHaptic: vi.fn(),
  setSoundEnabled: vi.fn(),
}));

function renderSetting(storageValue?: string) {
  if (storageValue !== undefined) {
    window.localStorage.setItem("stikup:sound", storageValue);
  }
  return render(
    <LanguageProvider>
      <SoundProvider>
        <SoundSetting />
      </SoundProvider>
    </LanguageProvider>,
  );
}

describe("SoundSetting", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("renders a role='switch' element", () => {
    renderSetting();
    expect(screen.getByRole("switch")).toBeTruthy();
  });

  it("aria-checked reflects the enabled state (default on)", async () => {
    renderSetting();
    // Wait a tick for the mounted effect to fire.
    await act(async () => {});
    const switchEl = screen.getByRole("switch");
    expect(switchEl.getAttribute("aria-checked")).toBe("true");
  });

  it("aria-checked is false when storage says 'off'", async () => {
    renderSetting("off");
    await act(async () => {});
    const switchEl = screen.getByRole("switch");
    expect(switchEl.getAttribute("aria-checked")).toBe("false");
  });

  it("clicking the switch flips aria-checked", async () => {
    renderSetting();
    await act(async () => {});
    const switchEl = screen.getByRole("switch");
    expect(switchEl.getAttribute("aria-checked")).toBe("true");

    act(() => {
      switchEl.click();
    });

    expect(switchEl.getAttribute("aria-checked")).toBe("false");
  });

  it("clicking twice returns to original state", async () => {
    renderSetting();
    await act(async () => {});
    const switchEl = screen.getByRole("switch");

    act(() => switchEl.click());
    expect(switchEl.getAttribute("aria-checked")).toBe("false");

    act(() => switchEl.click());
    expect(switchEl.getAttribute("aria-checked")).toBe("true");
  });
});
