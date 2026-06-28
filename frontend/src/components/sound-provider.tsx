"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

import { playSound, triggerHaptic } from "@/lib/sound";
import type { SoundEvent } from "@/lib/sound";

type SoundContextValue = {
  enabled: boolean;
  setEnabled(b: boolean): void;
  toggle(): void;
  play(event: SoundEvent): void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

const STORAGE_KEY = "stikup:sound";

function readStored(): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "on") return true;
    if (v === "off") return false;
  } catch {
    /* ignore */
  }
  return null;
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState<boolean>(() => {
    // Server: default on. Client: read stored pref, defaulting to on.
    if (typeof window === "undefined") return true;
    return readStored() ?? true;
  });

  const setEnabled = useCallback((b: boolean) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, b ? "on" : "off");
    } catch {
      /* ignore */
    }
    setEnabledState(b);
  }, []);

  const toggle = useCallback(() => {
    setEnabled(!enabled);
  }, [enabled, setEnabled]);

  const play = useCallback(
    (event: SoundEvent) => {
      if (!enabled) return;
      playSound(event);
      triggerHaptic(event);
    },
    [enabled],
  );

  return (
    <SoundContext.Provider value={{ enabled, setEnabled, toggle, play }}>
      {children}
    </SoundContext.Provider>
  );
}

/** Safe no-op fallback when no SoundProvider is mounted (mirrors useTheme). */
const FALLBACK: SoundContextValue = {
  enabled: true,
  setEnabled() {},
  toggle() {},
  play() {},
};

export function useSound(): SoundContextValue {
  return useContext(SoundContext) ?? FALLBACK;
}
