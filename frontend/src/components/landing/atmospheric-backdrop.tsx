export function AtmosphericBackdrop() {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1100px] bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(224,52,154,0.18),transparent_70%),radial-gradient(ellipse_55%_55%_at_80%_15%,rgba(255,180,34,0.18),transparent_70%),radial-gradient(ellipse_50%_50%_at_15%_20%,rgba(30,200,255,0.12),transparent_70%)]" />
      <div
        className="pointer-events-none absolute -top-32 -left-24 -z-10 h-[480px] w-[480px] rounded-full bg-[var(--color-brand)]/25 blur-3xl"
        style={{ animation: "drift 14s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute -top-20 right-0 -z-10 h-[440px] w-[440px] rounded-full bg-[var(--color-brand-2)]/25 blur-3xl"
        style={{ animation: "drift 18s ease-in-out infinite reverse" }}
      />
    </>
  );
}
