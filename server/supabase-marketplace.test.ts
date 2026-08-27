import { describe, expect, it } from "vitest";
import { mapOptionalSupabasePublicProduct, mapSupabaseCategory, mapSupabasePublicProduct } from "./supabase-marketplace";

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
      title: "Siaya market test listing",
      description: "Original MtaaMarket listing content for a physical item.",
      image_url: "https://example.test/original-listing.jpg",
      base_price: "1200.00",
      final_price: "1250.00",
      is_admin_concierge: true,
      allow_pay_on_pickup: true,
      status: "ACTIVE",
      created_at: "2026-08-26T00:00:00.000Z",
    });

    expect(entry.product).toMatchObject({ id: "5e33d1ac-a841-4994-a5e5-ca3fb59128bf", price: 1250, stockQuantity: 0 });
    expect(entry.product.slug).toBe("v3-5e33d1ac-a841-4994-a5e5-ca3fb59128bf");
    expect(entry.category.slug).toBe("general-goods");
    expect(entry.vendor).toBeNull();
  });

  it("returns explicit null when no public product record exists so the client query never resolves undefined", () => {
    expect(mapOptionalSupabasePublicProduct(null)).toBeNull();
  });
});
