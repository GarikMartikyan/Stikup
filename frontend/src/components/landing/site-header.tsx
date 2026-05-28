"use client";

import Link from "next/link";
import { Menu, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#pack", label: "The pack" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  // Close sheet on route changes (hash navigation)
  useEffect(() => {
    function handleHashChange() {
      setOpen(false);
    }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)]/60 bg-[var(--color-bg)]/75 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Brand />

        {/* Desktop nav links */}
        <div className="hidden items-center gap-7 text-sm font-medium text-[var(--color-fg-muted)] md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <a key={href} href={href} className="transition hover:text-[var(--color-fg)]">
              {label}
            </a>
          ))}
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
            Get started
            <Send className="h-3.5 w-3.5" />
          </Link>
          {/* Hamburger — mobile only */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elev)] text-[var(--color-fg-muted)] transition hover:text-[var(--color-fg)] md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile slide-down sheet */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-16 z-40 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Sheet */}
          <div className="absolute inset-x-0 top-full z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)] px-5 py-4 md:hidden">
            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-3 text-base font-semibold text-[var(--color-fg-muted)] transition hover:bg-[var(--color-bg-elev)] hover:text-[var(--color-fg)]"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </header>
  );
}
