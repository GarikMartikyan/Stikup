export type SupportedLang = 'en' | 'ru';

/**
 * Map a Telegram `language_code` (e.g. "ru", "en-US") onto one of our
 * supported translation locales. Anything we don't ship falls back to English.
 */
export function resolveLang(languageCode: string | undefined): SupportedLang {
  return languageCode?.toLowerCase().slice(0, 2) === 'ru' ? 'ru' : 'en';
}
