import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({ getSupabaseServiceClient: vi.fn() }));
vi.mock("./storage", () => ({ storagePut: vi.fn() }));

import { getSupabaseServiceClient } from "./supabase";
import { storagePut } from "./storage";
import { deleteV3Product, listV3ModerationProducts, moderateV3Product } from "./v3-moderation";
import { createV3HubOrder } from "./v3-orders";
import { submitV3VendorProduct } from "./v3-vendor";

const vendorIdentity = { subject: "11111111-1111-4111-8111-111111111111", email: "vendor@example.test", issuedAt: 0 };
const ownerIdentity = { subject: "22222222-2222-4222-8222-222222222222", email: "owner@example.test", issuedAt: 0 };

function asyncResult<T>(value: T) {
  return {
    then: (resolve: (result: T) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(value).then(resolve, reject),
  };
}

function profileQuery(data: unknown) {
  const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.maybeSingle.mockResolvedValue({ data, error: null });
  return query;
}

function onePixelPng() {
  const png = Buffer.alloc(24);
  png.write("\x89PNG\r\n\x1a\n", 0, "binary");
  png.writeUInt32BE(1, 16);
  png.writeUInt32BE(1, 20);
  return `data:image/png;base64,${png.toString("base64")}`;
}

beforeEach(() => vi.clearAllMocks());

describe("V3 vendor product submission", () => {
  it("requires an approved vendor profile and recorded agreement before handling image bytes", async () => {
    const profile = profileQuery({ id: vendorIdentity.subject, is_vendor: true, is_vendor_approved: true, vendor_agreement_accepted_at: null });
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from: vi.fn().mockReturnValue(profile) } as never);

    await expect(submitV3VendorProduct(vendorIdentity, { title: "Local cooking pot", price: 1600, imageData: onePixelPng(), imageType: "image/png" })).rejects.toThrow("Accept the vendor agreement");

    expect(storagePut).not.toHaveBeenCalled();
  });

  it("keeps original image MIME metadata and creates only a PENDING listing for an approved, agreed vendor", async () => {
    const profile = profileQuery({ id: vendorIdentity.subject, is_vendor: true, is_vendor_approved: true, vendor_agreement_accepted_at: "2026-08-27T00:00:00.000Z" });
    const products = { insert: vi.fn(), select: vi.fn(), single: vi.fn() };
    products.insert.mockReturnValue(products);
    products.select.mockReturnValue(products);
    products.single.mockResolvedValue({ data: { id: "33333333-3333-4333-8333-333333333333", status: "PENDING" }, error: null });
    const client = { from: vi.fn().mockImplementation((table: string) => table === "profiles" ? profile : products) };
    vi.mocked(getSupabaseServiceClient).mockReturnValue(client as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "vendor-listings/vendor/listing.png", url: "/manus-storage/vendor-listing.png" });

    await expect(submitV3VendorProduct(vendorIdentity, { title: "Local cooking pot", price: 1600, imageData: onePixelPng(), imageType: "image/png" })).resolves.toEqual({ id: "33333333-3333-4333-8333-333333333333", status: "PENDING" });

    expect(storagePut).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`^vendor-listings/${vendorIdentity.subject}/.+\\.png$`)), expect.any(Buffer), "image/png");
    expect(products.insert).toHaveBeenCalledWith(expect.objectContaining({ vendor_id: vendorIdentity.subject, title: "Local cooking pot", base_price: 1600, final_price: 1600, status: "PENDING" }));
  });

  it("rejects a data URL whose actual MIME type does not match the declared permitted type", async () => {
    const profile = profileQuery({ id: vendorIdentity.subject, is_vendor: true, is_vendor_approved: true, vendor_agreement_accepted_at: "2026-08-27T00:00:00.000Z" });
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from: vi.fn().mockReturnValue(profile) } as never);

    await expect(submitV3VendorProduct(vendorIdentity, { title: "Local cooking pot", price: 1600, imageData: onePixelPng(), imageType: "image/jpeg" })).rejects.toThrow("did not match");

    expect(storagePut).not.toHaveBeenCalled();
  });
});

describe("V3 owner moderation", () => {
  it("authorizes a verified owner, returns all reviewable states, and updates a listing only through the protected helper", async () => {
    const owner = profileQuery({ id: ownerIdentity.subject, role: "admin" });
    const queue = { select: vi.fn(), in: vi.fn(), order: vi.fn() };
    queue.select.mockReturnValue(queue);
    queue.in.mockReturnValue(queue);
    queue.order.mockReturnValue(asyncResult({ data: [{ id: "44444444-4444-4444-8444-444444444444", status: "PENDING" }], error: null }));
    const update = { update: vi.fn(), eq: vi.fn(), select: vi.fn(), maybeSingle: vi.fn() };
    update.update.mockReturnValue(update);
    update.eq.mockReturnValue(update);
    update.select.mockReturnValue(update);
    update.maybeSingle.mockResolvedValue({ data: { id: "44444444-4444-4444-8444-444444444444", status: "ACTIVE" }, error: null });
    const client = { from: vi.fn().mockImplementation((table: string) => {
      if (table === "profiles") return owner;
      return client.from.mock.calls.filter(call => call[0] === "products").length === 1 ? queue : update;
    }) };
    vi.mocked(getSupabaseServiceClient).mockReturnValue(client as never);

    await expect(listV3ModerationProducts(ownerIdentity)).resolves.toEqual([{ id: "44444444-4444-4444-8444-444444444444", status: "PENDING" }]);
    await expect(moderateV3Product(ownerIdentity, "44444444-4444-4444-8444-444444444444", "ACTIVE")).resolves.toEqual({ id: "44444444-4444-4444-8444-444444444444", status: "ACTIVE" });

    expect(queue.in).toHaveBeenCalledWith("status", ["PENDING", "ACTIVE", "FLAGGED"]);
    expect(update.update).toHaveBeenCalledWith({ status: "ACTIVE" });
  });

  it("rejects a non-owner before querying or deleting products", async () => {
    const nonOwner = profileQuery({ id: vendorIdentity.subject, role: "vendor" });
    const client = { from: vi.fn().mockReturnValue(nonOwner) };
    vi.mocked(getSupabaseServiceClient).mockReturnValue(client as never);

    await expect(deleteV3Product(vendorIdentity, "44444444-4444-4444-8444-444444444444")).rejects.toThrow("Owner access is required");

    expect(client.from).toHaveBeenCalledTimes(1);
  });
});

describe("V3 controlled hub orders", () => {
  it("derives the buyer contact, amount, and active state server-side before recording a pending pay-on-pickup order", async () => {
    const buyer = profileQuery({ id: vendorIdentity.subject, full_name: "Siaya Buyer", phone_number: "254711281501" });
    const product = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
    product.select.mockReturnValue(product);
    product.eq.mockReturnValue(product);
    product.maybeSingle.mockResolvedValue({ data: { id: "55555555-5555-4555-8555-555555555555", final_price: "2750.00", status: "ACTIVE" }, error: null });
    const existingOrder = { select: vi.fn(), eq: vi.fn(), in: vi.fn(), maybeSingle: vi.fn() };
    existingOrder.select.mockReturnValue(existingOrder);
    existingOrder.eq.mockReturnValue(existingOrder);
    existingOrder.in.mockReturnValue(existingOrder);
    existingOrder.maybeSingle.mockResolvedValue({ data: null, error: null });
    const orders = { insert: vi.fn(), select: vi.fn(), single: vi.fn() };
    orders.insert.mockReturnValue(orders);
    orders.select.mockReturnValue(orders);
    orders.single.mockImplementation(() => Promise.resolve({ data: { id: "66666666-6666-4666-8666-666666666666", pickup_pin: orders.insert.mock.calls[0][0].pickup_pin, payment_status: "PENDING", order_status: "PENDING_DROPOFF", pickup_station: "Siaya Town collection point — confirm with MtaaMarket" }, error: null }));
    const client = { from: vi.fn().mockImplementation((table: string) => {
      if (table === "profiles") return buyer;
      if (table === "products") return product;
      return client.from.mock.calls.filter(call => call[0] === "orders").length === 1 ? existingOrder : orders;
    }) };
    vi.mocked(getSupabaseServiceClient).mockReturnValue(client as never);

    await expect(createV3HubOrder(vendorIdentity, { productId: "55555555-5555-4555-8555-555555555555" })).resolves.toMatchObject({ payment_status: "PENDING", order_status: "PENDING_DROPOFF", pickup_pin: expect.stringMatching(/^\d{4}$/) });

    expect(product.eq).toHaveBeenNthCalledWith(1, "id", "55555555-5555-4555-8555-555555555555");
    expect(product.eq).toHaveBeenNthCalledWith(2, "status", "ACTIVE");
    expect(existingOrder.in).toHaveBeenCalledWith("order_status", ["PENDING_DROPOFF", "RECEIVED_AT_HUB"]);
    expect(orders.insert).toHaveBeenCalledWith(expect.objectContaining({ buyer_phone: "254711281501", amount: "2750.00", payment_method: "PAY_ON_PICKUP", payment_status: "PENDING" }));
  });

  it("rejects an existing open order before generating a PIN or creating a second request", async () => {
    const buyer = profileQuery({ id: vendorIdentity.subject, full_name: "Siaya Buyer", phone_number: "254711281501" });
    const product = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
    product.select.mockReturnValue(product);
    product.eq.mockReturnValue(product);
    product.maybeSingle.mockResolvedValue({ data: { id: "55555555-5555-4555-8555-555555555555", final_price: "2750.00", status: "ACTIVE" }, error: null });
    const existingOrder = { select: vi.fn(), eq: vi.fn(), in: vi.fn(), maybeSingle: vi.fn() };
    existingOrder.select.mockReturnValue(existingOrder);
    existingOrder.eq.mockReturnValue(existingOrder);
    existingOrder.in.mockReturnValue(existingOrder);
    existingOrder.maybeSingle.mockResolvedValue({ data: { id: "77777777-7777-4777-8777-777777777777" }, error: null });
    const client = { from: vi.fn().mockImplementation((table: string) => table === "profiles" ? buyer : table === "products" ? product : existingOrder) };
    vi.mocked(getSupabaseServiceClient).mockReturnValue(client as never);

    await expect(createV3HubOrder(vendorIdentity, { productId: "55555555-5555-4555-8555-555555555555" })).rejects.toThrow("already have an open hub-pickup request");
  });
});
