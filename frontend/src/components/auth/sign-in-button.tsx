'use client';

import Link from 'next/link';
import { useT } from '@/components/language-provider';

type SignInButtonProps = {
  next?: string;
};

export function SignInButton({ next = '/upload' }: SignInButtonProps) {
  const t = useT();
  const href = `/login?next=${encodeURIComponent(next)}`;
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full bg-[var(--color-fg)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)] shadow-sm transition hover:opacity-90"
    >
      {t('header.sign_in')}
    </Link>
  );
}
