import { describe, expect, it } from "vitest";
import { normalizeKenyanMobilePhone } from "./kenyan-phone";

describe("normalizeKenyanMobilePhone", () => {
  it.each([
    ["0712345678", "254712345678"],
    ["0112345678", "254112345678"],
    ["254712345678", "254712345678"],
    ["+254712345678", "254712345678"],
    ["254112345678", "254112345678"],
    ["+254112345678", "254112345678"],
    ["07 1234-5678", "254712345678"],
  ])("normalizes %s", (input, expected) => expect(normalizeKenyanMobilePhone(input)).toBe(expected));
  it.each(["", "071234567", "0612345678", "254612345678", "+254 712345678x"])("rejects %s", input => expect(normalizeKenyanMobilePhone(input)).toBeNull());
});
