"use client";

import { MessageCircle, Sparkles, Upload } from "lucide-react";
import { useT } from "@/components/language-provider";

const STEP_ICONS = [MessageCircle, Upload, Sparkles];
const STEP_EYEBROWS = ["01", "02", "03"];

export function HowItWorks() {
  const t = useT();

  const steps = [
    {
      icon: STEP_ICONS[0],
      eyebrow: STEP_EYEBROWS[0],
      title: t("landing.how_it_works.steps.step_01_title"),
      body: t("landing.how_it_works.steps.step_01_body"),
    },
    {
      icon: STEP_ICONS[1],
      eyebrow: STEP_EYEBROWS[1],
      title: t("landing.how_it_works.steps.step_02_title"),
      body: t("landing.how_it_works.steps.step_02_body"),
    },
    {
      icon: STEP_ICONS[2],
      eyebrow: STEP_EYEBROWS[2],
      title: t("landing.how_it_works.steps.step_03_title"),
      body: t("landing.how_it_works.steps.step_03_body"),
    },
  ];

  return (
    <section id="how" className="snap-section relative flex min-h-dvh flex-col justify-center py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl px-5">
        <div className="reveal max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
            {t("landing.how_it_works.eyebrow")}
          </span>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.02em] md:text-6xl">
            {t("landing.how_it_works.title")}
            <br />
            <span className="text-[var(--color-fg-muted)]">{t("landing.how_it_works.title_suffix")}</span>
          </h2>
          <p className="mt-5 max-w-lg text-lg text-[var(--color-fg-muted)]">
            {t("landing.how_it_works.description")}
          </p>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.eyebrow}
              className="reveal group relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-7 transition hover:-translate-y-2 hover:border-[var(--color-border-strong)]"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-[var(--color-brand)]/25 to-[var(--color-brand-2)]/20 opacity-70 blur-2xl transition group-hover:opacity-90" />
              <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] text-white shadow-lg">
                <step.icon className="h-7 w-7" strokeWidth={2} />
              </div>
              <div className="mt-6 font-mono text-xs font-bold tracking-[0.2em] text-[var(--color-fg-subtle)]">
                {t("landing.how_it_works.step_label")} {step.eyebrow}
              </div>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-3 text-[var(--color-fg-muted)]">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
