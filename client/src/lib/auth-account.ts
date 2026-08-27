export const ACCOUNT_MIN_PASSWORD_LENGTH = 8;
export const ACCOUNT_EMAIL_ACTION_COOLDOWN_SECONDS = 60;

export function validateMtaaMarketPassword(password: string) {
  if (password.length < ACCOUNT_MIN_PASSWORD_LENGTH) return "Use at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Use at least one letter and one number.";
  return null;
}

export function passwordRecoveryNotice() {
  return "If an account matches that email, MtaaMarket will send a verification code shortly. Check Spam or Junk if it is not visible after a few minutes.";
}

export function passwordSignupNotice() {
  return "We sent a verification code to verify the new password account. Enter it here to complete account setup.";
}

export function accountActionErrorMessage(error?: unknown) {
  const authError = error as { code?: unknown; message?: unknown } | undefined;
  const code = typeof authError?.code === "string" ? authError.code : "";
  const message = typeof authError?.message === "string" ? authError.message.toLowerCase() : "";
  if (code === "same_password" || message.includes("different from the old password")) {
    return "Choose a different password than your current password, then save it again.";
  }
  return "MtaaMarket could not complete that account step. Check your details and try again later.";
}

export function accountEmailCooldownNotice(seconds: number = ACCOUNT_EMAIL_ACTION_COOLDOWN_SECONDS) {
  const safeSeconds = Math.max(1, Math.ceil(seconds));
  return `For account security, wait ${safeSeconds} seconds before requesting another email.`;
}
