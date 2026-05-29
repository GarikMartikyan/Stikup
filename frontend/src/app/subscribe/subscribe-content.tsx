"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Crown, Sparkles } from "lucide-react";
import { SiteFooter } from "@/components/landing/site-footer";
import { useT } from "@/components/language-provider";

export function SubscribeContent() {
  const t = useT();
  const router = useRouter();

  // Go one step back if we got here from somewhere in-app; otherwise fall home.
  const handleBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  return (
    <div className="relative flex flex-1 w-full flex-col overflow-x-hidden text-[var(--color-fg)]">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <div className="reveal relative w-full overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-8 shadow-[var(--shadow-card)] md:p-12">
          {/* Soft brand glows */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--color-brand)]/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[var(--color-brand-2)]/20 blur-3xl"
          />

          <div className="relative">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)]">
              <Crown className="h-8 w-8" />
            </span>

            <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand)]/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
              <Sparkles className="h-3.5 w-3.5" />
              {t("pages.subscribe.badge")}
            </div>

            <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.02em] md:text-5xl">
              {t("pages.subscribe.title")}
            </h1>

            <p className="mx-auto mt-5 max-w-md text-lg text-[var(--color-fg-muted)]">
              {t("pages.subscribe.body")}
            </p>

            <p className="mt-4 text-sm text-[var(--color-fg-subtle)]">
              {t("pages.subscribe.note")}
            </p>

            <button
              type="button"
              onClick={handleBack}
              className="group mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-6 py-3 text-sm font-bold text-[var(--color-fg)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
            >
              <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
              {t("common.back")}
            </button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
