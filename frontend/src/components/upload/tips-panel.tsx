import { Camera, Sun, UserRound } from "lucide-react";

const TIPS = [
  { icon: UserRound, text: "One face, facing the camera" },
  { icon: Sun, text: "Even, natural light" },
  { icon: Camera, text: "Phone-camera resolution or higher" },
];

export function TipsPanel() {
  return (
    <aside className="reveal space-y-4" style={{ animationDelay: "150ms" }}>
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-6 shadow-[var(--shadow-card)]">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
          For best likeness
        </div>
        <ul className="mt-4 space-y-3 text-sm">
          {TIPS.map((tip) => (
            <li key={tip.text} className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--color-brand)]/12 text-[var(--color-brand)]">
                <tip.icon className="h-4 w-4" strokeWidth={2.2} />
              </span>
              <span className="text-[var(--color-fg)]">{tip.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-brand)]/10 via-[var(--color-bg-elev)] to-[var(--color-brand-2)]/10 p-6">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
          Free preview
        </div>
        <div className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
          3 stickers free.<br />Unlock 9 more for $5.99.
        </div>
        <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
          Your full pack of 12 generates upfront. After you see it, you
          decide whether to take the 3 free, unlock all 12, or
          regenerate.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-[var(--color-fg-subtle)]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
          You have 1 free generation available
        </div>
      </div>

      <div className="rounded-3xl border border-dashed border-[var(--color-border-strong)] p-5 text-xs text-[var(--color-fg-muted)]">
        We never share or sell your photo. It&apos;s stored only while
        your account exists and removed instantly when you delete it.
      </div>
    </aside>
  );
}
