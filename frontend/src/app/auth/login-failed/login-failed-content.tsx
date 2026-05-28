"use client";

import Link from "next/link";
import { Brand } from "@/components/brand";
import { useT } from "@/components/language-provider";

export function LoginFailedContent() {
  const t = useT();
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <Brand size="sm" />
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-[var(--color-fg)]">
          {t("auth.login_failed.title")}
        </h1>
        <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
          {t("auth.login_failed.body")}
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-[var(--color-fg)] px-6 py-2.5 text-sm font-semibold text-[var(--color-bg)] transition hover:opacity-90"
        >
          {t("auth.login_failed.back_to_sign_in")}
        </Link>
      </div>
    </div>
  );
}
