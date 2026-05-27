export type DashboardPack = {
  id: string;
  name: string;
  createdAt: string;
  status: "ready";
  regenLeft: number;
};

export const ALL_STICKERS = Array.from({ length: 12 }, (_, i) => ({
  src: `/assets/sticker_${i + 1}.webp`,
  alt: `Sticker ${i + 1}`,
}));
