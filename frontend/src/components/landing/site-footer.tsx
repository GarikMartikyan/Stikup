"use client";

import Link from "next/link";
import { Brand } from "@/components/brand";
import { useT } from "@/components/language-provider";

export function SiteFooter() {
  const t = useT();
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)] py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 text-sm text-[var(--color-fg-muted)]">
        <Brand size="sm" />
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/privacy" className="hover:text-[var(--color-fg)]">{t("landing.footer.privacy")}</Link>
          <Link href="/terms" className="hover:text-[var(--color-fg)]">{t("landing.footer.terms")}</Link>
          <Link href="/support" className="hover:text-[var(--color-fg)]">{t("landing.footer.support")}</Link>
          <a href="mailto:support@stikup.app" className="hover:text-[var(--color-fg)]">
            support@stikup.app
          </a>
        </div>
        <div>{t("landing.footer.copyright")}</div>
      </div>
    </footer>
  );
}
