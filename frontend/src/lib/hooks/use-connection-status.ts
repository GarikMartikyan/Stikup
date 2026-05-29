'use client';

import { useGetMeQuery } from '@/lib/store/auth-api';

export type ConnectionStatus = {
  telegramConnected: boolean;
  googleConnected: boolean;
  /** True when at least one of Telegram / Google is not yet linked. */
  hasUnconnected: boolean;
};

/**
 * Derives which secondary auth channels the current user has linked.
 *
 * Single source of truth for the "connect your accounts" nudge. While
 * /auth/me is loading or errors, both providers read as not-connected; the dot
 * only ever appears for a user who genuinely has an unlinked provider once the
 * cached `channels` resolve.
 */
export function useConnectionStatus(): ConnectionStatus {
  const { data: me } = useGetMeQuery();
  const channels = me?.channels ?? [];
  const telegramConnected = channels.some((c) => c.channel === 'telegram');
  const googleConnected = channels.some((c) => c.channel === 'google');
  return {
    telegramConnected,
    googleConnected,
    hasUnconnected: !telegramConnected || !googleConnected,
  };
}
