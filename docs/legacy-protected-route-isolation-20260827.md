# Legacy protected-route isolation record

**Status:** Current code-map decision record. This document changes no schema, account, payment, supplier, delivery, AI, or protected marketplace operation.

## Purpose

MtaaMarket is transitioning protected marketplace behavior from the older Manus-authenticated MySQL/TiDB implementation to the server-verified Supabase V3 control plane. The transition must be incremental: a route can be isolated only when doing so does not conceal a remaining legacy dependency or falsely present a replacement as operational.

This record captures the route map reviewed on 27 August 2026. It distinguishes the completed isolation of the old workspace runtime from the separate Request Desk migration that remains open.

## Verified route map

| Surface | Current implementation | Resulting boundary |
|---|---|---|
| `/` public Market | Uses the public marketplace category/product queries; V3 server discovery exposes only `ACTIVE` products. | Safe public discovery remains read-only and supplier-neutral. |
| `/dashboard` | A static V3 transition page with public exits to the Seller Studio guide and Market. It imports no marketplace tRPC client, legacy dashboard component, or legacy authentication hook. | The old profile, order, seller, owner, notification, payment, escrow, and assisted-order runtime cannot be mounted by this public route. |
| `/request` Request Desk | Still uses the older account hook and the legacy `marketplace.createItemRequest` protected procedure. | This is the remaining customer-facing legacy protected dependency. It must be migrated separately, not silently treated as V3. |
| `/admin` owner moderation | Uses verified Supabase session handling and the V3 owner/bootstrap, vendor-application, moderation, and owner-listing procedures. | The current V3 moderation surface remains server-authorized and PENDING-to-ACTIVE controlled. |
| `/vendor/upload` Vendor Studio | Uses the V3 approved-vendor, agreement, server-validated original-media, and PENDING-listing path. | No public or direct browser database listing write is introduced. |
| Legacy dashboard components | `AdminOperationsPanel` and `VendorProductForm` remain in source with their older procedures but are no longer mounted by `/dashboard`. | Preserve for a separately scoped retirement or migration decision; do not reopen them through a customer-facing route. |

## Migration rule

> **Do not represent the protected workspace as live until the exact route has completed its own V3 schema, identity, authorization, RLS, server-procedure, client, test, and controlled operational verification.**

The Request Desk cannot be converted by merely swapping a client hook. A safe V3 migration needs a reviewed request data model, verified buyer identity handling, least-privilege RLS, server-only request creation, a privacy-preserving owner review surface, retention/closure expectations, regression coverage, and a founder-controlled real-browser test. It must preserve the current no-supplier-feed, no-live-availability, no-payment, no-named-provider-promise, and no-AI-automation boundaries.

## Decision

The completed `/dashboard` isolation remains in place. The existing Request Desk remains the only identified customer-facing route that calls a legacy protected marketplace procedure, and it stays explicitly open in the roadmap. No attempt is made in this milestone to delete old schema, change authentication providers, create a buyer record, submit a request, or activate any commerce workflow.
