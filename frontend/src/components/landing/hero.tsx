'use client';

import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';
import { HERO_STICKERS } from './data';
import { AppLink } from '@/components/app-link';
import { useT } from '@/components/language-provider';

export function Hero({ loggedIn }: { loggedIn: boolean }) {
  const t = useT();
  return (
    <section className="snap-section relative flex min-h-dvh scroll-mt-16 flex-col justify-center px-5 pt-20 pb-10 md:pt-0">
      <div className="mx-auto grid w-full max-w-6xl items-start gap-10 md:grid-cols-[1.05fr_1fr]">
        <div>
          <h1
            className="reveal font-[family-name:var(--font-display)] text-[3.25rem] font-extrabold leading-[1.02] tracking-[-0.03em] md:text-[5.5rem]"
            style={{ animationDelay: '100ms' }}
          >
            {t('landing.hero.title_prefix')}{' '}
            <span className="relative inline-block">
              <span className="gradient-text bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] bg-clip-text text-transparent">
                {t('landing.hero.title_highlight')}
              </span>
              <svg
                aria-hidden
                className="absolute -bottom-3 left-0 w-full"
                viewBox="0 0 200 12"
                fill="none"
              >
                <path
                  d="M2 9 C 60 -1, 140 -1, 198 9"
                  stroke="url(#u)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="u" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#e0349a" />
                    <stop offset="1" stopColor="#ffb422" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            ,
            <br className="hidden md:block" /> {t('landing.hero.title_suffix')}
          </h1>
          <div
            className="reveal mt-8 flex flex-wrap gap-3"
            style={{ animationDelay: '300ms' }}
          >
            <AppLink
              href="/how-to"
              className="shimmer group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-7 py-4 text-base font-bold text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5"
            >
              <Sparkles className="h-5 w-5" />
              <span>
                {loggedIn
                  ? t('landing.hero.cta_authenticated')
                  : t('landing.hero.cta_anonymous')}
              </span>
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </AppLink>
          </div>

          <p
            className="reveal mt-7 max-w-md text-lg text-[var(--color-fg-muted)]"
            style={{ animationDelay: '200ms' }}
          >
            {t('landing.hero.description')}
          </p>
        </div>

        {/* RIGHT: portrait + floating stickers */}
        <div className="relative mt-10 mx-auto h-[450px] w-full max-w-md md:h-130 md:max-w-lg">
          <div className="absolute inset-6 -z-10 rounded-[2.5rem] bg-[conic-gradient(from_180deg_at_50%_50%,rgba(224,52,154,0.35),rgba(255,180,34,0.35),rgba(30,200,255,0.3),rgba(224,52,154,0.35))] blur-3xl opacity-70" />

          <div
            className="reveal absolute left-1/2 top-1/2 h-[270px] w-[210px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-elev)] shadow-[var(--shadow-card)] md:h-80 md:w-62.5"
            style={{ animationDelay: '120ms' }}
          >
            <Image
              src="/assets/real_image.webp"
              alt={t('landing.hero.selfie_label')}
              width={420}
              height={540}
              priority
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-xl bg-[var(--color-fg)]/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-bg)] backdrop-blur">
              <span>{t('landing.hero.selfie_label')}</span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                {t('landing.hero.ready')}
              </span>
            </div>
          </div>

          {/* Floating sticker satellites */}
          {HERO_STICKERS.map(({ src, r, t: topPos, l, d }, i) => (
            <div
              key={i}
              className="absolute h-24 w-24 md:h-28 md:w-28"
              style={{
                top: topPos,
                left: l,
                animation: `pop-in 0.55s cubic-bezier(0.34,1.56,0.64,1) ${600 + d}ms both, float-soft 6s ease-in-out ${1 + d / 1000}s infinite`,
              }}
            >
              <div
                className="relative h-full w-full rounded-[28%] bg-[var(--color-bg-elev)] shadow-[var(--shadow-sticker)] ring-1 ring-[var(--color-border)]"
                style={{ transform: `rotate(${r}deg)` }}
              >
                <Image
                  src={src}
                  alt=""
                  width={160}
                  height={160}
                  className="h-full w-full object-contain p-1.5"
                />
              </div>
            </div>
          ))}

          <div
            className="absolute bottom-14 right-2 rotate-6 rounded-2xl bg-[var(--color-fg)] px-4 py-2 text-sm font-bold text-[var(--color-bg)] shadow-xl"
            style={{ animation: 'fade-up 0.6s ease-out 1.4s both' }}
          >
            {t('landing.hero.pack_count', { count: 12 })}
          </div>
        </div>
      </div>
    </section>
  );
}
