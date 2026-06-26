import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OpenInTelegram } from '../open-in-telegram';

vi.mock('@/components/language-provider', () => ({
  useT: () => (k: string) => k,
}));

describe('OpenInTelegram', () => {
  it("links to the bot's Mini App with ?startapp", () => {
    render(<OpenInTelegram />);
    const link = screen.getByRole('link', { name: /telegram_gate\.button/ });
    expect(link).toHaveAttribute('href', expect.stringContaining('?startapp'));
    expect(link).toHaveAttribute('href', expect.stringContaining('t.me'));
  });
});
