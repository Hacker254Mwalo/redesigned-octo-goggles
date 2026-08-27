import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildMtaaAccountCodeResend,
  buildMtaaAccountCodeVerification,
  isSixDigitMtaaAccountCode,
} from "../client/src/lib/auth-code-flow";

describe("MtaaMarket account verification contracts", () => {
  it("creates separate provider payloads for new-account and password-recovery codes", () => {
    expect(buildMtaaAccountCodeVerification("buyer@example.com", "123456", "signup")).toEqual({
      email: "buyer@example.com",
      token: "123456",
      type: "signup",
    });
    expect(buildMtaaAccountCodeVerification("buyer@example.com", "654321", "recovery")).toEqual({
      email: "buyer@example.com",
      token: "654321",
      type: "recovery",
    });
    expect(buildMtaaAccountCodeResend("buyer@example.com")).toEqual({ email: "buyer@example.com", type: "signup" });
  });

  it("accepts exactly six numeric code digits", () => {
    expect(isSixDigitMtaaAccountCode("123456")).toBe(true);
    expect(isSixDigitMtaaAccountCode("12345")).toBe(false);
    expect(isSixDigitMtaaAccountCode("1234567")).toBe(false);
    expect(isSixDigitMtaaAccountCode("12a456")).toBe(false);
  });

  it("keeps returning-user sign-in password-based and reserves codes for signup and recovery", () => {
    const dialog = readFileSync(resolve(process.cwd(), "client/src/components/MtaaAccountDialog.tsx"), "utf8");
    const context = readFileSync(resolve(process.cwd(), "client/src/contexts/SupabaseAuthContext.tsx"), "utf8");

    expect(dialog).toContain('type AccountMode = "password" | "signup" | "recovery"');
    expect(dialog).toContain("Create account & send code");
    expect(dialog).toContain("Send recovery code");
    expect(dialog).not.toContain("Send six-digit sign-in code");
    expect(context).not.toContain("requestEmailCode");
    expect(context).not.toContain("verifyEmailCode");
  });
});
