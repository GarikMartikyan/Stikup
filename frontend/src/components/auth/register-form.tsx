"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useRegisterMutation } from "@/lib/store/auth-api";

export function RegisterForm() {
  const router = useRouter();
  const [register, { isLoading }] = useRegisterMutation();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const email = (data.get("email") as string).trim().toLowerCase();
    const password = data.get("password") as string;

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      await register({ email, password }).unwrap();
      router.push("/dashboard");
    } catch (err: unknown) {
      if (
        err !== null &&
        typeof err === "object" &&
        "status" in err &&
        err.status === 409
      ) {
        setError("An account with that email already exists.");
      } else {
        setError("Registration failed. Please try again.");
      }
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
        <label
          htmlFor="password"
          className="text-sm font-medium text-[var(--color-fg)]"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3.5 py-2.5 text-sm text-[var(--color-fg)] placeholder-[var(--color-fg-muted)] outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
          placeholder="At least 8 characters"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
