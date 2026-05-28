'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LayoutGrid, LogOut, Settings, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { initialFor, pickDisplayName } from '@/lib/auth/user-display';
import { useGetMeQuery, useLogoutMutation } from '@/lib/store/auth-api';
import { useT } from '@/components/language-provider';
import { UserAvatar } from '@/components/auth/user-avatar';

type UserDrawerProps = {
  // Rendered when /auth/me errors (typically a stale/invalid session cookie
  // — the server saw the cookie but the session is gone). Lets the header
  // recover to a sign-in CTA instead of rendering nothing.
  fallback?: ReactNode;
};

export function UserDrawer({ fallback = null }: UserDrawerProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();
  const { data: me, error: meError } = useGetMeQuery();
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Defer portaling until after hydration; document is unavailable during SSR.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot post-hydration gate
    setMounted(true);
  }, []);

  // Prevent body scroll + allow Escape to close while the drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  if (!me) return meError ? <>{fallback}</> : null;

  const shortId = me.userId.slice(0, 8);
  const name = pickDisplayName(me.displayName, me.email, shortId);
  const initial = initialFor(name);
  const fullLabel = me.email ?? name;

  const USER_LINKS = [
    { href: '/', label: t('auth.user_drawer.home'), Icon: Home },
    { href: '/my-stickers', label: t('auth.user_drawer.my_stickers'), Icon: LayoutGrid },
    { href: '/settings', label: t('auth.user_drawer.settings'), Icon: Settings },
  ] as const;

  async function handleLogout() {
    setOpen(false);
    await logout()
      .unwrap()
      .catch(() => {});
    router.push('/');
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        aria-label={open ? t('header.close_account_menu') : t('header.open_account_menu')}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="overflow-hidden rounded-full transition hover:opacity-90"
        title={fullLabel}
      >
        <UserAvatar
          src={me.avatarUrl}
          initial={initial}
          alt={fullLabel}
          className="h-9 w-9 text-[0.75rem]"
        />
      </button>

      {mounted &&
        createPortal(
          <>
            {/* Backdrop — softens and blurs the page behind the drawer; click to close */}
            <div
              onClick={() => setOpen(false)}
              aria-hidden="true"
              className={`fixed inset-0 z-[60] bg-black/25 backdrop-blur-[3px] transition-opacity duration-200 ${
                open ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            />
            {/* Drawer */}
            <aside
              role="dialog"
              aria-modal="true"
              aria-label={t('header.account_menu_label')}
              aria-hidden={!open}
              className={`fixed right-0 top-0 z-[70] flex h-dvh w-[72%] max-w-xs flex-col overflow-hidden rounded-l-3xl border-l border-[var(--color-border)] bg-[var(--color-bg)] shadow-2xl transition-transform duration-300 ease-out ${
                open ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              <div className="flex h-16 items-center justify-between border-b border-[var(--color-border)] px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar
                    src={me.avatarUrl}
                    initial={initial}
                    alt={fullLabel}
                    className="h-9 w-9 shrink-0 text-[0.8rem]"
                  />
                  <span
                    className="truncate text-sm font-semibold text-[var(--color-fg)]"
                    title={fullLabel}
                  >
                    {name}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label={t('header.close_menu')}
                  onClick={() => setOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elev)] text-[var(--color-fg-muted)] transition hover:text-[var(--color-fg)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-5 py-5">
                <ul className="flex flex-col gap-1">
                  {USER_LINKS.map(({ href, label, Icon }) => {
                    const active =
                      href === '/'
                        ? pathname === '/'
                        : pathname === href || pathname?.startsWith(`${href}/`);
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={() => setOpen(false)}
                          aria-current={active ? 'page' : undefined}
                          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition ${
                            active
                              ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]'
                              : 'text-[var(--color-fg)] hover:bg-[var(--color-bg-elev)]'
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 ${
                              active
                                ? 'text-[var(--color-brand)]'
                                : 'text-[var(--color-fg-muted)]'
                            }`}
                            aria-hidden="true"
                          />
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="border-t border-[var(--color-border)] px-5 py-4">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-base font-semibold text-[var(--color-fg)] transition hover:bg-[var(--color-bg-elev)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut
                    className="h-4 w-4 text-[var(--color-fg-muted)]"
                    aria-hidden="true"
                  />
                  {loggingOut ? t('auth.user_drawer.signing_out') : t('auth.user_drawer.sign_out')}
                </button>
              </div>
            </aside>
          </>,
          document.body,
        )}
    </>
  );
}
