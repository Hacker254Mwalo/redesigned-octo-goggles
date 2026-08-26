# External-Market Offer Comparison Boundary

## Decision

MtaaMarket will **not** scrape, mirror, copy, or claim real-time offers from Jumia or any other marketplace. A live offer-comparison feature needs an authorised data agreement and a purpose-specific API permission. Until that exists, assisted sourcing remains an owner-mediated process based on the customer’s request, a manual current-price/availability check by the owner, original MtaaMarket wording and imagery, and customer confirmation before any payment instruction.

> A customer request is not permission to automate supplier browsing, copy a supplier listing, or place a supplier order. MtaaMarket must confirm the next step with the customer before representing price, availability, collection, or fulfilment as current.

## Official API evidence

Jumia’s Vendor Center documentation describes its API as a seller integration for a Vendor Center shop: catalogue creation/update, stock and price management, order handling, shipment-provider and shipping-label operations. It requires a Vendor Center application and OAuth token, with self-authorisation intended for an unattended seller/ERP integration. [1] That scope does **not** establish permission for MtaaMarket to ingest public competitor offers, scrape listings, or automate checkout for a different marketplace account.

| Candidate approach | Customer value | What is required | MtaaMarket decision now |
|---|---|---|---|
| Manual assisted comparison | Owner can confirm a requested source, availability, price basis, and collection preference. | Owner review, original MtaaMarket copy, customer confirmation, recorded timestamp. | **Allowed** as a controlled Request Desk workflow. |
| Supplier-authorised feed | Accurate source catalogue/stock can be synchronised under an explicit commercial agreement. | Written permission, source API/data feed, scoped credentials, freshness policy, data mapping, incident handling. | **Future option** only after a named supplier agrees. |
| Own Jumia Vendor Center integration | A verified MtaaMarket-owned Jumia seller account could manage its own authorised catalogue/orders. | Vendor Center account, application registration, OAuth scope, secure token rotation, operational owner. | **Future option**; it does not make Jumia’s public catalogue a MtaaMarket feed. |
| Scraper, copied listings, or checkout bot | Appears quick but exposes buyers to stale data, content/IP issues, account risk, and misleading affiliation. | Unauthorised extraction or automation. | **Prohibited.** |

## Safe data model for a manual comparison

The owner may store only the customer request, a neutral source label, a manual-check timestamp, a quoted range or statement that confirmation is pending, the owner’s original description, and the customer-confirmation record. Do not store copied product images, supplier HTML, supplier account credentials, source checkout sessions, or automated order status.

| Field | Permitted use | Required wording |
|---|---|---|
| `source_type` | Internal workflow classification such as `owner_assisted_external_market`. | Never render as an affiliation badge. |
| `checked_at` | Tells the owner when they last manually checked. | “Availability and price require confirmation.” |
| `customer_confirmation_note` | Records that the buyer approved the next step after disclosure. | Do not proceed without it. |
| `collection_preference` | Buyer’s broad preferred collection option. | “MtaaMarket will confirm the actual hand-off route.” |

## Future authorised-integration gate

An automated integration can be proposed only when all of the following exist: a supplier contract or explicit data permission; a named owner account; source-approved credential storage; a documented API scope; a freshness/price timestamp; a source-content licence; customer-facing disclosure; manual override; rate-limit and failure handling; and an audit trail. No automatic source checkout, price promise, or parcel instruction may be introduced by the integration alone.

## References

[1]: https://vendorcenter.jumia.com/api-docs/ "Jumia Vendor Center API documentation"
