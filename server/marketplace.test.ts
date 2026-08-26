import { describe, expect, it } from "vitest";
import { ASSISTED_REQUEST_ACCEPTED_REPLY, assertAssistedOrderTransition, assertMarketplaceRole, buildAssistedOrderFromRequest, CATEGORY_SEED, convertRequestToAssistedOrder, getProductModerationUpdate, getVendorGovernanceUpdate, makeAssistedOrderNumber, makeSlug, validateExternalSourceDisclosure } from "./marketplace";

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

  it("creates traceable assisted-market order numbers and enforces their owner-managed lifecycle", () => {
    expect(makeAssistedOrderNumber(new Date("2026-08-26T00:00:00.000Z"))).toMatch(/^AM-260826-[A-Z0-9]{6}$/);
    expect(() => assertAssistedOrderTransition("recorded", "confirmed")).not.toThrow();
    expect(() => assertAssistedOrderTransition("sourcing", "ready")).not.toThrow();
    expect(() => assertAssistedOrderTransition("recorded", "completed")).toThrow(/cannot move/i);
    expect(() => assertAssistedOrderTransition("completed", "sourcing")).toThrow(/cannot move/i);
  });

  it("applies vendor approval and suspension controls without changing the owner’s authority", () => {
    const pendingVendor = { approvedAt: null, suspendedAt: null } as any;
    const approved = getVendorGovernanceUpdate(pendingVendor, "approved", "Verified by owner", new Date("2026-08-26"));
    expect(approved).toMatchObject({ approvalStatus: "approved", isActive: true, isVerified: true, ownerNotes: "Verified by owner" });
    const suspended = getVendorGovernanceUpdate({ ...pendingVendor, approvedAt: new Date("2026-08-25") }, "suspended", undefined, new Date("2026-08-26"));
    expect(suspended).toMatchObject({ approvalStatus: "suspended", isActive: false, isVerified: false });
    expect(suspended.suspendedAt).toEqual(new Date("2026-08-26"));
  });

  it("pauses or removes individual listings through a distinct moderation state", () => {
    const activeProduct = { status: "active" } as any;
    expect(getProductModerationUpdate(activeProduct, "paused")).toEqual({ moderationStatus: "paused", status: "active" });
    expect(getProductModerationUpdate(activeProduct, "removed")).toEqual({ moderationStatus: "removed", status: "archived" });
    expect(getProductModerationUpdate(activeProduct, "visible")).toEqual({ moderationStatus: "visible", status: "active" });
  });

  it("includes the governed Poultry & Livestock category in fallback discovery", () => {
    expect(CATEGORY_SEED).toContainEqual(expect.objectContaining({
      slug: "poultry-livestock",
      name: "Poultry & Livestock",
      icon: "Beef",
    }));
  });

  it("converts a request into a platform-controlled Assisted Market order with its source and fulfilment preference intact", () => {
    const draft = buildAssistedOrderFromRequest({ id: 9, customerName: null, customerPhone: null, title: "School backpack", details: "Blue, durable, and suitable for a primary-school learner.", quotedPrice: "2200.00", budgetHint: "2500.00", preferredFulfilment: "home_delivery", preferredLocation: "Siaya Town", sourceRoute: "approved_vendor" } as any, "Offline customer");
    expect(draft).toEqual(expect.objectContaining({ itemRequestId: 9, customerName: "Offline customer", quotedAmount: 2200, fulfilmentMethod: "home_delivery", sourceRoute: "approved_vendor", paymentTiming: "confirm_with_mtaamarket" }));
  });

  it("requires an owner-recorded customer confirmation for an external marketplace route", () => {
    expect(() => validateExternalSourceDisclosure("external_marketplace")).toThrow(/customer's confirmation/i);
    expect(() => validateExternalSourceDisclosure("external_marketplace", "too short")).toThrow(/customer's confirmation/i);
    expect(() => validateExternalSourceDisclosure("external_marketplace", "Customer understands this is MtaaMarket manual sourcing, not an external marketplace partnership.")).toThrow(/content is original/i);
    expect(validateExternalSourceDisclosure("external_marketplace", "Customer understands this is MtaaMarket manual sourcing, not an external marketplace partnership.", true)).toContain("manual sourcing");
    expect(validateExternalSourceDisclosure("approved_vendor")).toBeUndefined();
  });

  it("creates the linked assisted order before marking the source request accepted", async () => {
    const events: string[] = [];
    const request = { id: 12, customerName: null, customerPhone: "254712345678", title: "Household kettle", details: "A reliable electric kettle for home use.", quotedPrice: null, budgetHint: "1800.00", preferredFulfilment: "collection_point", preferredLocation: "Siaya Town", sourceRoute: null } as any;
    const created = await convertRequestToAssistedOrder(request, "Request buyer", {
      createOrder: async input => { events.push(`create:${input.itemRequestId}:${input.title}`); return { id: 77, input }; },
      markRequestAccepted: async requestId => { events.push(`accepted:${requestId}:${ASSISTED_REQUEST_ACCEPTED_REPLY}`); },
    });
    expect(created).toMatchObject({ id: 77, input: { itemRequestId: 12, customerName: "Request buyer", quotedAmount: 1800 } });
    expect(events).toEqual(["create:12:Household kettle", `accepted:12:${ASSISTED_REQUEST_ACCEPTED_REPLY}`]);
  });

  it("carries the owner-recorded disclosure through an external-marketplace request conversion before the order handler runs", async () => {
    const request = { id: 18, customerName: null, customerPhone: null, title: "Laptop sleeve", details: "Protective sleeve for a 14-inch laptop.", quotedPrice: null, budgetHint: "1800.00", preferredFulfilment: "siaya_pickup", preferredLocation: "Siaya Town", sourceRoute: "external_marketplace" } as any;
    const disclosure = "Customer understands this is independent MtaaMarket manual sourcing, not a marketplace partnership.";
    const created = await convertRequestToAssistedOrder(request, "Request buyer", {
      createOrder: async input => ({ input }),
      markRequestAccepted: async () => undefined,
    }, disclosure, true);
    expect(created).toMatchObject({ input: { itemRequestId: 18, sourceRoute: "external_marketplace", externalSourceDisclosure: disclosure, externalContentAttestation: true } });
  });
});
