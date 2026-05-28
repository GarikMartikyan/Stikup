import { cache } from "react";
import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/api";
import type { AuthMeResponse } from "@/lib/api-types";

export const requireSession = cache(async (): Promise<AuthMeResponse> => {
  const session = await serverFetch<AuthMeResponse>("/auth/me");
  if (!session) redirect("/login");
  return session;
});
