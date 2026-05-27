"use client";

import { ArrowRight } from "lucide-react";
import type { ComponentType } from "react";

type ActionButtonProps = {
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: "brand" | "ghost";
  primary?: boolean;
  hint?: string;
  onClick?: () => void;
  disabled?: boolean;
};

export function ActionButton({
  title,
  subtitle,
  icon: Icon,
  tone,
  primary,
  hint,
  onClick,
  disabled,
}: ActionButtonProps) {
  if (tone === "brand") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="shimmer group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] p-5 text-left text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition hover:-translate-y-1 disabled:cursor-wait disabled:opacity-80"
      >
        {hint && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand)]">
            {hint}
          </span>
        )}
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div className="mt-4 font-[family-name:var(--font-display)] text-xl font-bold">
          {title}
        </div>
        <div className="mt-1 text-sm text-white/90">{subtitle}</div>
        {primary && (
          <ArrowRight className="absolute bottom-5 right-5 h-5 w-5 transition group-hover:translate-x-1" />
        )}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 text-left transition hover:-translate-y-1 hover:border-[var(--color-border-strong)] disabled:cursor-wait disabled:opacity-80"
    >
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--color-bg-sunk)] text-[var(--color-fg)]">
        <Icon className="h-5 w-5" strokeWidth={2.2} />
      </div>
      <div className="mt-4 font-[family-name:var(--font-display)] text-xl font-bold">
        {title}
      </div>
      <div className="mt-1 text-sm text-[var(--color-fg-muted)]">{subtitle}</div>
    </button>
  );
}
