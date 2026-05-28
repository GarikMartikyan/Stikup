import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/api";
import type { AuthMeResponse } from "@/lib/api-types";
import { RegisterPageContent } from "./register-page-content";

export default async function RegisterPage() {
  const session = await serverFetch<AuthMeResponse>("/auth/me");
  if (session) redirect("/my-stickers");

  return <RegisterPageContent />;
}
