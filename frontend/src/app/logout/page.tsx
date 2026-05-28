"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLogoutMutation } from "@/lib/store/auth-api";

export default function LogoutPage() {
  const router = useRouter();
  const [logout] = useLogoutMutation();

  useEffect(() => {
    logout()
      .unwrap()
      .catch(() => {})
      .finally(() => {
        router.replace("/");
      });
  }, [logout, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-fg)]"
        aria-label="Signing out"
      />
    </div>
  );
}
