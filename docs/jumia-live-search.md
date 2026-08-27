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

The server query is restricted with the `site:jumia.co.ke <query>` search operator, uses safe-search settings where supported, requests at most ten results, accepts only HTTPS Jumia Kenya URLs, and ignores non-Jumia results. Tavily is intentionally not sent an additional `include_domains` filter because production testing showed that combination could suppress valid Jumia results. The server does not accept arbitrary external URLs as selected Jumia references.

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
