const CODE_RE = /^[0-9A-Za-z]{1,64}$/;
const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export interface ParsedReferralStartParam {
  ref: string;
  pack: string | undefined;
}

/**
 * Parse a Telegram Mini App `start_param` of the form `<CODE>_<PACKID>` into a
 * referral code and optional pack id.
 *
 * - Splits on the FIRST underscore (referral codes are base62 and pack ids are
 *   UUIDs — neither contains `_`, so this is unambiguous).
 * - Returns `null` when there is no valid referral code (caller skips
 *   attribution entirely).
 * - Drops an invalid pack id but keeps the code (credits the referral without a
 *   specific pack unlock).
 */
export function parseReferralStartParam(
  startParam: string | null | undefined,
): ParsedReferralStartParam | null {
  if (!startParam) return null;

  const idx = startParam.indexOf('_');
  const ref = idx === -1 ? startParam : startParam.slice(0, idx);
  const packRaw = idx === -1 ? undefined : startParam.slice(idx + 1);

  if (!CODE_RE.test(ref)) return null;

  const pack = packRaw && UUID_RE.test(packRaw) ? packRaw : undefined;
  return { ref, pack };
}
