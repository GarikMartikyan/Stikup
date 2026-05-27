"use client";

import { use, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ActionsRow } from "@/components/result/actions-row";
import { ResultHeader } from "@/components/result/result-header";
import { SidePanel } from "@/components/result/side-panel";
import { StickerGrid } from "@/components/result/sticker-grid";

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
        <ResultHeader />

        <div className="mt-6 grid gap-6 md:mt-8 md:grid-cols-[1.4fr_1fr]">
          <section className="reveal" style={{ animationDelay: "100ms" }}>
            <StickerGrid selected={selected} onSelect={setSelected} />
            <ActionsRow claiming={claiming} onClaim={claimFree} />
          </section>

          <SidePanel selected={selected} />
        </div>
      </main>
    </div>
  );
}
