import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";

import { SoundProvider, useSound } from "../sound-provider";

// Mock the sound engine so audio/haptic calls don't escape in tests.
vi.mock("@/lib/sound", () => ({
  playSound: vi.fn(),
  triggerHaptic: vi.fn(),
  setSoundEnabled: vi.fn(),
}));

import { playSound, triggerHaptic } from "@/lib/sound";

const STORAGE_KEY = "stikup:sound";

// Minimal consumer that exposes sound context via data attributes.
function Consumer() {
  const { enabled, toggle, play } = useSound();
  return (
    <div>
      <span data-testid="state" data-enabled={String(enabled)} />
      <button data-testid="toggle" onClick={toggle} />
      <button data-testid="play" onClick={() => play("success")} />
    </div>
  );
}

describe("SoundProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("defaults to enabled=true when nothing is stored", () => {
    render(
      <SoundProvider>
        <Consumer />
      </SoundProvider>,
    );
    expect(screen.getByTestId("state").dataset.enabled).toBe("true");
  });

  it("reads 'off' from localStorage and starts disabled", () => {
    window.localStorage.setItem(STORAGE_KEY, "off");
    render(
      <SoundProvider>
        <Consumer />
      </SoundProvider>,
    );
    expect(screen.getByTestId("state").dataset.enabled).toBe("false");
  });

  it("reads 'on' from localStorage and starts enabled", () => {
    window.localStorage.setItem(STORAGE_KEY, "on");
    render(
      <SoundProvider>
        <Consumer />
      </SoundProvider>,
    );
    expect(screen.getByTestId("state").dataset.enabled).toBe("true");
  });

  it("toggle writes 'off' to localStorage and flips to disabled", () => {
    render(
      <SoundProvider>
        <Consumer />
      </SoundProvider>,
    );
    expect(screen.getByTestId("state").dataset.enabled).toBe("true");

    act(() => {
      screen.getByTestId("toggle").click();
    });

    expect(screen.getByTestId("state").dataset.enabled).toBe("false");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("off");
  });

  it("toggle back writes 'on' to localStorage", () => {
    window.localStorage.setItem(STORAGE_KEY, "off");
    render(
      <SoundProvider>
        <Consumer />
      </SoundProvider>,
    );

    act(() => {
      screen.getByTestId("toggle").click();
    });

    expect(screen.getByTestId("state").dataset.enabled).toBe("true");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("on");
  });

  it("play() calls playSound and triggerHaptic when enabled", () => {
    render(
      <SoundProvider>
        <Consumer />
      </SoundProvider>,
    );

    act(() => {
      screen.getByTestId("play").click();
    });

    expect(playSound).toHaveBeenCalledWith("success");
    expect(triggerHaptic).toHaveBeenCalledWith("success");
  });

  it("play() does NOT call playSound or triggerHaptic when disabled", () => {
    window.localStorage.setItem(STORAGE_KEY, "off");
    render(
      <SoundProvider>
        <Consumer />
      </SoundProvider>,
    );

    act(() => {
      screen.getByTestId("play").click();
    });

    expect(playSound).not.toHaveBeenCalled();
    expect(triggerHaptic).not.toHaveBeenCalled();
  });
});

describe("useSound fallback (no provider)", () => {
  it("returns a safe no-op fallback with enabled=true", () => {
    function Probe() {
      const { enabled } = useSound();
      return <span data-testid="fallback-state" data-enabled={String(enabled)} />;
    }
    render(<Probe />);
    expect(screen.getByTestId("fallback-state").dataset.enabled).toBe("true");
  });
});
