"use client";

import { useT } from "@/components/language-provider";

export function UploadIntro() {
  const t = useT();
  return (
    <div className="reveal max-w-xl">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
        {t("upload.intro.step")}
      </span>
      <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-[-0.02em] md:text-4xl">
        {t("upload.intro.title")}
      </h1>
      <p className="mt-2 text-base text-[var(--color-fg-muted)] md:text-lg">
        {t("upload.intro.description")}
      </p>
    </div>
  );
}
