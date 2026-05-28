"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLoginMutation } from "@/lib/store/auth-api";
import { useT } from "@/components/language-provider";
import { safeNextPath } from "@/lib/auth/safe-next";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const t = useT();
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
      router.push(safeNextPath(next));
    } catch {
      setError(t("auth.login.error_invalid"));
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-sm font-medium text-[var(--color-fg)]"
        >
          {t("auth.common.email_label")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3.5 py-2.5 text-sm text-[var(--color-fg)] placeholder-[var(--color-fg-muted)] outline-none transition focus:border-[var(--color-brand-soft)] focus:ring-2 focus:ring-[var(--color-brand)]/15"
          placeholder={t("auth.common.email_placeholder")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-sm font-medium text-[var(--color-fg)]"
          >
            {t("auth.common.password_label")}
          </label>
          <Link
            href="/auth/forgot"
            className="text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:underline"
          >
            {t("auth.login.forgot_password")}
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3.5 py-2.5 pr-10 text-sm text-[var(--color-fg)] placeholder-[var(--color-fg-muted)] outline-none transition focus:border-[var(--color-brand-soft)] focus:ring-2 focus:ring-[var(--color-brand)]/15"
            placeholder="••••••••"
          />
          <button
            type="button"
            aria-label={showPassword ? t("auth.common.hide_password") : t("auth.common.show_password")}
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
        {isLoading ? t("auth.login.signing_in") : t("auth.login.sign_in")}
      </Button>
    </form>
  );
}
