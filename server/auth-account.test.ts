import { describe, expect, it } from "vitest";
import { ACCOUNT_MIN_PASSWORD_LENGTH, passwordRecoveryNotice, validateMtaaMarketPassword } from "../client/src/lib/auth-account";

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
});
