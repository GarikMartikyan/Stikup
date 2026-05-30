"use client";

import Link from "next/link";
import { SiteFooter } from "@/components/landing/site-footer";
import { useT } from "@/components/language-provider";

const SUPPORT_EMAIL = "garmailtest@gmail.com";

const SECTIONS = [
  "collect",
  "use",
  "ai",
  "third_party",
  "retention",
  "rights",
] as const;

export function PrivacyContent() {
  const t = useT();
  return (
    <div className="relative flex flex-1 w-full flex-col overflow-x-hidden text-[var(--color-fg)]">
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
          {t("pages.privacy.eyebrow")}
        </span>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.02em]">
          {t("pages.privacy.title")}
        </h1>
        <p className="mt-3 text-sm text-[var(--color-fg-subtle)]">
          {t("pages.privacy.last_updated")}
        </p>

        <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4 text-sm text-[var(--color-fg-muted)]">
          {t("pages.privacy.disclaimer")}
        </div>

        <p className="mt-8 text-[var(--color-fg-muted)]">
          {t("pages.privacy.intro")}
        </p>

        <div className="mt-8 space-y-8">
          {SECTIONS.map((id) => (
            <section key={id}>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
                {t(`pages.privacy.${id}_title`)}
              </h2>
              <p className="mt-2 text-[var(--color-fg-muted)]">
                {t(`pages.privacy.${id}_body`)}
              </p>
            </section>
          ))}

          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
              {t("pages.privacy.contact_title")}
            </h2>
            <p className="mt-2 text-[var(--color-fg-muted)]">
              {t("pages.privacy.contact_body")}{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-semibold text-[var(--color-fg)] hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-10">
          <Link
            href="/"
            className="text-sm font-semibold text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:underline"
          >
            {t("pages.privacy.back_home")}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
