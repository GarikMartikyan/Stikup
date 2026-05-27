/**
 * Global loading UI shown via React Suspense while route segments stream.
 *
 * Server Component by default. Next.js automatically skips this for very fast
 * transitions, so it should be safe to render unconditionally here.
 */
export default function Loading() {
  return (
    <main
      className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center px-5 py-12"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--color-bg-elev)] shadow-[var(--shadow-card)]" />
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
          Loading
        </div>
      </div>
    </main>
  );
}
