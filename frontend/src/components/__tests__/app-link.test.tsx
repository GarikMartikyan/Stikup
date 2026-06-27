import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppLink } from "../app-link";

let mockIsTelegram = false;

vi.mock("@/components/telegram/telegram-provider", () => ({
  useTelegram: () => ({ isTelegram: mockIsTelegram }),
}));

beforeEach(() => {
  mockIsTelegram = false;
});

describe("AppLink", () => {
  it("opens the Telegram Mini App when running in a browser", () => {
    render(<AppLink href="/how-to">Make stickers</AppLink>);
    const link = screen.getByRole("link", { name: "Make stickers" });
    expect(link).toHaveAttribute("href", expect.stringContaining("t.me"));
    expect(link).toHaveAttribute("href", expect.stringContaining("?startapp"));
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("navigates in-app when running inside Telegram", () => {
    mockIsTelegram = true;
    render(<AppLink href="/how-to">Make stickers</AppLink>);
    const link = screen.getByRole("link", { name: "Make stickers" });
    expect(link).toHaveAttribute("href", "/how-to");
    expect(link).not.toHaveAttribute("target", "_blank");
  });
});
