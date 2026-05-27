import { STEPS } from "./data";

export function HowItWorks() {
  return (
    <section id="how" className="snap-section relative flex min-h-dvh scroll-mt-16 flex-col justify-center py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl px-5">
        <div className="reveal max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
            How it works
          </span>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.02em] md:text-6xl">
            Three steps.
            <br />
            <span className="text-[var(--color-fg-muted)]">No prompts to write.</span>
          </h2>
          <p className="mt-5 max-w-lg text-lg text-[var(--color-fg-muted)]">
            The whole flow is built for one-handed mobile use — because
            that&apos;s where Telegram lives.
          </p>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="reveal group relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-7 transition hover:-translate-y-2 hover:border-[var(--color-border-strong)]"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-[var(--color-brand)]/25 to-[var(--color-brand-2)]/20 opacity-70 blur-2xl transition group-hover:opacity-90" />
              <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] text-white shadow-lg">
                <step.icon className="h-7 w-7" strokeWidth={2} />
              </div>
              <div className="mt-6 font-mono text-xs font-bold tracking-[0.2em] text-[var(--color-fg-subtle)]">
                STEP {step.eyebrow}
              </div>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-3 text-[var(--color-fg-muted)]">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
