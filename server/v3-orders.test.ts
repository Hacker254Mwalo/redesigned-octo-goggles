import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("./supabase", () => ({ getSupabaseServiceClient: vi.fn() }));
import { getSupabaseServiceClient } from "./supabase";
import { createV3HubOrder, listV3BuyerOrders, listV3OwnerOrders, listV3VendorOrders, reviewV3OrderStock, updateV3OrderStatus } from "./v3-orders";

const buyer = { subject: "11111111-1111-4111-8111-111111111111", email: "buyer@example.test", issuedAt: 0 };
const owner = { subject: "22222222-2222-4222-8222-222222222222", email: "owner@example.test", issuedAt: 0 };
function query(result: unknown) {
  const q: Record<string, any> = {};
  for (const method of ["select", "eq", "in", "order", "limit", "insert", "update"]) q[method] = vi.fn(() => q);
  q.maybeSingle = vi.fn().mockResolvedValue(result);
  q.single = vi.fn().mockResolvedValue(result);
  q.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => Promise.resolve(result).then(resolve, reject);
  return q;
}
beforeEach(() => vi.clearAllMocks());

describe("V3 order tracking", () => {
  it("requires buyer identity and scopes the feed to that profile", async () => {
    const orders = query({ data: [{ id: "order", pickup_pin: "0123", stock_review_status: "confirmed" }], error: null });
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from: vi.fn().mockReturnValue(orders) } as never);
    await expect(listV3BuyerOrders(null)).rejects.toThrow("Sign in");
    await expect(listV3BuyerOrders(buyer)).resolves.toEqual([{ id: "order", pickup_pin: "0123", stock_review_status: "confirmed" }]);
    expect(orders.eq).toHaveBeenCalledWith("buyer_profile_id", buyer.subject);
    expect(orders.select).toHaveBeenCalledWith(expect.stringContaining("pickup_pin"));
    expect(orders.limit).toHaveBeenCalledWith(100);
  });

  it("withholds pickup PINs until order availability is confirmed", async () => {
    const orders = query({ data: [
      { id: "pending", pickup_pin: "0123", stock_review_status: "pending" },
      { id: "unavailable", pickup_pin: "4567", stock_review_status: "unavailable" },
    ], error: null });
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from: vi.fn().mockReturnValue(orders) } as never);
    await expect(listV3BuyerOrders(buyer)).resolves.toEqual([
      { id: "pending", pickup_pin: null, stock_review_status: "pending" },
      { id: "unavailable", pickup_pin: null, stock_review_status: "unavailable" },
    ]);
  });

  it("requires an approved vendor profile and scopes vendor orders without private buyer fields", async () => {
    const profile = query({ data: { id: buyer.subject, is_vendor: true, is_vendor_approved: true, vendor_agreement_accepted_at: "2026-01-01T00:00:00Z" }, error: null });
    const orders = query({ data: [{ id: "vendor-order" }], error: null });
    const from = vi.fn().mockImplementation((table: string) => table === "profiles" ? profile : orders);
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from } as never);
    await expect(listV3VendorOrders(buyer)).resolves.toEqual([{ id: "vendor-order" }]);
    expect(orders.eq).toHaveBeenCalledWith("products.vendor_id", buyer.subject);
    expect(orders.select).not.toHaveBeenCalledWith(expect.stringContaining("buyer_phone"));
    expect(orders.select).not.toHaveBeenCalledWith(expect.stringContaining("pickup_pin"));
  });

  it.each([
    { label: "pending", approved: false, agreement: "2026-01-01T00:00:00Z" },
    { label: "suspended", approved: false, agreement: "2026-01-01T00:00:00Z" },
    { label: "missing agreement", approved: true, agreement: null },
  ])("denies $label vendors access to order activity", async ({ approved, agreement }) => {
    const profile = query({ data: { id: buyer.subject, is_vendor: true, is_vendor_approved: approved, vendor_agreement_accepted_at: agreement }, error: null });
    const from = vi.fn().mockReturnValue(profile);
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from } as never);
    await expect(listV3VendorOrders(buyer)).rejects.toThrow("approved vendor with an accepted agreement");
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("bounds owner reads, exposes buyer contact only in owner feed, and uses atomic fulfillment transitions", async () => {
    const profile = query({ data: { id: owner.subject, role: "admin" }, error: null });
    const read = query({ data: [], error: null });
    const rpc = vi.fn().mockResolvedValue({ data: { id: "o1", order_status: "RECEIVED_AT_HUB" }, error: null });
    const from = vi.fn().mockImplementation((table: string) => table === "profiles" ? profile : read);
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from, rpc } as never);
    await listV3OwnerOrders(owner, 900);
    expect(read.limit).toHaveBeenCalledWith(200);
    expect(read.select).toHaveBeenCalledWith(expect.stringContaining("buyer_phone"));
    await expect(updateV3OrderStatus(owner, "o1", "RECEIVED_AT_HUB")).resolves.toEqual({ id: "o1", order_status: "RECEIVED_AT_HUB" });
    expect(rpc).toHaveBeenCalledWith("transition_v3_order_fulfillment", { p_order_id: "o1", p_next_status: "RECEIVED_AT_HUB" });
  });

  it("requires persisted owner role before invoking stock-review RPC", async () => {
    const profile = query({ data: { id: owner.subject, role: "admin" }, error: null });
    const rpc = vi.fn().mockResolvedValue({ data: { id: "o1", stock_review_status: "confirmed" }, error: null });
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from: vi.fn().mockReturnValue(profile), rpc } as never);
    await expect(reviewV3OrderStock(owner, { orderId: "o1", decision: "confirmed" })).resolves.toEqual({ id: "o1", stock_review_status: "confirmed" });
    expect(rpc).toHaveBeenCalledWith("review_v3_order_stock", { p_order_id: "o1", p_decision: "confirmed", p_mark_listing_out_of_stock: false });
  });

  it("does not invoke stock review for non-owners", async () => {
    const profile = query({ data: { id: buyer.subject, role: "buyer" }, error: null });
    const rpc = vi.fn();
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from: vi.fn().mockReturnValue(profile), rpc } as never);
    await expect(reviewV3OrderStock(buyer, { orderId: "o1", decision: "unavailable", markListingOutOfStock: true })).rejects.toThrow("Owner access is required");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("records order quantity, price snapshot, buyer profile, and preferred pickup area server-side", async () => {
    const profile = query({ data: { id: buyer.subject, full_name: "Buyer", phone_number: "254711281501" }, error: null });
    const product = query({ data: { id: "p1", final_price: "200", category_slug: "home-kitchen", allow_pay_on_pickup: true, stock_quantity: 4, status: "ACTIVE" }, error: null });
    const duplicate = query({ data: null, error: null });
    const inserted = query({ data: { id: "o1", pickup_pin: "1234" }, error: null });
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "profiles") return profile;
      if (table === "products") return product;
      return from.mock.calls.filter(call => call[0] === "orders").length === 1 ? duplicate : inserted;
    });
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from } as never);
    await createV3HubOrder(buyer, { productId: "p1", quantity: 2, pickupPreference: "Siaya Town" });
    expect(inserted.insert).toHaveBeenCalledWith(expect.objectContaining({ buyer_profile_id: buyer.subject, payment_status: "PENDING", quantity: 2, amount: "400.00", stock_review_status: "pending", pickup_station: "Siaya Town" }));
  });
});
