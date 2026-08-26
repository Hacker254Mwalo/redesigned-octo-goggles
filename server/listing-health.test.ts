import { describe, expect, it } from "vitest";
import { assessListingHealth } from "../client/src/lib/listingHealth";

describe("Seller Studio listing health", () => {
  it("blocks a weak listing until the seller supplies core product, photo, and fulfilment facts", () => {
    const checks = assessListingHealth({ title: "Bag", description: "Too short", categoryId: "", price: "", stockQuantity: "0", fulfilmentOptions: [] });
    expect(checks.filter(check => check.ok)).toHaveLength(0);
  });

  it("recognizes a complete physical-product listing", () => {
    const checks = assessListingHealth({ title: "Durable school backpack", description: "A clean everyday backpack with padded straps, one main compartment, and a front pocket for school supplies.", categoryId: "3", imageDataUrl: "data:image/webp;base64,abc", price: "1850", stockQuantity: "4", fulfilmentOptions: ["siaya_pickup"] });
    expect(checks.every(check => check.ok)).toBe(true);
  });
});
