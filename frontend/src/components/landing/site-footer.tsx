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
          <a href="https://t.me/garmartikyan" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-fg)]">{t("landing.footer.support")}</a>
        </div>
        <div>{t("landing.footer.copyright")}</div>
      </div>
    </footer>
  );
}
