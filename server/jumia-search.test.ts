import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchJumiaPublicProducts } from "./jumia-search";

describe("Jumia public discovery", () => {
  beforeEach(() => {
    delete process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    delete process.env.GOOGLE_SEARCH_API_KEY;
    delete process.env.GOOGLE_CUSTOM_SEARCH_CX;
    delete process.env.GOOGLE_SEARCH_CX;
    vi.restoreAllMocks();
  });

  it("returns a clear unconfigured state without calling an external provider", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await searchJumiaPublicProducts("smart TV");

    expect(result.configured).toBe(false);
    expect(result.provider).toBe("unconfigured");
    expect(result.results).toEqual([]);
    expect(result.message).toContain("credentials");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects a query that is too short", async () => {
    const result = await searchJumiaPublicProducts("tv");

    expect(result.configured).toBe(false);
    expect(result.message).toContain("three characters");
  });

  it("keeps only HTTPS Jumia Kenya results and sanitizes public metadata", async () => {
    process.env.GOOGLE_CUSTOM_SEARCH_API_KEY = "test-key";
    process.env.GOOGLE_CUSTOM_SEARCH_CX = "test-cx";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ items: [
      { title: "Smart TV | Jumia Kenya", link: "https://www.jumia.co.ke/smart-tv", snippet: "KES 34,999 smart television", pagemap: { cse_image: [{ src: "https://img.jumia.co.ke/tv.jpg" }], metatags: [{ "product:price:amount": "34999" }] } },
      { title: "Outside result", link: "https://example.com/item", snippet: "Should be removed" },
      { title: "Unsafe result", link: "http://www.jumia.co.ke/item", snippet: "Should be removed" },
    ] }), { status: 200 }));

    const result = await searchJumiaPublicProducts("smart TV");

    expect(result.configured).toBe(true);
    expect(result.provider).toBe("google_public_search");
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({ title: "Smart TV | Jumia Kenya", url: "https://www.jumia.co.ke/smart-tv", price: 34999, currency: "KES", imageUrl: "https://img.jumia.co.ke/tv.jpg" });
  });
});
