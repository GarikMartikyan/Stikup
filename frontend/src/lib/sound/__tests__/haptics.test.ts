import { describe, it, expect, afterEach, vi } from "vitest";
import { triggerHaptic } from "../haptics";

describe("triggerHaptic", () => {
  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).Telegram;
    vi.restoreAllMocks();
  });

  it("calls impactOccurred('light') for 'tap'", () => {
    const impactOccurred = vi.fn();
    const notificationOccurred = vi.fn();
    const selectionChanged = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Telegram = {
      WebApp: { HapticFeedback: { impactOccurred, notificationOccurred, selectionChanged } },
    };

    triggerHaptic("tap");

    expect(impactOccurred).toHaveBeenCalledWith("light");
    expect(notificationOccurred).not.toHaveBeenCalled();
  });

  it("calls notificationOccurred('success') for 'success'", () => {
    const impactOccurred = vi.fn();
    const notificationOccurred = vi.fn();
    const selectionChanged = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Telegram = {
      WebApp: { HapticFeedback: { impactOccurred, notificationOccurred, selectionChanged } },
    };

    triggerHaptic("success");

    expect(notificationOccurred).toHaveBeenCalledWith("success");
    expect(impactOccurred).not.toHaveBeenCalled();
  });

  it("calls notificationOccurred('success') for 'unlock'", () => {
    const notificationOccurred = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Telegram = {
      WebApp: { HapticFeedback: { impactOccurred: vi.fn(), notificationOccurred, selectionChanged: vi.fn() } },
    };

    triggerHaptic("unlock");

    expect(notificationOccurred).toHaveBeenCalledWith("success");
  });

  it("calls notificationOccurred('error') for 'error'", () => {
    const notificationOccurred = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Telegram = {
      WebApp: { HapticFeedback: { impactOccurred: vi.fn(), notificationOccurred, selectionChanged: vi.fn() } },
    };

    triggerHaptic("error");

    expect(notificationOccurred).toHaveBeenCalledWith("error");
  });

  it("does not throw when HapticFeedback is undefined", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Telegram = { WebApp: {} };
    expect(() => triggerHaptic("tap")).not.toThrow();
  });

  it("does not throw when window.Telegram is absent", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).Telegram;
    expect(() => triggerHaptic("success")).not.toThrow();
  });
});
