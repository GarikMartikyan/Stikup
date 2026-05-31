/**
 * Minimal typed wrapper around the Telegram Web App JavaScript SDK.
 *
 * The SDK is loaded via a <Script> tag in layout.tsx and attaches itself to
 * `window.Telegram.WebApp`. This file only reads that global — it never
 * imports anything from npm. All functions are SSR-safe (guarded with
 * `typeof window`).
 */

export interface TgUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export interface TgThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
}

export interface TgBackButton {
  isVisible: boolean;
  show(): void;
  hide(): void;
  onClick(fn: () => void): void;
  offClick(fn: () => void): void;
}

export interface TelegramWebApp {
  /** Raw initData string for server-side validation. */
  initData: string;
  /** Parsed initData as an object. */
  initDataUnsafe: {
    user?: TgUser;
    auth_date?: number;
    hash?: string;
    [key: string]: unknown;
  };
  colorScheme: "light" | "dark";
  themeParams: TgThemeParams;
  BackButton: TgBackButton;
  /** Tell Telegram the Mini App is ready to be shown. */
  ready(): void;
  /** Expand the Mini App to full height. */
  expand(): void;
  /** Set the header color (hex string or "bg_color" | "secondary_bg_color"). */
  setHeaderColor(color: string): void;
  /** Set the background color (hex string or "bg_color" | "secondary_bg_color"). */
  setBackgroundColor(color: string): void;
  onEvent(eventType: string, callback: () => void): void;
  offEvent(eventType: string, callback: () => void): void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

/**
 * Returns the Telegram WebApp instance when running inside a Telegram client,
 * or `undefined` on the server and in a normal browser.
 */
export function getWebApp(): TelegramWebApp | undefined {
  if (typeof window === "undefined") return undefined;
  return window.Telegram?.WebApp;
}

/**
 * Returns `true` when the app is opened inside Telegram (initData is present
 * and non-empty). Safe to call during SSR — always returns `false` there.
 */
export function isTelegramEnv(): boolean {
  const app = getWebApp();
  return typeof app?.initData === "string" && app.initData.length > 0;
}
