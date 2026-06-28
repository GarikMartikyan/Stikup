import { SOUND_SRC, SOUND_VOLUME, type SoundEvent } from "./manifest";

/** Module-level enabled flag — synced from SoundProvider via setSoundEnabled. */
let soundEnabled = true;
export function setSoundEnabled(b: boolean): void { soundEnabled = b; }
export function isSoundEnabled(): boolean { return soundEnabled; }

/** Lazily-created base audio elements, keyed by sound event. */
const cache = new Map<SoundEvent, HTMLAudioElement>();

/**
 * Play a sound effect for the given event.
 * Plays a clone of the cached element so rapid overlapping calls (e.g. tap)
 * never cut each other off. Never throws — all errors are swallowed.
 */
export function playSound(event: SoundEvent): void {
  if (typeof window === "undefined") return;
  if (typeof Audio === "undefined") return;
  try {
    let base = cache.get(event);
    if (!base) {
      base = new Audio(SOUND_SRC[event]);
      base.preload = "auto";
      base.volume = SOUND_VOLUME[event];
      cache.set(event, base);
    }
    const node = base.cloneNode(true) as HTMLAudioElement;
    node.volume = SOUND_VOLUME[event];
    node.currentTime = 0;
    void node.play()?.catch(() => {});
  } catch {
    /* never throw */
  }
}
