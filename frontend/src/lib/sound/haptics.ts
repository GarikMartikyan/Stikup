import { getWebApp } from "@/lib/telegram/webapp";
import { SOUND_HAPTIC, type HapticEvent } from "./manifest";

/**
 * Fire the Telegram HapticFeedback call corresponding to the given event.
 * No-ops silently when HapticFeedback is unavailable (outside Telegram or old
 * client). Never throws.
 */
export function triggerHaptic(event: HapticEvent): void {
  try {
    const hf = getWebApp()?.HapticFeedback;
    const spec = SOUND_HAPTIC[event];
    if (spec.kind === "impact") {
      hf?.impactOccurred(spec.style);
    } else if (spec.kind === "notification") {
      hf?.notificationOccurred(spec.type);
    } else {
      hf?.selectionChanged();
    }
  } catch {
    /* never throw */
  }
}
