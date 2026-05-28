import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

const PRICING_BULLETS = [
  "All 12 stickers (3 free + 9 unlocked)",
  "Real Telegram sticker set you own",
  "1 free regeneration of the pack",
  "PNG + WebP downloads",
  "Bot delivers it for you in seconds",
  "No watermark. No subscription. No catch.",
];

export function Pricing() {
  return (
    <section id="pricing" className="snap-section relative flex min-h-dvh scroll-mt-16 flex-col justify-center py-16 md:py-20">
      <div className="mx-auto w-full max-w-3xl px-5 text-center">
        <div className="reveal">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
            Pricing
          </span>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.02em] md:text-6xl">
            One pack. One price.
            <br />
            <span className="text-[var(--color-fg-muted)]">No subscription. Ever.</span>
          </h2>
          <p className="mt-5 text-lg text-[var(--color-fg-muted)]">
            Try the 3-sticker preview free. Pay once to unlock the full pack —
            keep it forever.
          </p>
        </div>

        <div className="reveal relative mt-12" style={{ animationDelay: "150ms" }}>
          <div
            className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-br from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] opacity-60 blur-xl"
            style={{
              backgroundSize: "300% 300%",
              animation: "gradient-shift 7s ease-in-out infinite",
            }}
          />
          <div className="relative overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-8 text-left shadow-[var(--shadow-card)] md:p-10">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand)]/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
                  Full pack of 12
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-[family-name:var(--font-display)] text-6xl font-black tracking-[-0.04em] md:text-7xl">
                    $5.99
                  </span>
                  <span className="text-[var(--color-fg-muted)]">one-time</span>
                </div>
                <div className="mt-1 text-sm text-[var(--color-fg-subtle)]">
                  Regional pricing — pay in your own currency.
                </div>
              </div>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-fg)] px-6 py-3.5 text-base font-bold text-[var(--color-bg)] transition hover:opacity-90"
              >
                Start free pack
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="my-7 hr-dotted" />

            <div className="grid gap-3 sm:grid-cols-2">
              {PRICING_BULLETS.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-[var(--color-fg)]"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)]">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-[var(--color-fg-subtle)]">
          Stripe · Apple Pay · Google Pay · CIS, EU, US currency support
        </p>
      </div>
    </section>
  );
}
