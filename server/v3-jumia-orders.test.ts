import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({ getSupabaseServiceClient: vi.fn() }));
vi.mock("./v3-profiles", () => ({ requireV3Owner: vi.fn(), saveV3BuyerOrderProfile: vi.fn() }));

import { getSupabaseServiceClient } from "./supabase";
import { requireV3Owner, saveV3BuyerOrderProfile } from "./v3-profiles";
import { assertJumiaOrderTransition, createV3JumiaOrder, updateV3OwnerJumiaOrder } from "./v3-jumia-orders";

const buyer = { subject: "11111111-1111-4111-8111-111111111111", email: "buyer@example.test", issuedAt: 0 };
const owner = { subject: "22222222-2222-4222-8222-222222222222", email: "owner@example.test", issuedAt: 0 };

function chain(results: { maybeSingle?: unknown; single?: unknown }) {
  const value: Record<string, ReturnType<typeof vi.fn>> & { maybeSingle?: ReturnType<typeof vi.fn>; single?: ReturnType<typeof vi.fn> } = {};
  for (const method of ["select", "order", "eq", "in", "insert", "update", "delete"]) value[method] = vi.fn().mockReturnValue(value);
  value.maybeSingle = vi.fn().mockResolvedValue(results.maybeSingle ?? { data: null, error: null });
  value.single = vi.fn().mockResolvedValue(results.single ?? { data: null, error: null });
  return value;
}

beforeEach(() => vi.clearAllMocks());

describe("normal Jumia customer orders", () => {
  it("does not require owner approval and starts unpaid for collection", async () => {
    const profile = chain({ maybeSingle: { data: { id: buyer.subject, full_name: "Buyer", phone_number: "254712345678" }, error: null } });
    const order = chain({ single: { data: { id: "33333333-3333-4333-8333-333333333333", order_number: "JM-260827-ABC123", status: "placed", payment_status: "not_due" }, error: null } });
    let call = 0;
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from: vi.fn().mockImplementation(() => [profile, order][call++]) } as never);

    await expect(createV3JumiaOrder(buyer, { items: [{ title: "43 inch smart TV", details: "Black smart TV with delivery-ready packaging.", quantity: 1 }], fulfilmentMethod: "siaya_pickup", paymentTiming: "pay_on_collection" })).resolves.toMatchObject({ status: "placed", payment_status: "not_due" });
    expect(profile.insert).not.toHaveBeenCalled();
    expect(order.insert).toHaveBeenCalledWith(expect.objectContaining({ buyer_profile_id: buyer.subject, status: "placed", payment_status: "not_due", payment_timing: "pay_on_collection", fulfilment_method: "siaya_pickup", quoted_amount: null }));
    expect(requireV3Owner).not.toHaveBeenCalled();
  });

  it("saves supplied buyer contact details and requires delivery payment timing for home delivery", async () => {
    const profile = chain({ maybeSingle: { data: { id: buyer.subject, full_name: "Buyer", phone_number: "254712345678" }, error: null } });
    const order = chain({ single: { data: { id: "44444444-4444-4444-8444-444444444444", order_number: "JM-260827-DEF456", status: "placed", payment_status: "not_due" }, error: null } });
    let call = 0;
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from: vi.fn().mockImplementation(() => [profile, order][call++]) } as never);

    await expect(createV3JumiaOrder(buyer, { items: [{ title: "School shoes", details: "Black school shoes, size 38, durable sole.", quantity: 2 }], fulfilmentMethod: "home_delivery", paymentTiming: "pay_on_delivery", preferredLocation: "Siaya Town", fullName: "Buyer", phone: "254712345678" })).resolves.toMatchObject({ status: "placed" });
    expect(saveV3BuyerOrderProfile).toHaveBeenCalledWith(buyer, { fullName: "Buyer", phone: "254712345678" });
    expect(order.insert).toHaveBeenCalledWith(expect.objectContaining({ payment_timing: "pay_on_delivery", fulfilment_method: "home_delivery", preferred_location: "Siaya Town" }));
  });

  it("keeps the customer-facing lifecycle separate from local vendor approval", () => {
    expect(() => assertJumiaOrderTransition("placed", "accepted")).toThrow("cannot move from placed");
    expect(() => assertJumiaOrderTransition("placed", "confirming")).not.toThrow();
    expect(() => assertJumiaOrderTransition("sourcing", "ready")).not.toThrow();
  });

  it("requires a refund status before cancelling a paid order", async () => {
    const current = chain({ maybeSingle: { data: { id: "55555555-5555-4555-8555-555555555555", status: "accepted", payment_status: "paid", confirmed_at: null, completed_at: null }, error: null } });
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from: vi.fn().mockReturnValue(current) } as never);

    await expect(updateV3OwnerJumiaOrder(owner, { orderId: "55555555-5555-4555-8555-555555555555", status: "cancelled", cancellationReason: "Item unavailable" })).rejects.toThrow("Record the refund");
    expect(requireV3Owner).toHaveBeenCalledWith(owner);
    expect(current.update).not.toHaveBeenCalled();
  });
});
