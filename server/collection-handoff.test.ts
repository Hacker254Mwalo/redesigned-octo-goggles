import { describe, expect, it } from "vitest";
import { buildCollectionBrief, collectionSafetySteps } from "../client/src/lib/collection-handoff";

describe("MtaaMarket parcel collection brief", () => {
  it("creates a confirmation-gated brief without payment or exact-address data", () => {
    const brief = buildCollectionBrief({
      items: [{ id: 1, slug: "lantern", title: "Sample Listing — Solar lantern", category: "Home", price: 900, quantity: 2 }],
      fulfilmentMethod: "collection_point",
      broadLocation: " Siaya Town ",
      preferenceNote: " Saturday if confirmed ",
      createdAt: "2026-08-26T18:00:00.000Z",
    });
    expect(brief).toMatchObject({ requiresOwnerConfirmation: true, paymentInstructionsConfirmed: false, broadLocation: "Siaya Town" });
    expect(brief.items).toEqual([{ title: "Solar lantern", quantity: 2 }]);
    expect(JSON.stringify(brief)).not.toContain("price");
  });

  it("includes a clear hand-off safety boundary", () => {
    expect(collectionSafetySteps.join(" ")).toContain("Do not add a house number");
    expect(collectionSafetySteps.join(" ")).toContain("confirm");
  });
});
