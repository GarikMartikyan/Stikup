'use client';

import Link from 'next/link';
import { RegisterForm } from '@/components/auth/register-form';
import { GoogleButton } from '@/components/auth/google-button';
import { TelegramButton } from '@/components/auth/telegram-button';
import { Brand } from '@/components/brand';
import { useT } from '@/components/language-provider';

export function RegisterPageContent() {
  const t = useT();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Brand size="lg" />
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-fg)]">
            {t('auth.register.title')}
          </h1>
          <p className="text-sm text-[var(--color-fg-muted)]">
            {t('auth.register.subtitle')}
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-3">
            <GoogleButton />
            <TelegramButton />
          </div>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-[var(--color-border)]" />
            <span className="text-xs text-[var(--color-fg-muted)]">
              {t('common.or')}
            </span>
            <span className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          <RegisterForm />
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-fg-muted)]">
          {t('auth.register.already_have_account')}{' '}
          <Link
            href="/login"
            className="font-semibold text-[var(--color-fg)] hover:underline"
          >
            {t('auth.register.sign_in')}
          </Link>
        </p>
      </div>
    </div>
  );
}
