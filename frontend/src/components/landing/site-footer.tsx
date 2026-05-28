import Link from "next/link";
import { Brand } from "@/components/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)] py-10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 text-sm text-[var(--color-fg-muted)]">
        <Brand size="sm" />
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/privacy" className="hover:text-[var(--color-fg)]">Privacy</Link>
          <Link href="/terms" className="hover:text-[var(--color-fg)]">Terms</Link>
          <Link href="/support" className="hover:text-[var(--color-fg)]">Support</Link>
          <a href="mailto:support@stikup.app" className="hover:text-[var(--color-fg)]">
            support@stikup.app
          </a>
        </div>
        <div>© 2026 Stikup</div>
      </div>
    </footer>
  );
}
