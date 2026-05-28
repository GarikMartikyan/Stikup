"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { useTheme } from "@/components/theme-provider";
import { useT } from "@/components/language-provider";

export function ThemeSetting() {
  const { theme, setTheme } = useTheme();
  const t = useT();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot post-hydration gate to avoid SSR/client localStorage mismatch
    setMounted(true);
  }, []);

  const OPTIONS = [
    { value: "light" as const, labelKey: "settings.theme.light", icon: Sun },
    { value: "dark" as const, labelKey: "settings.theme.dark", icon: Moon },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={t("settings.theme.radio_label")}
      className="grid grid-cols-2 gap-2 sm:max-w-sm"
    >
      {OPTIONS.map(({ value, labelKey, icon: Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            suppressHydrationWarning
            className={`group flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
              active
                ? "border-[var(--color-fg)] bg-[var(--color-fg)] text-[var(--color-bg)]"
                : "border-[var(--color-border)] bg-[var(--color-bg-elev)] text-[var(--color-fg)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-sunk)]"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={2.25} />
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}
