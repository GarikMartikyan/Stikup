import { AppHeader } from "@/components/app-header";
import { AccountRow } from "@/components/dashboard/account-row";
import { GreetingStrip } from "@/components/dashboard/greeting-strip";
import { PackList } from "@/components/dashboard/pack-list";
import { StatsRow } from "@/components/dashboard/stats-row";
import { UserMenu } from "@/components/auth/user-menu";
import type { DashboardPack } from "@/components/dashboard/data";
import { requireSession } from "@/lib/auth/require-session";

export default async function DashboardPage() {
  const session = await requireSession();

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
      <AppHeader right={<UserMenu />} />

      <main className="snap-section mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-8 md:py-12">
        <GreetingStrip shortId={shortId} />
        <StatsRow packCount={packs.length} />
        <PackList packs={packs} />
        <AccountRow />
      </main>
    </div>
  );
}
