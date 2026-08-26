import { describe, expect, it } from "vitest";
import { magicLinkDeliveryNotice } from "../client/src/lib/auth-delivery";

describe("magicLinkDeliveryNotice", () => {
  it("offers recovery guidance without promising inbox placement", () => {
    const notice = magicLinkDeliveryNotice();

    expect(notice).toContain("check Spam");
    expect(notice).toContain("not spam");
    expect(notice).toContain("custom-domain email authentication");
    expect(notice).not.toContain("guaranteed");
  });
});
