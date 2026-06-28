export type DashboardPack = {
  id: string;
  /** ISO timestamp; formatted per the active language in the UI. */
  createdAt: string;
  status: string;
  unlocked: boolean;
  freeCount: number;
  packSize: number;
  stickers: { index: number; url: string }[];
};
