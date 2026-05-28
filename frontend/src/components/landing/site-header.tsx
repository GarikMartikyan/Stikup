import Link from "next/link";
import { Send } from "lucide-react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)]/60 bg-[var(--color-bg)]/75 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Brand />
        <div className="hidden items-center gap-7 text-sm font-medium text-[var(--color-fg-muted)] md:flex">
          <a href="#how" className="hover:text-[var(--color-fg)] transition">How it works</a>
          <a href="#pack" className="hover:text-[var(--color-fg)] transition">The pack</a>
          <a href="#pricing" className="hover:text-[var(--color-fg)] transition">Pricing</a>
          <a href="#faq" className="hover:text-[var(--color-fg)] transition">FAQ</a>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--color-fg-muted)] transition hover:text-[var(--color-fg)]"
          >
            Log in
          </Link>
          <Link
            href="/upload"
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-fg)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)] shadow-sm transition hover:opacity-90"
          >
            Open in Telegram
            <Send className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
