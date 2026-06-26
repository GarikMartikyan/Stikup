/**
 * Minimal, SSR-safe wrapper around the Adsgram Mini-App SDK.
 *
 * The SDK is loaded via a <Script> tag in layout.tsx and attaches itself to
 * `window.Adsgram`. This file only reads that global. `showInterstitial` is
 * best-effort: it always resolves to a tagged result and never rejects, and it
 * is bounded by a timeout so a hung ad can never block the caller.
 */
import { isTelegramEnv } from "@/lib/telegram/webapp";
import { adsgramBlockId } from "@/lib/config";

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
 * Show an Adsgram interstitial.
 *
 * - "skipped": outside Telegram, SDK not loaded, or no block id configured.
 * - "shown": the ad played and closed.
 * - "error": the SDK rejected, or the ad failed to settle within AD_TIMEOUT_MS.
 */
export async function showInterstitial(): Promise<AdResult> {
  if (!isTelegramEnv()) return "skipped";
  if (typeof window === "undefined") return "skipped";

  const sdk = window.Adsgram;
  const blockId = adsgramBlockId();
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
