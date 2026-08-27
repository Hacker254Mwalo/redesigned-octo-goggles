import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({
  getSupabaseServiceClient: vi.fn(),
  isSupabaseConfigured: vi.fn(),
}));

import { getSupabaseServiceClient, isSupabaseConfigured } from "./supabase";
import { listSupabasePublicProducts, mapOptionalSupabasePublicProduct, mapSupabaseCategory, mapSupabasePublicProduct } from "./supabase-marketplace";

function createV3ProductsQuery(data: unknown[] = []) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    or: vi.fn(),
    then: (resolve: (value: { data: unknown[]; error: null }) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve({ data, error: null }).then(resolve, reject),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  query.or.mockReturnValue(query);

  return query;
}

describe("Supabase public marketplace adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
  });

  it("maps the isolated PostgreSQL category shape to the existing public catalogue contract", () => {
    const category = mapSupabaseCategory({
      id: "6e65495c-2fd6-41d5-a00a-eabb9d8bc1ed",
      name: "Phones & Electronics",
      slug: "phones-electronics",
      icon: "Smartphone",
      description: "Phones, accessories, audio, computing, and household electronics.",
      sort_order: 20,
      is_active: true,
      created_at: "2026-08-26T00:00:00.000Z",
    });

    expect(category).toMatchObject({
      id: "6e65495c-2fd6-41d5-a00a-eabb9d8bc1ed",
      slug: "phones-electronics",
      sortOrder: 20,
      isActive: true,
    });
    expect(category.createdAt).toBeInstanceOf(Date);
  });

  it("maps a public PostgreSQL product and its nested relations without exposing a server credential", () => {
    const entry = mapSupabasePublicProduct({
      id: "5e33d1ac-a841-4994-a5e5-ca3fb59128bf",
      vendor_id: null,
      title: "Siaya market test listing",
      category_slug: "phones-electronics",
      description: "Original MtaaMarket listing content for a physical item.",
      image_url: "https://example.test/original-listing.jpg",
      base_price: "1200.00",
      final_price: "1250.00",
      stock_quantity: 6,
      is_admin_concierge: true,
      allow_pay_on_pickup: true,
      status: "ACTIVE",
      created_at: "2026-08-26T00:00:00.000Z",
    });

    expect(entry.product).toMatchObject({ id: "5e33d1ac-a841-4994-a5e5-ca3fb59128bf", price: 1250, stockQuantity: 6 });
    expect(entry.product.slug).toBe("v3-5e33d1ac-a841-4994-a5e5-ca3fb59128bf");
    expect(entry.category.slug).toBe("phones-electronics");
    expect(entry.vendor).toBeNull();
  });

  it("returns explicit null when no public product record exists so the client query never resolves undefined", () => {
    expect(mapOptionalSupabasePublicProduct(null)).toBeNull();
  });

  it("queries only V3 ACTIVE products, applies a requested V3 category, and never requests the removed legacy moderation field", async () => {
    const query = createV3ProductsQuery();
    const client = { from: vi.fn().mockReturnValue(query) };
    vi.mocked(getSupabaseServiceClient).mockReturnValue(client as never);

    await expect(listSupabasePublicProducts({ limit: 12, categorySlug: "phones-electronics" })).resolves.toEqual([]);

    expect(client.from).toHaveBeenCalledWith("products");
    expect(query.eq).toHaveBeenCalledTimes(2);
    expect(query.eq).toHaveBeenCalledWith("status", "ACTIVE");
    expect(query.eq).toHaveBeenCalledWith("category_slug", "phones-electronics");
    expect(query.select).toHaveBeenCalledWith(expect.stringContaining("category_slug"));
    expect(query.select).toHaveBeenCalledWith(expect.stringContaining("stock_quantity"));
    expect(query.select).toHaveBeenCalledWith(expect.not.stringContaining("base_price"));
    expect(query.select).toHaveBeenCalledWith(expect.not.stringContaining("moderation_status"));
  });
});
