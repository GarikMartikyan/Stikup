import Link from 'next/link';

const SIZES = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
} as const;

export function Brand({ size = 'md' }: { size?: keyof typeof SIZES }) {
  return (
    <Link
      href="/"
      aria-label="Stikup home"
      className={`group inline-flex items-baseline gap-0.5 font-[family-name:var(--font-display)] font-extrabold tracking-[-0.04em] text-[var(--color-fg)] ${SIZES[size]}`}
    >
      <span>Stikup</span>
      <span
        aria-hidden
        className="text-[var(--color-brand)] transition-transform group-hover:scale-125"
      >
        .
      </span>
    </Link>
  );
}
