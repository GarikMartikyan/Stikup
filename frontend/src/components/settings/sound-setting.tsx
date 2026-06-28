"use client";

import { useEffect, useState } from "react";

import { useSound } from "@/components/sound-provider";
import { useT } from "@/components/language-provider";
// Direct engine import: used only when turning ON so we can give immediate
// audible+haptic confirmation before the provider state has updated.
import { playSound, triggerHaptic } from "@/lib/sound";

export function SoundSetting() {
  const { enabled, toggle } = useSound();
  const t = useT();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot post-hydration gate to avoid SSR/client localStorage mismatch
    setMounted(true);
  }, []);

  function handleClick() {
    const next = !enabled;
    toggle();
    // When turning ON, play feedback immediately using the engine directly
    // because the provider's `play` still reads the not-yet-updated `enabled`.
    if (next) {
      playSound("tap");
      triggerHaptic("tap");
    }
  }

  const isOn = mounted && enabled;

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium">
        {t("settings.sound.toggle_label")}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--color-fg-muted)]">
          {isOn ? t("settings.sound.on") : t("settings.sound.off")}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={mounted && enabled}
          aria-label={t("settings.sound.switch_aria")}
          suppressHydrationWarning
          onClick={handleClick}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-fg)] focus-visible:ring-offset-2 ${
            isOn
              ? "bg-[var(--color-fg)]"
              : "bg-[var(--color-border)] dark:bg-[var(--color-bg-sunk)]"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-[var(--color-bg)] shadow-lg ring-0 transition-transform ${
              isOn ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
