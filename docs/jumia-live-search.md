# Jumia live discovery for MtaaMarket

## What is implemented

MtaaMarket now has a server-side `jumiaSearch` procedure and a customer-facing search panel on `/jumia`. When a supported search provider is configured, the customer searches by keyword, sees sanitized public Jumia Kenya result cards, selects a result, and adds it to the normal unpaid MtaaMarket order. The selected page URL, displayed image, and displayed price are retained as reference data for the founder’s fulfilment review.

The customer sees that results come from public Jumia Kenya pages and that price, stock, variant, and delivery are confirmed before fulfilment. The customer still uses the ordinary MtaaMarket order path: choose delivery or collection, schedule the hand-off, and pay only at hand-off.

## Production configuration

The server accepts either pair of environment variables:

| Variable | Purpose |
|---|---|
| `GOOGLE_CUSTOM_SEARCH_API_KEY` | Google Custom Search JSON API key |
| `GOOGLE_CUSTOM_SEARCH_CX` | Programmable Search Engine ID configured to search `jumia.co.ke` |

The aliases `GOOGLE_SEARCH_API_KEY` and `GOOGLE_SEARCH_CX` are also accepted. These variables are server-only and must not be prefixed with `VITE_` or exposed in client code.

The search query is automatically restricted to `site:jumia.co.ke`, uses safe search, requests at most ten results, accepts only HTTPS Jumia Kenya URLs, and ignores non-Jumia results. The server does not accept arbitrary external URLs as selected Jumia references.

## Important provider status

Google’s official documentation currently states that the Custom Search JSON API is closed to new customers. Existing eligible customers may use the service during its transition period, but a new MtaaMarket project may not be able to obtain a new API account. If the founder does not already have an eligible Google search account, the page remains operational with an explicit “live discovery is not connected yet” state instead of displaying fabricated results.

The provider boundary is intentionally isolated in `server/jumia-search.ts`. If Jumia later grants a Vendor Center catalogue feed or an approved partner search endpoint, that adapter can be replaced without changing the customer order, basket, delivery, cancellation, or refund workflow.

## Customer and founder flow

A customer searches for a product inside MtaaMarket and selects a public result. The customer may add multiple selected items to one unpaid order, choose Siaya collection, a collection point, or home delivery, and submit the order. The founder verifies current stock, variant, price, and delivery route before supplier fulfilment. If the item is unavailable, the founder cancels the order. If payment had already been recorded, the founder marks `refund_due`; the server calculates a three-working-day target and the founder later marks `refunded`.

## References

- Google Custom Search JSON API overview: https://developers.google.com/custom-search/v1/overview
- Google Custom Search JSON API introduction: https://developers.google.com/custom-search/v1/introduction
- Jumia Vendor Center API documentation: https://vendorcenter.jumia.com/api-docs/
- Jumia JForce: https://jforce.jumia.co.ke/
