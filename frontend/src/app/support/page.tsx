import Link from "next/link";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";

export const metadata = { title: "Support — Stikup" };

export default function SupportPage() {
  return (
    <div className="relative w-full overflow-x-hidden text-[var(--color-fg)]">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-16">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
          Help
        </span>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.02em]">
          Support
        </h1>
        <div className="mt-8 space-y-4 text-[var(--color-fg-muted)]">
          <p>
            A full help centre is being prepared. For now, the fastest way to
            get help is to email us directly.
          </p>
          <p>
            <a
              href="mailto:support@stikup.app"
              className="font-semibold text-[var(--color-fg)] hover:underline"
            >
              support@stikup.app
            </a>
          </p>
          <p>We aim to respond within one business day.</p>
        </div>
        <div className="mt-10">
          <Link
            href="/"
            className="text-sm font-semibold text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:underline"
          >
            Back to home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
