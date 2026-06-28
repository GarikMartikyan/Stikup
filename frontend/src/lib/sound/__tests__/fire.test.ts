import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the engine and haptics modules before importing the barrel.
vi.mock("../engine", async (importOriginal) => {
  const original = await importOriginal<typeof import("../engine")>();
  return {
    ...original,
    playSound: vi.fn(),
  };
});

vi.mock("../haptics", async (importOriginal) => {
  const original = await importOriginal<typeof import("../haptics")>();
  return {
    ...original,
    triggerHaptic: vi.fn(),
  };
});

import { fireSound, fireHaptic, setSoundEnabled } from "../index";
import { playSound } from "../engine";
import { triggerHaptic } from "../haptics";

describe("fireSound", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to enabled before each test.
    setSoundEnabled(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setSoundEnabled(true);
  });

  it("calls playSound and triggerHaptic when sound is enabled", () => {
    setSoundEnabled(true);
    fireSound("success");
    expect(playSound).toHaveBeenCalledTimes(1);
    expect(playSound).toHaveBeenCalledWith("success");
    expect(triggerHaptic).toHaveBeenCalledTimes(1);
    expect(triggerHaptic).toHaveBeenCalledWith("success");
  });

  it("calls neither playSound nor triggerHaptic when sound is disabled", () => {
    setSoundEnabled(false);
    fireSound("success");
    expect(playSound).not.toHaveBeenCalled();
    expect(triggerHaptic).not.toHaveBeenCalled();
  });

  it("works for all audible events when enabled", () => {
    setSoundEnabled(true);
    const events = ["success", "unlock", "error"] as const;
    for (const event of events) {
      vi.clearAllMocks();
      fireSound(event);
      expect(playSound).toHaveBeenCalledWith(event);
      expect(triggerHaptic).toHaveBeenCalledWith(event);
    }
  });

  it("blocks all events when disabled", () => {
    setSoundEnabled(false);
    const events = ["success", "unlock", "error"] as const;
    for (const event of events) {
      fireSound(event);
    }
    expect(playSound).not.toHaveBeenCalled();
    expect(triggerHaptic).not.toHaveBeenCalled();
  });
});

describe("fireHaptic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setSoundEnabled(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setSoundEnabled(true);
  });

  it("triggers the haptic but never plays a sound (tap is silent)", () => {
    setSoundEnabled(true);
    fireHaptic("tap");
    expect(triggerHaptic).toHaveBeenCalledTimes(1);
    expect(triggerHaptic).toHaveBeenCalledWith("tap");
    expect(playSound).not.toHaveBeenCalled();
  });

  it("does not fire the haptic when sound is disabled", () => {
    setSoundEnabled(false);
    fireHaptic("tap");
    expect(triggerHaptic).not.toHaveBeenCalled();
    expect(playSound).not.toHaveBeenCalled();
  });
});
