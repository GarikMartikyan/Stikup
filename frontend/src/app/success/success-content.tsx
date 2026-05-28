"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  ExternalLink,
  Gift,
  Heart,
  Send,
  Share2,
  Sparkles,
} from "lucide-react";
import { StickerCard } from "@/components/sticker-card";
import { useT } from "@/components/language-provider";

const ALL_STICKERS = Array.from({ length: 12 }, (_, i) => ({
  src: `/assets/sticker_${i + 1}.webp`,
  alt: `Sticker ${i + 1}`,
}));

const TG_INSTALL = "https://t.me/addstickers/stikup_you_demo";

function NextCard({
  icon: Icon,
  title,
  body,
  cta,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-6 transition hover:-translate-y-1 hover:border-[var(--color-border-strong)]">
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[var(--color-brand)]/15 blur-2xl" />
      <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] text-white shadow-md">
        <Icon className="h-5 w-5" strokeWidth={2.2} />
      </div>
      <h3 className="relative mt-4 font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
        {title}
      </h3>
      <p className="relative mt-1.5 text-sm text-[var(--color-fg-muted)]">
        {body}
      </p>
      <button
        type="button"
        className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-brand)] hover:opacity-80"
      >
        {cta}
        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

export function SuccessContent() {
  const t = useT();

  return (
    <div className="relative flex flex-1 flex-col">
      {/* Celebratory backdrop */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[700px] bg-[radial-gradient(ellipse_55%_55%_at_50%_0%,rgba(16,185,129,0.18),transparent_70%),radial-gradient(ellipse_55%_55%_at_50%_15%,rgba(224,52,154,0.18),transparent_70%),radial-gradient(ellipse_55%_55%_at_50%_30%,rgba(255,180,34,0.12),transparent_70%)]" />

      <main className="snap-section relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-6 md:py-10">
        {/* Hero */}
        <div className="reveal mx-auto max-w-2xl text-center">
          <div className="relative mx-auto inline-grid h-16 w-16 place-items-center rounded-3xl bg-[var(--color-success)]/15">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-[var(--color-success)]/15 blur-2xl" />
            <Check className="h-8 w-8 text-[var(--color-success)]" strokeWidth={3} />
          </div>
          <span className="mt-4 inline-block text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-success)]">
            {t("success.payment_confirmed")}
          </span>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.025em] md:text-6xl">
            {t("success.title_prefix")}{" "}
            <span className="gradient-text bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] bg-clip-text text-transparent">
              {t("success.title_highlight")}
            </span>
            .
          </h1>
          <p className="mt-3 text-base text-[var(--color-fg-muted)] md:text-lg">
            {t("success.description")}
          </p>
        </div>

        {/* Big install CTA card */}
        <div
          className="reveal relative mx-auto mt-6 max-w-3xl md:mt-8"
          style={{ animationDelay: "120ms" }}
        >
          <div className="absolute -inset-2 rounded-[2.5rem] bg-gradient-to-br from-[var(--color-brand)]/40 via-[#ff5e72]/40 to-[var(--color-brand-2)]/40 opacity-60 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-6 shadow-[var(--shadow-card)] md:p-8">
            <div className="flex flex-wrap items-center gap-5">
              <Image
                src="/assets/sticker_1.webp"
                alt=""
                width={88}
                height={88}
                className="h-20 w-20 -rotate-6 rounded-2xl bg-[var(--color-bg-sunk)] object-contain p-1.5 shadow-md ring-1 ring-[var(--color-border)]"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
                  {t("success.your_pack")}
                </div>
                <div className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
                  stikup_you_demo
                </div>
                <div className="mt-1 truncate font-mono text-xs text-[var(--color-fg-muted)]">
                  {TG_INSTALL}
                </div>
              </div>
              <div className="flex w-full flex-wrap gap-2 md:w-auto md:flex-nowrap">
                <a
                  href={TG_INSTALL}
                  className="shimmer group inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-6 py-3.5 text-base font-bold text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5 md:w-auto"
                >
                  <Send className="h-5 w-5" />
                  {t("success.install_telegram")}
                  <ExternalLink className="h-4 w-4 transition group-hover:translate-x-1" />
                </a>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-4 py-3.5 text-sm font-bold text-[var(--color-fg)] hover:bg-[var(--color-bg-sunk)]"
                >
                  <Copy className="h-4 w-4" /> {t("success.copy_link")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stickers grid */}
        <section
          className="reveal mt-6 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4 shadow-[var(--shadow-card)] md:mt-8 md:p-6"
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
                {t("success.whole_pack_label")}
              </div>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight md:text-4xl">
                {t("success.stickers_heading")}
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-4 py-2 text-sm font-bold text-[var(--color-fg)] hover:bg-[var(--color-bg-sunk)]"
              >
                <Download className="h-4 w-4" /> {t("success.download_all")}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-4 py-2 text-sm font-bold text-[var(--color-fg)] hover:bg-[var(--color-bg-sunk)]"
              >
                <Share2 className="h-4 w-4" /> {t("success.share")}
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {ALL_STICKERS.map((s, i) => (
              <StickerCard
                key={i}
                src={s.src}
                alt={s.alt}
                rotate={(i % 2 === 0 ? 1 : -1) * (i % 3)}
                delay={i * 40}
                popIn
              />
            ))}
          </div>
        </section>

        {/* Next actions */}
        <section className="mt-6 grid gap-3 md:mt-8 md:grid-cols-3 md:gap-4">
          <NextCard
            icon={Share2}
            title={t("success.share_tiktok_title")}
            body={t("success.share_tiktok_body")}
            cta={t("success.share_tiktok_cta")}
          />
          <NextCard
            icon={Gift}
            title={t("success.invite_title")}
            body={t("success.invite_body")}
            cta={t("success.invite_cta")}
          />
          <NextCard
            icon={Sparkles}
            title={t("success.make_another_title")}
            body={t("success.make_another_body")}
            cta={t("success.make_another_cta")}
          />
        </section>

        {/* Soft footer band */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-[var(--color-border-strong)] p-4 text-sm text-[var(--color-fg-muted)] md:mt-8">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-[var(--color-brand)]" />
            <span>{t("success.thanks")}</span>
          </div>
          <Link
            href="/my-stickers"
            className="inline-flex items-center gap-1.5 font-bold text-[var(--color-fg)] hover:text-[var(--color-brand)]"
          >
            {t("success.go_to_stickers")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
