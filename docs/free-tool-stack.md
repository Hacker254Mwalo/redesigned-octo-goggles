# Siaya Online MtaaMarket: Free-Tier Tool Stack

This document separates **useful tools** from expensive or distracting technology. MtaaMarket should use a tool only when it improves a real customer, seller, or owner workflow. Free tiers can change, so none should become a single point of failure.

| Need | Launch recommendation | Why it fits | Boundary |
|---|---|---|---|
| Marketplace application | The existing managed full-stack project | It already provides authentication, database, server procedures, storage, and a responsive web app. | Keep M-Pesa, courier, and supplier integrations disabled until an actual merchant or provider agreement exists. |
| Seller listing support | Manual server-side listing assistant in Seller Studio | It drafts original product copy only from seller-entered facts. | The seller must review the result. It cannot approve a seller, set a price, promise stock, or make payment/refund decisions. |
| Product photos | Original mobile photos, WebP compression, and optional outside editing tools | Original photos make listings more credible and reduce copied-content risk. | Do not use generated images to misrepresent an item, condition, stock, logo, or brand. |
| Founder AI experimentation | Google AI Studio / Gemini free tier | Google documents a no-charge starting tier for selected Gemini models and AI Studio access. [1] | Google says free-tier content may be used to improve its products; never submit customer contact, payment, order, or sensitive data. [1] |
| Optional model experiments | Hugging Face Inference Providers | Hugging Face documents small monthly credits for free users and multiple providers. [2] | Credits are limited and subject to change; this is not a production guarantee or a place for private buyer data. |
| Traffic and conversion measurement | Google Analytics | Google states that Analytics tools are available free of charge for understanding journeys and improving marketing results. [3] | Add only after the founder understands the privacy notice and measurement need. Do not use analytics to expose personal order details. |
| Customer support | MtaaMarket Request Desk and private workspace first | Keeps buyer/vendor communication and fulfilment instructions inside the platform. | A future messaging or WhatsApp layer must use a real business account and the customer’s consent; it should not bypass the platform-control model. |

## What is enabled in this build

The Seller Studio includes a **manual “Use AI to draft from these facts” control**. It is rate-limited, server-side, and limited to product titles, category, condition, and seller-provided description facts. It never receives buyer contact information, payment data, order notes, or supplier credentials. The output is a draft, not a decision.

## What remains deliberately optional

The following are not activated merely because they exist: autonomous customer chat, AI price-setting, AI fraud/scam scoring, automatic refunds, automated seller approval, generated product imagery, web scraping, supplier checkout bots, payment integrations, and courier APIs. They would either increase cost, create legal/operational risk, or remove the owner control that is central to MtaaMarket.

## Upgrade rule

Move from a free tier only when the platform has a measured need: regular listing-assistant use, a stable number of real orders, recurring seller activity, or a provider contract. Keep each provider behind a server-side module so it can be replaced without rebuilding the marketplace.

## References

[1] [Google Gemini Developer API pricing](https://ai.google.dev/gemini-api/docs/pricing)

[2] [Hugging Face Inference Providers: Pricing and Billing](https://huggingface.co/docs/inference-providers/en/pricing)

[3] [Google Analytics](https://marketingplatform.google.com/about/analytics/)
