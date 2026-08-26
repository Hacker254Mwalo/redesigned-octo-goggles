import { describe, expect, it } from "vitest";
import { defaultDisplayNameForSupabaseIdentity } from "./supabase-profiles";

describe("Supabase UUID profile preparation", () => {
  it("derives a neutral display name from a verified email without assigning authority", () => {
    expect(defaultDisplayNameForSupabaseIdentity({ subject: "11111111-1111-4111-8111-111111111111", email: "siaya.farmer@example.com", issuedAt: null })).toBe("siaya farmer");
    expect(defaultDisplayNameForSupabaseIdentity({ subject: "11111111-1111-4111-8111-111111111111", email: null, issuedAt: null })).toBe("MtaaMarket member");
  });
});
