"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  Download,
  Heart,
  Lock,
  RefreshCw,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Unlock,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { StickerCard } from "@/components/sticker-card";

const ALL_STICKERS = Array.from({ length: 12 }, (_, i) => ({
  src: `/assets/sticker_${i + 1}.webp`,
  alt: `Sticker ${i + 1}`,
}));

const FREE_COUNT = 3;
const PACK_SIZE = 12;
const PRICE_LABEL = "$5.99";

export default function ResultPage({
  params,
}: {
  params: Promise<{ packId: string }>;
}) {
  const { packId } = use(params);
  const [selected, setSelected] = useState<number | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [botUrl, setBotUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/packs/bot-url", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { botUrl?: string } | null) => {
        if (!cancelled && data?.botUrl) setBotUrl(data.botUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const claimFree = () => {
    if (claiming) return;
    setClaiming(true);

    // Fire-and-forget the claim request. `keepalive: true` lets it finish on
    // the backend even after we navigate away to the Telegram universal link.
    void fetch(`/api/packs/${encodeURIComponent(packId)}/claim-free`, {
      method: "POST",
      credentials: "include",
      keepalive: true,
    }).catch(() => {});

    // Mobile (iOS especially) only opens the Telegram app when navigation
    // happens synchronously inside the click's user-gesture context. If the
    // bot URL hasn't prefetched yet, fall back to awaiting the claim response.
    if (botUrl) {
      window.location.href = botUrl;
      return;
    }

    void (async () => {
      try {
        const res = await fetch(
          `/api/packs/${encodeURIComponent(packId)}/claim-free`,
          { method: "POST", credentials: "include" },
        );
        if (res.status === 401) {
          window.location.href = "/";
          return;
        }
        if (!res.ok) throw new Error(`claim-free failed: ${res.status}`);
        const { botUrl: url } = (await res.json()) as {
          delivered: boolean;
          botUrl: string;
        };
        window.location.href = url;
      } catch (err) {
        setClaiming(false);
        console.error(err);
      }
    })();
  };

  return (
    <div className="relative flex min-h-dvh flex-col">
      <AppHeader
        right={
          <div className="hidden items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3 py-1.5 text-xs font-medium text-[var(--color-fg-muted)] md:inline-flex">
            <ShieldCheck className="h-3 w-3" />
            <span className="font-mono uppercase tracking-wide">
              pack · {packId.slice(0, 6)}
            </span>
          </div>
        }
      />

      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-6 md:py-10">
        {/* Hero ribbon */}
        <div className="reveal flex flex-wrap items-center gap-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-2 ring-[var(--color-brand)]/30">
            <Image
              src="/assets/real_image.webp"
              alt="Your selfie"
              width={120}
              height={120}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/30" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
              Pack ready
            </div>
            <h1 className="mt-0.5 font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-[-0.02em] md:text-4xl">
              Your sticker pack is alive.
            </h1>
            <p className="mt-0.5 text-sm text-[var(--color-fg-muted)] md:text-base">
              All 12 generated. 3 free, 9 unlock with the pack.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:mt-8 md:grid-cols-[1.4fr_1fr]">
          {/* GRID */}
          <section
            className="reveal"
            style={{ animationDelay: "100ms" }}
          >
            <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 shadow-[var(--shadow-card)] md:p-7">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)]">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span>{FREE_COUNT} unlocked</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-fg)] text-[var(--color-bg)]">
                    <Lock className="h-3 w-3" />
                  </span>
                  <span>{PACK_SIZE - FREE_COUNT} locked</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {ALL_STICKERS.map((s, i) => {
                  const locked = i >= FREE_COUNT;
                  const isSel = selected === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => !locked && setSelected(i)}
                      className={`group relative transition ${
                        isSel ? "ring-2 ring-[var(--color-brand)] rounded-[20%]" : ""
                      }`}
                      aria-label={locked ? "Locked sticker" : `Sticker ${i + 1}`}
                    >
                      <StickerCard
                        src={s.src}
                        alt={s.alt}
                        locked={locked}
                        rotate={locked ? 0 : (i - 1) * 2}
                        delay={i * 60}
                        popIn
                      />
                      {!locked && (
                        <div className="absolute -top-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-[var(--color-success)] text-white shadow-md">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-sunk)] p-4">
                <div className="flex items-start gap-3 text-sm">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand)]" />
                  <div className="text-[var(--color-fg-muted)]">
                    Locked stickers are real — they&apos;re already generated.
                    Unlock instantly reveals all 9 with no second wait.
                  </div>
                </div>
              </div>
            </div>

            {/* Actions row, mobile-friendly */}
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <ActionButton
                tone="brand"
                title={`Unlock all ${PACK_SIZE}`}
                subtitle={PRICE_LABEL}
                icon={Unlock}
                hint="Recommended"
                primary
              />
              <ActionButton
                tone="ghost"
                title={`Take ${FREE_COUNT} free`}
                subtitle={claiming ? "Sending to Telegram…" : "Install to Telegram"}
                icon={claiming ? RefreshCw : Send}
                onClick={claimFree}
                disabled={claiming}
              />
              <ActionButton
                tone="ghost"
                title="Regenerate"
                subtitle="1 free regen left"
                icon={RefreshCw}
              />
            </div>
          </section>

          {/* SIDE PANEL: paywall + pack summary */}
          <aside
            className="reveal space-y-5"
            style={{ animationDelay: "180ms" }}
          >
            {/* Selected detail */}
            <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 shadow-[var(--shadow-card)]">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
                {selected === null ? "Preview" : `Sticker ${selected + 1}`}
              </div>
              <div className="mt-3 grid place-items-center rounded-2xl bg-[var(--color-bg-sunk)] p-4">
                {selected === null ? (
                  <div className="text-center text-sm text-[var(--color-fg-muted)]">
                    Tap a sticker to preview it large
                  </div>
                ) : (
                  <Image
                    src={ALL_STICKERS[selected].src}
                    alt={ALL_STICKERS[selected].alt}
                    width={240}
                    height={240}
                    className="h-40 w-40 object-contain"
                  />
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={selected === null}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-4 py-2 text-xs font-bold transition hover:bg-[var(--color-bg-sunk)] disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
                <button
                  type="button"
                  disabled={selected === null}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-4 py-2 text-xs font-bold transition hover:bg-[var(--color-bg-sunk)] disabled:opacity-50"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share
                </button>
              </div>
            </div>

            {/* Paywall card */}
            <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-6 shadow-[var(--shadow-card)]">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[var(--color-brand)]/25 blur-2xl" />
              <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-[var(--color-brand-2)]/25 blur-2xl" />
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand)]/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
                  Unlock the pack
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-[family-name:var(--font-display)] text-5xl font-black tracking-[-0.04em]">
                    {PRICE_LABEL}
                  </span>
                  <span className="text-sm text-[var(--color-fg-muted)]">one-time</span>
                </div>

                <ul className="mt-5 space-y-2.5 text-sm">
                  {[
                    "All 12 stickers — locked ones reveal instantly",
                    "Bot installs the Telegram pack for you",
                    "1 free regeneration included",
                    "Download as PNG / WebP",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]"
                        strokeWidth={3}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className="shimmer group mt-6 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-6 py-3.5 text-base font-bold text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5"
                >
                  <Unlock className="h-5 w-5" />
                  Unlock all 12 — {PRICE_LABEL}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </button>

                <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-[var(--color-fg-subtle)]">
                  <ShieldCheck className="h-3 w-3" />
                  Stripe · Apple Pay · Google Pay
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-dashed border-[var(--color-border-strong)] p-5 text-xs text-[var(--color-fg-muted)]">
              <div className="flex items-center gap-2 font-semibold text-[var(--color-fg)]">
                <Heart className="h-3.5 w-3.5 text-[var(--color-brand)]" />
                Quota
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Quota label="Generations" used={1} total={1} />
                <Quota label="Regenerations" used={0} total={1} />
              </div>
              <div className="mt-3 text-[10px]">
                Each paid pack grants you a fresh cycle: new photo, 12 new
                stickers, 1 more regen.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Quota({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = total === 0 ? 0 : Math.min(100, (used / total) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between text-[10px] uppercase tracking-wide">
        <span className="text-[var(--color-fg-muted)]">{label}</span>
        <span className="font-mono text-[var(--color-fg)]">
          {used}/{total}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-bg-sunk)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-2)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ActionButton({
  title,
  subtitle,
  icon: Icon,
  tone,
  primary,
  hint,
  onClick,
  disabled,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: "brand" | "ghost";
  primary?: boolean;
  hint?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  if (tone === "brand") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`shimmer group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] p-5 text-left text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition hover:-translate-y-1 disabled:cursor-wait disabled:opacity-80`}
      >
        {hint && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand)]">
            {hint}
          </span>
        )}
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div className="mt-4 font-[family-name:var(--font-display)] text-xl font-bold">
          {title}
        </div>
        <div className="mt-1 text-sm text-white/90">{subtitle}</div>
        {primary && (
          <ArrowRight className="absolute bottom-5 right-5 h-5 w-5 transition group-hover:translate-x-1" />
        )}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 text-left transition hover:-translate-y-1 hover:border-[var(--color-border-strong)] disabled:cursor-wait disabled:opacity-80"
    >
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--color-bg-sunk)] text-[var(--color-fg)]">
        <Icon className="h-5 w-5" strokeWidth={2.2} />
      </div>
      <div className="mt-4 font-[family-name:var(--font-display)] text-xl font-bold">
        {title}
      </div>
      <div className="mt-1 text-sm text-[var(--color-fg-muted)]">{subtitle}</div>
    </button>
  );
}
