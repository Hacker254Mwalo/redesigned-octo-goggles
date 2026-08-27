import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({ getSupabaseServiceClient: vi.fn() }));
vi.mock("./supabase-profiles", () => ({ ensureSupabaseMarketplaceProfile: vi.fn() }));
vi.mock("./v3-profiles", () => ({ requireV3Owner: vi.fn() }));

import { getSupabaseServiceClient } from "./supabase";
import { ensureSupabaseMarketplaceProfile } from "./supabase-profiles";
import { requireV3Owner } from "./v3-profiles";
import { assertV3AssistedOrderTransition, createV3AssistedOrderFromRequest, createV3ItemRequest, listV3OwnerAssistedOrders, listV3OwnerItemRequests, updateV3AssistedOrder, updateV3ItemRequest } from "./v3-requests";

const buyer = { subject: "11111111-1111-4111-8111-111111111111", email: "buyer@example.test", issuedAt: 0 };
const owner = { subject: "22222222-2222-4222-8222-222222222222", email: "owner@example.test", issuedAt: 0 };

function chain(results: { maybeSingle?: unknown; single?: unknown }) {
  const value: Record<string, ReturnType<typeof vi.fn>> & { maybeSingle?: ReturnType<typeof vi.fn>; single?: ReturnType<typeof vi.fn> } = {};
  for (const method of ["select", "order", "eq", "insert", "update", "delete"]) value[method] = vi.fn().mockReturnValue(value);
  value.maybeSingle = vi.fn().mockResolvedValue(results.maybeSingle ?? { data: null, error: null });
  value.single = vi.fn().mockResolvedValue(results.single ?? { data: null, error: null });
  return value;
}

beforeEach(() => vi.clearAllMocks());

describe("V3 Request Desk intake", () => {
  it("requires a verified Supabase identity before creating a private request", async () => {
    await expect(createV3ItemRequest(null, { title: "School backpack", details: "Durable backpack for a primary school learner.", preferredFulfilment: "siaya_pickup" })).rejects.toThrow("verified MtaaMarket email");
    expect(ensureSupabaseMarketplaceProfile).not.toHaveBeenCalled();
    expect(getSupabaseServiceClient).not.toHaveBeenCalled();
  });

  it("uses the verified profile and stores a Jumia-assisted intent without buyer phone, customer name, payment, or delivery promise", async () => {
    vi.mocked(ensureSupabaseMarketplaceProfile).mockResolvedValue({ id: buyer.subject, displayName: "Buyer", role: "buyer" });
    const requests = chain({ single: { data: { id: "33333333-3333-4333-8333-333333333333", status: "submitted", created_at: "2026-08-27T00:00:00.000Z" }, error: null } });
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from: vi.fn().mockReturnValue(requests) } as never);

    await expect(createV3ItemRequest(buyer, { title: "  School   backpack ", details: " A durable school backpack for a primary learner. ", budgetHint: 2500, preferredFulfilment: "siaya_pickup", preferredLocation: " Siaya Town " })).resolves.toMatchObject({ status: "submitted" });

    expect(requests.insert).toHaveBeenCalledWith({ buyer_profile_id: buyer.subject, created_by_profile_id: buyer.subject, is_assisted: true, customer_name: null, customer_phone: null, title: "School backpack", details: "A durable school backpack for a primary learner.", budget_hint: 2500, preferred_fulfilment: "siaya_pickup", preferred_location: "Siaya Town", status: "submitted", source_route: "external_marketplace" });
  });

  it("allows only the verified owner to load a contact-free Request Desk review queue", async () => {
    const queue = chain({});
    queue.order.mockResolvedValue({ data: [{ id: "44444444-4444-4444-8444-444444444444", title: "School backpack", status: "submitted" }], error: null });
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from: vi.fn().mockReturnValue(queue) } as never);

    await expect(listV3OwnerItemRequests(owner)).resolves.toEqual([{ id: "44444444-4444-4444-8444-444444444444", title: "School backpack", status: "submitted" }]);
    expect(requireV3Owner).toHaveBeenCalledWith(owner);
    expect(queue.select).toHaveBeenCalledWith("id,title,details,budget_hint,preferred_fulfilment,preferred_location,status,source_route,quoted_price,platform_reply,created_at,updated_at");
  });

  it("saves an owner review, manual source route, quote, and private reply", async () => {
    const current = chain({ maybeSingle: { data: { id: "55555555-5555-4555-8555-555555555555", status: "submitted", source_route: null }, error: null } });
    const updated = chain({ maybeSingle: { data: { id: "55555555-5555-4555-8555-555555555555", status: "quoted", source_route: "external_marketplace", quoted_price: 3200, platform_reply: "Owner will confirm the exact item before payment.", updated_at: "2026-08-27T00:00:00.000Z" }, error: null } });
    let call = 0;
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from: vi.fn().mockImplementation(() => [current, updated][call++]) } as never);

    await expect(updateV3ItemRequest(owner, { requestId: "55555555-5555-4555-8555-555555555555", status: "quoted", sourceRoute: "external_marketplace", quotedPrice: 3200, platformReply: " Owner will confirm the exact item before payment. " })).resolves.toMatchObject({ status: "quoted" });
    expect(requireV3Owner).toHaveBeenCalledWith(owner);
    expect(updated.update).toHaveBeenCalledWith({ status: "quoted", source_route: "external_marketplace", quoted_price: 3200, platform_reply: "Owner will confirm the exact item before payment." });
  });
});

describe("V3 Assisted Market owner workflow", () => {
  it("requires customer confirmation and original content before an external route can become an assisted order", async () => {
    const request = chain({ maybeSingle: { data: { id: "66666666-6666-4666-8666-666666666666", buyer_profile_id: buyer.subject, created_by_profile_id: buyer.subject, title: "School backpack", details: "A durable backpack for a primary learner.", budget_hint: 2500, preferred_fulfilment: "siaya_pickup", preferred_location: "Siaya Town", status: "quoted", source_route: "external_marketplace", quoted_price: 3200 }, error: null } });
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from: vi.fn().mockReturnValue(request) } as never);

    await expect(createV3AssistedOrderFromRequest(owner, "66666666-6666-4666-8666-666666666666")).rejects.toThrow("customer's confirmation");
    expect(request.insert).not.toHaveBeenCalled();
  });

  it("creates a protected assisted order, records the external disclosure, and accepts the linked request", async () => {
    const request = chain({ maybeSingle: { data: { id: "77777777-7777-4777-8777-777777777777", buyer_profile_id: buyer.subject, created_by_profile_id: buyer.subject, title: "School backpack", details: "A durable backpack for a primary learner.", budget_hint: 2500, preferred_fulfilment: "siaya_pickup", preferred_location: "Siaya Town", status: "quoted", source_route: "external_marketplace", quoted_price: 3200 }, error: null } });
    const profile = chain({ maybeSingle: { data: { id: buyer.subject, full_name: "Buyer", phone_number: "254712345678" }, error: null } });
    const assisted = chain({ single: { data: { id: "88888888-8888-4888-8888-888888888888", assisted_order_number: "AM-260827-ABC123", status: "recorded" }, error: null } });
    const linked = chain({ maybeSingle: { data: { id: "77777777-7777-4777-8777-777777777777", status: "accepted" }, error: null } });
    let call = 0;
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from: vi.fn().mockImplementation(() => [request, profile, assisted, linked][call++]) } as never);

    await expect(createV3AssistedOrderFromRequest(owner, "77777777-7777-4777-8777-777777777777", "Customer understands MtaaMarket is independently sourcing this item and will confirm the final price and handover before payment.", true)).resolves.toMatchObject({ status: "recorded" });
    expect(assisted.insert).toHaveBeenCalledWith(expect.objectContaining({ item_request_id: "77777777-7777-4777-8777-777777777777", owner_profile_id: owner.subject, customer_name: "Buyer", customer_phone: "254712345678", source_route: "external_marketplace", status: "recorded", external_source_disclosure: expect.stringContaining("independently sourcing") }));
    expect(linked.update).toHaveBeenCalledWith({ status: "accepted", platform_reply: "MtaaMarket has opened an Assisted Market order and will confirm the next step." });
  });

  it("loads an owner-only fulfillment queue without exposing customer contact fields", async () => {
    const queue = chain({});
    queue.order.mockResolvedValue({ data: [{ id: "99999999-9999-4999-8999-999999999999", assisted_order_number: "AM-260827-ABC123", title: "School backpack", status: "ready", fulfilment_method: "siaya_pickup" }], error: null });
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from: vi.fn().mockReturnValue(queue) } as never);

    await expect(listV3OwnerAssistedOrders(owner)).resolves.toMatchObject([{ status: "ready" }]);
    expect(queue.select).toHaveBeenCalledWith("id,assisted_order_number,item_request_id,title,details,quoted_amount,payment_timing,fulfilment_method,preferred_location,source_route,status,platform_notes,confirmed_at,completed_at,created_at,updated_at,external_source_disclosure,external_source_confirmed_at,external_source_content_attested_at");
    expect(String(queue.select.mock.calls[0][0])).not.toContain("customer_phone");
  });

  it("enforces the documented assisted-order progression and allows same-status detail saves", async () => {
    expect(() => assertV3AssistedOrderTransition("recorded", "sourcing")).toThrow("cannot move from recorded");
    expect(() => assertV3AssistedOrderTransition("ready", "recorded")).toThrow("cannot move from ready");

    const current = chain({ maybeSingle: { data: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", status: "ready", item_request_id: null, platform_notes: null, quoted_amount: null, payment_timing: "confirm_with_mtaamarket", fulfilment_method: "siaya_pickup", confirmed_at: null, completed_at: null }, error: null } });
    const updated = chain({ maybeSingle: { data: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", status: "ready", updated_at: "2026-08-27T00:00:00.000Z" }, error: null } });
    let call = 0;
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from: vi.fn().mockImplementation(() => [current, updated][call++]) } as never);

    await expect(updateV3AssistedOrder(owner, { assistedOrderId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", status: "ready", platformNotes: "Collection point confirmed." })).resolves.toMatchObject({ status: "ready" });
    expect(updated.update).toHaveBeenCalledWith(expect.objectContaining({ status: "ready", platform_notes: "Collection point confirmed." }));
  });
});
