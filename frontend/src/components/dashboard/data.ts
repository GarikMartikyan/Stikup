export type DashboardPack = {
  id: string;
  createdAtLabel: string;
  status: string;
  unlocked: boolean;
  freeCount: number;
  packSize: number;
  stickers: { index: number; url: string }[];
};
