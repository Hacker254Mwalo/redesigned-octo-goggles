import { describe, expect, it } from "vitest";
import { emailCodeDeliveryNotice } from "../client/src/lib/auth-delivery";

describe("emailCodeDeliveryNotice", () => {
  it("offers code and Spam-folder guidance without promising inbox placement", () => {
    const notice = emailCodeDeliveryNotice("account verification");

    expect(notice).toContain("six-digit");
    expect(notice).toContain("check Spam");
    expect(notice).toContain("Junk");
    expect(notice).toContain("Send another code");
    expect(notice).not.toContain("guaranteed");
  });

  it("uses distinct user-facing purposes for the two code-only flows", () => {
    expect(emailCodeDeliveryNotice("account verification")).toContain("account verification code");
    expect(emailCodeDeliveryNotice("password recovery")).toContain("password recovery code");
  });
});
