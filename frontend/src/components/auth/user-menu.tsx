"use client";

import { useGetMeQuery } from "@/lib/store/auth-api";
import { LogoutButton } from "./logout-button";

export function UserMenu() {
  const { data: me } = useGetMeQuery();

  if (!me) return null;

  const shortId = me.userId.slice(0, 8);

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-xs text-[var(--color-fg-muted)] sm:block">
        {shortId}
      </span>
      <LogoutButton />
    </div>
  );
}
