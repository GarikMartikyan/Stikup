export type DashboardPack = {
  id: string;
  createdAtLabel: string;
  status: string;
  unlocked: boolean;
  freeCount: number;
  packSize: number;
  stickers: { index: number; url: string }[];
};

export const ALL_STICKERS = Array.from({ length: 12 }, (_, i) => ({
  src: `/assets/sticker_${i + 1}.webp`,
  alt: `Sticker ${i + 1}`,
}));
