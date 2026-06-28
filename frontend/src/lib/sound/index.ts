export type { AudioEvent, HapticEvent } from "./manifest";
export { SOUND_SRC } from "./manifest";
export { playSound, setSoundEnabled, isSoundEnabled } from "./engine";
export { triggerHaptic } from "./haptics";

import { playSound, isSoundEnabled } from "./engine";
import { triggerHaptic } from "./haptics";
import type { AudioEvent, HapticEvent } from "./manifest";

/** Fire a sound + its haptic, respecting the user's enabled preference.
 *  Safe to call from anywhere (handlers, effects, timeouts) — no React context needed. */
export function fireSound(event: AudioEvent): void {
  if (!isSoundEnabled()) return;
  playSound(event);
  triggerHaptic(event);
}

/** Fire only an event's haptic — no audio. Used for the universal button tap,
 *  which vibrates but is silent. Respects the user's enabled preference. */
export function fireHaptic(event: HapticEvent): void {
  if (!isSoundEnabled()) return;
  triggerHaptic(event);
}
