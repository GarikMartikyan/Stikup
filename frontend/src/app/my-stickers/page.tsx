import { GreetingStrip } from '@/components/dashboard/greeting-strip';
import { PackList } from '@/components/dashboard/pack-list';
import { StatsRow } from '@/components/dashboard/stats-row';
import type { DashboardPack } from '@/components/dashboard/data';
import { requireSession } from '@/lib/auth/require-session';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MyStickersPage({ searchParams }: PageProps) {
  const session = await requireSession();
  const params = await searchParams;

  // Real packs come from the API once the backend endpoint exists.
  // For now: no packs by default so fresh accounts see the empty state.
  // Add ?demo=1 to the URL to preview the demo card (e.g. during development).
  const packs: DashboardPack[] =
    params.demo === '1'
      ? [
          {
            id: 'demo-001',
            name: 'stikup_you_demo',
            createdAt: '2026-05-24',
            status: 'ready',
            regenLeft: 1,
          },
        ]
      : [];

  const shortId = session.userId.slice(0, 8);

  return (
    <div className="relative flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-8 md:py-12">
        <GreetingStrip
          shortId={shortId}
          username={session.displayName ?? session.email}
        />
        <StatsRow packCount={packs.length} />
        <PackList packs={packs} />
      </main>
    </div>
  );
}
