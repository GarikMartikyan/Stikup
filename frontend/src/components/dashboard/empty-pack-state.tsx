import Link from "next/link";
import { ArrowRight, ImageIcon } from "lucide-react";

export function EmptyPackState() {
  return (
    <section className="reveal mt-10 flex flex-col items-center gap-6 py-12 text-center">
      <div className="relative">
        <div className="absolute inset-0 -z-10 rounded-full bg-[var(--color-brand)]/15 blur-2xl" />
        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] text-white shadow-[var(--shadow-glow)]">
          <ImageIcon className="h-9 w-9" strokeWidth={1.8} />
        </div>
      </div>
      <div>
        <p className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight md:text-3xl">
          No sticker packs yet
        </p>
        <p className="mt-2 text-[var(--color-fg-muted)]">
          You haven&apos;t made a sticker pack yet. Drop a selfie to begin.
        </p>
      </div>
      <Link
        href="/upload"
        className="shimmer inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-7 py-3.5 text-base font-bold text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5"
      >
        Make your first pack
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
