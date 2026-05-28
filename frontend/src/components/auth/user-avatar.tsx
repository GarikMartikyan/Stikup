'use client';

import { useState } from 'react';

type UserAvatarProps = {
  src: string | null | undefined;
  initial: string;
  alt: string;
  className?: string;
};

export function UserAvatar({ src, initial, alt, className }: UserAvatarProps) {
  // If the remote image 404s or the third-party CDN is down, swap to initials
  // without leaving a broken-image icon behind.
  const [failed, setFailed] = useState(false);

  const base =
    'grid place-items-center overflow-hidden rounded-full bg-[var(--color-fg)] text-[var(--color-bg)] font-bold uppercase';
  const classes = className ? `${base} ${className}` : base;

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- third-party avatar URLs from arbitrary CDNs; allowlisting every provider is impractical
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${classes} object-cover`}
      />
    );
  }

  return (
    <span aria-label={alt} className={classes}>
      {initial}
    </span>
  );
}
