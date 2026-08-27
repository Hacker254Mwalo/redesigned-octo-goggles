# Owner-managed external sourcing assessment

**Status:** Design record only. This document does not authorize supplier imports, API use, browser automation, catalogue copying, payment collection, delivery, named collection-point operations, or any external account action. The founder has explicitly asked to retain this as a future capability while current work improves the local MtaaMarket experience.

## Purpose

MtaaMarket can complement local Siaya vendor listings with a founder-operated **request-and-confirmation** service. A buyer asks MtaaMarket to look for a physical product; the founder may later use a personal supplier or affiliate account outside MtaaMarket to assess availability. The customer sees a truthful MtaaMarket-confirmed offer only after the founder has reviewed the item, final price, lead time, and possible handover route.

This is not a supplier catalogue mirror, a hidden affiliate storefront, or an automatic checkout service. It does not represent any supplier as a MtaaMarket vendor, and it does not promise a product is available, a price is locked, or a delivery/collection point is confirmed until the founder says so.

## Initial source findings

| Finding | Design consequence |
|---|---|
| Jumia’s Vendor Center describes its API as a seller-operational integration for vendors managing their own operations through ERP/API systems, not as a general third-party catalogue-import or buyer-checkout permission.[1] | MtaaMarket must not build an automatic Jumia product-sync, price polling, stock feed, or checkout path without a specifically authorised agreement and documented API scope. |
| Kenya’s Consumer Protection Act includes an internet-agreement disclosure obligation and prohibits false, misleading, or deceptive representations.[2] [3] | The customer must receive a MtaaMarket offer that clearly states the supplier relationship category, factual item description, final amount, fees if any, availability/lead-time qualification, collection/delivery terms, and the action required to accept. |
| Current MtaaMarket policy already keeps external sourcing owner-recorded, customer-confirmed, and based on original MtaaMarket content. | The safe baseline is to extend the existing Request Desk and owner-assisted-order experience, not create an “AI vendor,” copied supplier listing, or a direct external cart. |

The refreshed official-source search located only Jumia’s **Vendor Center** API entry, which describes a seller/ERP integration for sellers managing their own catalogue and orders.[1] Its public documentation interface remained dynamically unavailable for a detailed unauthenticated review, and the available materials did not establish permission for MtaaMarket to expose a buyer-facing Jumia catalogue, current stock/price feed, or checkout-on-behalf flow. That is not evidence that no commercial programme exists; it is evidence that MtaaMarket currently has **no documented authorization** for that integration.

## Separate supplier-sourced collection design

The founder’s requested experience can be implemented only in two distinct layers:

| Layer | Safe launch behavior | Not permitted without supplier authorization |
|---|---|---|
| **MtaaMarket collection interface** | Shows only founder-provided, original MtaaMarket content for an approved supplier-sourced item. A buyer can place a **pending MtaaMarket request**, not a supplier order. | Presenting a supplier’s live catalogue, brand/product imagery, titles, reviews, stock, rankings, discounts, seller identity, or claimed real-time pricing as if MtaaMarket receives a feed. |
| **Founder confirmation** | The founder manually checks the item in their own supplier account, then accepts or cancels the MtaaMarket request. Acceptance must record the exact MtaaMarket item, final inclusive amount, availability check time, collection/delivery arrangement, and a qualified handover window. | Automatically logging in, adding to a supplier cart, placing an order, passing buyer data to the supplier, calculating a supplier price/fee, or silently changing an accepted MtaaMarket offer. |
| **Buyer handover** | Buyer receives a platform-managed update and pays only at the **founder-confirmed** pickup or delivery handover, subject to the agreed terms. | A payment guarantee, a named third-party pickup guarantee, cash custody, automatic M-Pesa charge, or representation that the supplier, courier, or collection provider is a MtaaMarket partner without an agreement. |

This is the operating contract for the requested **founder-managed Jumia collection**. A dedicated buyer-facing live-search catalogue is deferred until the founder provides written supplier permission and an authorised API/specification that expressly supports MtaaMarket’s intended display, refresh, order, privacy, and commercial use. Until then, the appropriate interface is a premium MtaaMarket collection built only from original, owner-checked information; it can be expanded later without merging its data or lifecycle with local vendor listings.

## Future supplier-sourced collection lifecycle

The current public Market and Request Desk remain general MtaaMarket experiences. The following is the separate future collection lifecycle, not an active customer flow.

| Stage | MtaaMarket record and customer experience | Founder responsibility | Automation boundary |
|---|---|---|---|
| **1. Authorised catalogue source** | A supplier-sourced item may be displayed only if the founder has a written supplier authorization and a technical interface whose terms allow this buyer-facing use. Every record needs a provenance timestamp and an owner review state. | Retain proof of authorization and ensure every displayed fact is permitted and current. | No scraping, browser automation, copied data, or inferred availability. |
| **2. Buyer pending order** | A verified MtaaMarket buyer selects an eligible item and creates a **pending MtaaMarket order**, never a supplier order. The page clearly says that item, final amount, and handover are awaiting founder confirmation. | Review the buyer’s quantity and broad fulfilment preference. | No supplier cart, checkout, buyer-data transfer, payment request, or delivery promise. |
| **3. Founder procurement decision** | The buyer receives either an approved MtaaMarket confirmation or a cancellation with a clear next step. | Manually check the item and, only after the buyer confirmation rules are satisfied, use the founder’s own Jumia account outside MtaaMarket. Record a non-sensitive status and current check time. | No automatic ordering, price calculation, payment handling, or status inference. |
| **4. Handover confirmation** | Buyer sees the final inclusive MtaaMarket amount, a confirmed collection or delivery arrangement, and payment timing before proceeding. Payment is made only at the agreed handover stage. | Confirm item arrival/hand-off readiness and use platform-managed support for communication. | No automatic M-Pesa initiation, escrow, third-party collection guarantee, or courier dispatch. |
| **5. Cancellation or exception** | If the item is unavailable, changes materially, or cannot be handed over as agreed, the founder cancels before any buyer payment instruction and sends an owner-reviewed update. | Resolve the case manually and keep any supplier evidence private. | No unreviewed substitute, repricing, re-order, or customer notification. |

## Activation requirements

Before this collection is built, the founder must provide a written authorization or supplier-provided API specification that covers product data display, refresh frequency, customer order handling, brand/content use, and any account/data restrictions. The implementation must then be separately designed with source provenance, price/availability timestamps, a change-review workflow, buyer cancellation terms, data retention, incident handling, owner audit history, and end-to-end tests. The customer interface must make the MtaaMarket confirmation state prominent and must never imply that the supplier, delivery provider, or collection point has entered an agreement with MtaaMarket unless that is true.

AI remains a later optional drafting tool. It may help an authorised owner rewrite their **own verified facts** into an editable MtaaMarket description, but it cannot import supplier data, generate a supplier listing, determine availability, set price, accept/cancel an order, or send a customer update. Every request must state that it may consume model credits and must preserve the data-minimisation, rate-limit, retention, error, and human-review controls already defined above.

## Decision boundary for the next design phase

The launch-safe service name is **“MtaaMarket Assisted Sourcing”** or **“Request an item”**, rather than “Jumia vendor,” “Jumia verified,” “AI vendor,” or language that could imply the supplier is browsing, selling, or delivering through MtaaMarket. A customer may request a product by ordinary text and optional requirements. The founder then makes a manual decision outside the application. No supplier link, supplier image, supplier price, supplier review, product ranking, stock claim, or affiliate tracking data is required in the customer request.

Any later AI feature must be a user-triggered, server-side, editable drafting aid that receives only founder-provided MtaaMarket facts. It must disclose model-credit use before activation and must never source a product, identify a supplier, state availability, set a price, approve a listing, create an order, or send a customer communication without a human review.

## Zero-cost launch tools and future AI decision

| Approach | What it gives MtaaMarket now | Cost and setup | Decision |
|---|---|---|---|
| **Manual-first Request Desk** | One premium Siaya entry point for unmatched searches, factual customer requirements, owner review, and a later confirmed offer. | No model, supplier API, queue, tracker, external account connection, or per-request charge. | **Enabled.** This is the correct launch path. |
| **Owner-authored listing and message templates** | Consistent English-first wording for offers, collection preferences, and customer confirmations based on facts the founder has personally checked. | No model call. The founder remains responsible for every factual statement. | **Enabled through guidance only.** |
| **Opt-in AI drafting** | A future concise draft of an owner-provided offer or listing description before the owner edits and approves it. | Model calls consume project credits. The live model catalogue currently lists ten candidate models, but it did not return price metadata; no model has been selected or called. | **Not enabled.** Provider/model, per-day or monthly credit budget, consent wording, retention, abuse limits, timeout, fallback, and audit design must be approved first. |
| **Authorised supplier integration** | A future factual availability/price feed or order handoff, if a supplier grants a suitable contract and API scope. | Requires written authorisation, privacy/security review, operational reconciliation, and a supplier-specific test. | **Not enabled.** The current public Jumia vendor API material does not establish this permission for MtaaMarket’s buyer-facing use. |

The current active model catalogue includes `gpt-5-nano`, `gpt-5-mini`, `gpt-5`, `gpt-5.5`, `claude-haiku-4-5`, `claude-sonnet-4-6`, `claude-opus-4-6`, `claude-opus-4-7`, `gemini-3-flash-preview`, and `gemini-3.1-pro-preview`. Availability is not authorization: choosing any model would be a later explicit product and budget decision. This assessment made **no model invocation**, so no AI generation credit was used.

### Required future AI controls

Before an AI drafting button is activated, the request must be deliberate and attributable to an authorised seller or owner. It must send only title, category, and owner-entered factual notes—never customer contacts, payment instructions, supplier screenshots, supplier links, private order data, or a customer’s private location. The result must be labelled as an editable draft and must be discarded on error or timeout. The system must use a conservative per-user rate limit, a short maximum output, server-only credentials, and a clear message that an AI request can consume credits. Publishing, supplier choice, pricing, availability, fulfilment, customer communication, and payment remain human decisions.

## References

[1]: https://vendorcenter.jumia.com/api-docs/ "Jumia Vendor Center API"

[2]: https://new.kenyalaw.org/akn/ke/act/2012/46/eng@2022-12-31 "Consumer Protection Act, 2012 (Kenya Law)"

[3]: https://www.sheriaplex.com/kenya-acts/5386-section-12-of-the-consumer-protection-act-cap-501-false-representation "Consumer Protection Act — Section 12 (secondary navigation aid)"
