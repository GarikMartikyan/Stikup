import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { BrowserGuard } from "../browser-guard";

const mockReplace = vi.fn();
let mockPathname = "/";
let mockIsTelegram = false;
let mockResolved = true;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockPathname,
}));

vi.mock("@/components/telegram/telegram-provider", () => ({
  useTelegram: () => ({
    isTelegram: mockIsTelegram,
    telegramResolved: mockResolved,
  }),
}));

beforeEach(() => {
  mockReplace.mockClear();
  mockPathname = "/";
  mockIsTelegram = false;
  mockResolved = true;
});

describe("BrowserGuard", () => {
  it("bounces non-home routes back to / in a browser", () => {
    mockPathname = "/settings";
    render(<BrowserGuard />);
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("leaves the home route alone in a browser", () => {
    mockPathname = "/";
    render(<BrowserGuard />);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("never redirects inside the Telegram Mini App", () => {
    mockIsTelegram = true;
    mockPathname = "/settings";
    render(<BrowserGuard />);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("waits for SDK detection to resolve before redirecting", () => {
    mockResolved = false;
    mockPathname = "/settings";
    render(<BrowserGuard />);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
