"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLoginMutation } from "@/lib/store/auth-api";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const email = (data.get("email") as string).trim().toLowerCase();
    const password = data.get("password") as string;

    try {
      await login({ email, password }).unwrap();
      router.push(next && next.startsWith("/") ? next : "/dashboard");
    } catch {
      setError("Invalid email or password.");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-sm font-medium text-[var(--color-fg)]"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3.5 py-2.5 text-sm text-[var(--color-fg)] placeholder-[var(--color-fg-muted)] outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
          placeholder="you@example.com"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-sm font-medium text-[var(--color-fg)]"
          >
            Password
          </label>
          <Link
            href="/auth/forgot"
            className="text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3.5 py-2.5 pr-10 text-sm text-[var(--color-fg)] placeholder-[var(--color-fg-muted)] outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
            placeholder="••••••••"
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        aria-busy={isLoading}
        className="w-full"
      >
        {isLoading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
