import { describe, expect, it } from "vitest";
import { extractSupabaseBearerToken } from "./supabase-auth";

describe("Supabase bearer-token bridge", () => {
  it("extracts exactly one bearer token without accepting arbitrary authorization formats", () => {
    expect(extractSupabaseBearerToken("Bearer verified-token")).toBe("verified-token");
    expect(extractSupabaseBearerToken(["Bearer first-token", "Bearer ignored-token"])).toBe("first-token");
    expect(extractSupabaseBearerToken("Basic ignored")).toBeNull();
    expect(extractSupabaseBearerToken(undefined)).toBeNull();
  });
});
