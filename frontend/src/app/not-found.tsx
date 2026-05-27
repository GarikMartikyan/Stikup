import Link from "next/link";

/**
 * 404 page. Server Component — no hooks, no client state.
 * Styling kept in sync with error.tsx for visual consistency.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center px-5 py-12">
      <div className="w-full rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-8 shadow-[var(--shadow-card)] md:p-10">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
          404
        </div>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-[-0.02em] md:text-4xl">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
          The page you’re looking for doesn’t exist or has moved.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-fg)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)] shadow-sm transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
