"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { telegramAppHref } from "@/lib/telegram/href";

type AppLinkProps = {
  /** In-app route to use when running inside the Telegram Mini App. */
  href: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"a">, "href">;

/**
 * Navigation that adapts to where the app is running:
 *
 *  - Inside the Telegram Mini App it behaves like a normal in-app <Link>.
 *  - In a plain browser the app is Telegram-only, so the in-app route is never
 *    reachable — the link instead opens the Telegram Mini App.
 *
 * Until the SDK detection resolves `isTelegram` is false, which is the correct
 * default for the web (the home page is almost always viewed in a browser).
 */
export function AppLink({ href, children, ...rest }: AppLinkProps) {
  const { isTelegram } = useTelegram();

  if (isTelegram) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={telegramAppHref()}
      target="_blank"
      rel="noopener noreferrer"
      {...rest}
    >
      {children}
    </a>
  );
}
