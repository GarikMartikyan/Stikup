import Link from "next/link";
import { Brand } from "@/components/brand";

export default function LoginFailedPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <Brand size="sm" />
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-[var(--color-fg)]">
          Sign-in failed
        </h1>
        <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
          We couldn&apos;t complete the sign-in. This can happen if you denied
          access or the link expired.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-[var(--color-fg)] px-6 py-2.5 text-sm font-semibold text-[var(--color-bg)] transition hover:opacity-90"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
