# Parcel Collection Safety Workflow

> This is an operating design, not legal advice. Before launching staffed collection or delivery, the founder should confirm local consumer, privacy, carrier, and insurance obligations with a qualified adviser and the chosen provider.

## Purpose and present boundary

MtaaMarket can collect a buyer’s **preference** for a Siaya pickup, collection point, home-delivery preference, or owner advice. It does not yet accept a payment, issue a collection reference, book a courier, promise a collection time, disclose a seller’s contact information, or guarantee a hand-off. The public basket keeps the preference only in the buyer’s browser session until the protected owner-confirmation workflow is migrated to PostgreSQL.

| Stage | Buyer action | MtaaMarket responsibility | Explicitly not enabled |
|---|---|---|---|
| 1. Preference | Select a broad Siaya area or known point. | Explain data-minimisation and next-step boundary. | Exact address, ID, payment, live location, or seller contact collection. |
| 2. Item review | Wait for confirmation. | Confirm genuine availability and the appropriate route manually. | Automatic allocation, stock promise, or supplier checkout. |
| 3. Hand-off confirmation | Review one protected instruction. | Create a reference only after item, route, time, fees, and payment timing are confirmed. | Public reference numbers or unverified third-party collection points. |
| 4. Collection | Inspect parcel where the selected route permits. | Provide a support/escalation path. | Forced acceptance, health/quality guarantee, or unreviewed home-delivery claim. |

## Private-information rule

The public preference form accepts only a broad area and an optional brief note. It explicitly rejects a house number, national-ID number, payment detail, and live location. Exact hand-off information belongs in the future authenticated owner-confirmation workspace, with role checks, purpose limitation, audit events, and retention rules.

## Owner confirmation checklist

Before telling a buyer to collect any parcel, the owner or a delegated approved operator must verify the following items in the protected workflow.

| Check | Confirmation required |
|---|---|
| Item | Identity, quantity, condition, and availability are accurate. |
| Route | The collection point or delivery option is recognised and appropriate for the item. |
| Timing | The proposed window is current and clear to the buyer. |
| Cost and payment | Any fee and payment timing are disclosed before collection. |
| Privacy | Only the people required for the hand-off receive buyer contact/address information. |
| Escalation | Buyer has a platform support route before accepting a parcel. |

## Next migration gate

The first live collection workflow must be built only after the protected UUID profile, buyer request, owner-assignment, collection-confirmation, and audit-log records are migrated to isolated PostgreSQL. Each hand-off must be owner-approved, time-stamped, and reversible before a collection reference or payment instruction is released. This rule is stricter for poultry and livestock, which remain manual owner-reviewed collection only.
