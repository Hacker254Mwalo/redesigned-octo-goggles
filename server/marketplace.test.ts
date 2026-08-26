import { describe, expect, it } from "vitest";
import { assertMarketplaceRole, makeSlug } from "./marketplace";

describe("marketplace foundation helpers", () => {
  it("creates clean URL-safe slugs for stores and products", () => {
    expect(makeSlug("  Mtaa Shop — Nairobi!  ")).toBe("mtaa-shop-nairobi");
  });

  it("removes unsupported characters without creating empty separators", () => {
    expect(makeSlug("Power@@@Bank___20,000mAh")).toBe("power-bank-20-000mah");
  });

  it("blocks buyers from vendor-only and administrator-only areas", () => {
    expect(() => assertMarketplaceRole("buyer", ["vendor", "admin"])).toThrow(/permission/i);
    expect(() => assertMarketplaceRole("buyer", ["admin"])).toThrow(/permission/i);
  });

  it("allows a vendor in the vendor workspace but not the administrator workspace", () => {
    expect(() => assertMarketplaceRole("vendor", ["vendor", "admin"])).not.toThrow();
    expect(() => assertMarketplaceRole("vendor", ["admin"])).toThrow(/permission/i);
  });
});
