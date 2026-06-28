export type { SoundEvent } from "./manifest";
export { SOUND_SRC } from "./manifest";
export { playSound, setSoundEnabled, isSoundEnabled } from "./engine";
export { triggerHaptic } from "./haptics";

import { playSound, isSoundEnabled } from "./engine";
import { triggerHaptic } from "./haptics";
import type { SoundEvent } from "./manifest";

/** Fire a sound + its haptic, respecting the user's enabled preference.
 *  Safe to call from anywhere (handlers, effects, timeouts) — no React context needed. */
export function fireSound(event: SoundEvent): void {
  if (!isSoundEnabled()) return;
  playSound(event);
  triggerHaptic(event);
}
