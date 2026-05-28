"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { uploadCtaHref } from "@/lib/auth/cta-href";
import { useT } from "@/components/language-provider";

const PRICING_BULLET_KEYS = [
  "landing.pricing.bullets.b1",
  "landing.pricing.bullets.b2",
  "landing.pricing.bullets.b3",
  "landing.pricing.bullets.b4",
  "landing.pricing.bullets.b5",
  "landing.pricing.bullets.b6",
] as const;

export function Pricing({ loggedIn }: { loggedIn: boolean }) {
  const t = useT();
  return (
    <section id="pricing" className="snap-section relative flex min-h-dvh flex-col justify-center py-16 md:py-20">
      <div className="mx-auto w-full max-w-3xl px-5 text-center">
        <div className="reveal">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
            {t("landing.pricing.eyebrow")}
          </span>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.02em] md:text-6xl">
            {t("landing.pricing.title")}
            <br />
            <span className="text-[var(--color-fg-muted)]">{t("landing.pricing.title_suffix")}</span>
          </h2>
          <p className="mt-5 text-lg text-[var(--color-fg-muted)]">
            {t("landing.pricing.description")}
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
                  {t("landing.pricing.full_pack_badge")}
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-[family-name:var(--font-display)] text-6xl font-black tracking-[-0.04em] md:text-7xl">
                    $5.99
                  </span>
                  <span className="text-[var(--color-fg-muted)]">{t("landing.pricing.one_time")}</span>
                </div>
                <div className="mt-1 text-sm text-[var(--color-fg-subtle)]">
                  {t("landing.pricing.regional_pricing")}
                </div>
              </div>
              <Link
                href={uploadCtaHref(loggedIn)}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-fg)] px-6 py-3.5 text-base font-bold text-[var(--color-bg)] transition hover:opacity-90"
              >
                {loggedIn ? t("landing.pricing.cta_authenticated") : t("landing.pricing.cta_anonymous")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="my-7 hr-dotted" />

            <div className="grid gap-3 sm:grid-cols-2">
              {PRICING_BULLET_KEYS.map((key) => (
                <div
                  key={key}
                  className="flex items-center gap-2 text-[var(--color-fg)]"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)]">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="text-sm font-medium">{t(key)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-[var(--color-fg-subtle)]">
          {t("landing.pricing.payment_methods")}
        </p>
      </div>
    </section>
  );
}
