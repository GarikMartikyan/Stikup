import Link from "next/link";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";

export const metadata = { title: "Privacy Policy — Stikup" };

export default function PrivacyPage() {
  return (
    <div className="relative w-full overflow-x-hidden text-[var(--color-fg)]">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-16">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
          Legal
        </span>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.02em]">
          Privacy Policy
        </h1>
        <div className="mt-8 space-y-4 text-[var(--color-fg-muted)]">
          <p>
            This page is being prepared. We take your privacy seriously and are
            working on a full policy document.
          </p>
          <p>
            In the meantime, if you have any questions about how we handle your
            data, please reach out at{" "}
            <a
              href="mailto:support@stikup.app"
              className="text-[var(--color-fg)] hover:underline"
            >
              support@stikup.app
            </a>
            .
          </p>
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
