import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/api";
import type { AuthMeResponse } from "@/lib/api-types";
import { LoginPageContent } from "./login-page-content";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await serverFetch<AuthMeResponse>("/auth/me");
  const { next } = await searchParams;
  if (session) redirect(next && next.startsWith("/") ? next : "/my-stickers");

  return <LoginPageContent next={next} />;
}
