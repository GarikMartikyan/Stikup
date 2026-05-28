"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import enMessages from "@/i18n/messages/en.json";
import ruMessages from "@/i18n/messages/ru.json";

export type Language = "en" | "ru";

export const LANGUAGES: { value: Language; label: string; native: string }[] = [
  { value: "en", label: "English", native: "English" },
  { value: "ru", label: "Russian", native: "Русский" },
];

type Messages = typeof enMessages;
// Ensure ru.json is always structurally compatible with en.json at the top level.
const _ruCheck: Messages = ruMessages;
void _ruCheck;

const MESSAGES: Record<Language, Messages> = {
  en: enMessages,
  ru: ruMessages,
};

function resolvePath(obj: unknown, parts: string[]): string | undefined {
  let cur = obj;
  for (const part of parts) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] !== undefined ? String(vars[key]) : `{${key}}`,
  );
}

type TFunction = (key: string, vars?: Record<string, string | number>) => string;

type LanguageContextValue = {
  language: Language;
  setLanguage: (l: Language) => void;
  t: TFunction;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "stikup:lang";

function readStoredLanguage(): Language | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "en" || v === "ru") return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Always start with "en" so SSR output matches the client's first paint,
  // then upgrade from localStorage after hydration.
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = readStoredLanguage();
    if (stored && stored !== language) {
      // Intentional post-mount sync: SSR renders "en" so server/client first
      // paint match, then we upgrade to the stored preference after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguageState(stored);
    }
    // Run once on mount to pick up the user's stored preference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", language);
    }
  }, [language]);

  const setLanguage = useCallback((l: Language) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    setLanguageState(l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const parts = key.split(".");
      const value =
        resolvePath(MESSAGES[language], parts) ??
        resolvePath(MESSAGES["en"], parts) ??
        key;
      return interpolate(value, vars);
    },
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

function fallbackT(key: string, vars?: Record<string, string | number>): string {
  const parts = key.split(".");
  const value = resolvePath(MESSAGES["en"], parts) ?? key;
  return interpolate(value, vars);
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return { language: "en", setLanguage: () => {}, t: fallbackT };
  }
  return ctx;
}

export function useT(): TFunction {
  return useLanguage().t;
}
