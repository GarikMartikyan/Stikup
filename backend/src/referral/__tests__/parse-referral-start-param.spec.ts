import { parseReferralStartParam } from '../parse-referral-start-param';

describe('parseReferralStartParam', () => {
  const PACK = '550e8400-e29b-41d4-a716-446655440000';

  it('returns null for empty / nullish input', () => {
    expect(parseReferralStartParam(undefined)).toBeNull();
    expect(parseReferralStartParam(null)).toBeNull();
    expect(parseReferralStartParam('')).toBeNull();
  });

  it('parses "<code>_<packUuid>" into ref + pack', () => {
    expect(parseReferralStartParam(`Ab3Xy9Qz_${PACK}`)).toEqual({
      ref: 'Ab3Xy9Qz',
      pack: PACK,
    });
  });

  it('returns code with undefined pack when there is no pack segment', () => {
    expect(parseReferralStartParam('Ab3Xy9Qz')).toEqual({
      ref: 'Ab3Xy9Qz',
      pack: undefined,
    });
  });

  it('drops an invalid pack id but keeps the code', () => {
    expect(parseReferralStartParam('Ab3Xy9Qz_not-a-uuid')).toEqual({
      ref: 'Ab3Xy9Qz',
      pack: undefined,
    });
  });

  it('returns null when the code is invalid', () => {
    expect(parseReferralStartParam(`bad!code_${PACK}`)).toBeNull();
  });
});
