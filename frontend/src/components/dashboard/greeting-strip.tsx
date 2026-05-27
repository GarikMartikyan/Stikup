import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

export function GreetingStrip({ shortId }: { shortId: string }) {
  return (
    <div className="reveal flex flex-wrap items-end justify-between gap-4">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-success)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
          Signed in
        </span>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.02em] md:text-5xl">
          Welcome back.
        </h1>
        <div className="mt-1 font-mono text-xs text-[var(--color-fg-subtle)]">
          user · {shortId}
        </div>
      </div>
      <Link
        href="/upload"
        className="shimmer group inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-10px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5"
      >
        <Plus className="h-4 w-4" />
        Make a new pack
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
