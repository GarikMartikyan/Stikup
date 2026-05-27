import { FAQS } from "./data";

export function Faq() {
  return (
    <section id="faq" className="snap-section relative flex min-h-dvh scroll-mt-16 flex-col justify-center bg-[var(--color-bg-sunk)] py-16 md:py-20">
      <div className="mx-auto w-full max-w-3xl px-5">
        <div className="reveal text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
            FAQ
          </span>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.02em] md:text-5xl">
            Questions, answered.
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {FAQS.map((f, i) => (
            <details
              key={f.q}
              className="reveal group rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 transition hover:border-[var(--color-border-strong)] open:border-[var(--color-brand)]/40 open:shadow-md"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-[var(--color-fg)]">
                {f.q}
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-bg-sunk)] text-[var(--color-fg-muted)] transition group-open:rotate-45 group-open:bg-[var(--color-brand)]/15 group-open:text-[var(--color-brand)]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 text-[var(--color-fg-muted)]">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
