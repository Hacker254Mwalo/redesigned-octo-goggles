import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({ getSupabaseServiceClient: vi.fn() }));
vi.mock("./supabase-profiles", () => ({ ensureSupabaseMarketplaceProfile: vi.fn() }));
vi.mock("./v3-profiles", () => ({ requireV3Owner: vi.fn() }));

import { getSupabaseServiceClient } from "./supabase";
import { ensureSupabaseMarketplaceProfile } from "./supabase-profiles";
import { requireV3Owner } from "./v3-profiles";
import { createV3ItemRequest, listV3OwnerItemRequests } from "./v3-requests";

const buyer = { subject: "11111111-1111-4111-8111-111111111111", email: "buyer@example.test", issuedAt: 0 };
const owner = { subject: "22222222-2222-4222-8222-222222222222", email: "owner@example.test", issuedAt: 0 };

beforeEach(() => vi.clearAllMocks());

describe("V3 Request Desk intake", () => {
  it("requires a verified Supabase identity before creating a private request", async () => {
    await expect(createV3ItemRequest(null, { title: "School backpack", details: "Durable backpack for a primary school learner.", preferredFulfilment: "siaya_pickup" })).rejects.toThrow("verified MtaaMarket email");
    expect(ensureSupabaseMarketplaceProfile).not.toHaveBeenCalled();
    expect(getSupabaseServiceClient).not.toHaveBeenCalled();
  });

  it("uses the verified profile and stores no buyer phone, customer name, supplier route, payment, or delivery promise", async () => {
    vi.mocked(ensureSupabaseMarketplaceProfile).mockResolvedValue({ id: buyer.subject, displayName: "Buyer", role: "buyer" });
    const requests = { insert: vi.fn(), select: vi.fn(), single: vi.fn() };
    requests.insert.mockReturnValue(requests);
    requests.select.mockReturnValue(requests);
    requests.single.mockResolvedValue({ data: { id: "33333333-3333-4333-8333-333333333333", status: "submitted", created_at: "2026-08-27T00:00:00.000Z" }, error: null });
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from: vi.fn().mockReturnValue(requests) } as never);

    await expect(createV3ItemRequest(buyer, { title: "  School   backpack ", details: " A durable school backpack for a primary learner. ", budgetHint: 2500, preferredFulfilment: "siaya_pickup", preferredLocation: " Siaya Town " })).resolves.toMatchObject({ status: "submitted" });

    expect(requests.insert).toHaveBeenCalledWith({ buyer_profile_id: buyer.subject, created_by_profile_id: buyer.subject, is_assisted: false, customer_name: null, customer_phone: null, title: "School backpack", details: "A durable school backpack for a primary learner.", budget_hint: 2500, preferred_fulfilment: "siaya_pickup", preferred_location: "Siaya Town", status: "submitted", source_route: null });
  });

  it("allows only the verified owner to load a contact-free Request Desk review queue", async () => {
    const queue = { select: vi.fn(), order: vi.fn() };
    queue.select.mockReturnValue(queue);
    queue.order.mockResolvedValue({ data: [{ id: "44444444-4444-4444-8444-444444444444", title: "School backpack", status: "submitted" }], error: null });
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from: vi.fn().mockReturnValue(queue) } as never);

    await expect(listV3OwnerItemRequests(owner)).resolves.toEqual([{ id: "44444444-4444-4444-8444-444444444444", title: "School backpack", status: "submitted" }]);
    expect(requireV3Owner).toHaveBeenCalledWith(owner);
    expect(queue.select).toHaveBeenCalledWith("id,title,details,budget_hint,preferred_fulfilment,preferred_location,status,created_at,updated_at");
  });
});
