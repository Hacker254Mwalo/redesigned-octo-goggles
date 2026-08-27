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
const JUMIA_IMAGE_HOSTS = new Set(["ke.jumia.is"]);

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

function collapseRepeatedTitle(value: string) {
  const normalized = value.toLowerCase();
  for (let length = Math.floor(value.length / 2); length >= 20; length -= 1) {
    const prefix = value.slice(0, length);
    if (normalized.slice(length).startsWith(prefix.toLowerCase())) return `${prefix}${value.slice(length + prefix.length)}`;
  }
  return value;
}

function cleanTitle(value: string) {
  let title = collapseRepeatedTitle(value.replace(/\s+/g, " ")).replace(/^\s*(?:title\s*:\s*|add to cart\s+|buy\s+)/i, "").trim();
  const ellipsisIndex = title.indexOf("...");
  if (ellipsisIndex >= 30 && title.slice(ellipsisIndex + 3).trim()) title = title.slice(0, ellipsisIndex + 3).trim();
  title = title.replace(/\s+@\s*best price.*$/i, "");
  title = title.replace(/\s+available\s+at\s+best price.*$/i, "");
  title = title.replace(/\s*(?:\||[-–])\s*(?:best prices?|price)\s+online.*$/i, "");
  title = title.replace(/\s*\|\s*buy\s*(?:&|and)?\s*shop online.*$/i, "");
  title = title.replace(/\s*[-–]\s*buy\b.*?\bonline\b.*?\bjumia kenya\b.*$/i, "");
  title = title.replace(/\s*\|\s*(?:smart\s*&\s*digital tvs|official stores).*?\bjumia kenya\b.*$/i, "");
  title = title.replace(/\s*(?:\||[-–])\s*jumia\s*(?:kenya|ke).*$/i, "");
  title = title.replace(/\s+jumia kenya.*$/i, "");
  return title.replace(/[|–-]+\s*$/, "").replace(/\s+/g, " ").trim().slice(0, 180);
}

function stripCatalogArtifacts(value: string) {
  return value
    .replace(/https?:\/\/[^\s"'<>]+/gi, " ")
    .replace(/\/?product\/\d{1,3}\/\d{5,10}\/\d+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>)]*)?/gi, " ")
    .replace(/\bproduct[_-]image[_-]name[-_][a-z0-9_-]+\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractCatalogProductTitle(value: string) {
  const match = value.match(/\bbuy\b[^|]{2,160}\bonline\b\s*\|\s*jumia kenya\s+(.+?)(?=\s*\/?product\/|$)/i);
  if (!match?.[1]) return "";
  const candidate = cleanTitle(stripCatalogArtifacts(match[1]));
  return candidate.length >= 8 && candidate.length <= 180 ? candidate : "";
}

function customerTitle(value: string, content: string) {
  const title = cleanTitle(value);
  const catalogTitle = extractCatalogProductTitle(content);
  return catalogTitle || title;
}

function cleanSnippet(value: string, title: string) {
  let snippet = value.replace(/<[^>]*>/g, " ").replace(/#+\s*/g, " ").replace(/\*+/g, " ").replace(/^\s*(?:title|description):\s*/i, " ");
  snippet = snippet.replace(/^\s*home\s+/i, " ");
  snippet = snippet.replace(/this website uses cookies[\s\S]*?(?=category|home|$)/i, " ");
  snippet = snippet.replace(/\bbuy\b[^|]{2,160}\bonline\b\s*\|\s*jumia kenya\b/gi, " ");
  snippet = snippet.replace(/@\s*best price.*?(?:\|\s*)?jumia kenya\s*[-–|]?/gi, " ");
  snippet = snippet.replace(/for further information on how we use cookies.*?(?:privacy and cookie notice|cookie notice|$)/gi, " ");
  snippet = snippet.replace(/^[\s.\-–—|\u200b\ufeff]*/, "");
  snippet = snippet.replace(/^(?:home)?phones\s*&\s*tabletsmobile phones?smartphones?android phones?/i, "");
  snippet = stripCatalogArtifacts(snippet);
  snippet = snippet.replace(/\b(?:our categories|our services|help center|place your order|payment options|delivery timelines?\s*&\s*track your order|returns\s*&\s*refunds|warranty|category|add to cart|official stores|phones\s*&\s*tablets|tvs\s*&\s*audio|appliances|health\s*&\s*beauty|home\s*&\s*office|fashion|computing|gaming|supermarket|baby products|other categories)\b[.:]?/gi, " ");
  snippet = snippet.replace(/\s+/g, " ").replace(/([a-z0-9)])(?=(?:If you are|This |The |Some of |It is)\b)/g, "$1. ").replace(/^[\s|–—-]+|[\s|–—-]+$/g, "").trim();
  snippet = collapseRepeatedTitle(snippet);
  if (snippet.toLowerCase().startsWith(title.toLowerCase())) snippet = snippet.slice(title.length).trim();
  if (!/[a-z0-9]{3}/i.test(snippet)) snippet = "";
  const firstSentence = snippet.match(/^.{35,220}?(?:[.!?](?=\s|$)|$)/)?.[0]?.trim() || snippet.slice(0, 220).trim();
  return (firstSentence || "View current product details.").slice(0, 220);
}

function isJumiaImageUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && JUMIA_IMAGE_HOSTS.has(parsed.hostname.toLowerCase()) && /\/product\/\d{1,3}\/\d{5,10}\/\d+\.(?:jpg|jpeg|png|webp)$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

function extractImageFromContent(value: string) {
  const fullUrl = value.match(/https:\/\/ke\.jumia\.is\/[^"'<>\s)]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'<>\s)]*)?/i)?.[0] || "";
  if (isJumiaImageUrl(fullUrl)) return fullUrl.slice(0, 1_000);

  const productPath = value.match(/\/product\/\d{1,3}\/\d{5,10}\/\d+\.(?:jpg|jpeg|png|webp)(?:\?[^"'<>\s)]*)?/i)?.[0] || "";
  if (!productPath) return null;
  const safePath = productPath.replace(/[^a-zA-Z0-9/?=&._-]/g, "");
  const fallbackUrl = `https://ke.jumia.is/unsafe/fit-in/500x500/filters:fill(white)${safePath}`;
  return isJumiaImageUrl(fallbackUrl) ? fallbackUrl.slice(0, 1_000) : null;
}

function firstJumiaImage(candidates: Array<string | undefined>, content = "") {
  for (const candidate of candidates) {
    if (candidate && isJumiaImageUrl(candidate)) return candidate.slice(0, 1_000);
  }
  return extractImageFromContent(content);
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

function isLikelyProductUrl(url: string) {
  try {
    return /\.html$/i.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

function isSearchLandingUrl(url: string) {
  try {
    const pathname = new URL(url).pathname.replace(/\/+$/, "");
    return /\/(?:slp|mlp|category|categories|search|brand|brands)(?:\/|$)/i.test(pathname);
  } catch {
    return false;
  }
}

function isGenericCatalogLandingResult(result: JumiaSearchResult) {
  const title = result.title.trim();
  const hasCategoryLanguage = /\b(?:smartphones?|mobile phones?|phones?|smart tvs?|televisions?|laptops?|shoes?)\b/i.test(title);
  const hasLandingLanguage = /\b(?:online|store|latest|best\s+(?:price|prices)|buy|shop|range|collection)\b/i.test(title);
  const hasConcreteModelSignal = /\d{2,}/.test(title);
  const genericTitle = hasCategoryLanguage && hasLandingLanguage && !hasConcreteModelSignal && title.length <= 120;
  const genericCopy = /\b(?:buy|shop\s+for)\s+(?:the\s+)?(?:latest\s+)?(?:smartphones?|mobile phones?|phones?|smart tvs?|televisions?|laptops?)\s+(?:in\s+kenya\s+)?online\b/i.test(result.snippet)
    || /\b(?:widest|wide|huge|large)\s+range\b.{0,70}\b(?:smartphones?|mobile phones?|phones?|kenya)\b/i.test(result.snippet);
  return genericTitle || genericCopy;
}

function prioritizeVisualResults(results: JumiaSearchResult[]) {
  const filtered = results.filter(result => !isSearchLandingUrl(result.url) && !isGenericCatalogLandingResult(result));
  const sorted = [...filtered].sort((left, right) => {
    const leftScore = Number(isLikelyProductUrl(left.url)) * 4 + Number(Boolean(left.imageUrl)) * 2 + Number(Boolean(left.price));
    const rightScore = Number(isLikelyProductUrl(right.url)) * 4 + Number(Boolean(right.imageUrl)) * 2 + Number(Boolean(right.price));
    return rightScore - leftScore;
  });
  const seenImages = new Set<string>();
  return sorted.map(result => {
    if (!result.imageUrl || !seenImages.has(result.imageUrl)) {
      if (result.imageUrl) seenImages.add(result.imageUrl);
      return result;
    }
    return { ...result, imageUrl: null };
  });
}

function sanitizeGoogleItem(item: GoogleSearchItem, index: number): JumiaSearchResult | null {
  const url = item.link?.trim() || "";
  const content = item.snippet || "";
  const title = customerTitle(item.title || "", content);
  if (!isJumiaUrl(url) || title.length < 3) return null;
  const snippet = cleanSnippet(item.snippet || "", title);
  const imageUrl = firstJumiaImage([item.pagemap?.cse_image?.[0]?.src, firstMeta(item, ["og:image", "twitter:image"])]);
  const price = extractGooglePrice(item) || extractTextPrice(`${title} ${snippet}`);
  return { id: resultId(url, index), title: title.slice(0, 180), url, snippet, imageUrl, price, currency: price ? "KES" : null, source: "google_public_search" };
}

function sanitizeBraveItem(item: BraveSearchItem, index: number): JumiaSearchResult | null {
  const url = item.url?.trim() || "";
  const content = item.description || "";
  const title = customerTitle(item.title || "", content);
  if (!isJumiaUrl(url) || title.length < 3) return null;
  const snippet = cleanSnippet(item.description || "", title);
  const imageUrl = extractImageFromContent(item.description || "");
  const price = extractTextPrice(`${title} ${snippet}`);
  return { id: resultId(url, index), title: title.slice(0, 180), url, snippet, imageUrl, price, currency: price ? "KES" : null, source: "brave_public_search" };
}

function sanitizeTavilyItem(item: TavilySearchItem, index: number): JumiaSearchResult | null {
  const url = item.url?.trim() || "";
  const content = item.content || "";
  const title = customerTitle(item.title || "", content);
  if (!isJumiaUrl(url) || title.length < 3) return null;
  const snippet = cleanSnippet(content, title);
  const imageUrl = firstJumiaImage((item.images ?? []).map(image => image.url), content);
  const productLikeContent = /\bbuy\b[^|]{2,160}\bonline\b\s*\|\s*jumia kenya\b/i.test(content) || /\bfrom\s+(?:kes|ksh)\s*[\d,]+/i.test(content);
  const price = isLikelyProductUrl(url) || productLikeContent ? extractTextPrice(`${title} ${snippet}`) : null;
  return { id: resultId(url, index), title: title.slice(0, 180), url, snippet, imageUrl, price, currency: price ? "KES" : null, source: "tavily_public_search" };
}

function resultMessage(results: JumiaSearchResult[]) {
  return results.length ? "Live products found." : "No individual product pages were found. Try a more specific product or model.";
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
  const results = prioritizeVisualResults((payload.items ?? []).map((item, index) => sanitizeGoogleItem(item, index)).filter((item): item is JumiaSearchResult => Boolean(item)));
  return { configured: true, provider: "google_public_search", query: normalized, results, message: resultMessage(results) };
}

async function searchWithTavily(normalized: string, config: { key: string }): Promise<JumiaSearchResponse> {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: config.key, query: `site:jumia.co.ke ${normalized}`, search_depth: "basic", max_results: MAX_RESULTS, include_answer: false, include_raw_content: false, include_images: true }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error("The Jumia search provider is temporarily unavailable.");
  const payload = await response.json() as TavilySearchResponse;
  const results = prioritizeVisualResults((payload.results ?? []).map((item, index) => sanitizeTavilyItem(item, index)).filter((item): item is JumiaSearchResult => Boolean(item)));
  return { configured: true, provider: "tavily_public_search", query: normalized, results, message: resultMessage(results) };
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
  const results = prioritizeVisualResults((payload.web?.results ?? []).map((item, index) => sanitizeBraveItem(item, index)).filter((item): item is JumiaSearchResult => Boolean(item)));
  return { configured: true, provider: "brave_public_search", query: normalized, results, message: resultMessage(results) };
}

export async function searchJumiaPublicProducts(query: string): Promise<JumiaSearchResponse> {
  const normalized = query.trim().replace(/\s+/g, " ").slice(0, 120);
  if (normalized.length < 3) return { configured: false, provider: "unconfigured", query: normalized, results: [], message: "Enter at least three characters to search live products." };
  const googleConfig = getGoogleConfig();
  if (googleConfig) return searchWithGoogle(normalized, googleConfig);
  const tavilyConfig = getTavilyConfig();
  if (tavilyConfig) return searchWithTavily(normalized, tavilyConfig);
  const braveConfig = getBraveConfig();
  if (braveConfig) return searchWithBrave(normalized, braveConfig);
  return { configured: false, provider: "unconfigured", query: normalized, results: [], message: "Live product search is not connected yet." };
}
