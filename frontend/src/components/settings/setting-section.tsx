import type { ComponentType, ReactNode } from "react";

export function SettingSection({
  id,
  icon: Icon,
  title,
  description,
  children,
  danger,
}: {
  id?: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 shadow-[var(--shadow-card)] md:p-6"
    >
      <header className="flex items-start gap-4">
        <div
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
            danger
              ? "bg-[var(--color-danger)]/15 text-[var(--color-danger)]"
              : "bg-[var(--color-bg-sunk)] text-[var(--color-fg)]"
          }`}
        >
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            {description}
          </p>
        </div>
      </header>
      <div className="mt-5">{children}</div>
    </section>
  );
}
