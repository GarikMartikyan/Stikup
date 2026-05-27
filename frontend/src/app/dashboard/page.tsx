import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { AccountRow } from "@/components/dashboard/account-row";
import { GreetingStrip } from "@/components/dashboard/greeting-strip";
import { PackList } from "@/components/dashboard/pack-list";
import { StatsRow } from "@/components/dashboard/stats-row";
import type { DashboardPack } from "@/components/dashboard/data";
import { serverFetch } from "@/lib/api";

export default async function DashboardPage() {
  const session = await serverFetch<{ userId: string }>("/auth/me");
  if (!session) redirect("/");

  // Mocked pack history for the UI demo
  const packs: DashboardPack[] = [
    {
      id: "demo-001",
      name: "stikup_you_demo",
      createdAt: "2026-05-24",
      status: "ready",
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
        <GreetingStrip shortId={shortId} />
        <StatsRow packCount={packs.length} />
        <PackList packs={packs} />
        <AccountRow />
      </main>
    </div>
  );
}
