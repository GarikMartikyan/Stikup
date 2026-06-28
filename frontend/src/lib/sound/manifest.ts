export type SoundEvent = "tap" | "success" | "unlock" | "error";

export const SOUND_SRC: Record<SoundEvent, string> = {
  tap: "/sounds/tap.mp3",
  success: "/sounds/success.mp3",
  unlock: "/sounds/unlock.mp3",
  error: "/sounds/error.mp3",
};

/** Playback volume per event (0..1). Taps are frequent → quieter. */
export const SOUND_VOLUME: Record<SoundEvent, number> = {
  tap: 0.35,
  success: 0.6,
  unlock: 0.6,
  error: 0.5,
};

export type HapticSpec =
  | { kind: "impact"; style: "light" | "medium" | "heavy" | "rigid" | "soft" }
  | { kind: "notification"; type: "success" | "error" | "warning" }
  | { kind: "selection" };

export const SOUND_HAPTIC: Record<SoundEvent, HapticSpec> = {
  tap: { kind: "impact", style: "light" },
  success: { kind: "notification", type: "success" },
  unlock: { kind: "notification", type: "success" },
  error: { kind: "notification", type: "error" },
};
