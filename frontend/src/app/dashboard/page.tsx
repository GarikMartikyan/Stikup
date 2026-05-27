import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Check,
  ExternalLink,
  LogOut,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { StickerCard } from "@/components/sticker-card";
import { serverFetch } from "@/lib/api";

const ALL_STICKERS = Array.from({ length: 12 }, (_, i) => ({
  src: `/assets/sticker_${i + 1}.webp`,
  alt: `Sticker ${i + 1}`,
}));

export default async function DashboardPage() {
  const session = await serverFetch<{ userId: string }>("/auth/me");
  if (!session) redirect("/");

  // Mocked pack history for the UI demo
  const packs = [
    {
      id: "demo-001",
      name: "stikup_you_demo",
      createdAt: "2026-05-24",
      status: "ready" as const,
      regenLeft: 1,
    },
  ];

  const shortId = session.userId.slice(0, 8);

  return (
    <div className="relative flex min-h-dvh flex-col">
      <AppHeader
        right={
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
            >
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </form>
        }
      />

      <main className="snap-section mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-8 md:py-12">
        {/* Greeting strip */}
        <div className="reveal flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-success)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
              Signed in
            </span>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.02em] md:text-5xl">
              Welcome back.
            </h1>
            <div className="mt-1 font-mono text-xs text-[var(--color-fg-subtle)]">
              user · {shortId}
            </div>
          </div>
          <Link
            href="/upload"
            className="shimmer group inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-10px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Make a new pack
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Stats row */}
        <div className="reveal mt-8 grid gap-4 md:grid-cols-4" style={{ animationDelay: "120ms" }}>
          <Stat label="Packs" value={String(packs.length)} hint="lifetime" />
          <Stat label="Stickers owned" value={String(packs.length * 12)} hint="across all packs" />
          <Stat label="Regenerations" value="1 / pack" hint="paid-pack quota" />
          <Stat label="Subscription" value="None" hint="never — one-time only" />
        </div>

        {/* Packs grid */}
        <section
          className="snap-section reveal mt-10 scroll-mt-20"
          style={{ animationDelay: "180ms" }}
        >
          <div className="flex items-end justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight md:text-3xl">
              Your packs
            </h2>
            <span className="font-mono text-xs text-[var(--color-fg-subtle)]">
              {packs.length} pack{packs.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {packs.map((pack) => (
              <div
                key={pack.id}
                className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 shadow-[var(--shadow-card)] md:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
                      {pack.createdAt}
                    </div>
                    <div className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
                      {pack.name}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success)]/15 px-2 py-0.5 font-bold text-[var(--color-success)]">
                        <Check className="h-3 w-3" strokeWidth={3} /> ready
                      </span>
                      <span className="text-[var(--color-fg-muted)]">12/12 stickers</span>
                    </div>
                  </div>
                  <a
                    href={`https://t.me/addstickers/${pack.name}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-fg)] px-3 py-1.5 text-xs font-bold text-[var(--color-bg)] hover:opacity-90"
                  >
                    Install
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="mt-4 grid grid-cols-6 gap-2">
                  {ALL_STICKERS.map((s, i) => (
                    <StickerCard
                      key={i}
                      src={s.src}
                      alt={s.alt}
                      rotate={(i % 2 === 0 ? 1 : -1) * (i % 3)}
                    />
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-4 text-xs">
                  <span className="text-[var(--color-fg-muted)]">
                    Regenerations: {pack.regenLeft} left
                  </span>
                  <div className="ml-auto flex gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-3 py-1.5 font-bold text-[var(--color-fg)] hover:bg-[var(--color-bg-sunk)]"
                    >
                      <RefreshCw className="h-3 w-3" /> Regenerate
                    </button>
                    <Link
                      href={`/result/${pack.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-3 py-1.5 font-bold text-[var(--color-fg)] hover:bg-[var(--color-bg-sunk)]"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* CTA placeholder card */}
            <Link
              href="/upload"
              className="group relative grid place-items-center overflow-hidden rounded-3xl border-2 border-dashed border-[var(--color-border-strong)] p-10 text-center transition hover:border-[var(--color-brand)]"
            >
              <div>
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] text-white shadow-md">
                  <Plus className="h-6 w-6" strokeWidth={2.2} />
                </div>
                <div className="mt-4 font-[family-name:var(--font-display)] text-xl font-bold">
                  Make another pack
                </div>
                <div className="mt-1 text-sm text-[var(--color-fg-muted)]">
                  Different photo. Fresh 12 stickers. One payment.
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Account row */}
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
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 shadow-[var(--shadow-card)]">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
        {label}
      </div>
      <div className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight">
        {value}
      </div>
      <div className="mt-1 text-xs text-[var(--color-fg-muted)]">{hint}</div>
    </div>
  );
}

function AccountCard({
  icon: Icon,
  title,
  body,
  cta,
  danger,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
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
