"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRegisterMutation } from "@/lib/store/auth-api";

function strengthOk(password: string) {
  return password.length >= 8 && /\d/.test(password);
}

export function RegisterForm() {
  const router = useRouter();
  const [register, { isLoading }] = useRegisterMutation();
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);

  const pwOk = strengthOk(password);
  const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== password;
  const canSubmit = pwOk && !confirmMismatch && confirmPassword.length > 0 && termsChecked;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    const data = new FormData(e.currentTarget);
    const email = (data.get("email") as string).trim().toLowerCase();

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
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3.5 py-2.5 pr-10 text-sm text-[var(--color-fg)] placeholder-[var(--color-fg-muted)] outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
            placeholder="At least 8 characters"
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
        <p
          className={`text-xs transition-colors ${
            pwOk
              ? "text-[var(--color-success)]"
              : "text-[var(--color-fg-muted)]"
          }`}
        >
          8+ characters, 1 number
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="confirm-password"
          className="text-sm font-medium text-[var(--color-fg)]"
        >
          Confirm password
        </label>
        <div className="relative">
          <input
            id="confirm-password"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full rounded-xl border bg-[var(--color-bg-elev)] px-3.5 py-2.5 pr-10 text-sm text-[var(--color-fg)] placeholder-[var(--color-fg-muted)] outline-none transition focus:ring-2 focus:ring-[var(--color-brand)]/20 ${
              confirmMismatch
                ? "border-red-500 focus:border-red-500"
                : "border-[var(--color-border)] focus:border-[var(--color-brand)]"
            }`}
            placeholder="••••••••"
          />
          <button
            type="button"
            aria-label={showConfirm ? "Hide password" : "Show password"}
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
          >
            {showConfirm ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {confirmMismatch && (
          <p className="text-xs text-red-500">Passwords don&apos;t match.</p>
        )}
      </div>

      <label className="flex items-start gap-2.5 text-sm text-[var(--color-fg-muted)]">
        <input
          type="checkbox"
          checked={termsChecked}
          onChange={(e) => setTermsChecked(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded accent-[var(--color-brand)]"
          required
        />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="font-medium text-[var(--color-fg)] hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-medium text-[var(--color-fg)] hover:underline">
            Privacy Policy
          </Link>
        </span>
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isLoading || !canSubmit}
        aria-busy={isLoading}
        className="w-full"
      >
        {isLoading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
