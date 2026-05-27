"use client";

import { PaywallCard } from "./paywall-card";
import { PreviewPanel } from "./preview-panel";
import { QuotaCard } from "./quota-card";

export function SidePanel({ selected }: { selected: number | null }) {
  return (
    <aside className="reveal space-y-5" style={{ animationDelay: "180ms" }}>
      <PreviewPanel selected={selected} />
      <PaywallCard />
      <QuotaCard />
    </aside>
  );
}
