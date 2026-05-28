"use client";

import { useEffect, useState } from "react";

import { LANGUAGES, useLanguage, useT } from "@/components/language-provider";

export function LanguageSetting() {
  const { language, setLanguage } = useLanguage();
  const t = useT();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot post-hydration gate to avoid SSR/client localStorage mismatch
    setMounted(true);
  }, []);

  return (
    <div
      role="radiogroup"
      aria-label={t("settings.language.radio_label")}
      className="grid grid-cols-2 gap-2 sm:max-w-sm"
    >
      {LANGUAGES.map(({ value, label, native }) => {
        const active = mounted && language === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setLanguage(value)}
            suppressHydrationWarning
            className={`flex flex-col items-start gap-0.5 rounded-2xl border px-4 py-3 text-left transition ${
              active
                ? "border-[var(--color-fg)] bg-[var(--color-fg)] text-[var(--color-bg)]"
                : "border-[var(--color-border)] bg-[var(--color-bg-elev)] text-[var(--color-fg)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-sunk)]"
            }`}
          >
            <span className="text-sm font-semibold">{native}</span>
            <span
              className={`text-xs ${
                active
                  ? "text-[var(--color-bg)]/70"
                  : "text-[var(--color-fg-muted)]"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
