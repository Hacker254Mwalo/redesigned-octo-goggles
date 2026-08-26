# MtaaMarket AI Toolkit

## Purpose

MtaaMarket will use AI to reduce writing and organisation work for many gradual local vendors and the owner. It will **not** hand commercial authority to AI. Every price, listing publication, seller approval, welfare decision, product availability, payment instruction, collection/delivery commitment, supplier action, refund, or account role remains a human decision.

The live server-side model catalog currently includes lightweight GPT models, Claude models, and Gemini models. The toolkit selects a lightweight model only when a human actively requests a draft; it does not run automatic background prompts against seller, buyer, or order data.

## Toolkit map

| Toolkit section | User | What it does | Status | Human boundary |
|---|---|---|---|---|
| Listing Draft | Approved seller | Turns seller-supplied facts into an original English description and a missing-facts checklist. | Available through Seller Studio. | Seller must review and edit before any submission. |
| Photo Readiness | Seller | Provides local, no-upload guidance for original photo count, light, clarity, background, label, and product angles. | Available as guided checklist; optional image analysis remains off. | It does not certify condition, authenticity, brand, or stock. |
| Category & Attribute Guide | Seller | Suggests questions to complete a listing, such as size, material, condition, quantity, location, or poultry/livestock details. | AI-ready; activation waits for the protected UUID listing path. | It cannot choose a category or publish a listing. |
| Poultry & Livestock Preflight | Seller and owner | Surfaces the required original-photo, welfare, location, and manual-collection declarations. | Rules defined; live-animal publishing remains gated. | It cannot assess health, ownership, movement eligibility, breed, age, or legality. |
| Item Request Draft | Buyer or owner | Helps a person turn a rough need into a clear Request Desk description. | AI-ready; no automatic quote or sourcing. | The owner confirms availability, price, and fulfilment. |
| Owner Intake Triage | Owner only | Summarises a request into an owner review checklist and flags missing details. | AI-ready; activation waits for the authenticated owner workspace. | It cannot approve, decline, quote, rank sellers, or contact anyone automatically. |
| Support Reply Draft | Owner only | Drafts polite English replies from owner-provided facts and selected status. | AI-ready; activation waits for the authenticated owner workspace. | The owner must review before sending; it cannot promise payment, delivery, refunds, or availability. |
| Listing Moderation Notes | Owner only | Produces a concise checklist of missing listing facts for a human moderator. | AI-ready; no automated removal/approval. | The owner makes every moderation outcome. |
| Marketplace Insights | Owner only | Later, summarises aggregated, non-sensitive trends such as common request categories. | Deferred until consented analytics exists. | No profiling, credit scoring, price setting, or individual behavioural decisions. |

## Model selection and cost control

The first-choice model for short structured drafts is `gpt-5-mini`, with `gpt-5-nano` used only where quality tolerance is lower. Optional future photo analysis should use a vision-capable model only after the owner approves a usage budget and privacy notice. Each endpoint must have a small per-user rate limit, strict JSON output where applicable, and a minimum-fact validation step before invoking a model.

> AI output is a draft, not evidence. MtaaMarket does not use AI to verify an item, determine animal welfare or health, authenticate a brand, estimate a price, predict delivery, select a supplier, make a payment, or make decisions about a person.

## Activation order

1. Keep the existing listing draft and browser-only photo checklist.
2. Add an Item Request draft helper that creates text only; it does not submit a request.
3. After the Supabase Auth owner workspace is validated, add owner-only request triage and support reply drafting behind explicit buttons.
4. Consider optional vision feedback only after privacy, cost, retention, and original-image controls are reviewed.
5. Add aggregate insights only after a small privacy-conscious analytics plan is deliberately approved.
