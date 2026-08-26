import { describe, expect, it } from "vitest";

describe("isolated MtaaMarket Supabase connection", () => {
  it("authenticates the server-only key with a read-only category query", async () => {
    const projectUrl = process.env.VITE_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    expect(projectUrl, "VITE_SUPABASE_URL must be configured").toMatch(/^https:\/\/[a-z0-9-]+\.supabase\.co$/);
    expect(secretKey, "SUPABASE_SECRET_KEY must be configured").toMatch(/^sb_secret_/);

    const response = await fetch(`${projectUrl}/rest/v1/categories?select=id&limit=1`, {
      headers: {
        apikey: secretKey!,
        Authorization: `Bearer ${secretKey!}`,
      },
    });

    expect(response.ok, `Supabase read-only check failed with ${response.status}`).toBe(true);
    expect(await response.json()).toBeInstanceOf(Array);
  });

  it("serves every anonymous discovery resource from the isolated project without writing data", async () => {
    const projectUrl = process.env.VITE_SUPABASE_URL!;
    const secretKey = process.env.SUPABASE_SECRET_KEY!;
    const headers = { apikey: secretKey, Authorization: `Bearer ${secretKey}` };
    const resources = [
      "products?select=id,category:categories!inner(id),vendor:vendors(id)&status=eq.active&moderation_status=eq.visible&limit=1",
      "pickup_stations?select=id&is_active=eq.true&county=eq.Siaya&limit=1",
      "vendors?select=id&approval_status=eq.approved&is_active=eq.true&limit=1",
      "reviews?select=id,reviewer:marketplace_profiles!inner(id)&limit=1",
    ];

    for (const resource of resources) {
      const response = await fetch(`${projectUrl}/rest/v1/${resource}`, { headers });
      expect(response.ok, `Supabase discovery read failed for ${resource} with ${response.status}`).toBe(true);
      expect(await response.json()).toBeInstanceOf(Array);
    }
  });
});
