/**
 * Minimal, SSR-safe wrapper around the Adsgram Mini-App SDK.
 *
 * The SDK is loaded via a <Script> tag in layout.tsx and attaches itself to
 * `window.Adsgram`. This file only reads that global. `showInterstitial` is
 * best-effort: it always resolves to a tagged result and never rejects, and it
 * is bounded by a timeout so a hung ad can never block the caller.
 */
import { isTelegramEnv } from "@/lib/telegram/webapp";
import { adsgramBlockId, adsgramRewardBlockId } from "@/lib/config";

/** Outcome of an interstitial attempt. */
export type AdResult = "shown" | "skipped" | "error";

/**
 * Hard ceiling on how long we wait for the ad to finish. Interstitials run
 * ~15-30s; if `show()` never settles (backgrounded app, network drop, SDK bug)
 * we resolve to "error" so generation delivery is never blocked.
 */
const AD_TIMEOUT_MS = 60_000;

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
 * Best-effort: always resolves to a tagged result, never rejects, and is
 * bounded by AD_TIMEOUT_MS so a hung ad can never block the caller.
 *
 * - "skipped": outside Telegram, SDK not loaded, or no block id configured.
 * - "shown": the ad played and closed (for rewarded blocks, was watched).
 * - "error": the SDK rejected, or the ad failed to settle within AD_TIMEOUT_MS.
 */
async function runAd(blockId: string): Promise<AdResult> {
  if (!isTelegramEnv()) return "skipped";
  if (typeof window === "undefined") return "skipped";

  const sdk = window.Adsgram;
  if (!sdk || !blockId) return "skipped";

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const controller = sdk.init({ blockId });
    const shown = controller.show().then<AdResult>(() => "shown");
    const timedOut = new Promise<AdResult>((resolve) => {
      timer = setTimeout(() => resolve("error"), AD_TIMEOUT_MS);
    });
    return await Promise.race([shown, timedOut]);
  } catch {
    return "error";
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Show an interstitial ad (best-effort) during normal generation. */
export function showInterstitial(): Promise<AdResult> {
  return runAd(adsgramBlockId());
}

/**
 * Show a rewarded ad. "shown" means the user watched it and the caller may
 * grant the reward (the upload page calls POST /api/ads/reward on "shown").
 */
export function showRewarded(): Promise<AdResult> {
  return runAd(adsgramRewardBlockId());
}
