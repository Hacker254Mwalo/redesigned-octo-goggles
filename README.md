# MtaaMarket

**MtaaMarket** is a mobile-first Kenyan marketplace designed for product discovery, protected M-Pesa checkout, pickup-station fulfilment, vendor operations, and auditable order status changes.

The public storefront is ready for discovery and checkout preparation. Its M-Pesa code is implemented server-side but remains intentionally inactive until Daraja sandbox credentials and a final public callback address are provided through the project secret settings.

## What is included

| Area | Included capability |
|---|---|
| Marketplace foundation | Buyer, vendor, and administrator roles; categories; vendor profiles; products; stations; orders; disputes; reviews; notifications; and immutable-style order event records. |
| Public buying flow | Search, categories, product pages, basket, pickup selection, M-Pesa phone capture, and a clear order summary. |
| Trust controls | Payment/escrow status, pickup confirmation, dispute opening, only-completed-order reviews, and server-authorized operations. |
| Seller workflow | Seller onboarding, draft-first listings, in-browser WebP compression, server-side image storage, fulfilment view, and inventory view. |
| Collection | Station directory, landmarks, hours, external directions links, and an interactive map with a usable fallback when the map provider is unavailable. |
| Updates | Transactional in-app notices for payment, delivery to station, pickup, disputes, and order completion. |

## Local development

```bash
pnpm install
pnpm check
pnpm test
pnpm dev
```

The site is built with React, TypeScript, Express, tRPC, Drizzle, a managed MySQL-compatible database, Manus OAuth, and managed object storage.

## M-Pesa activation

Configure the following values through the project secret settings; never place them in client code or commit them to Git.

| Secret | Purpose |
|---|---|
| `DARAJA_CONSUMER_KEY` | Server-side Daraja OAuth credential. |
| `DARAJA_CONSUMER_SECRET` | Server-side Daraja OAuth credential. |
| `DARAJA_PASSKEY` | Server-side Lipa na M-Pesa Online request signing value. |
| `DARAJA_SHORTCODE` | Sandbox business shortcode. |
| `MPESA_CALLBACK_URL` | Final public HTTPS address for `/api/payments/daraja-callback`. |
| `MPESA_CALLBACK_SECRET` | A long random secret embedded as a query token in the callback URL to reject unsolicited callback posts. |

Use the Daraja sandbox app credentials first. After adding the secrets, publish the site, confirm that the final callback URL is reachable over HTTPS, and run a controlled test order before using any production Daraja credentials. Safaricom documents Daraja as the M-Pesa API platform and provides a sandbox testing workflow. [1]

## Escrow and fulfilment lifecycle

```text
pending payment → paid / held in escrow → ready for pickup → pickup confirmed → released to vendor
                                            ↘ dispute open ↗
```

The application validates state transitions server-side. After publishing, create a platform-managed hourly Heartbeat job pointing at `/api/scheduled/release-escrow`. It only accepts authenticated schedule calls and releases orders whose saved release time has passed while they remain in the pickup-confirmed state.

## Production checklist

1. Verify every intended administrator uses the project owner account or is promoted through the database role workflow.
2. Add the Daraja sandbox secrets and final callback URL in project settings, then test an STK Push and callback end-to-end.
3. Publish from a saved project checkpoint; do not expose local development URLs as a callback address.
4. Create and monitor the protected hourly escrow-release Heartbeat job after publication.
5. Replace sample catalog items with verified seller products before public launch. The project deliberately has no fabricated reviews or ratings.
6. Confirm the station information, hours, pickup desk contact details, terms, refunds process, and live support process with your actual operators.

## Quality checks completed

The project passes TypeScript validation, the unit-test suite, and a production build. The current database foundation contains six categories, four pickup stations, and eight explicitly labelled sample catalog products.

## References

[1]: https://developer.safaricom.co.ke/ "Daraja 3.0 by Safaricom"
