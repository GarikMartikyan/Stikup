export const ALL_STICKERS = Array.from({ length: 12 }, (_, i) => ({
  src: `/assets/sticker_${i + 1}.webp`,
  alt: `Sticker ${i + 1}`,
}));

export const FREE_COUNT = 3;
export const PACK_SIZE = 12;
export const PRICE_LABEL = "$5.99";
