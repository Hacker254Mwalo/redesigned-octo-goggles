export type MtaaAccountCodeChallenge = "signup" | "recovery";

export const MTAAMARKET_ACCOUNT_CODE_LENGTHS = [6, 8] as const;

export function buildMtaaAccountCodeVerification(email: string, token: string, challenge: MtaaAccountCodeChallenge) {
  return { email, token, type: challenge } as const;
}

export function buildMtaaAccountCodeResend(email: string) {
  return { email, type: "signup" as const };
}

/** Supabase projects may be configured with six- or eight-digit email tokens. Accept only those exact numeric formats. */
export function isMtaaMarketAccountCode(value: string) {
  return /^(?:\d{6}|\d{8})$/.test(value);
}
