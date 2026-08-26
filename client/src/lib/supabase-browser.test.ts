import { describe, expect, it } from "vitest";
import { getSupabaseAuthCode } from "./supabase-browser";

describe("Supabase email callback parsing", () => {
  it("extracts only the PKCE code from the callback query", () => {
    expect(getSupabaseAuthCode("?code=one-time-code&next=ignored")).toBe("one-time-code");
    expect(getSupabaseAuthCode("?error=access_denied")).toBeNull();
  });
});
