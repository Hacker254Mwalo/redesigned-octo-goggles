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

## Requested schema compatibility addendum

The later V3 directive supplied exact `profiles`, `products`, and `orders` `CREATE TABLE` statements, but those names already exist in the isolated MtaaMarket baseline and cannot be safely replaced. The current schema deliberately uses `marketplace_profiles` for identity, a separate `vendors` table for approval status, a richer `products` table for moderated discovery, and an `orders` plus `order_items` model for traceable multi-item records. Re-running the proposed `CREATE TABLE public.products` or `CREATE TABLE public.orders` would fail on existing names; replacing them would risk deleting established constraints, RLS controls, and the protected data model.

| Requested V3 element | Existing MtaaMarket model | Safe decision |
| --- | --- | --- |
| `public.profiles` with vendor flags | `public.marketplace_profiles` plus a distinct `public.vendors` table and owner-reviewed `public.vendor_applications`. | Do not add a parallel identity table or boolean role flags. Preserve UUID identity and role separation; public vendor approval remains unavailable. |
| Replacement `public.products` table | Existing `public.products` includes category, slug, stock, original-media fields, moderation state, source type, fulfilment options, and controlled payment-timing values. | Do not replace it. A 5% automatic source-derived markup or copied-listing path is not added. |
| Replacement `public.orders` table | Existing orders are tied to a buyer profile, station, items, protected status enums, events, disputes, and data-minimisation fields. | Do not replace it or add a public pickup PIN/payment workflow. Payment and fulfilment stay gated. |
| Mandatory profile phone number | Current identity design permits passwordless email and minimises contact data. | Do not impose a public mandatory phone collection rule or store a buyer phone on a new public order path. |
| Fixed third-party station wording | Current collection model uses a neutral, owner-confirmed preference rather than a branded third-party promise. | Do not present a specific external station as a default guaranteed hub. |
| “Next.js pages” | MtaaMarket is currently React 19 + Vite + Express + tRPC, with selective Supabase adapters—not a Next.js application. | Do not introduce an incompatible parallel framework or route tree. Any future UI stays within the existing app architecture. |

The configured Supabase management connector was inspected before the requested DDL. Its project inventory returned no accessible projects in this session, so no migration was submitted through it. This prevents a blind schema action against an unverified target. The repository’s existing timestamped Supabase migrations remain the only source-controlled database history.

The compatible foundation from this directive is therefore its **approval-before-visibility** intent, already represented by the current vendor-application governance and product moderation schema. No new `001_schema.sql` file was created, no existing migration was overwritten, no data was changed, and no V3 page component was added.

## Confirmed core-replacement execution

After an explicit confirmation to proceed with the irreversible operation, the active isolated project `mfgjpjtlmfdtsnkoluco` was re-identified and its schema was inventoried. The replacement migration `20260827055000_v3_core_replacement.sql` then ran successfully. At the time of the inventory, the affected `products`, `orders`, and directly dependent operational tables had no rows. `products` and `orders` were dropped with `CASCADE`, and the V3 `profiles`, `products`, and `orders` tables were created.

The applied migration enables RLS on all three V3 tables. It creates no public profile, vendor, order, payment, settlement, or update policy; only `ACTIVE` V3 products can be read publicly. A post-migration schema inspection confirmed the three tables exist with RLS enabled and zero rows. The Supabase security advisor reports the expected informational RLS-without-policy notices for the intentionally closed `profiles` and `orders` tables, plus legacy removed-dependency tables; it also continues to report the pre-existing optional leaked-password-protection setting.

The repository now contains a compatible public discovery adapter for the V3 product columns. It keeps V3 products as an empty launch-stage catalogue until an owner-controlled write path is separately implemented. TypeScript, 22 Vitest files / 76 tests, the Vercel production build, and the production dependency audit all pass after the reconciliation.

## Production-directive compatibility addendum

The later production-core directive was reviewed against the deployed V3 baseline. It repeats `profiles`, `products`, and `orders`, which were already replaced by the owner-confirmed V3 migration. Running the proposed `CREATE TABLE IF NOT EXISTS` script would therefore not establish its assumed role, price, source, or embedding fields on the current tables, and could leave the application and database contracts inconsistent.

The pgvector column/function, source URL, sourcing requests, and escrow-oriented states were not added. Vector search needs an approved embedding model, price/credit budget, input-redaction and retention policy, error/rate-limit path, human review boundary, and regression coverage before any model call. Sourcing and payment features require a least-privilege write path and a verified buyer/owner identity model; neither is created by a public client page. The existing public catalogue remains limited to V3 `ACTIVE` products, while the basket can record only a local, confirmation-gated collection preference.

## First-owner and vendor-activation foundation

The protected V3 path now supports a deliberately narrow operational bootstrap. A person must first authenticate through Supabase email verification. Only then may the server compare the verified email address with the private `FOUNDER_EMAIL` environment value. A match may create or promote **that same verified UUID profile only** to `role = admin`; no frontend code receives the allow-list value, profile identifiers, or a general role-assignment capability. This implementation is deployed as a capability, not an assertion that an owner has already activated it.

An authenticated member can record a vendor agreement and create a vendor-approval request, but the request remains unapproved. The owner console can list agreement-backed applications and approve or suspend listing access. The server rejects any approval where the vendor flag or agreement timestamp is absent. Newly approved vendors may submit only original JPEG, PNG, or WebP listing images through the server-controlled storage path, and every new product remains `PENDING` until separate owner moderation changes it to `ACTIVE`.

| Workflow | Server-enforced gate | Public result before owner action |
| --- | --- | --- |
| First owner bootstrap | Verified identity email equals the private configured founder email. | No role or profile disclosure; no general admin signup. |
| Vendor request | Verified email session plus explicit agreement acknowledgement. | `is_vendor = true`, `is_vendor_approved = false`; no listing access. |
| Vendor approval or suspension | Verified V3 owner role plus an agreement-backed vendor request. | Listing eligibility changes only; public products remain separately moderated. |
| Listing submission | Approved vendor flag, agreement timestamp, MIME/data/size/dimension validation, server storage write. | `PENDING` listing only; never public until approved. |

No M-Pesa initiation, payment custody, payout, external supplier integration, scraping, automatic price decision, or AI/vector pipeline is part of this foundation.

## References

[1]: https://www.centralbank.go.ke/national-payments-system/ "Central Bank of Kenya — National Payments System and authorised PSP directory"
[2]: https://vendorcenter.jumia.com/api-docs/ "Jumia Vendor Center API documentation"
[3]: https://www.jumia.co.ke/sp-terms-and-conditions "Jumia Kenya terms and conditions"
[4]: https://cloudinary.com/documentation/background_removal "Cloudinary — Background removal documentation"
[5]: https://cloudinary.com/documentation/developer_onboarding_faq_credits "Cloudinary — Credits and add-on billing documentation"
[6]: https://ai-sdk.dev/cookbook/node/generate-text-with-image-prompt "Vercel AI SDK — Generate text with image input"
[7]: https://ai-sdk.dev/docs/ai-sdk-core/embeddings "Vercel AI SDK — Embeddings, usage, retries, and timeouts"
[8]: https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text "Vercel AI SDK — generateText telemetry and tool controls"
