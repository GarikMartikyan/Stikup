"use client";

import Link from "next/link";
import { ArrowRight, Download, Heart, Send, Sparkles, Zap } from "lucide-react";
import { uploadCtaHref } from "@/lib/auth/cta-href";
import { useT } from "@/components/language-provider";

export function FinalCta({ loggedIn }: { loggedIn: boolean }) {
  const t = useT();
  return (
    <section className="snap-section relative flex min-h-dvh scroll-mt-16 flex-col justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)]"
        style={{
          backgroundSize: "200% 200%",
          animation: "gradient-shift 9s ease-in-out infinite",
        }}
      />
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
      <div className="reveal relative mx-auto max-w-3xl px-5 py-20 text-center text-white">
        <h2 className="font-[family-name:var(--font-display)] text-5xl font-extrabold tracking-[-0.02em] md:text-7xl">
          {t("landing.final_cta.title_line1")}
          <br /> {t("landing.final_cta.title_line2")}
          <br /> {t("landing.final_cta.title_line3")}
        </h2>
        <p className="mt-6 text-lg text-white/90">
          {t("landing.final_cta.description")}
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={uploadCtaHref(loggedIn)}
            className="shimmer group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-7 py-4 text-base font-bold text-[#1a1410] shadow-2xl transition hover:scale-105"
          >
            <Sparkles className="h-5 w-5" />
            {loggedIn ? t("landing.final_cta.cta_authenticated") : t("landing.final_cta.cta_anonymous")}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
          <a
            href="https://t.me/stikup_bot"
            className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 bg-white/10 px-7 py-4 text-base font-bold text-white backdrop-blur transition hover:bg-white/20"
          >
            <Send className="h-5 w-5" />
            {t("landing.final_cta.open_bot")}
          </a>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm text-white/80">
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-4 w-4" /> {t("landing.final_cta.ready")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Heart className="h-4 w-4" /> {t("landing.final_cta.age_gdpr")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Download className="h-4 w-4" /> {t("landing.final_cta.download")}
          </span>
        </div>
      </div>
    </section>
  );
}
