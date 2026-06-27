'use client';

import { Clapperboard, RefreshCw } from 'lucide-react';
import { useT } from '@/components/language-provider';

type NoGenerationsBannerProps = {
  watchingAd: boolean;
  adError: string | null;
  onWatchAd: () => void;
};

/**
 * Shown on the upload page when the user is out of generations. Offers a
 * rewarded ad that grants +1 generation (client-confirmed via POST
 * /api/ads/reward), then the upload auto-retries.
 */
export function NoGenerationsBanner({
  watchingAd,
  adError,
  onWatchAd,
}: NoGenerationsBannerProps) {
  const t = useT();
  return (
    <div className="mt-3 rounded-2xl border border-[var(--color-brand)]/40 bg-[var(--color-brand)]/10 p-4">
      <p className="text-sm font-semibold text-[var(--color-ink)]">
        {t('upload.error.no_generations')}
      </p>
      {adError && (
        <p className="mt-1 text-sm text-[var(--color-danger)]">{adError}</p>
      )}
      <button
        type="button"
        onClick={onWatchAd}
        disabled={watchingAd}
        className="shimmer group mt-3 inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-6 py-3 text-base font-bold text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-80"
      >
        {watchingAd ? (
          <RefreshCw className="h-5 w-5 animate-spin" />
        ) : (
          <Clapperboard className="h-5 w-5" />
        )}
        <span>{t('upload.actions.watch_ad')}</span>
      </button>
    </div>
  );
}
