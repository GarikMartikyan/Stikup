import { Settings, Trash2 } from "lucide-react";
import type { ComponentType } from "react";

function AccountCard({
  icon: Icon,
  title,
  body,
  cta,
  danger,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
  cta: string;
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
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${
          danger
            ? "border border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
            : "border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] text-[var(--color-fg)] hover:bg-[var(--color-bg-sunk)]"
        }`}
      >
        {cta}
      </button>
    </div>
  );
}

export function AccountRow() {
  return (
    <section className="snap-section reveal mt-12 grid scroll-mt-20 gap-4 md:grid-cols-2">
      <AccountCard
        icon={Settings}
        title="Account settings"
        body="Linked accounts (Telegram, Google, email), language, transactional notifications."
        cta="Open settings"
      />
      <AccountCard
        icon={Trash2}
        title="Delete account"
        body="Cascading delete — your packs, stickers, and uploaded photo all removed. GDPR-compliant."
        cta="Delete"
        danger
      />
    </section>
  );
}
