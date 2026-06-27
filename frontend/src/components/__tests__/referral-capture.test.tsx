import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { ReferralCapture } from "../referral-capture";

// ─── helpers ─────────────────────────────────────────────────────────────────

function setSearchParams(search: string) {
  Object.defineProperty(window, "location", {
    value: { ...window.location, search },
    writable: true,
    configurable: true,
  });
}

function getCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}

function clearCookies() {
  for (const name of ["stikup_ref", "stikup_ref_pack"]) {
    document.cookie = `${name}=; max-age=0; path=/`;
  }
}

// ─── setup / teardown ────────────────────────────────────────────────────────

beforeEach(() => {
  clearCookies();
});

afterEach(() => {
  clearCookies();
  vi.restoreAllMocks();
});

// ─── tests ───────────────────────────────────────────────────────────────────

describe("ReferralCapture — ref cookie", () => {
  it("sets stikup_ref when ?ref= is present", () => {
    setSearchParams("?ref=ABCD1234");
    render(<ReferralCapture />);
    expect(getCookie("stikup_ref")).toBe("ABCD1234");
  });

  it("does not set stikup_ref when ref is absent", () => {
    setSearchParams("?foo=bar");
    render(<ReferralCapture />);
    expect(getCookie("stikup_ref")).toBeUndefined();
  });

  it("ignores a ref value that fails the safety regex", () => {
    setSearchParams("?ref=../../../etc/passwd");
    render(<ReferralCapture />);
    expect(getCookie("stikup_ref")).toBeUndefined();
  });
});

describe("ReferralCapture — pack cookie", () => {
  it("sets stikup_ref_pack when both ?ref= and ?pack= are present", () => {
    setSearchParams("?ref=CODE123&pack=550e8400-e29b-41d4-a716-446655440000");
    render(<ReferralCapture />);
    expect(getCookie("stikup_ref")).toBe("CODE123");
    expect(getCookie("stikup_ref_pack")).toBe(
      "550e8400-e29b-41d4-a716-446655440000",
    );
  });

  it("does NOT set stikup_ref_pack when only ?pack= is present (no ref)", () => {
    setSearchParams("?pack=550e8400-e29b-41d4-a716-446655440000");
    render(<ReferralCapture />);
    expect(getCookie("stikup_ref")).toBeUndefined();
    expect(getCookie("stikup_ref_pack")).toBeUndefined();
  });

  it("does NOT set stikup_ref_pack when pack fails the safety regex", () => {
    setSearchParams("?ref=VALIDCODE&pack=<script>alert(1)</script>");
    render(<ReferralCapture />);
    expect(getCookie("stikup_ref")).toBe("VALIDCODE");
    expect(getCookie("stikup_ref_pack")).toBeUndefined();
  });

  it("handles a pack id with hyphens (UUID format)", () => {
    setSearchParams("?ref=MYCODE&pack=a1b2c3d4-e5f6-7890-abcd-ef1234567890");
    render(<ReferralCapture />);
    expect(getCookie("stikup_ref_pack")).toBe(
      "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    );
  });
});
