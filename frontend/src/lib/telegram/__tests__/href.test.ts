import { describe, it, expect } from 'vitest';
import { telegramReferralHref } from '../href';

describe('telegramReferralHref', () => {
  it('builds a startapp deep link encoding code and pack id', () => {
    const url = telegramReferralHref(
      'MYCODE',
      '550e8400-e29b-41d4-a716-446655440000',
    );
    expect(url).toBe(
      'https://t.me/stikup_bot?startapp=MYCODE_550e8400-e29b-41d4-a716-446655440000',
    );
  });
});
