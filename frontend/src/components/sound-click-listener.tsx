"use client";

import { useEffect } from "react";

import { fireHaptic } from "@/lib/sound";

/**
 * Fires the universal "tap" haptic (a light vibration) on EVERY button press,
 * app-wide, so every `<button>` (and `role="button"`) shares one consistent
 * press feedback without each call site having to opt in. The tap is silent —
 * it vibrates only, no sound.
 *
 * Implemented as a single capture-phase listener on `document`: capture runs
 * before the target's own handlers, so the tap fires even when a handler calls
 * `stopPropagation()` in the bubble phase, and it automatically covers buttons
 * rendered later (modals, dynamic lists). The buzz is gated by the user's sound
 * preference inside `fireHaptic()`.
 *
 * Links (`<a>`) are intentionally NOT matched — navigation/text links stay
 * silent; only buttons tap.
 */
export function SoundClickListener() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Element | null;
      const el = target?.closest?.('button, [role="button"]');
      if (!el) return;
      // Let surfaces with their own audio (e.g. the tutorial video overlay) opt
      // out via `data-no-tap-sound`, so the tap buzz doesn't fire over playback.
      if (el.closest("[data-no-tap-sound]")) return;
      // Don't buzz a press that can't do anything.
      if (
        el.hasAttribute("disabled") ||
        el.getAttribute("aria-disabled") === "true"
      ) {
        return;
      }
      fireHaptic("tap");
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
