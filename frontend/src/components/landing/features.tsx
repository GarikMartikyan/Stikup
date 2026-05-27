import { FEATURES } from "./data";

export function Features() {
  return (
    <section className="snap-section relative flex min-h-dvh scroll-mt-16 flex-col justify-center py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl px-5">
        <div className="reveal max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Why Stikup
          </span>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.02em] md:text-6xl">
            Built for the chat,
            <br />
            <span className="text-[var(--color-fg-muted)]">not the gallery.</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="reveal group relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-7 transition hover:-translate-y-1 hover:border-[var(--color-border-strong)]"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] text-white shadow-md">
                <f.icon className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
