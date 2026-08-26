import { describe, expect, it } from "vitest";
import { mapSupabaseCategory } from "./supabase-marketplace";

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
});
