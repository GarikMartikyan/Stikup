import { TELEGRAM_BOT_URL } from "@/lib/config";

/**
 * Deep link that opens the Stikup Telegram Mini App from a normal browser.
 * `?startapp` tells Telegram to launch the Mini App (not just the bot chat).
 *
 * The app is Telegram-only: in a browser every primary action funnels here.
 */
export function telegramAppHref(): string {
  return `${TELEGRAM_BOT_URL}?startapp`;
}
