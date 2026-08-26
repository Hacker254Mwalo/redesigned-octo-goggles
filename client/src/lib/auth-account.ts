export const ACCOUNT_MIN_PASSWORD_LENGTH = 8;

export function validateMtaaMarketPassword(password: string) {
  if (password.length < ACCOUNT_MIN_PASSWORD_LENGTH) return "Use at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Use at least one letter and one number.";
  return null;
}

export function passwordRecoveryNotice() {
  return "If an account matches that email, MtaaMarket will send password recovery instructions shortly. Check Spam too while the sender domain is being improved.";
}

export function passwordSignupNotice() {
  return "Check your email to verify the new account before signing in. The verification link expires, so use the newest message.";
}

export function accountActionErrorMessage() {
  return "MtaaMarket could not complete that account step. Check your details and try again later.";
}
