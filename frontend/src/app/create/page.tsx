"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { StylePicker } from "@/components/create/StylePicker";
import { PromptBox } from "@/components/create/PromptBox";
import { HowTo } from "@/components/create/HowTo";
import {
  buildPrompt,
  STICKER_STYLES,
  type StyleId,
} from "@/lib/sticker-styles";
import { useT } from "@/components/language-provider";

export default function CreatePage() {
  const t = useT();
  const [selectedStyle, setSelectedStyle] = useState<StyleId>(
    STICKER_STYLES[0].id,
  );
  const prompt = buildPrompt(selectedStyle);

  return (
    <div className="relative flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-6 md:py-10">
        {/* Header */}
        <div className="reveal max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
            {t("create.eyebrow")}
          </span>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-[-0.02em] md:text-4xl">
            {t("create.title")}
          </h1>
          <p className="mt-2 text-base text-[var(--color-fg-muted)] md:text-lg">
            {t("create.description")}
          </p>
        </div>

        {/* Style picker */}
        <div className="reveal mt-8" style={{ animationDelay: "80ms" }}>
          <StylePicker selected={selectedStyle} onSelect={setSelectedStyle} />
        </div>

        {/* Prompt box */}
        <div className="reveal mt-6" style={{ animationDelay: "150ms" }}>
          <PromptBox prompt={prompt} />
        </div>

        {/* ChatGPT link + Continue */}
        <div
          className="reveal mt-5 flex flex-wrap items-center gap-3"
          style={{ animationDelay: "200ms" }}
        >
          <a
            href="https://chatgpt.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-5 py-3 text-sm font-semibold text-[var(--color-fg)] transition hover:-translate-y-0.5 hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
          >
            <ExternalLink className="h-4 w-4" strokeWidth={2.2} />
            {t("create.open_chatgpt")}
          </a>
          <Link
            href={`/upload?style=${encodeURIComponent(selectedStyle)}`}
            className="shimmer group inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-6 py-3 text-sm font-bold text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5"
          >
            {t("create.continue")}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
        </div>

        {/* How-to walkthrough */}
        <div className="reveal mt-8" style={{ animationDelay: "250ms" }}>
          <HowTo />
        </div>
      </main>
    </div>
  );
}
