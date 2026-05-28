import Link from "next/link";

/**
 * 404 page. Server Component — no hooks, no client state.
 * Styling kept in sync with error.tsx for visual consistency.
 *
 * Note: Next.js prerendering of the special _not-found route does not run
 * through the root layout's client component tree. We therefore inline a
 * lightweight header here (brand wordmark only, no ThemeToggle) rather than
 * importing AppHeader, which pulls in ThemeToggle (a "use client" component
 * relying on a React context that is absent during static generation of this
 * special segment).
 */
export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-5">
          <Link
            href="/"
            aria-label="Stikup home"
            className="inline-flex items-baseline gap-0.5 font-[family-name:var(--font-display)] text-lg font-extrabold tracking-[-0.04em] text-[var(--color-fg)]"
          >
            <span>Stikup</span>
            <span aria-hidden className="text-[var(--color-brand)]">.</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-5 py-12">
        <div className="w-full rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-8 shadow-[var(--shadow-card)] md:p-10">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
            404
          </div>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-[-0.02em] md:text-4xl">
            Page not found
          </h1>
          <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
            The page you&apos;re looking for doesn&apos;t exist or has moved.
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
    </div>
  );
}
