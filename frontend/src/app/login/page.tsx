import Link from "next/link";
import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/api";
import type { AuthMeResponse } from "@/lib/api-types";
import { LoginForm } from "@/components/auth/login-form";
import { GoogleButton } from "@/components/auth/google-button";
import { TelegramButton } from "@/components/auth/telegram-button";
import { Brand } from "@/components/brand";

export default async function LoginPage() {
  const session = await serverFetch<AuthMeResponse>("/auth/me");
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Brand size="sm" />
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-fg)]">
            Sign in to Stikup
          </h1>
          <p className="text-sm text-[var(--color-fg-muted)]">
            Welcome back — pick your method below.
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-3">
            <GoogleButton />
            <TelegramButton />
          </div>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-[var(--color-border)]" />
            <span className="text-xs text-[var(--color-fg-muted)]">or</span>
            <span className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-fg-muted)]">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-[var(--color-fg)] hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
