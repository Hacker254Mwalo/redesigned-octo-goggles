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

type BraveSearchItem = {
  title?: string;
  url?: string;
  description?: string;
};

type BraveSearchResponse = { web?: { results?: BraveSearchItem[] } };

type TavilySearchItem = {
  title?: string;
  url?: string;
  content?: string;
  images?: Array<{ url?: string }>;
};

type TavilySearchResponse = { results?: TavilySearchItem[] };

type SearchProvider = "google_public_search" | "brave_public_search" | "tavily_public_search";

export type JumiaSearchResult = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  imageUrl: string | null;
  price: number | null;
  currency: string | null;
  source: SearchProvider;
};

export type JumiaSearchResponse = {
  configured: boolean;
  provider: SearchProvider | "unconfigured";
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

function getTavilyConfig() {
  const key = process.env.TAVILY_API_KEY || process.env.TAVILY_SEARCH_API_KEY || "";
  return key ? { key } : null;
}

function getBraveConfig() {
  const key = process.env.BRAVE_SEARCH_API_KEY || process.env.BRAVE_SEARCH_API_TOKEN || "";
  return key ? { key } : null;
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

function parsePrice(value: string) {
  const number = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) && number > 0 ? number : null;
}

function extractGooglePrice(item: GoogleSearchItem) {
  return parsePrice(firstMeta(item, ["product:price:amount", "og:price:amount", "price"]));
}

function extractTextPrice(value: string) {
  const match = value.match(/(?:KES|KSh|Ksh|K\.S\.H)\s*([\d,]+(?:\.\d{1,2})?)/i);
  return match ? parsePrice(match[1]) : null;
}

function resultId(url: string, index: number) {
  const encoded = Buffer.from(url).toString("base64url").slice(0, 24);
  return `${index}-${encoded}`;
}

function sanitizeGoogleItem(item: GoogleSearchItem, index: number): JumiaSearchResult | null {
  const url = item.link?.trim() || "";
  const title = item.title?.trim().replace(/\s+/g, " ") || "";
  if (!isJumiaUrl(url) || title.length < 3) return null;
  const snippet = (item.snippet || "Jumia Kenya product page").trim().replace(/\s+/g, " ").slice(0, 500);
  const imageCandidate = item.pagemap?.cse_image?.[0]?.src || firstMeta(item, ["og:image", "twitter:image"]);
  const imageUrl = imageCandidate && /^https:\/\//i.test(imageCandidate) ? imageCandidate.slice(0, 1_000) : null;
  const price = extractGooglePrice(item) || extractTextPrice(`${title} ${snippet}`);
  return { id: resultId(url, index), title: title.slice(0, 180), url, snippet, imageUrl, price, currency: price ? "KES" : null, source: "google_public_search" };
}

function sanitizeBraveItem(item: BraveSearchItem, index: number): JumiaSearchResult | null {
  const url = item.url?.trim() || "";
  const title = item.title?.trim().replace(/\s+/g, " ") || "";
  if (!isJumiaUrl(url) || title.length < 3) return null;
  const snippet = (item.description || "Jumia Kenya product page").replace(/<[^>]*>/g, "").trim().replace(/\s+/g, " ").slice(0, 500);
  const price = extractTextPrice(`${title} ${snippet}`);
  return { id: resultId(url, index), title: title.slice(0, 180), url, snippet, imageUrl: null, price, currency: price ? "KES" : null, source: "brave_public_search" };
}

function sanitizeTavilyItem(item: TavilySearchItem, index: number): JumiaSearchResult | null {
  const url = item.url?.trim() || "";
  const title = item.title?.trim().replace(/\s+/g, " ") || "";
  if (!isJumiaUrl(url) || title.length < 3) return null;
  const snippet = (item.content || "Jumia Kenya product page").replace(/<[^>]*>/g, "").trim().replace(/\s+/g, " ").slice(0, 500);
  const imageCandidate = item.images?.find(image => image.url && /^https:\/\//i.test(image.url))?.url || null;
  const imageUrl = imageCandidate ? imageCandidate.slice(0, 1_000) : null;
  const price = extractTextPrice(`${title} ${snippet}`);
  return { id: resultId(url, index), title: title.slice(0, 180), url, snippet, imageUrl, price, currency: price ? "KES" : null, source: "tavily_public_search" };
}

async function searchWithGoogle(normalized: string, config: { key: string; cx: string }): Promise<JumiaSearchResponse> {
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", config.key);
  url.searchParams.set("cx", config.cx);
  url.searchParams.set("q", `site:jumia.co.ke ${normalized}`);
  url.searchParams.set("num", String(MAX_RESULTS));
  url.searchParams.set("safe", "active");
  const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error("The Jumia search provider is temporarily unavailable.");
  const payload = await response.json() as GoogleSearchResponse;
  const results = (payload.items ?? []).map((item, index) => sanitizeGoogleItem(item, index)).filter((item): item is JumiaSearchResult => Boolean(item));
  return { configured: true, provider: "google_public_search", query: normalized, results, message: results.length ? "Jumia products found." : "No matching Jumia products were found." };
}

async function searchWithTavily(normalized: string, config: { key: string }): Promise<JumiaSearchResponse> {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: config.key, query: `site:jumia.co.ke ${normalized}`, search_depth: "basic", max_results: MAX_RESULTS, include_answer: false, include_raw_content: false, include_images: true, country: "kenya", safe_search: true }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error("The Jumia search provider is temporarily unavailable.");
  const payload = await response.json() as TavilySearchResponse;
  const results = (payload.results ?? []).map((item, index) => sanitizeTavilyItem(item, index)).filter((item): item is JumiaSearchResult => Boolean(item));
  return { configured: true, provider: "tavily_public_search", query: normalized, results, message: results.length ? "Jumia products found." : "No matching Jumia products were found." };
}

async function searchWithBrave(normalized: string, config: { key: string }): Promise<JumiaSearchResponse> {
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", `site:jumia.co.ke ${normalized}`);
  url.searchParams.set("count", String(MAX_RESULTS));
  url.searchParams.set("country", "KE");
  url.searchParams.set("search_lang", "en");
  url.searchParams.set("safesearch", "strict");
  const response = await fetch(url, { headers: { Accept: "application/json", "X-Subscription-Token": config.key }, signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error("The Jumia search provider is temporarily unavailable.");
  const payload = await response.json() as BraveSearchResponse;
  const results = (payload.web?.results ?? []).map((item, index) => sanitizeBraveItem(item, index)).filter((item): item is JumiaSearchResult => Boolean(item));
  return { configured: true, provider: "brave_public_search", query: normalized, results, message: results.length ? "Jumia products found." : "No matching Jumia products were found." };
}

export async function searchJumiaPublicProducts(query: string): Promise<JumiaSearchResponse> {
  const normalized = query.trim().replace(/\s+/g, " ").slice(0, 120);
  if (normalized.length < 3) return { configured: false, provider: "unconfigured", query: normalized, results: [], message: "Enter at least three characters to search Jumia Kenya." };
  const googleConfig = getGoogleConfig();
  if (googleConfig) return searchWithGoogle(normalized, googleConfig);
  const tavilyConfig = getTavilyConfig();
  if (tavilyConfig) return searchWithTavily(normalized, tavilyConfig);
  const braveConfig = getBraveConfig();
  if (braveConfig) return searchWithBrave(normalized, braveConfig);
  return { configured: false, provider: "unconfigured", query: normalized, results: [], message: "Live product search is not connected yet." };
}
