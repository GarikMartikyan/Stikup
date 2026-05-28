import Link from "next/link";
import { Plus } from "lucide-react";
import { PackCard } from "./pack-card";
import { EmptyPackState } from "./empty-pack-state";
import type { DashboardPack } from "./data";

export function PackList({ packs }: { packs: DashboardPack[] }) {
  if (packs.length === 0) {
    return <EmptyPackState />;
  }

  return (
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
          <PackCard key={pack.id} pack={pack} />
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
  );
}
