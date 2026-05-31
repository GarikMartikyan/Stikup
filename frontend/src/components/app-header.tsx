'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Brand } from '@/components/brand';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { SignInButton } from '@/components/auth/sign-in-button';
import { UserDrawer } from '@/components/auth/user-drawer';
import { useT } from '@/components/language-provider';
import { useTelegram } from '@/components/telegram/telegram-provider';
import { LANDING_NAV_LINKS, type NavLink } from '@/lib/nav-links';

export type { NavLink };
export { LANDING_NAV_LINKS } from '@/lib/nav-links';

// Routes whose marketing-style content includes the in-page anchor sections
// referenced by LANDING_NAV_LINKS (#how, #pack, #pricing, #faq).
const LANDING_NAV_ROUTES = new Set<string>([
  '/',
  '/privacy',
  '/terms',
  '/support',
]);

// Auth flow routes — hide the right-side CTA (Sign in / account drawer) since
// the page itself is the auth action.
const AUTH_ROUTES = new Set<string>([
  '/login',
  '/register',
  '/logout',
  '/auth/forgot',
  '/auth/login-failed',
]);

type AppHeaderProps = {
  navLinks?: ReadonlyArray<NavLink>;
  loggedIn?: boolean;
  right?: ReactNode;
};

export function AppHeader({ navLinks, loggedIn, right }: AppHeaderProps) {
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

  const onAuthRoute = Boolean(pathname && AUTH_ROUTES.has(pathname));

  const rightContent = isTelegram
    ? // Render the drawer only after auto-login resolves, so its /auth/me runs
      // once the session cookie exists (avoids a 401-then-stale-cache race).
      status === 'authed'
      ? <UserDrawer hideSignOut />
      : null
    : right ??
      (onAuthRoute ? null : loggedIn === false ? (
        <SignInButton />
      ) : (
        // Server sees a session cookie but it may be stale — UserDrawer falls
        // back to a sign-in button when /auth/me returns 401.
        <UserDrawer fallback={<SignInButton />} />
      ));

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
