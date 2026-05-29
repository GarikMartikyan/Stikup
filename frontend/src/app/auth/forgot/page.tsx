'use client';

// TODO: wire submit to POST /auth/forgot-password with { email } body
// when the backend endpoint is available.

import { useState } from 'react';
import Link from 'next/link';
import { Brand } from '@/components/brand';
import { useT } from '@/components/language-provider';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const t = useT();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Brand size="lg" />
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-fg)]">
            {t('auth.forgot.title')}
          </h1>
          <p className="text-sm text-[var(--color-fg-muted)]">
            {t('auth.forgot.subtitle')}
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-6 shadow-[var(--shadow-card)]">
          {submitted ? (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-sunk)] p-4 text-sm text-[var(--color-fg-muted)]">
              {t('auth.forgot.sent_message')}
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-[var(--color-fg)]"
                >
                  {t('auth.common.email_label')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3.5 py-2.5 text-sm text-[var(--color-fg)] placeholder-[var(--color-fg-muted)] outline-none transition focus:border-[var(--color-brand-soft)] focus:ring-2 focus:ring-[var(--color-brand)]/15"
                  placeholder={t('auth.common.email_placeholder')}
                />
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-full bg-[var(--color-fg)] px-4 py-2.5 text-sm font-semibold text-[var(--color-bg)] shadow-sm transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
              >
                {t('auth.forgot.send_link')}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-fg-muted)]">
          <Link
            href="/login"
            className="font-semibold text-[var(--color-fg)] hover:underline"
          >
            {t('auth.forgot.back_to_sign_in')}
          </Link>
        </p>
      </div>
    </div>
  );
}
