import { describe, expect, it } from "vitest";
import { assertLegacySellerListingCategoryCanPublish, assertOrderTransition, getPickupStationDeliveryNotice, makeOrderNumber, normalizeKenyanPhone, resolvePaymentTimingSnapshot, toVendorSafeOrderView, validateFulfilmentSelection } from "./marketplace-operations";

describe("marketplace order safeguards", () => {
  it("normalizes accepted Kenyan mobile formats to Daraja-compatible form", () => {
    expect(normalizeKenyanPhone("0712 345 678")).toBe("254712345678");
    expect(normalizeKenyanPhone("+254712345678")).toBe("254712345678");
    expect(normalizeKenyanPhone("712345678")).toBe("254712345678");
  });

  it("rejects an invalid mobile number before an STK request can start", () => {
    expect(() => normalizeKenyanPhone("12345")).toThrow(/valid Kenyan mobile/i);
  });

  it("only allows valid escrow lifecycle transitions", () => {
    expect(() => assertOrderTransition("paid_escrow", "ready_for_pickup")).not.toThrow();
    expect(() => assertOrderTransition("ready_for_pickup", "picked_up")).not.toThrow();
    expect(() => assertOrderTransition("pending_payment", "released_vendor")).toThrow(/cannot move/i);
    expect(() => assertOrderTransition("disputed", "picked_up")).toThrow(/cannot move/i);
  });

  it("creates a traceable marketplace order number", () => {
    expect(makeOrderNumber()).toMatch(/^MTAA-\d{6}-[A-Z0-9]{6}$/);
  });

  it("creates a distinct delivery update when an order reaches its pickup station", () => {
    expect(getPickupStationDeliveryNotice("MTAA-260826-ABC123")).toEqual({
      type: "delivery",
      title: "Arrived at your pickup station",
      body: "MTAA-260826-ABC123 has been delivered to your selected pickup station and is ready for collection.",
    });
  });

  it("keeps buyer contact, delivery notes, and payment identifiers out of vendor order views", () => {
    const safe = toVendorSafeOrderView({ id: 4, orderNumber: "MTAA-260826-ABC123", buyerProfileId: 3, vendorId: 2, pickupStationId: null, subtotal: "100.00", pickupFee: "0.00", totalAmount: "100.00", paymentStatus: "unpaid", status: "pending_payment", mpesaCheckoutRequestId: "secret-checkout", mpesaMerchantRequestId: "secret-merchant", mpesaReceiptNumber: "secret-receipt", paymentPhone: "254712345678", fulfilmentMethod: "home_delivery", customerFulfilmentNote: "Private gate details", deliveryArea: "Private address", buyerContactShared: false, paymentTimingSnapshot: "confirm_with_mtaamarket", platformNotes: "Owner-only note", autoReleaseAt: null, pickedUpAt: null, releasedAt: null, createdAt: new Date("2026-08-26"), updatedAt: new Date("2026-08-26") });
    expect(safe).toEqual(expect.objectContaining({ orderNumber: "MTAA-260826-ABC123", fulfilmentMethod: "home_delivery" }));
    expect(safe).not.toHaveProperty("paymentPhone");
    expect(safe).not.toHaveProperty("customerFulfilmentNote");
    expect(safe).not.toHaveProperty("deliveryArea");
    expect(safe).not.toHaveProperty("platformNotes");
  });

  it("captures a single seller payment timing but falls back to platform confirmation for mixed items", () => {
    expect(resolvePaymentTimingSnapshot(["pay_on_delivery"])).toBe("pay_on_delivery");
    expect(resolvePaymentTimingSnapshot(["pay_on_delivery", "pay_before"])).toBe("confirm_with_mtaamarket");
    expect(resolvePaymentTimingSnapshot([])).toBe("confirm_with_mtaamarket");
  });

  it("blocks livestock from the legacy seller-write path pending the UUID owner-review workflow", () => {
    expect(() => assertLegacySellerListingCategoryCanPublish("poultry-livestock")).toThrow(/owner review/i);
    expect(() => assertLegacySellerListingCategoryCanPublish("farm-garden")).not.toThrow();
  });

  it("requires enough location information for home delivery or an unverified collection point", () => {
    expect(() => validateFulfilmentSelection({ fulfilmentMethod: "home_delivery" })).toThrow(/delivery area/i);
    expect(() => validateFulfilmentSelection({ fulfilmentMethod: "collection_point" })).toThrow(/collection point/i);
    expect(() => validateFulfilmentSelection({ fulfilmentMethod: "home_delivery", deliveryArea: "Siaya Town" })).not.toThrow();
    expect(() => validateFulfilmentSelection({ fulfilmentMethod: "collection_point", customerFulfilmentNote: "Use the collection point near town" })).not.toThrow();
  });
});
