"use client";

import { useEffect } from "react";

import { useT } from "@/components/language-provider";

/**
 * Route-segment error boundary. Must be "use client" per Next.js convention.
 * It renders inside the root layout, so the LanguageProvider is available;
 * useT() also falls back to English if the context is ever missing.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();

  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <main className="mx-auto flex flex-1 w-full max-w-2xl flex-col items-center justify-center px-5 py-12">
      <div className="w-full rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-8 shadow-[var(--shadow-card)] md:p-10">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
          {t("errors.error_boundary.eyebrow")}
        </div>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-[-0.02em] md:text-4xl">
          {t("errors.error_boundary.title")}
        </h1>
        <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
          {t("errors.error_boundary.body")}
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
            {t("errors.error_boundary.try_again")}
          </button>
        </div>
      </div>
    </main>
  );
}
