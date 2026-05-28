"use client";

import Link from "next/link";
import { SiteFooter } from "@/components/landing/site-footer";
import { useT } from "@/components/language-provider";

export function SupportContent() {
  const t = useT();
  return (
    <div className="relative flex flex-1 w-full flex-col overflow-x-hidden text-[var(--color-fg)]">
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
          {t("pages.support.eyebrow")}
        </span>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.02em]">
          {t("pages.support.title")}
        </h1>
        <div className="mt-8 space-y-4 text-[var(--color-fg-muted)]">
          <p>{t("pages.support.body_1")}</p>
          <p>
            <a
              href="mailto:support@stikup.app"
              className="font-semibold text-[var(--color-fg)] hover:underline"
            >
              support@stikup.app
            </a>
          </p>
          <p>{t("pages.support.body_3")}</p>
        </div>
        <div className="mt-10">
          <Link
            href="/"
            className="text-sm font-semibold text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:underline"
          >
            {t("pages.support.back_home")}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
