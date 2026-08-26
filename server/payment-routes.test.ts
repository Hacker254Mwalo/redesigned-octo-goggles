import { describe, expect, it } from "vitest";
import { safeEqual } from "./payment-routes";

describe("M-Pesa callback token guard", () => {
  it("accepts an exact server-side callback token", () => {
    expect(safeEqual("server-only-token", "server-only-token")).toBe(true);
  });

  it("rejects a different, truncated, or extended callback token", () => {
    expect(safeEqual("server-only-token", "server-only-tokeN")).toBe(false);
    expect(safeEqual("server-only-token", "server-only")).toBe(false);
    expect(safeEqual("server-only-token", "server-only-token-extra")).toBe(false);
  });
});
