import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Lock } from "lucide-react";
import { StickerCard } from "@/components/sticker-card";
import { ALL_STICKERS } from "./data";

const PACK_BULLETS = [
  "12 expressive emotions, hand-curated",
  "Real Telegram sticker set you own",
  "Free 3 stickers — no payment required",
  "Pay once to unlock all 12, no subscription",
  "One regeneration included with every paid pack",
];

export function PackShowcase() {
  return (
    <section id="pack" className="snap-section relative flex min-h-dvh scroll-mt-16 flex-col justify-center bg-[var(--color-bg-sunk)] py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl px-5">
        <div className="grid items-center gap-14 md:grid-cols-[1fr_1.1fr]">
          <div className="reveal">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand-2)]">
              The pack
            </span>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.02em] md:text-6xl">
              Here&apos;s what you actually get.
            </h2>
            <p className="mt-5 max-w-md text-lg text-[var(--color-fg-muted)]">
              Every pack is 12 stickers, generated from one photo. You see all
              12 right away — 3 are free to take, 9 stay locked until you
              unlock the pack.
            </p>

            <ul className="mt-7 space-y-3">
              {PACK_BULLETS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-[var(--color-fg)]"
                >
                  <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)]">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/upload"
              className="mt-8 inline-flex items-center gap-2 text-base font-bold text-[var(--color-brand)] hover:opacity-80"
            >
              Try the free preview
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* The 12-grid mockup with 3 unlocked + 9 locked */}
          <div className="reveal" style={{ animationDelay: "120ms" }}>
            <div className="relative mx-auto max-w-md">
              <div
                className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-[var(--color-brand)]/35 via-[#ff5e72]/30 to-[var(--color-brand-2)]/35 opacity-50 blur-2xl"
                style={{ animation: "drift 12s ease-in-out infinite" }}
              />
              <div className="relative rounded-[2.25rem] border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 shadow-[var(--shadow-card)]">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 overflow-hidden rounded-full ring-2 ring-[var(--color-brand)]/30">
                      <Image
                        src="/assets/real_image.webp"
                        alt=""
                        width={60}
                        height={60}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-bold">Your pack · ready</div>
                      <div className="text-[10px] text-[var(--color-fg-subtle)]">
                        t.me/addstickers/stikup_you
                      </div>
                    </div>
                  </div>
                  <span className="rounded-full bg-[var(--color-fg)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-bg)]">
                    12/12
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2.5">
                  {ALL_STICKERS.map((s, i) => (
                    <StickerCard
                      key={i}
                      src={s.src}
                      alt={s.alt}
                      locked={i >= 3}
                      rotate={(i % 2 === 0 ? 1 : -1) * (i % 3)}
                      delay={i * 50}
                      popIn
                    />
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl border border-dashed border-[var(--color-border-strong)] p-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Lock className="h-3.5 w-3.5 text-[var(--color-fg-muted)]" />
                    <span className="text-[var(--color-fg-muted)]">9 stickers locked</span>
                  </div>
                  <Link
                    href="/upload"
                    className="rounded-full bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-2)] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm"
                  >
                    Unlock all 12
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
