import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ACCOUNT_EMAIL_ACTION_COOLDOWN_SECONDS, ACCOUNT_MIN_PASSWORD_LENGTH, accountEmailCooldownNotice, passwordRecoveryNotice, validateMtaaMarketPassword } from "../client/src/lib/auth-account";

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
    expect(notice).not.toContain("does not exist");
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

  it("keeps the public account dialog keyboard-accessible without changing account-provider behavior", () => {
    expect(accountDialogSource).toContain('event.key !== "Escape"');
    expect(accountDialogSource).toContain("window.addEventListener(\"keydown\", handleEscape)");
    expect(accountDialogSource).toContain("returnFocusRef.current?.focus()");
    expect(accountDialogSource).toContain("ref={emailInputRef}");
    expect(accountDialogSource).toContain("Recommended: email link is ready now.");
    expect(accountDialogSource).toContain("Google sign-in will appear only after the MtaaMarket Google provider is securely configured.");
    expect(accountDialogSource).not.toContain("signInWithGoogle");
  });

  it("keeps the Google OAuth bridge dormant until the provider is configured", () => {
    expect(supabaseAuthContextSource).toContain('provider: "google"');
    expect(supabaseAuthContextSource).toContain('redirectTo: `${window.location.origin}/auth/callback`');
    expect(accountDialogSource).toContain("Google sign-in will appear only after the MtaaMarket Google provider is securely configured.");
    expect(accountDialogSource).not.toContain("signInWithGoogle");
  });
});
