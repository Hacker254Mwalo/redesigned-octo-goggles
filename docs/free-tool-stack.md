# Siaya Online MtaaMarket: Zero-Cost AI and Operations Stack

## Launch principle

MtaaMarket should use technology only when it improves a real Siaya buyer, seller, or owner workflow. The first release must be **owner-controlled, privacy-aware, low-cost, and replaceable**. A free tier is a launch aid, not a permanent production guarantee; each optional provider must remain behind a narrow module so the platform can change providers without rebuilding its marketplace rules.

| Need | Launch choice | What is verified | Guardrail |
|---|---|---|---|
| Marketplace data foundation | Isolated MtaaMarket Supabase project | PostgreSQL, Auth-ready profiles, RLS, catalogue categories, and storage buckets are now isolated from Dumiropay. | Do not send the existing Vercel protected traffic to it until server adapter, session, and storage migrations are tested. |
| Listing-copy assistance | Existing manual Seller Studio draft assistant | The live built-in model catalog includes `gpt-5-nano`, `gpt-5-mini`, GPT-5, Claude, and Gemini models. | Drafts only; the seller must review. Never set a price, approve a vendor, promise stock, or decide a refund. |
| Product photos | Original mobile photo + existing browser WebP compression | Keeps uploads smaller before storage and preserves truthful representation. | Never generate a product image that changes the item, condition, brand, stock, or price. |
| Image quality guidance | Checklist first; optional vision review later | An optional vision check can identify blur, dark lighting, or missing angles using a server-side model request. | Never use a photo to infer private traits, make automated seller decisions, or replace owner review. |
| Basic website measurement | Cloudflare Web Analytics beacon | Cloudflare offers privacy-focused web analytics without cookies, local storage, or visitor fingerprinting. [1] | Use one simple measurement system first; exclude checkout, contact, and order-detail paths from tracking plans. |
| Product analytics and flags | PostHog only when funnels/feature flags are needed | Its current free tier says no card is needed and includes one project with monthly free allowances and hard usage stopping at limits. [2] | Add only with a privacy notice and a deliberately small event plan. Do not replay sensitive pages. |
| Error monitoring | Sentry Developer plan when production errors need alerts | Sentry lists a $0 developer plan with error monitoring, tracing, alerts, and one user. [3] | Remove buyer names, phone numbers, addresses, payments, and tokens before errors are sent. |
| Support operations | Request Desk plus owner-managed Assisted Market orders | Keeps the buyer, vendor, and owner workflow in MtaaMarket rather than exposing buyer details to sellers. | Do not add automated WhatsApp or chatbot messaging until consent, business account, and response ownership are defined. |

## AI features to build in the right order

The first AI feature is already the correct one for a zero-budget founder: **a manual listing-copy draft from seller-provided facts**. It is controlled by a human, limited to English, and does not affect commercial decisions. The current live model catalog makes `gpt-5-mini` a suitable default for short structured listing copy and `gpt-5-nano` a possible later low-cost option for simple checks; no model should be hard-coded without checking the current catalog again.

The next safe layer is a **photo readiness checklist**, not automated image generation. The platform can first validate file size, type, dimensions, and the presence of an original image. Later, with a visible “review photo quality” button, a vision model may return suggestions such as “take the image in better light” or “show the product label.” The seller remains responsible for the image and the owner retains moderation control.

> MtaaMarket will not launch autonomous chat, AI price setting, AI credit or fraud scoring, automatic refunds, automatic vendor approval, generated product photos, scraping, supplier checkout bots, or AI-created customer promises. Those features either cost money, create compliance risk, or weaken the platform-control model.

## Jumia-assisted sourcing: what MtaaMarket may and may not do

MtaaMarket may help a Siaya buyer request an item that the owner later sources through a legitimate route, including an external marketplace, but it must present this as an **owner-managed assisted request**, not as an official Jumia listing, partnership, or automated fulfilment service. The owner must confirm the actual item, price, availability, payment timing, pickup/delivery method, and buyer acceptance before creating a MtaaMarket assisted order.

| Acceptable owner-managed workflow | Not allowed in this launch |
|---|---|
| Buyer submits a Request Desk item request with their budget and fulfilment preference. | Copying Jumia product text, images, logos, reviews, or prices into a MtaaMarket listing. |
| Owner manually checks lawful supplier options and gives a transparent quote. | Scraping, data harvesting, or using automated bots against Jumia. |
| Buyer accepts the quote; owner records an Assisted Market order with a visible `external_marketplace` source route. | Placing an order on a buyer’s behalf without transparent confirmation or pretending MtaaMarket is affiliated with Jumia. |
| Owner gives realistic status updates and handles local pickup or delivery as separately agreed. | Promising Jumia availability, delivery times, returns, or payment terms before the owner confirms them. |

Jumia’s published terms prohibit systematic automated data collection, including scraping and data extraction, and restrict commercial reuse of its materials. [4] Its Kenyan marketplace page also describes separate vendor requirements and operations, which reinforces that MtaaMarket must not present itself as a Jumia vendor or logistics channel without a real approved relationship. [5]

## Practical rollout order

Start with the existing listing draft assistant, original photos, Request Desk, Assisted Market orders, and simple owner dashboards. Add Cloudflare Web Analytics only once the privacy notice and a small page-view plan are ready. Introduce PostHog only when the owner needs funnel or feature-flag answers that basic analytics cannot give. Add Sentry at the moment real protected traffic is enabled. Each addition should have a small owner-facing success measure—for example, “fewer incomplete listings” or “faster response to item requests”—rather than being added simply because it is fashionable.

## Current free-plan comparison

The recommended first addition remains **none until the public privacy notice is ready**, followed by **Cloudflare Web Analytics only**. It is the narrowest option for basic page and performance measurement. Sentry becomes useful only when real protected customer traffic exists, while PostHog should wait until the owner has a specific funnel or feature-flag question that simple analytics cannot answer.

| Tool | Official free-plan position checked | Best first use for MtaaMarket | Do not send |
|---|---|---|---|
| Cloudflare Web Analytics | Cloudflare presents it as privacy-focused web analytics for understanding page performance. [6] | Public page views and page-performance trends. | Customer names, contact information, order details, payment paths, or Request Desk text. |
| Sentry Developer | Sentry lists a $0 Developer plan for one user, with error monitoring, tracing, alerts, and email notifications. [7] | Production error alerts once account and order flows are genuinely live. | Buyer/vendor identities, phone numbers, addresses, payment references, tokens, or raw request bodies. |
| PostHog Free | PostHog says its no-card Free plan includes one project, one-year data retention, unlimited team members, monthly allowances, and usage stopping at free-tier limits. [8] | Later: a small, consented event plan for product discovery funnels or carefully reviewed feature flags. | Session recordings of sign-in, Request Desk, baskets, checkout, payment, profiles, seller operations, or owner dashboards. |

No provider is connected by this comparison. Before adding any tool, the owner should document a specific measurement question, name the exact paths/events permitted, keep the integration removable, and review the provider's current terms and limits again.

## References

[1]: https://www.cloudflare.com/web-analytics/ "Cloudflare Web Analytics"
[2]: https://posthog.com/pricing "PostHog pricing"
[3]: https://sentry.io/pricing/ "Sentry pricing"
[4]: https://www.jumia.co.ke/sp-terms-and-conditions "Jumia Kenya terms and conditions"
[5]: https://www.jumia.co.ke/sp-market-place/ "Jumia Kenya marketplace"
[6]: https://developers.cloudflare.com/web-analytics/ "Cloudflare Web Analytics documentation"
[7]: https://sentry.io/pricing/ "Sentry pricing"
[8]: https://posthog.com/pricing "PostHog pricing"
