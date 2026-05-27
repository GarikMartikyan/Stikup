import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { ALL_STICKERS, HERO_STICKERS } from "./data";

export function Hero() {
  return (
    <section className="snap-section relative flex min-h-dvh scroll-mt-16 flex-col justify-center px-5 pt-20 pb-10 md:pt-14">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-[1.05fr_1fr]">
        <div>
          <span
            className="reveal inline-flex items-center gap-2 rounded-full border border-[var(--color-brand)]/25 bg-[var(--color-brand)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-brand)]"
            style={{ animationDelay: "0ms" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)] animate-pulse" />
            New · 12 stickers in a minute
          </span>

          <h1
            className="reveal mt-5 font-[family-name:var(--font-display)] text-[3.25rem] font-extrabold leading-[1.02] tracking-[-0.03em] md:text-[5.5rem]"
            style={{ animationDelay: "100ms" }}
          >
            A sticker pack of{" "}
            <span className="relative inline-block">
              <span className="gradient-text bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] bg-clip-text text-transparent">
                YOU
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
            <br className="hidden md:block" /> in your Telegram.
          </h1>

          <p
            className="reveal mt-7 max-w-md text-lg text-[var(--color-fg-muted)]"
            style={{ animationDelay: "200ms" }}
          >
            One selfie. Twelve cartoon stickers. Yours forever — installed
            straight into Telegram by our bot. No artists. No prompts.
          </p>

          <div
            className="reveal mt-8 flex flex-wrap gap-3"
            style={{ animationDelay: "300ms" }}
          >
            <Link
              href="/upload"
              className="shimmer group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-7 py-4 text-base font-bold text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5"
            >
              <Sparkles className="h-5 w-5" />
              <span>Make my stickers</span>
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-7 py-4 text-base font-semibold text-[var(--color-fg)] transition hover:-translate-y-0.5"
            >
              See how it works
            </a>
          </div>

          <div
            className="reveal mt-10 flex items-center gap-5 text-sm text-[var(--color-fg-muted)]"
            style={{ animationDelay: "400ms" }}
          >
            <div className="flex -space-x-2">
              {ALL_STICKERS.slice(0, 4).map((s, i) => (
                <div
                  key={i}
                  className="h-9 w-9 overflow-hidden rounded-full border-2 border-[var(--color-bg)] bg-[var(--color-bg-elev)]"
                >
                  <Image
                    src={s.src}
                    alt=""
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1 text-[var(--color-brand-2)]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <span className="text-xs">Loved by early testers</span>
            </div>
          </div>
        </div>

        {/* RIGHT: portrait + floating stickers */}
        <div className="relative mx-auto h-[450px] w-full max-w-md md:h-[480px]">
          <div className="absolute inset-6 -z-10 rounded-[2.5rem] bg-[conic-gradient(from_180deg_at_50%_50%,rgba(224,52,154,0.35),rgba(255,180,34,0.35),rgba(30,200,255,0.3),rgba(224,52,154,0.35))] blur-3xl opacity-70" />

          <div
            className="reveal absolute left-1/2 top-1/2 h-[270px] w-[210px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-elev)] shadow-[var(--shadow-card)]"
            style={{ animationDelay: "120ms" }}
          >
            <Image
              src="/assets/real_image.webp"
              alt="Your selfie"
              width={420}
              height={540}
              priority
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-xl bg-[var(--color-fg)]/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-bg)] backdrop-blur">
              <span>Your selfie</span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                ready
              </span>
            </div>
          </div>

          {/* Floating sticker satellites */}
          {HERO_STICKERS.map(({ idx, r, t, l, d }) => (
            <div
              key={idx}
              className="absolute h-24 w-24 md:h-28 md:w-28"
              style={{
                top: t,
                left: l,
                animation: `pop-in 0.55s cubic-bezier(0.34,1.56,0.64,1) ${600 + d}ms both, float-soft 6s ease-in-out ${1 + d / 1000}s infinite`,
              }}
            >
              <div
                className="relative h-full w-full rounded-[28%] bg-[var(--color-bg-elev)] shadow-[var(--shadow-sticker)] ring-1 ring-[var(--color-border)]"
                style={{ transform: `rotate(${r}deg)` }}
              >
                <Image
                  src={ALL_STICKERS[idx].src}
                  alt=""
                  width={160}
                  height={160}
                  className="h-full w-full object-contain p-1.5"
                />
              </div>
            </div>
          ))}

          <div
            className="absolute -bottom-6 right-2 rotate-6 rounded-2xl bg-[var(--color-fg)] px-4 py-2 text-sm font-bold text-[var(--color-bg)] shadow-xl"
            style={{ animation: "fade-up 0.6s ease-out 1.4s both" }}
          >
            12 stickers · WebP · 512px
          </div>
        </div>
      </div>
    </section>
  );
}
