# Jumia live discovery for MtaaMarket

## What is implemented

MtaaMarket now has a server-side `jumiaSearch` procedure, a customer-facing search panel on `/jumia`, and an optional embedded Google Standard Search Element. When a supported search provider is configured, the customer searches by keyword, sees sanitized Jumia Kenya result cards, selects a result, and adds it to the normal unpaid MtaaMarket order. The selected page URL, displayed image, and displayed price are retained as reference data for the private fulfilment review.

Results are discovered from public Jumia Kenya pages and sanitized server-side. The customer uses the ordinary MtaaMarket order path: choose collection or delivery, add one or more items to the page-local basket, and place the order without upfront payment.

## Production configuration

The server accepts Google JSON-search credentials, a Tavily API key, or a Brave Search API key. Tavily is the best free-trial route for this project because its official documentation lists 1,000 API credits per month with no credit card required.[1]

| Variable | Purpose |
|---|---|
| `GOOGLE_CUSTOM_SEARCH_API_KEY` | Google Custom Search JSON API key |
| `GOOGLE_CUSTOM_SEARCH_CX` | Programmable Search Engine ID configured to search `jumia.co.ke` |
| `TAVILY_API_KEY` | Tavily Search API key; basic search uses one API credit per request |
| `BRAVE_SEARCH_API_KEY` | Brave Web Search API subscription token; the official plan includes monthly credits but may require a card |

The aliases `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_CX`, `TAVILY_SEARCH_API_KEY`, and `BRAVE_SEARCH_API_TOKEN` are also accepted. These variables are server-only and must not be prefixed with `VITE_` or exposed in client code.

For the Google Standard Search Element, the browser uses the separate `VITE_GOOGLE_PSE_CX` variable. This is only a Programmable Search Engine ID, not a secret API key. Configure that engine to search `jumia.co.ke`; the standard client-side element is designed for embedded site search and does not require the closed JSON API.

The server query is restricted with the `site:jumia.co.ke <query>` search operator, requests at most ten results, accepts only HTTPS Jumia Kenya URLs, and ignores non-Jumia results. Google and Brave may use their provider-specific safe-search controls; Tavily intentionally receives only the verified basic-search fields because production testing showed that adding `include_domains`, `country`, or `safe_search` can suppress valid results for the active free-tier key. The server does not accept arbitrary external URLs as selected Jumia references.

## Catalogue-card quality and trust boundaries

The server normalizes public provider metadata before it reaches the customer page. It removes search-page labels such as `@ Best Price`, `Buy … Online`, `Best Price Online`, `Price Online`, `Add to cart`, `Jumia Kenya`, cookie notices, navigation categories, product-image tokens, and indexed media paths from displayed titles and snippets. When a result’s content includes a product-like heading, that heading is preferred over a generic search label. Results ending in `.html` and results with a trusted image or exact indexed price are ranked ahead of generic landing pages. An identical indexed image is not reused as the photo for a second result.

Product images are accepted only from strict HTTPS `ke.jumia.is` product paths. Indexed paths may be converted into a token-free, validated Jumia CDN fallback; if no trusted image exists or the browser cannot load it, the UI shows a branded unavailable-photo state rather than unrelated stock art. Exact KES prices are displayed only when the provider exposes a parseable price for a product-like result; otherwise the customer sees `Price on product page`.

This is public discovery rather than a first-party Jumia catalogue feed. The provider index can return category, search, or landing pages, and may omit current photos, prices, stock, variants, and delivery information. The customer flow therefore preserves the selected public URL, image, and price as reference data without fabricating missing values. The server now removes known `/slp`, `/mlp`, category, search, and brand landing-page URLs from customer cards; if the provider returns only those pages, the customer receives a clear prompt to search for a more specific product or model.

## Official permitted feed path

Jumia’s official Vendor Center documentation describes `GET https://vendor-api.jumia.com/catalog/products` as a paginated catalogue endpoint for an authenticated seller/mastershop. It returns seller-managed product records with names, descriptions, images, variations, and price fields, and supports filters such as shop, status, QC status, visibility, and pagination. Every request requires an OAuth2 bearer token. Jumia documents two application types: **Self Authorization** for unattended integrations, which uses a rotating refresh token, and **Web Application** for an interactive login flow, which must send the user through login again when its access token expires.[5]

This is the permitted integration route only when the founder has a Jumia Vendor Center seller/mastershop account and registers an application in Vendor Center. JForce access by itself is not documented as Vendor Center catalogue API access. The official catalogue endpoint has no buyer keyword-search parameter, so an approved integration would retrieve the authorized seller/mastershop catalogue, paginate it, and perform local product-name/category matching. It would not expose Jumia’s entire public marketplace unless the authorized account is entitled to those records.

Do not place a client secret, refresh token, or access token in the browser or GitHub. Once the founder provides the official Vendor Center application authorization through the registered callback—or supplies a permitted server-side feed/export—the provider adapter can replace Tavily without changing the customer basket, delivery, order, cancellation, or refund workflow. Exact first-party catalogue fidelity requires that approved access; until then, the safer public-discovery fallback remains active.

Exact first-party catalogue fidelity requires a permitted Jumia catalogue feed, partner endpoint, or other approved data source.

## Important provider status

Google’s official documentation lists the Standard Search Element as a free client-side option and the Custom Search JSON API as a separate programmatic option. The page can use the Standard Search Element when `VITE_GOOGLE_PSE_CX` is configured. If no provider credential is configured, it remains operational with a quiet “search is not connected yet” state rather than displaying fabricated products.

The provider boundary is intentionally isolated in `server/jumia-search.ts`, while the optional embedded element lives in `client/src/components/JumiaGoogleSearch.tsx`. If Jumia later grants a Vendor Center catalogue feed or an approved partner search endpoint, that adapter can be replaced without changing the customer order, basket, delivery, cancellation, or refund workflow.

## Customer and founder flow

A customer searches for a product inside MtaaMarket and selects a public result. The customer may add multiple selected items to one unpaid page-local basket, choose Siaya collection, a collection point, or home delivery, and submit the order. The private owner workspace then manages the order lifecycle. If the item is unavailable, the owner cancels the order. If payment had already been recorded, the order enters `refund_due`; the server calculates a three-working-day target and the owner later marks `refunded`. Search coverage depends on the provider index, so a narrower term may return fewer cards than a broader equivalent.

## References

- Google Programmable Search overview: https://developers.google.com/custom-search/docs/overview
- Google Programmable Search Element: https://developers.google.com/custom-search/docs/element
- Tavily credits and pricing: https://docs.tavily.com/documentation/api-credits
- Tavily Search endpoint: https://docs.tavily.com/documentation/api-reference/endpoint/search
- Brave Search API pricing: https://api-dashboard.search.brave.com/documentation/pricing
- Jumia Vendor Center API documentation: https://vendorcenter.jumia.com/api-docs/
- Jumia JForce: https://jforce.jumia.co.ke/

[5]: https://vendorcenter.jumia.com/api-docs/ "Jumia Vendor Center GPM/GOP API documentation"
