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
 * Deep link that carries a referral payload to the bot.
 *
 * Uses the classic `?start=` bot deep link (NOT `?startapp=`): tapping it opens
 * the bot chat and — once the friend presses START — sends `/start ref_<code>_<packId>`
 * to the bot server-side. The bot records a pending referral keyed by the
 * friend's Telegram id, then opens the Mini App; the referral is credited when
 * the friend registers. This works regardless of whether a Main Mini App is
 * configured in BotFather (a bare `?startapp=` link silently drops its param
 * unless a Main Mini App exists, which is why the referral was never credited).
 *
 * Payload after `ref_` is `<referralCode>_<packId>` (split on the first `_`
 * server-side — neither a base62 code nor a UUID contains `_`).
 */
export function telegramReferralHref(code: string, packId: string): string {
  return `${TELEGRAM_BOT_URL}?start=ref_${code}_${packId}`;
}
