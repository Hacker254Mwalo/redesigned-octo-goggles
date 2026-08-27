# MtaaMarket V3 Architecture Assessment — 27 August 2026

## Decision

The uploaded V3 proposal contains several strong **product-design ideas**: owner review before listing visibility, platform-mediated support, editable seller assistance, and an item-request fallback when a verified catalogue does not have an item. Those ideas align with MtaaMarket’s existing staging model.

However, its immediate execution commands would prematurely activate capabilities that are not safe, authorised, or compatible with the current production boundary. MtaaMarket remains a **public discovery and request site with limited buyer-session foundations**. Protected vendor, order, payment, fulfilment, media, role, and AI workflows remain gated until the corresponding PostgreSQL, Supabase Auth, RLS, storage, cost, and controlled-test milestones are complete.

> **Financial and regulatory note.** This is a technical and operational assessment, not legal or financial advice. A qualified Kenyan payments and legal professional should confirm any plan to receive, hold, release, or disburse customer money before it is offered to the public.

## Pillar-by-pillar adoption decision

| Uploaded pillar | MtaaMarket decision now | Required gate before later implementation |
| --- | --- | --- |
| Vendor approval and unpublished listings | **Retain as the target model, but do not activate.** The isolated database already has vendor-application governance with RLS; public seller writes and role elevation remain disabled. | Complete Supabase UUID profile mapping, founder-only role assignment, original-media upload rules, protected write procedures, RLS allow/deny tests, and a controlled seller-only test. |
| Platform escrow and M-Pesa STK Push | **Do not implement or advertise.** A platform-controlled wallet, escrow release, PIN collection, and vendor payout would make MtaaMarket responsible for sensitive payment and fulfilment operations. The Central Bank of Kenya publishes an authorised payment-service-provider directory, so a production money-flow model needs a separately reviewed, authorised payment arrangement rather than a website-only status field.[1] | Founder-approved payment architecture, legal/regulatory review, an authorised provider contract and webhook design, reconciliation, refund/dispute controls, privacy review, live test environment, and explicit launch approval. |
| Jumia URL fetch, copied metadata, markup, and automatic catalogue save | **Reject.** MtaaMarket will not scrape or copy supplier title, photo, price, review, or catalogue data; it will not automatically add a margin, present supplier stock as MtaaMarket stock, or automate supplier checkout. Jumia’s Vendor Center API is for an approved seller to manage that seller’s own marketplace operations, and the existing MtaaMarket review records that its terms restrict commercial reuse and systematic collection of website material.[2] [3] | A separately approved, legitimate supplier or seller integration with written data-use permission, credential isolation, original-content rules, customer confirmation, pricing ownership, audit logs, and tests that prohibit automatic purchase or source-derived claims. |
| AI image clean-up and listing-copy generation | **Defer.** AI may only become an editable helper after the protected seller and media paths work. It must never publish a listing, choose price, claim stock, approve a vendor, or alter a source item. Cloudinary background removal is asynchronous, can return pending responses, and may preserve/backup image variants; it also uses special transformation counting and certain add-ons are billed separately.[4] [5] | Founder selects provider, zero-cost or funded budget, retention policy, original-image consent, storage location, moderation/quality fallback, per-user limits, output disclosure, and a human approval flow. |
| Vision request desk and vector similarity | **Defer; preserve the manual Request Desk.** The current text request flow is truthful and sign-in-gated for submission. Vision or embeddings would send uploaded content to an AI provider and introduce model cost, privacy, error, and matching-quality risks. The Vercel AI SDK supports image inputs and embeddings, but documents token usage for embeddings and retry/telemetry controls that must be intentionally configured.[6] [7] [8] | A user-visible consent notice, minimal input scope, no automatic request submission, no retained image without a storage policy, model/budget decision, rate limiting, opt-out telemetry, measurable match-quality threshold, human review, and tests for timeout/error/no-match paths. |

## Compatible architecture to keep

MtaaMarket can retain the uploaded proposal’s **human-in-the-loop** direction without changing the current live boundary:

1. A buyer searches public, owner-reviewed listings or opens the Request Desk.
2. The owner reviews a request manually, using original MtaaMarket wording and no implied source affiliation.
3. Any exact item, amount, and practical fulfilment preference are presented only for buyer confirmation; a request by itself sends no payment instruction and causes no supplier action.
4. Only after protected identity, roles, moderated seller write paths, original-media storage, and payment architecture are separately validated may a verified workflow be considered.

This preserves the credible elements of the design while avoiding fabricated inventory, copied content, unattended procurement, unsupported payment custody, or false availability claims.

## Staged implementation order

| Stage | Scope | Non-negotiable boundary |
| --- | --- | --- |
| 1 — Current | Public discovery, Request Desk guidance, transparent assisted-sourcing explanation, owner-reviewed catalogue language, and account accessibility. | No real marketplace operation is accepted; no public seller write or payment is enabled. |
| 2 — Identity and protected data | Supabase UUID buyer profiles, founder-only role assignment, protected procedure migration, and buyer-only controlled account tests. | No vendor/admin elevation through signup; no production test credentials, codes, reset links, or secrets in chat or source control. |
| 3 — Seller moderation and media | Invited/approved seller path, unpublished-by-default listings, scoped original-photo storage, owner moderation, and audit trail. | No self-service listing visibility, copied supplier media, or automatic publishing. |
| 4 — Optional assisted AI | Explicitly selected model/provider, low-volume editable suggestions, private input policy, caps, disabled telemetry where appropriate, and human review. | No AI commercial decision, supplier tool, automatic message, scheduled model call, or background polling. |
| 5 — Payments and fulfilment | Professional payment/fulfilment design using approved providers, disclosure, reconciliation, and controlled test release. | No platform-operated escrow, automated payout, buyer PIN hand-off, or live payment instruction until this stage passes separately. |
| 6 — Authorised external catalogue integration | Only if MtaaMarket has written authority and a verified business relationship. | No scraping, copied listings, source price monitoring, automatic repricing, or automatic third-party checkout. |

## Immediate action

No V3 schema migration, checkout refactor, M-Pesa action, Jumia fetch endpoint, Cloudinary integration, AI model call, vector database, scheduled job, or public vendor upload was created from the uploaded prompt. The next safe technical work remains the existing protected identity and data-adapter migration, which requires an isolated tested milestone and, where needed, founder-controlled browser approval.

## References

[1]: https://www.centralbank.go.ke/national-payments-system/ "Central Bank of Kenya — National Payments System and authorised PSP directory"
[2]: https://vendorcenter.jumia.com/api-docs/ "Jumia Vendor Center API documentation"
[3]: https://www.jumia.co.ke/sp-terms-and-conditions "Jumia Kenya terms and conditions"
[4]: https://cloudinary.com/documentation/background_removal "Cloudinary — Background removal documentation"
[5]: https://cloudinary.com/documentation/developer_onboarding_faq_credits "Cloudinary — Credits and add-on billing documentation"
[6]: https://ai-sdk.dev/cookbook/node/generate-text-with-image-prompt "Vercel AI SDK — Generate text with image input"
[7]: https://ai-sdk.dev/docs/ai-sdk-core/embeddings "Vercel AI SDK — Embeddings, usage, retries, and timeouts"
[8]: https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text "Vercel AI SDK — generateText telemetry and tool controls"
