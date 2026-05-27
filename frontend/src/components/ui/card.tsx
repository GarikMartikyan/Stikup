import type { HTMLAttributes } from "react";

function cx(...parts: Array<string | undefined | false>): string {
  return parts.filter(Boolean).join(" ");
}

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] shadow-[var(--shadow-card)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "border-b border-[var(--color-border)] px-6 py-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("px-6 py-5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "border-t border-[var(--color-border)] px-6 py-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
