"use client";

/**
 * Global error boundary — catches errors in the root layout itself.
 * This file MUST define its own <html> and <body> tags because it replaces
 * the root layout when active. It cannot use context-dependent components
 * (ThemeProvider, LanguageProvider, StoreProvider, AppHeader) because those
 * providers are part of the layout that failed.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/error#global-error
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          fontFamily: "system-ui, sans-serif",
          background: "#0a0a0a",
          color: "#ededed",
        }}
      >
        <main
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <div
            style={{
              maxWidth: "480px",
              width: "100%",
              borderRadius: "1.5rem",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              padding: "2rem",
            }}
          >
            <div
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              Error
            </div>
            <h1
              style={{
                marginTop: "0.75rem",
                fontSize: "1.75rem",
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                marginTop: "0.75rem",
                fontSize: "0.875rem",
                color: "rgba(255,255,255,0.55)",
              }}
            >
              An unexpected error occurred. You can try again — if the problem
              persists, please come back in a minute.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: "1.5rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                borderRadius: "9999px",
                background: "#ededed",
                color: "#0a0a0a",
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
