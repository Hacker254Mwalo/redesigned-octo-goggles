import { describe, expect, it } from "vitest";
import { assertOrderTransition, getPickupStationDeliveryNotice, makeOrderNumber, normalizeKenyanPhone } from "./marketplace-operations";

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
});
