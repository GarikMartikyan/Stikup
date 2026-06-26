"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { useT } from "@/components/language-provider";

const STEPS = [
  { key: "step_01", num: "01" },
  { key: "step_02", num: "02" },
  { key: "step_03", num: "03" },
  { key: "step_04", num: "04" },
] as const;

export default function HowToPage() {
  const t = useT();
  const router = useRouter();

  return (
    <div className="relative flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-10 md:py-16">
        {/* Header */}
        <div className="reveal text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand)]/30 bg-[var(--color-brand)]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
            <Sparkles className="h-3 w-3" />
            {t("landing.how_it_works.eyebrow")}
          </div>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-[-0.02em] md:text-4xl">
            {t("landing.how_it_works.title")}{" "}
            <span className="text-[var(--color-fg-muted)] font-normal">
              {t("landing.how_it_works.title_suffix")}
            </span>
          </h1>
          <p className="mt-3 text-base text-[var(--color-fg-muted)] md:text-lg">
            {t("landing.how_it_works.description")}
          </p>
        </div>

        {/* Steps */}
        <ol className="mt-10 flex flex-col gap-4">
          {STEPS.map(({ key, num }, i) => (
            <li
              key={key}
              className="reveal flex gap-5 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-6 shadow-[var(--shadow-card)]"
              style={{ animationDelay: `${(i + 1) * 60}ms` }}
            >
              <div className="shrink-0 grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] text-white text-xs font-extrabold">
                {num}
              </div>
              <div>
                <div className="font-semibold text-[var(--color-fg)]">
                  {t(`landing.how_it_works.steps.${key}_title`)}
                </div>
                <p className="mt-1 text-sm text-[var(--color-fg-muted)] leading-relaxed">
                  {t(`landing.how_it_works.steps.${key}_body`)}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {/* CTA */}
        <div className="reveal mt-10 flex justify-center" style={{ animationDelay: "300ms" }}>
          <button
            type="button"
            onClick={() => router.push("/my-stickers")}
            className="shimmer inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-8 py-4 text-base font-bold text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5 active:translate-y-0"
          >
            {t("how_to.got_it")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </main>
    </div>
  );
}
