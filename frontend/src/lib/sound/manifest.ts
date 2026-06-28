/**
 * Events that play an audible sound (each also fires a haptic via `fireSound`).
 * `tap` is intentionally NOT here — the universal button press vibrates only,
 * it has no sound.
 */
export type AudioEvent = "success" | "unlock" | "error";

/**
 * Every event that can fire a haptic — the audible events plus `tap`, the
 * silent button-press buzz.
 */
export type HapticEvent = "tap" | AudioEvent;

export const SOUND_SRC: Record<AudioEvent, string> = {
  success: "/sounds/success.mp3",
  unlock: "/sounds/unlock.mp3",
  error: "/sounds/error.mp3",
};

/** Playback volume per audible event (0..1). */
export const SOUND_VOLUME: Record<AudioEvent, number> = {
  success: 0.6,
  unlock: 0.6,
  error: 0.5,
};

export type HapticSpec =
  | { kind: "impact"; style: "light" | "medium" | "heavy" | "rigid" | "soft" }
  | { kind: "notification"; type: "success" | "error" | "warning" }
  | { kind: "selection" };

export const SOUND_HAPTIC: Record<HapticEvent, HapticSpec> = {
  tap: { kind: "impact", style: "light" },
  success: { kind: "notification", type: "success" },
  unlock: { kind: "notification", type: "success" },
  error: { kind: "notification", type: "error" },
};
