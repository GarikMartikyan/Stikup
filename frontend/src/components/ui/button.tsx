import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]";

function variantClasses(variant: Variant): string {
  switch (variant) {
    case "primary":
      return "bg-[var(--color-fg)] text-[var(--color-bg)] shadow-sm hover:opacity-90";
    case "secondary":
      return "border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] text-[var(--color-fg)] hover:-translate-y-0.5";
    case "ghost":
      return "bg-transparent text-[var(--color-fg)] hover:bg-[var(--color-bg-sunk)]";
  }
}

function sizeClasses(size: Size): string {
  switch (size) {
    case "sm":
      return "px-3 py-1.5 text-xs";
    case "md":
      return "px-4 py-2 text-sm";
    case "lg":
      return "px-7 py-4 text-base";
  }
}

function cx(...parts: Array<string | undefined | false>): string {
  return parts.filter(Boolean).join(" ");
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    className,
    disabled,
    type = "button",
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      className={cx(BASE, variantClasses(variant), sizeClasses(size), className)}
      {...props}
    >
      {children}
    </button>
  );
});
