/**
 * Minimal, SSR-safe wrapper around the Adsgram Mini-App SDK.
 *
 * The SDK is loaded via a <Script> tag in layout.tsx and attaches itself to
 * `window.Adsgram`. This file only reads that global. `showInterstitial` is
 * best-effort: it always resolves to a tagged result and never rejects, so
 * callers can run it alongside real work without try/catch.
 */
import { isTelegramEnv } from '@/lib/telegram/webapp';
import { adsgramBlockId } from '@/lib/config';

/** Outcome of an interstitial attempt. */
export type AdResult = 'shown' | 'skipped' | 'error';

interface AdController {
  show(): Promise<unknown>;
}

interface AdsgramSDK {
  init(params: { blockId: string }): AdController;
}

declare global {
  interface Window {
    Adsgram?: AdsgramSDK;
  }
}

/**
 * Show an Adsgram interstitial.
 *
 * - "skipped": outside Telegram, SDK not loaded, or no block id configured.
 * - "shown": the ad played and closed.
 * - "error": the SDK rejected (no fill, network, closed early, etc.).
 */
export async function showInterstitial(): Promise<AdResult> {
  if (!isTelegramEnv()) return 'skipped';
  if (typeof window === 'undefined') return 'skipped';

  const sdk = window.Adsgram;
  const blockId = adsgramBlockId();
  if (!sdk || !blockId) return 'skipped';

  try {
    const controller = sdk.init({ blockId });
    await controller.show();
    return 'shown';
  } catch {
    return 'error';
  }
}
