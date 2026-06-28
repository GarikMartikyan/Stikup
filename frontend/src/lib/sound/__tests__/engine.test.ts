import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { playSound } from "../engine";

describe("playSound", () => {
  let playSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on HTMLMediaElement.prototype.play before each test.
    playSpy = vi
      .spyOn(window.HTMLMediaElement.prototype, "play")
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls play() when a sound event is triggered", () => {
    playSound("success");
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it("does not throw when play() returns a rejected promise", () => {
    playSpy.mockRejectedValue(new Error("NotAllowedError"));
    expect(() => playSound("success")).not.toThrow();
  });

  it("does not throw for all audible events", () => {
    const events = ["success", "unlock", "error"] as const;
    for (const event of events) {
      expect(() => playSound(event)).not.toThrow();
    }
  });
});
