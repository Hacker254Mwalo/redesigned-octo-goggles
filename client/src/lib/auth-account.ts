export const ACCOUNT_MIN_PASSWORD_LENGTH = 8;
export const ACCOUNT_EMAIL_ACTION_COOLDOWN_SECONDS = 60;

export function validateMtaaMarketPassword(password: string) {
  if (password.length < ACCOUNT_MIN_PASSWORD_LENGTH) return "Use at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Use at least one letter and one number.";
  return null;
}

export function passwordRecoveryNotice() {
  return "If an account matches that email, MtaaMarket will send a six-digit recovery code shortly. Check Spam or Junk if it is not visible after a few minutes.";
}

export function passwordSignupNotice() {
  return "We sent a six-digit code to verify the new password account. Enter it here to complete account setup.";
}

export function accountActionErrorMessage() {
  return "MtaaMarket could not complete that account step. Check your details and try again later.";
}

export function accountEmailCooldownNotice(seconds: number = ACCOUNT_EMAIL_ACTION_COOLDOWN_SECONDS) {
  const safeSeconds = Math.max(1, Math.ceil(seconds));
  return `For account security, wait ${safeSeconds} seconds before requesting another email.`;
}
