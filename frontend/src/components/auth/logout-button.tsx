"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLogoutMutation } from "@/lib/store/auth-api";

export function LogoutButton() {
  const router = useRouter();
  const [logout, { isLoading }] = useLogoutMutation();

  async function handleLogout() {
    await logout().unwrap().catch(() => {});
    router.push("/");
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} disabled={isLoading}>
      {isLoading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
