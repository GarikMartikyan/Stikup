"use client";

import { useGetMeQuery } from "@/lib/store/auth-api";
import { LogoutButton } from "./logout-button";

export function UserMenu() {
  const { data: me } = useGetMeQuery();

  if (!me) return null;

  const shortId = me.userId.slice(0, 8);
  const label = me.email ?? shortId;

  return (
    <div className="flex items-center gap-3">
      <span
        className="hidden max-w-[200px] items-center gap-1.5 truncate rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3 py-1 text-xs font-semibold text-[var(--color-fg-muted)] sm:inline-flex"
        title={label}
      >
        {label}
      </span>
      <LogoutButton />
    </div>
  );
}
