import Link from "next/link";
import { ArrowRight, Download, Heart, Send, Sparkles, Zap } from "lucide-react";

export function FinalCta() {
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
          Your face.
          <br /> Your pack.
          <br /> Three minutes.
        </h2>
        <p className="mt-6 text-lg text-white/90">
          One selfie. We do the rest. Sticker pack waiting in your Telegram.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/upload"
            className="shimmer group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-7 py-4 text-base font-bold text-[var(--color-fg)] shadow-2xl transition hover:scale-105"
          >
            <Sparkles className="h-5 w-5" />
            Try the free preview
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
          <a
            href="https://t.me/stikup_bot"
            className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 bg-white/10 px-7 py-4 text-base font-bold text-white backdrop-blur transition hover:bg-white/20"
          >
            <Send className="h-5 w-5" />
            Open Telegram bot
          </a>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm text-white/80">
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-4 w-4" /> Ready in 3 minutes
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Heart className="h-4 w-4" /> 13+ only · GDPR ready
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Download className="h-4 w-4" /> Download PNG / WebP
          </span>
        </div>
      </div>
    </section>
  );
}
