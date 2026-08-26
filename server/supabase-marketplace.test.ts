import { describe, expect, it } from "vitest";
import { mapSupabaseCategory, mapSupabasePublicProduct } from "./supabase-marketplace";

describe("Supabase public marketplace adapter", () => {
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
      category_id: "6e65495c-2fd6-41d5-a00a-eabb9d8bc1ed",
      title: "Siaya market test listing",
      slug: "siaya-market-test-listing",
      description: "Original MtaaMarket listing content for a physical item.",
      price: "1250.00",
      stock_quantity: 3,
      image_url: null,
      image_key: null,
      image_alt: null,
      is_local_inventory: true,
      source_type: "mtaa_select",
      item_condition: "new",
      availability_status: "ready",
      payment_timing: "confirm_with_mtaamarket",
      fulfilment_options: ["siaya_pickup"],
      moderation_status: "visible",
      status: "active",
      created_at: "2026-08-26T00:00:00.000Z",
      updated_at: "2026-08-26T00:00:00.000Z",
      categories: { id: "6e65495c-2fd6-41d5-a00a-eabb9d8bc1ed", name: "Phones & Electronics", slug: "phones-electronics", icon: "Smartphone", description: null, sort_order: 20, is_active: true, created_at: "2026-08-26T00:00:00.000Z" },
      vendors: null,
    });

    expect(entry.product).toMatchObject({ id: "5e33d1ac-a841-4994-a5e5-ca3fb59128bf", price: 1250, stockQuantity: 3 });
    expect(entry.category.slug).toBe("phones-electronics");
    expect(entry.vendor).toBeNull();
  });
});
