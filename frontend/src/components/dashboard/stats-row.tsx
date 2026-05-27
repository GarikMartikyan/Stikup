function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 shadow-[var(--shadow-card)]">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
        {label}
      </div>
      <div className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight">
        {value}
      </div>
      <div className="mt-1 text-xs text-[var(--color-fg-muted)]">{hint}</div>
    </div>
  );
}

export function StatsRow({ packCount }: { packCount: number }) {
  return (
    <div className="reveal mt-8 grid gap-4 md:grid-cols-4" style={{ animationDelay: "120ms" }}>
      <Stat label="Packs" value={String(packCount)} hint="lifetime" />
      <Stat label="Stickers owned" value={String(packCount * 12)} hint="across all packs" />
      <Stat label="Regenerations" value="1 / pack" hint="paid-pack quota" />
      <Stat label="Subscription" value="None" hint="never — one-time only" />
    </div>
  );
}
