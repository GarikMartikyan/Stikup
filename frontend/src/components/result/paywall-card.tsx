import { ArrowRight, Check, ShieldCheck, Unlock } from "lucide-react";
import { PRICE_LABEL } from "./data";

const PAYWALL_BULLETS = [
  "All 12 stickers — locked ones reveal instantly",
  "Bot installs the Telegram pack for you",
  "1 free regeneration included",
  "Download as PNG / WebP",
];

export function PaywallCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-6 shadow-[var(--shadow-card)]">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[var(--color-brand)]/25 blur-2xl" />
      <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-[var(--color-brand-2)]/25 blur-2xl" />
      <div className="relative">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand)]/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
          Unlock the pack
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-display)] text-5xl font-black tracking-[-0.04em]">
            {PRICE_LABEL}
          </span>
          <span className="text-sm text-[var(--color-fg-muted)]">one-time</span>
        </div>

        <ul className="mt-5 space-y-2.5 text-sm">
          {PAYWALL_BULLETS.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]"
                strokeWidth={3}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="shimmer group mt-6 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-6 py-3.5 text-base font-bold text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5"
        >
          <Unlock className="h-5 w-5" />
          Unlock all 12 — {PRICE_LABEL}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </button>

        <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-[var(--color-fg-subtle)]">
          <ShieldCheck className="h-3 w-3" />
          Stripe · Apple Pay · Google Pay
        </div>
      </div>
    </div>
  );
}
