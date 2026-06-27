/**
 * Per-user generation cap.
 *
 * Single source of truth for the quota formula, shared by PackService (the
 * generation gate + display) and AdRewardService (granting ad-earned credits).
 *
 *   cap = baseGenerations
 *       + referralBonusGenerations * referralCount   // friends who signed up
 *       + adRewardCount                              // ads watched (1 each)
 */
export function computeCap(
  offer: { baseGenerations: number; referralBonusGenerations: number },
  referralCount: number,
  adRewardCount: number,
): number {
  return (
    offer.baseGenerations +
    offer.referralBonusGenerations * referralCount +
    adRewardCount
  );
}
