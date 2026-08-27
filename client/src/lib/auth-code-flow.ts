export type MtaaAccountCodeChallenge = "signup" | "recovery";

export function buildMtaaAccountCodeVerification(email: string, token: string, challenge: MtaaAccountCodeChallenge) {
  return { email, token, type: challenge } as const;
}

export function buildMtaaAccountCodeResend(email: string) {
  return { email, type: "signup" as const };
}

export function isSixDigitMtaaAccountCode(value: string) {
  return /^\d{6}$/.test(value);
}
