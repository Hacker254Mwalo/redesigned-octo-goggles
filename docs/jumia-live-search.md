# Jumia live discovery for MtaaMarket

## What is implemented

MtaaMarket now has a server-side `jumiaSearch` procedure, a customer-facing search panel on `/jumia`, and an optional embedded Google Standard Search Element. When a supported search provider is configured, the customer searches by keyword, sees sanitized Jumia Kenya result cards, selects a result, and adds it to the normal unpaid MtaaMarket order. The selected page URL, displayed image, and displayed price are retained as reference data for the private fulfilment review.

The customer sees that results come from public Jumia Kenya pages and that price, stock, variant, and delivery are confirmed before fulfilment. The customer still uses the ordinary MtaaMarket order path: choose delivery or collection, schedule the hand-off, and pay only at hand-off.

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

The server query is restricted to `site:jumia.co.ke`, uses safe-search settings where supported, requests at most ten results, accepts only HTTPS Jumia Kenya URLs, and ignores non-Jumia results. The server does not accept arbitrary external URLs as selected Jumia references.

## Important provider status

Google’s official documentation lists the Standard Search Element as a free client-side option and the Custom Search JSON API as a separate programmatic option. The page can use the Standard Search Element when `VITE_GOOGLE_PSE_CX` is configured. If no provider credential is configured, it remains operational with a quiet “search is not connected yet” state rather than displaying fabricated products.

The provider boundary is intentionally isolated in `server/jumia-search.ts`, while the optional embedded element lives in `client/src/components/JumiaGoogleSearch.tsx`. If Jumia later grants a Vendor Center catalogue feed or an approved partner search endpoint, that adapter can be replaced without changing the customer order, basket, delivery, cancellation, or refund workflow.

## Customer and founder flow

A customer searches for a product inside MtaaMarket and selects a public result. The customer may add multiple selected items to one unpaid order, choose Siaya collection, a collection point, or home delivery, and submit the order. The founder verifies current stock, variant, price, and delivery route before supplier fulfilment. If the item is unavailable, the founder cancels the order. If payment had already been recorded, the founder marks `refund_due`; the server calculates a three-working-day target and the founder later marks `refunded`.

## References

- Google Programmable Search overview: https://developers.google.com/custom-search/docs/overview
- Google Programmable Search Element: https://developers.google.com/custom-search/docs/element
- Tavily credits and pricing: https://docs.tavily.com/documentation/api-credits
- Tavily Search endpoint: https://docs.tavily.com/documentation/api-reference/endpoint/search
- Brave Search API pricing: https://api-dashboard.search.brave.com/documentation/pricing
- Jumia Vendor Center API documentation: https://vendorcenter.jumia.com/api-docs/
- Jumia JForce: https://jforce.jumia.co.ke/
