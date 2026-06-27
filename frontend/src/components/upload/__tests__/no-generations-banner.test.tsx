import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NoGenerationsBanner } from '../no-generations-banner';

vi.mock('@/components/language-provider', () => ({
  useT: () => (k: string) => k,
}));

describe('NoGenerationsBanner', () => {
  it('shows the message and calls onWatchAd when the button is clicked', () => {
    const onWatchAd = vi.fn();
    render(
      <NoGenerationsBanner
        watchingAd={false}
        adError={null}
        onWatchAd={onWatchAd}
      />,
    );
    expect(screen.getByText('upload.error.no_generations')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /upload\.actions\.watch_ad/ }),
    );
    expect(onWatchAd).toHaveBeenCalledOnce();
  });

  it('disables the button and surfaces adError while watching', () => {
    render(
      <NoGenerationsBanner
        watchingAd={true}
        adError={'upload.error.ad_unavailable'}
        onWatchAd={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: /upload\.actions\.watch_ad/ }),
    ).toBeDisabled();
    expect(screen.getByText('upload.error.ad_unavailable')).toBeInTheDocument();
  });
});
