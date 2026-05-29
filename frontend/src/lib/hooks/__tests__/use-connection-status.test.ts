import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";

let mockMe: { channels: { channel: string }[] } | undefined;
vi.mock("@/lib/store/auth-api", () => ({
  useGetMeQuery: () => ({ data: mockMe }),
}));

import { useConnectionStatus } from "../use-connection-status";

function withChannels(...names: string[]) {
  return { channels: names.map((channel) => ({ channel })) };
}

describe("useConnectionStatus", () => {
  beforeEach(() => {
    mockMe = undefined;
  });

  it("treats both providers as unconnected while /auth/me is loading", () => {
    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current).toEqual({
      telegramConnected: false,
      googleConnected: false,
      hasUnconnected: true,
    });
  });

  it("reports both unconnected when there are no channels", () => {
    mockMe = withChannels();
    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current).toEqual({
      telegramConnected: false,
      googleConnected: false,
      hasUnconnected: true,
    });
  });

  it("flags unconnected when only Telegram is linked", () => {
    mockMe = withChannels("telegram");
    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current).toEqual({
      telegramConnected: true,
      googleConnected: false,
      hasUnconnected: true,
    });
  });

  it("flags unconnected when only Google is linked", () => {
    mockMe = withChannels("google");
    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current).toEqual({
      telegramConnected: false,
      googleConnected: true,
      hasUnconnected: true,
    });
  });

  it("clears the nudge once both providers are linked", () => {
    mockMe = withChannels("telegram", "google");
    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current).toEqual({
      telegramConnected: true,
      googleConnected: true,
      hasUnconnected: false,
    });
  });
});
