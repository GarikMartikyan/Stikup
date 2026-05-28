"use client";

import { useEffect } from "react";

/**
 * Root error boundary. Must be "use client" per Next.js convention.
 * Strings are hardcoded in English — the LanguageProvider context may be
 * unavailable when this renders as the global error fallback.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <main className="mx-auto flex flex-1 w-full max-w-2xl flex-col items-center justify-center px-5 py-12">
      <div className="w-full rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-8 shadow-[var(--shadow-card)] md:p-10">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
          Error
        </div>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-[-0.02em] md:text-4xl">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
          We hit an unexpected hiccup while rendering this page. You can try
          again — if it keeps happening, please come back in a minute.
        </p>

        {isDev && error.message ? (
          <pre className="mt-5 max-h-48 overflow-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-sunk)] p-3 font-mono text-xs text-[var(--color-fg-muted)]">
            {error.message}
            {error.digest ? `\n\ndigest: ${error.digest}` : ""}
          </pre>
        ) : null}

        <div className="mt-6">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-fg)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)] shadow-sm transition hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}
