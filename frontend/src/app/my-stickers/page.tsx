import { GreetingStrip } from '@/components/dashboard/greeting-strip';
import { PackList } from '@/components/dashboard/pack-list';
import { StatsRow } from '@/components/dashboard/stats-row';
import type { DashboardPack } from '@/components/dashboard/data';
import { requireSession } from '@/lib/auth/require-session';
import { serverFetch } from '@/lib/api';

type PackSummary = {
  id: string;
  createdAt: string;
  status: string;
  unlocked: boolean;
  freeCount: number;
  packSize: number;
  regensLeft: number;
  stickers: { index: number; url: string }[];
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function MyStickersPage() {
  const session = await requireSession();

  // The user's real generated packs (most recent first). serverFetch forwards
  // the session cookie; returns null on any non-2xx — treat as no packs.
  const summaries = (await serverFetch<PackSummary[]>('/packs')) ?? [];

  // Generations still available to the user (per-account, not per-pack); every
  // summary carries the same value, so read it off the first pack. Only when
  // there are no packs do we fall back to the offer config for the default
  // allowance — fetched lazily (skipped entirely when packs exist) and
  // defensively (a config-endpoint hiccup, e.g. while the backend is still
  // warming up right after a deploy, must not 500 the whole dashboard).
  let regensLeft = summaries[0]?.regensLeft;
  if (regensLeft === undefined) {
    const offer = await serverFetch<{ freeRegenerations: number }>(
      '/config/offer',
    ).catch(() => null);
    regensLeft = 1 + (offer?.freeRegenerations ?? 0);
  }

  const packs: DashboardPack[] = summaries.map((p) => ({
    id: p.id,
    createdAtLabel: formatDate(p.createdAt),
    status: p.status,
    unlocked: p.unlocked,
    freeCount: p.freeCount,
    packSize: p.packSize,
    stickers: p.stickers,
  }));

  const shortId = session.userId.slice(0, 8);

  return (
    <div className="relative flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-8 md:py-12">
        <GreetingStrip
          shortId={shortId}
          username={session.displayName ?? session.email}
        />
        <StatsRow packCount={packs.length} regensLeft={regensLeft} />
        <PackList packs={packs} />
      </main>
    </div>
  );
}
