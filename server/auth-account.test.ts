import { describe, expect, it } from "vitest";
import { ACCOUNT_EMAIL_ACTION_COOLDOWN_SECONDS, ACCOUNT_MIN_PASSWORD_LENGTH, accountEmailCooldownNotice, passwordRecoveryNotice, validateMtaaMarketPassword } from "../client/src/lib/auth-account";

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
});
