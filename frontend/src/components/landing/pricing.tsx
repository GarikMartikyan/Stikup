"use client";

import Link from "next/link";
import { useT } from "@/components/language-provider";
import { uploadCtaHref } from "@/lib/auth/cta-href";

export function Pricing({ loggedIn }: { loggedIn: boolean }) {
  const t = useT();

  const steps = [
    t("landing.pricing.step_chatgpt"),
    t("landing.pricing.step_upload"),
    t("landing.pricing.step_free"),
    t("landing.pricing.step_refer"),
  ];

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
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-success)]/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-success)]">
                {t("landing.pricing.how_label")}
              </div>
            </div>

            <ol className="space-y-4">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--color-brand)]/15 text-xs font-bold text-[var(--color-brand)]">
                    {i + 1}
                  </span>
                  <span className="text-sm text-[var(--color-fg)]">{step}</span>
                </li>
              ))}
            </ol>

            <div className="my-7 hr-dotted" />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-[var(--color-fg-muted)]">
                {t("landing.pricing.referral_note")}
              </p>
              <Link
                href={uploadCtaHref(loggedIn)}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-6 py-3.5 text-base font-bold text-white transition hover:opacity-90"
              >
                {loggedIn ? t("landing.pricing.cta_authenticated") : t("landing.pricing.cta_anonymous")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
