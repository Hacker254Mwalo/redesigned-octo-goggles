import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchJumiaPublicProducts } from "./jumia-search";

describe("Jumia public discovery", () => {
  beforeEach(() => {
    delete process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    delete process.env.GOOGLE_SEARCH_API_KEY;
    delete process.env.GOOGLE_CUSTOM_SEARCH_CX;
    delete process.env.GOOGLE_SEARCH_CX;
    delete process.env.BRAVE_SEARCH_API_KEY;
    delete process.env.BRAVE_SEARCH_API_TOKEN;
    delete process.env.TAVILY_API_KEY;
    delete process.env.TAVILY_SEARCH_API_KEY;
    vi.restoreAllMocks();
  });

  it("returns a clear unconfigured state without calling an external provider", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await searchJumiaPublicProducts("smart TV");

    expect(result.configured).toBe(false);
    expect(result.provider).toBe("unconfigured");
    expect(result.results).toEqual([]);
    expect(result.message).toContain("not connected");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects a query that is too short", async () => {
    const result = await searchJumiaPublicProducts("tv");

    expect(result.configured).toBe(false);
    expect(result.message).toContain("three characters");
  });

  it("uses Tavily when configured and maps product metadata", async () => {
    process.env.TAVILY_API_KEY = "test-key";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ results: [
      { title: "Samsung TV Jumia Kenya", url: "https://www.jumia.co.ke/samsung-tv", content: "Samsung smart TV from KES 34,999", images: [{ url: "https://ke.jumia.is/p_9n_2Fk5GQPGkotcccQ5cDtlHA=/fit-in/500x500/filters:fill(white)/product/31/8481392/1.jpg?7944" }] },
      { title: "Outside result", url: "https://example.com/item", content: "Should be removed" },
    ] }), { status: 200 }));

    const result = await searchJumiaPublicProducts("Samsung TV");
    const request = fetchSpy.mock.calls[0]?.[1];
    const payload = JSON.parse(String(request?.body));
    expect(payload).toMatchObject({ query: "site:jumia.co.ke Samsung TV", search_depth: "basic", max_results: 10, include_images: true, include_answer: false, include_raw_content: false });
    expect(payload).not.toHaveProperty("include_domains");
    expect(payload).not.toHaveProperty("country");
    expect(payload).not.toHaveProperty("safe_search");

    expect(result.configured).toBe(true);
    expect(result.provider).toBe("tavily_public_search");
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({ title: "Samsung TV", url: "https://www.jumia.co.ke/samsung-tv", price: 34999, currency: "KES", imageUrl: "https://ke.jumia.is/p_9n_2Fk5GQPGkotcccQ5cDtlHA=/fit-in/500x500/filters:fill(white)/product/31/8481392/1.jpg?7944" });
  });

  it("puts image-bearing Jumia cards first while retaining text-only results", async () => {
    process.env.TAVILY_API_KEY = "test-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ results: [
      { title: "Text-only result", url: "https://www.jumia.co.ke/text-only", content: "Samsung television" },
      { title: "Visual result", url: "https://www.jumia.co.ke/visual", content: "Samsung television", images: [{ url: "https://ke.jumia.is/p_9n_2Fk5GQPGkotcccQ5cDtlHA=/fit-in/500x500/filters:fill(white)/product/31/8481392/1.jpg?7944" }] },
    ] }), { status: 200 }));

    const result = await searchJumiaPublicProducts("Samsung TV");

    expect(result.results).toHaveLength(2);
    expect(result.results[0]?.title).toBe("Visual result");
    expect(result.results[1]?.title).toBe("Text-only result");
  });

  it("derives a safe Jumia CDN image from an indexed product path when Tavily has no image field", async () => {
    process.env.TAVILY_API_KEY = "test-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ results: [
      { title: "Samsung TV fallback", url: "https://www.jumia.co.ke/samsung-tv-fallback", content: "Samsung TV /product/31/8481392/1.jpg?7944" },
    ] }), { status: 200 }));

    const result = await searchJumiaPublicProducts("Samsung TV");

    expect(result.results[0]?.imageUrl).toBe("https://ke.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/31/8481392/1.jpg?7944");
  });

  it("uses the first product-like heading from indexed content instead of a noisy search label", async () => {
    process.env.TAVILY_API_KEY = "test-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ results: [
      { title: "Samsung 65 resolution", url: "https://www.jumia.co.ke/samsung-65-resolution", content: "Buy samsung 65 resolution Online | Jumia Kenya 65DU7010 65 inches PurColor, 4K Upscaling, Tizen OS & Q-Symphony Smart LED TV/product/51/7819992/1.jpg?7944" },
    ] }), { status: 200 }));

    const result = await searchJumiaPublicProducts("Samsung TV");

    expect(result.results[0]?.title).toContain("65DU7010");
    expect(result.results[0]?.snippet).not.toMatch(/buy .*online|product\/51\/7819992/i);
  });

  it("does not reuse the same indexed photo as a different product", async () => {
    process.env.TAVILY_API_KEY = "test-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ results: [
      { title: "Product one", url: "https://www.jumia.co.ke/product-one.html", content: "Product one", images: [{ url: "https://ke.jumia.is/p_9n_2Fk5GQPGkotcccQ5cDtlHA=/fit-in/500x500/filters:fill(white)/product/31/8481392/1.jpg?7944" }] },
      { title: "Product two", url: "https://www.jumia.co.ke/product-two.html", content: "Product two", images: [{ url: "https://ke.jumia.is/p_9n_2Fk5GQPGkotcccQ5cDtlHA=/fit-in/500x500/filters:fill(white)/product/31/8481392/1.jpg?7944" }] },
    ] }), { status: 200 }));

    const result = await searchJumiaPublicProducts("Samsung TV");

    expect(result.results[0]?.imageUrl).toBeTruthy();
    expect(result.results[1]?.imageUrl).toBeNull();
  });

  it("removes search-page boilerplate from customer-facing titles and snippets", async () => {
    process.env.TAVILY_API_KEY = "test-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ results: [
      { title: "Premier CLOTH CUTTING MACHINE @ Best Price Online | Jumia Kenya", url: "https://www.jumia.co.ke/premier-cloth-cutting-machine-123456.html", content: "Title: Premier CLOTH CUTTING MACHINE @ Best Price Online | Jumia Kenya product_image_name-Premier-CLOTH-CUTTING-MACHINE- ## This website uses cookies. For further information. Official Stores Appliances Home & Office" },
    ] }), { status: 200 }));

    const result = await searchJumiaPublicProducts("cloth cutting machine");

    expect(result.results[0]?.title).toBe("Premier CLOTH CUTTING MACHINE");
    expect(result.results[0]?.snippet).not.toMatch(/cookies|product_image_name|official stores|appliances/i);
    expect(result.results[0]?.snippet).toContain("View current product details");
  });

  it("removes search-landing pages and keeps individual product pages", async () => {
    process.env.TAVILY_API_KEY = "test-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ results: [
      { title: "Smart TV search", url: "https://www.jumia.co.ke/slp/smart-tv", content: "Smart TV search landing page" },
      { title: "Samsung 50U8000 50 Inches Crystal UHD 4K Smart TV", url: "https://www.jumia.co.ke/samsung-50u8000-50-inches-crystal-uhd-4k-smart-tv-123456.html", content: "Samsung 50U8000 50 Inches Crystal UHD 4K Smart TV KSh 78,499" },
      { title: "TV category", url: "https://www.jumia.co.ke/category/tvs", content: "TV category" },
    ] }), { status: 200 }));

    const result = await searchJumiaPublicProducts("Smart TV");

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.url).toContain(".html");
    expect(result.results[0]?.price).toBe(78499);
  });

  it("returns a clear message when the provider only returns landing pages", async () => {
    process.env.TAVILY_API_KEY = "test-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ results: [
      { title: "Smart TV search", url: "https://www.jumia.co.ke/slp/smart-tv", content: "Smart TV search landing page" },
    ] }), { status: 200 }));

    const result = await searchJumiaPublicProducts("Smart TV");

    expect(result.results).toEqual([]);
    expect(result.message).toContain("individual Jumia product pages");
  });

  it("uses Brave Web Search when configured and keeps only HTTPS Jumia Kenya results", async () => {
    process.env.BRAVE_SEARCH_API_KEY = "test-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ web: { results: [
      { title: "Samsung TV Jumia Kenya", url: "https://www.jumia.co.ke/samsung-tv", description: "Samsung smart TV from KES 34,999" },
      { title: "Outside result", url: "https://example.com/item", description: "Should be removed" },
      { title: "Unsafe result", url: "http://www.jumia.co.ke/item", description: "Should be removed" },
    ] } }), { status: 200 }));

    const result = await searchJumiaPublicProducts("Samsung TV");

    expect(result.configured).toBe(true);
    expect(result.provider).toBe("brave_public_search");
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({ title: "Samsung TV", url: "https://www.jumia.co.ke/samsung-tv", price: 34999, currency: "KES" });
  });

  it("keeps only HTTPS Jumia Kenya results and sanitizes public metadata", async () => {
    process.env.GOOGLE_CUSTOM_SEARCH_API_KEY = "test-key";
    process.env.GOOGLE_CUSTOM_SEARCH_CX = "test-cx";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ items: [
      { title: "Smart TV | Jumia Kenya", link: "https://www.jumia.co.ke/smart-tv", snippet: "KES 34,999 smart television", pagemap: { cse_image: [{ src: "https://ke.jumia.is/p_9n_2Fk5GQPGkotcccQ5cDtlHA=/fit-in/500x500/filters:fill(white)/product/31/8481392/1.jpg?7944" }], metatags: [{ "product:price:amount": "34999" }] } },
      { title: "Outside result", link: "https://example.com/item", snippet: "Should be removed" },
      { title: "Unsafe result", link: "http://www.jumia.co.ke/item", snippet: "Should be removed" },
    ] }), { status: 200 }));

    const result = await searchJumiaPublicProducts("smart TV");

    expect(result.configured).toBe(true);
    expect(result.provider).toBe("google_public_search");
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({ title: "Smart TV", url: "https://www.jumia.co.ke/smart-tv", price: 34999, currency: "KES", imageUrl: "https://ke.jumia.is/p_9n_2Fk5GQPGkotcccQ5cDtlHA=/fit-in/500x500/filters:fill(white)/product/31/8481392/1.jpg?7944" });
  });
});
