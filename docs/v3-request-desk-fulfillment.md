# V3 Request Desk and Owner Fulfillment

## Scope

The public Request Desk is now backed by the isolated Siaya MtaaMarket Supabase project. A verified Supabase email session is required before a buyer request is written to `public.item_requests`. The request stores the buyer profile identity, item description, optional budget hint, broad fulfilment preference, and broad location preference. It deliberately stores no buyer phone number, customer name, supplier route, payment instruction, or delivery promise from the public form.

The active owner page at `/admin` uses the same server-verified Supabase identity boundary. It presents private Request Desk records for manual review, allows the owner to record a status, a manually confirmed source route, a quote, and a factual private reply, and exposes an **Open Assisted Market order** action only after a route has been saved.

## Assisted Market conversion

Opening an Assisted Market order creates a linked row in `public.assisted_orders` with the owner profile, request details, protected customer profile fields, fulfilment preference, manual source route, and an initial `recorded` status. The linked request moves to `accepted` only after the assisted-order insert succeeds. If the link update fails, the inserted assisted record is removed rather than leaving an unlinked owner order.

If the owner selects `external_marketplace`, the server requires a private customer-confirmation note and an original-content attestation. The confirmation must state that MtaaMarket is independently sourcing the item, is not affiliated with the external marketplace, and will confirm the final item, price, and fulfilment before payment. The attestation prohibits copying supplier text, images, logos, prices, or reviews. The website does not scrape a supplier catalogue, claim live stock or price, place a third-party checkout, collect payment, or promise delivery.

## Owner fulfillment lifecycle

The owner dashboard presents linked Assisted Market records in the following server-enforced order:

> **Recorded → Confirmed → Sourcing → Ready → Out for delivery → Completed**

An order can be cancelled before completion, while completed and cancelled records cannot move backward. For a Siaya collection or collection-point route, the dashboard presents **Ready for collection** and does not offer the out-for-delivery transition. Saving notes, a confirmed amount, payment timing, or fulfilment preference is allowed without changing status. “Ready for collection” is a manual MtaaMarket checkpoint and does not activate payment or courier operations.

## Data and authorization boundary

All owner mutations call `requireV3Owner` against the verified Supabase identity and use the server-only Supabase client. The owner queue intentionally excludes `customer_phone` and does not expose private contact information in the browser. The assisted-order table remains owner-only at the application boundary, and the public buyer form remains a minimal request intake. No legacy MySQL/TiDB procedure is used by the active Request Desk or Admin page.

## Validation

The focused V3 request tests cover unauthenticated rejection, verified-profile insertion, owner-only queue loading, review updates, external-source disclosure enforcement, assisted-order creation and request linking, contact-free owner queue shaping, status progression, and same-status detail saves. The full suite, TypeScript check, and Vercel build must pass before synchronization to `main`. External Supabase and storage verification tests skip only when their production-only environment variables are absent locally; they continue to execute in a configured deployment environment.
