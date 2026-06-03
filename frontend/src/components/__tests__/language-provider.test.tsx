import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";

import {
  LanguageProvider,
  normalizeLanguage,
  useLanguage,
} from "../language-provider";

const STORAGE_KEY = "stikup:lang";

// ---------------------------------------------------------------------------
// normalizeLanguage — pure mapping
// ---------------------------------------------------------------------------

describe("normalizeLanguage", () => {
  it("maps exact supported codes", () => {
    expect(normalizeLanguage("en")).toBe("en");
    expect(normalizeLanguage("ru")).toBe("ru");
  });

  it("uses only the primary subtag and is case-insensitive", () => {
    expect(normalizeLanguage("ru-RU")).toBe("ru");
    expect(normalizeLanguage("EN-us")).toBe("en");
    expect(normalizeLanguage("RU")).toBe("ru");
  });

  it("returns null for unsupported languages", () => {
    expect(normalizeLanguage("fr")).toBeNull();
    expect(normalizeLanguage("uk")).toBeNull();
    expect(normalizeLanguage("de-DE")).toBeNull();
  });

  it("returns null for empty / missing input", () => {
    expect(normalizeLanguage("")).toBeNull();
    expect(normalizeLanguage(null)).toBeNull();
    expect(normalizeLanguage(undefined)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// adoptTelegramLanguage — first-open behaviour
// ---------------------------------------------------------------------------

// Exposes the active language and lets the test trigger adoption with a given
// Telegram language_code.
function Harness({ code }: { code: string | null | undefined }) {
  const { language, adoptTelegramLanguage } = useLanguage();
  return (
    <button
      data-testid="probe"
      data-language={language}
      onClick={() => adoptTelegramLanguage(code)}
    >
      adopt
    </button>
  );
}

function renderHarness(code: string | null | undefined) {
  render(
    <LanguageProvider>
      <Harness code={code} />
    </LanguageProvider>,
  );
  return screen.getByTestId("probe");
}

describe("adoptTelegramLanguage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("adopts a supported Telegram language on first open and persists it", () => {
    const probe = renderHarness("ru-RU");
    expect(probe.dataset.language).toBe("en"); // default first paint

    act(() => probe.click());

    expect(probe.dataset.language).toBe("ru");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("ru");
  });

  it("keeps English (default) and does not persist for an unsupported language", () => {
    const probe = renderHarness("fr");

    act(() => probe.click());

    expect(probe.dataset.language).toBe("en");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("never overrides an existing stored preference", () => {
    window.localStorage.setItem(STORAGE_KEY, "en");
    const probe = renderHarness("ru");

    act(() => probe.click());

    // Manual "en" choice wins over the Russian Telegram language.
    expect(probe.dataset.language).toBe("en");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("en");
  });

  it("no-ops when no language_code is provided", () => {
    const probe = renderHarness(undefined);

    act(() => probe.click());

    expect(probe.dataset.language).toBe("en");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
