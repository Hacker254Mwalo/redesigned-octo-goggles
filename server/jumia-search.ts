type GoogleSearchItem = {
  title?: string;
  link?: string;
  snippet?: string;
  pagemap?: {
    cse_image?: Array<{ src?: string }>;
    metatags?: Array<Record<string, string | undefined>>;
  };
};

type GoogleSearchResponse = { items?: GoogleSearchItem[] };

export type JumiaSearchResult = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  imageUrl: string | null;
  price: number | null;
  currency: string | null;
  source: "google_public_search";
};

export type JumiaSearchResponse = {
  configured: boolean;
  provider: "google_public_search" | "unconfigured";
  query: string;
  results: JumiaSearchResult[];
  message: string;
};

const MAX_RESULTS = 10;
const JUMIA_HOSTS = new Set(["jumia.co.ke", "www.jumia.co.ke"]);

function getGoogleConfig() {
  const key = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || process.env.GOOGLE_SEARCH_API_KEY || "";
  const cx = process.env.GOOGLE_CUSTOM_SEARCH_CX || process.env.GOOGLE_SEARCH_CX || "";
  return key && cx ? { key, cx } : null;
}

function isJumiaUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && JUMIA_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function firstMeta(item: GoogleSearchItem, names: string[]) {
  const tags = item.pagemap?.metatags ?? [];
  for (const tag of tags) {
    for (const name of names) {
      const value = tag[name] || tag[name.toLowerCase()] || tag[name.toUpperCase()];
      if (value) return value;
    }
  }
  return "";
}

function extractPrice(item: GoogleSearchItem) {
  const value = firstMeta(item, ["product:price:amount", "og:price:amount", "price"]);
  const number = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) && number > 0 ? number : null;
}

function sanitizeItem(item: GoogleSearchItem, index: number): JumiaSearchResult | null {
  const url = item.link?.trim() || "";
  const title = item.title?.trim().replace(/\s+/g, " ") || "";
  if (!isJumiaUrl(url) || title.length < 3) return null;
  const snippet = (item.snippet || "Jumia Kenya product page").trim().replace(/\s+/g, " ").slice(0, 500);
  const imageCandidate = item.pagemap?.cse_image?.[0]?.src || firstMeta(item, ["og:image", "twitter:image"]);
  const imageUrl = imageCandidate && /^https:\/\//i.test(imageCandidate) ? imageCandidate.slice(0, 1_000) : null;
  const encoded = Buffer.from(url).toString("base64url").slice(0, 24);
  return { id: `${index}-${encoded}`, title: title.slice(0, 180), url, snippet, imageUrl, price: extractPrice(item), currency: extractPrice(item) ? "KES" : null, source: "google_public_search" };
}

export async function searchJumiaPublicProducts(query: string): Promise<JumiaSearchResponse> {
  const normalized = query.trim().replace(/\s+/g, " ").slice(0, 120);
  if (normalized.length < 3) return { configured: false, provider: "unconfigured", query: normalized, results: [], message: "Enter at least three characters to search Jumia Kenya." };
  const config = getGoogleConfig();
  if (!config) return { configured: false, provider: "unconfigured", query: normalized, results: [], message: "Live Jumia discovery is not connected yet. Add the Google search credentials to enable public Jumia result cards." };

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", config.key);
  url.searchParams.set("cx", config.cx);
  url.searchParams.set("q", `site:jumia.co.ke ${normalized}`);
  url.searchParams.set("num", String(MAX_RESULTS));
  url.searchParams.set("safe", "active");
  const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error("The Jumia search provider is temporarily unavailable.");
  const payload = await response.json() as GoogleSearchResponse;
  const results = (payload.items ?? []).map((item, index) => sanitizeItem(item, index)).filter((item): item is JumiaSearchResult => Boolean(item));
  return { configured: true, provider: "google_public_search", query: normalized, results, message: results.length ? "Public Jumia Kenya pages found. Price and availability are confirmed before fulfilment." : "No matching Jumia Kenya pages were found for that search." };
}
