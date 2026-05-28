"use client";

import Link from "next/link";
import { Settings, Trash2 } from "lucide-react";
import type { ComponentType } from "react";
import { useT } from "@/components/language-provider";

function AccountCard({
  icon: Icon,
  title,
  body,
  cta,
  href,
  danger,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
  cta: string;
  href: string;
  danger?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 shadow-[var(--shadow-card)] md:p-6">
      <div className="flex items-start gap-4">
        <div
          className={`grid h-11 w-11 place-items-center rounded-2xl ${
            danger
              ? "bg-[var(--color-danger)]/15 text-[var(--color-danger)]"
              : "bg-[var(--color-bg-sunk)] text-[var(--color-fg)]"
          }`}
        >
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div>
          <div className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
            {title}
          </div>
          <div className="mt-1 text-sm text-[var(--color-fg-muted)]">{body}</div>
        </div>
      </div>
      <Link
        href={href}
        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${
          danger
            ? "border border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
            : "border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] text-[var(--color-fg)] hover:bg-[var(--color-bg-sunk)]"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

export function AccountRow() {
  const t = useT();
  return (
    <section className="snap-section reveal mt-12 grid scroll-mt-20 gap-4 md:grid-cols-2">
      <AccountCard
        icon={Settings}
        title={t("dashboard.account_row.settings_title")}
        body={t("dashboard.account_row.settings_body")}
        cta={t("dashboard.account_row.settings_cta")}
        href="/settings"
      />
      <AccountCard
        icon={Trash2}
        title={t("dashboard.account_row.delete_title")}
        body={t("dashboard.account_row.delete_body")}
        cta={t("dashboard.account_row.delete_cta")}
        href="/settings#delete-account"
        danger
      />
    </section>
  );
}
