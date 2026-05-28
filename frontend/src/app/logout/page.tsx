"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLogoutMutation } from "@/lib/store/auth-api";
import { useT } from "@/components/language-provider";

export default function LogoutPage() {
  const router = useRouter();
  const t = useT();
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
    <div className="flex flex-1 items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-fg)]"
        aria-label={t("auth.logout.signing_out_label")}
      />
    </div>
  );
}
