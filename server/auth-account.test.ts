import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ACCOUNT_EMAIL_ACTION_COOLDOWN_SECONDS, ACCOUNT_MIN_PASSWORD_LENGTH, accountActionErrorMessage, accountEmailCooldownNotice, passwordRecoveryNotice, validateMtaaMarketPassword } from "../client/src/lib/auth-account";

const supabaseAuthContextSource = readFileSync(
  new URL("../client/src/contexts/SupabaseAuthContext.tsx", import.meta.url),
  "utf8",
);
const accountDialogSource = readFileSync(
  new URL("../client/src/components/MtaaAccountDialog.tsx", import.meta.url),
  "utf8",
);

describe("MtaaMarket email/password account safeguards", () => {
  it("requires an eight-character password with both letters and digits", () => {
    expect(ACCOUNT_MIN_PASSWORD_LENGTH).toBe(8);
    expect(validateMtaaMarketPassword("short1")).toBe("Use at least 8 characters.");
    expect(validateMtaaMarketPassword("onlyletters")).toBe("Use at least one letter and one number.");
    expect(validateMtaaMarketPassword("12345678")).toBe("Use at least one letter and one number.");
    expect(validateMtaaMarketPassword("Mtaa2026")).toBeNull();
  });

  it("keeps password recovery responses non-enumerating", () => {
    const notice = passwordRecoveryNotice();
    expect(notice).toContain("If an account matches that email");
    expect(notice).toContain("verification code");
    expect(notice).not.toContain("six-digit");
    expect(notice).not.toContain("does not exist");
  });

  it("explains when Supabase rejects a password that matches the current password", () => {
    expect(accountActionErrorMessage({ code: "same_password" })).toContain("different password");
    expect(accountActionErrorMessage({ message: "New password should be different from the old password." })).toContain("different password");
    expect(accountActionErrorMessage({ code: "unexpected" })).toContain("could not complete");
  });

  it("gives actionable login diagnostics without revealing account existence", () => {
    expect(accountActionErrorMessage({ code: "invalid_credentials" })).toContain("email or password is incorrect");
    expect(accountActionErrorMessage({ message: "Email not confirmed" })).toContain("Verify your email");
    expect(accountActionErrorMessage({ message: "Failed to fetch" })).toContain("could not reach the account service");
  });

  it("uses a short, transparent cooldown to reduce duplicate account-email requests", () => {
    expect(ACCOUNT_EMAIL_ACTION_COOLDOWN_SECONDS).toBe(60);
    expect(accountEmailCooldownNotice()).toContain("wait 60 seconds");
    expect(accountEmailCooldownNotice(1.2)).toContain("wait 2 seconds");
  });

  it("keeps passwords client-to-provider only and cannot assign marketplace roles during account actions", () => {
    expect(supabaseAuthContextSource).toContain("auth.signUp({");
    expect(supabaseAuthContextSource).toContain("auth.signInWithPassword({ email, password })");
    expect(supabaseAuthContextSource).toContain("auth.resetPasswordForEmail(email");
    expect(supabaseAuthContextSource).toContain("auth.updateUser({ password })");
    expect(supabaseAuthContextSource).toContain("sessionStorage.setItem(SUPABASE_ACCESS_TOKEN_KEY, session.access_token)");
    expect(supabaseAuthContextSource).not.toMatch(/(?:localStorage|sessionStorage)\.[^(]+\([^)]*password/i);
    expect(supabaseAuthContextSource).not.toMatch(/password[^\n]*(?:localStorage|sessionStorage)/i);
    expect(supabaseAuthContextSource).not.toMatch(/\brole\s*:/i);
  });

  it("keeps the public account dialog keyboard-accessible without adding verification friction to returning users", () => {
    expect(accountDialogSource).toContain('event.key === "Escape"');
    expect(accountDialogSource).toContain("window.addEventListener(\"keydown\", handleEscape)");
    expect(accountDialogSource).toContain("returnFocusRef.current?.focus()");
    expect(accountDialogSource).toContain("ref={emailInputRef}");
    expect(accountDialogSource).toContain("Use the email and password for your MtaaMarket account.");
    expect(accountDialogSource).toContain("Creating an account does not make you a seller.");
    expect(accountDialogSource).toContain("maxLength={8}");
    expect(accountDialogSource).not.toContain("six-digit code");
    expect(accountDialogSource).not.toContain("signInWithGoogle");
  });

  it("keeps reset-page recovery guidance aligned with the hosted code formats", () => {
    const resetPageSource = readFileSync(new URL("../client/src/pages/ResetPasswordPage.tsx", import.meta.url), "utf8");
    expect(resetPageSource).toContain("six- or eight-digit code");
    expect(resetPageSource).toContain("accountActionErrorMessage(error)");
  });

  it("keeps unconfigured Google OAuth and passwordless sign-in out of the production client account bridge", () => {
    expect(supabaseAuthContextSource).not.toContain('provider: "google"');
    expect(supabaseAuthContextSource).not.toContain("signInWithGoogle");
    expect(supabaseAuthContextSource).not.toContain("signInWithOtp");
    expect(supabaseAuthContextSource).not.toContain("requestEmailCode");
    expect(accountDialogSource).not.toContain("Email code");
    expect(accountDialogSource).not.toContain("Send six-digit sign-in code");
  });
});
