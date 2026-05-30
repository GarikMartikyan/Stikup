"use client";

import Link from "next/link";
import { SiteFooter } from "@/components/landing/site-footer";
import { useT } from "@/components/language-provider";

const SUPPORT_EMAIL = "garmailtest@gmail.com";

const TOPICS = ["account", "stickers", "billing"] as const;

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

        <p className="mt-8 text-[var(--color-fg-muted)]">
          {t("pages.support.intro")}
        </p>

        {/* Email card */}
        <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
            {t("pages.support.email_label")}
          </div>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-1 inline-block font-[family-name:var(--font-display)] text-2xl font-extrabold text-[var(--color-fg)] hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
          <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
            {t("pages.support.response_time")}
          </p>
        </div>

        <section className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
            {t("pages.support.topics_title")}
          </h2>
          <ul className="mt-3 space-y-3">
            {TOPICS.map((id) => (
              <li key={id} className="text-[var(--color-fg-muted)]">
                <span className="font-semibold text-[var(--color-fg)]">
                  {t(`pages.support.${id}_title`)}
                </span>{" "}
                — {t(`pages.support.${id}_body`)}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
            {t("pages.support.include_title")}
          </h2>
          <p className="mt-2 text-[var(--color-fg-muted)]">
            {t("pages.support.include_body")}
          </p>
        </section>

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
