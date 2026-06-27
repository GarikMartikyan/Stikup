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

/**
 * Deep link that opens the Mini App and carries a referral payload.
 * `start_param` arrives inside the signed `initData`, so the backend trusts it.
 * Format: `<referralCode>_<packId>` (split on the first `_` server-side).
 */
export function telegramReferralHref(code: string, packId: string): string {
  return `${TELEGRAM_BOT_URL}?startapp=${code}_${packId}`;
}
