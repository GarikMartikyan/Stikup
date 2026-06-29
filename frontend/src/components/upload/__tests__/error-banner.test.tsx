import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBanner } from '../error-banner';

// Passthrough translator: renders the i18n key verbatim so we can assert on it.
vi.mock('@/components/language-provider', () => ({
  useT: () => (k: string) => k,
}));

describe('ErrorBanner', () => {
  it('defaults the heading to the image-not-accepted title', () => {
    render(<ErrorBanner message="some message" />);
    expect(
      screen.getByText('upload.error.photo_not_accepted'),
    ).toBeInTheDocument();
    expect(screen.getByText('some message')).toBeInTheDocument();
  });

  it('uses a custom title when provided, so server errors do not blame the image', () => {
    render(<ErrorBanner message="server hiccup" title="Upload failed" />);
    expect(screen.getByText('Upload failed')).toBeInTheDocument();
    expect(
      screen.queryByText('upload.error.photo_not_accepted'),
    ).not.toBeInTheDocument();
  });
});
