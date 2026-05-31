import { describe, it, expect, afterEach, vi } from "vitest";
import { getWebApp, isTelegramEnv } from "../webapp";

// We need to manipulate window.Telegram between tests.

describe("getWebApp", () => {
  afterEach(() => {
    // Clean up global state.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).Telegram;
    vi.restoreAllMocks();
  });

  it("returns undefined when window.Telegram is absent", () => {
    expect(getWebApp()).toBeUndefined();
  });

  it("returns undefined when window.Telegram.WebApp is absent", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Telegram = {};
    expect(getWebApp()).toBeUndefined();
  });

  it("returns the WebApp object when present", () => {
    const fakeWebApp = { initData: "test" };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Telegram = { WebApp: fakeWebApp };
    expect(getWebApp()).toBe(fakeWebApp);
  });
});

describe("isTelegramEnv", () => {
  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).Telegram;
    vi.restoreAllMocks();
  });

  it("returns false when window.Telegram is absent", () => {
    expect(isTelegramEnv()).toBe(false);
  });

  it("returns false when initData is an empty string", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Telegram = { WebApp: { initData: "" } };
    expect(isTelegramEnv()).toBe(false);
  });

  it("returns true when initData is a non-empty string", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Telegram = { WebApp: { initData: "query_id=abc&user=..." } };
    expect(isTelegramEnv()).toBe(true);
  });

  it("returns false when WebApp exists but initData is undefined", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Telegram = { WebApp: {} };
    expect(isTelegramEnv()).toBe(false);
  });
});
