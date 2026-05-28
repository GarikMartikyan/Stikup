"use client";

import { useT } from "@/components/language-provider";

const FAQ_KEYS = ["1", "2", "3", "4", "5"] as const;

export function Faq() {
  const t = useT();
  return (
    <section id="faq" className="snap-section relative flex min-h-dvh flex-col justify-center bg-[var(--color-bg-sunk)] py-16 md:py-20">
      <div className="mx-auto w-full max-w-3xl px-5">
        <div className="reveal text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
            {t("landing.faq.eyebrow")}
          </span>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.02em] md:text-5xl">
            {t("landing.faq.title")}
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {FAQ_KEYS.map((k, i) => (
            <details
              key={k}
              className="reveal group rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 transition hover:border-[var(--color-border-strong)] open:border-[var(--color-brand)]/40 open:shadow-md"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-[var(--color-fg)]">
                {t(`landing.faq.items.q${k}`)}
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-bg-sunk)] text-[var(--color-fg-muted)] transition group-open:rotate-45 group-open:bg-[var(--color-brand)]/15 group-open:text-[var(--color-brand)]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 text-[var(--color-fg-muted)]">{t(`landing.faq.items.a${k}`)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
