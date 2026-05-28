"use client";

import Image from "next/image";
import { useT } from "@/components/language-provider";

export function ResultHeader() {
  const t = useT();
  return (
    <div className="reveal flex flex-wrap items-center gap-4">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-2 ring-[var(--color-brand)]/30">
        <Image
          src="/assets/real_image.webp"
          alt={t("result.header.selfie_alt")}
          width={120}
          height={120}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/30" />
      </div>
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
          {t("result.header.eyebrow")}
        </div>
        <h1 className="mt-0.5 font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-[-0.02em] md:text-4xl">
          {t("result.header.title")}
        </h1>
        <p className="mt-0.5 text-sm text-[var(--color-fg-muted)] md:text-base">
          {t("result.header.description")}
        </p>
      </div>
    </div>
  );
}
