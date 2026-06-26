'use client';

import { Send } from 'lucide-react';
import { TELEGRAM_BOT_URL } from '@/lib/config';
import { useT } from '@/components/language-provider';

/**
 * Shown on the web (outside Telegram) when generation is gated. Funnels users
 * into the Telegram Mini App, where the interstitial ad runs.
 */
export function OpenInTelegram() {
  const t = useT();
  return (
    <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 text-center">
      <p className="text-sm font-medium text-[var(--color-fg-muted)]">
        {t('upload.telegram_gate.title')}
      </p>
      <a
        href={`${TELEGRAM_BOT_URL}?startapp`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-7 py-3.5 text-base font-bold text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5"
      >
        <Send className="h-5 w-5" /> {t('upload.telegram_gate.button')}
      </a>
    </div>
  );
}
