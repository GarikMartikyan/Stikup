"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLogoutMutation } from "@/lib/store/auth-api";
import { useT } from "@/components/language-provider";

export function LogoutButton() {
  const router = useRouter();
  const t = useT();
  const [logout, { isLoading }] = useLogoutMutation();

  async function handleLogout() {
    await logout().unwrap().catch(() => {});
    router.push("/");
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} disabled={isLoading}>
      {isLoading ? t("common.signing_out") : t("common.sign_out")}
    </Button>
  );
}
