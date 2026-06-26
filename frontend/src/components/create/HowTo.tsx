"use client";

import { ClipboardCopy, ExternalLink, Grid2X2, Upload } from "lucide-react";
import { useT } from "@/components/language-provider";

// TODO: Replace these icon mockups with real screenshots when available.
// Each step card has a fixed-height area above the text where you can drop
// a <Image src="/assets/how-to/step-N.webp" ... /> component.

const STEP_ICONS = [ClipboardCopy, ExternalLink, Grid2X2, Upload];

export function HowTo() {
  const t = useT();

  const steps = [
    {
      icon: STEP_ICONS[0],
      title: t("create.how_to.step1_title"),
      body: t("create.how_to.step1_body"),
    },
    {
      icon: STEP_ICONS[1],
      title: t("create.how_to.step2_title"),
      body: t("create.how_to.step2_body"),
    },
    {
      icon: STEP_ICONS[2],
      title: t("create.how_to.step3_title"),
      body: t("create.how_to.step3_body"),
    },
    {
      icon: STEP_ICONS[3],
      title: t("create.how_to.step4_title"),
      body: t("create.how_to.step4_body"),
    },
  ];

  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-6 shadow-[var(--shadow-card)]">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
        {t("create.how_to.title")}
      </h2>
      <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <li
              key={i}
              className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4"
            >
              {/* TODO: drop a <Image> screenshot here once available */}
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--color-brand)]/12 text-[var(--color-brand)]">
                <Icon className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div className="font-mono text-[10px] font-bold tracking-[0.2em] text-[var(--color-fg-subtle)]">
                0{i + 1}
              </div>
              <div className="font-semibold text-sm text-[var(--color-fg)]">
                {step.title}
              </div>
              <p className="text-xs text-[var(--color-fg-muted)] leading-relaxed">
                {step.body}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
