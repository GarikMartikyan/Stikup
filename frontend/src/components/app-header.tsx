'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Brand } from '@/components/brand';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserDrawer } from '@/components/auth/user-drawer';
import { OpenInTelegramButton } from '@/components/open-in-telegram-button';
import { useT } from '@/components/language-provider';
import { useTelegram } from '@/components/telegram/telegram-provider';
import { LANDING_NAV_LINKS, type NavLink } from '@/lib/nav-links';

export type { NavLink };
export { LANDING_NAV_LINKS } from '@/lib/nav-links';

// Routes whose marketing-style content includes the in-page anchor sections
// referenced by LANDING_NAV_LINKS (#how, #pack, #pricing, #faq).
const LANDING_NAV_ROUTES = new Set<string>([
  '/',
  '/support',
]);

type AppHeaderProps = {
  navLinks?: ReadonlyArray<NavLink>;
  right?: ReactNode;
};

export function AppHeader({ navLinks, right }: AppHeaderProps) {
  const t = useT();
  const pathname = usePathname();
  const { isTelegram, status } = useTelegram();

  // Inside Telegram the in-app chrome (title bar, back/close) is native, so the
  // header stays minimal: brand + toggles, and the account drawer once the
  // initData auto-login completes. There is never a Sign in / Sign up CTA — the
  // user is already authenticated by Telegram — and the drawer hides its
  // Sign out action (the next launch would just auto-sign-in again).
  const resolvedNavLinks = isTelegram
    ? undefined
    : navLinks ??
      (pathname && LANDING_NAV_ROUTES.has(pathname)
        ? LANDING_NAV_LINKS
        : undefined);

  // Inside Telegram: render the account drawer once auto-login resolves, so its
  // /auth/me runs after the session cookie exists (avoids a 401-then-stale-cache
  // race). In a browser the app is Telegram-only, so the right-side control is
  // always an "Open in Telegram" CTA that funnels visitors into the Mini App.
  const rightContent = isTelegram
    ? status === 'authed'
      ? <UserDrawer hideSignOut />
      : null
    : right ?? <OpenInTelegramButton />;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg-elev)]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Brand size="md" />

        {resolvedNavLinks && resolvedNavLinks.length > 0 && (
          <div className="hidden items-center gap-7 text-sm font-medium text-[var(--color-fg-muted)] md:flex">
            {resolvedNavLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="transition hover:text-[var(--color-fg)]"
              >
                {t(`header.${label}`)}
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageToggle />
          {rightContent}
        </div>
      </div>
    </header>
  );
}
