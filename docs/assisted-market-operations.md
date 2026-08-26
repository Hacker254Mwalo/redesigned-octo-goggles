# Assisted Market Operations

Siaya Online MtaaMarket supports two related workflows. A **Request Desk item request** is a buyer’s request for an item that is not currently listed. An **Assisted Market order** is an owner-managed fulfilment record for an offline customer, a personal-shopping request, or a Request Desk request that the owner has decided to fulfil.

| Starting point | Owner action | Platform record | Customer outcome |
|---|---|---|---|
| Website customer cannot find an item | Review the Request Desk entry; verify a real route and availability | `item_requests` record | The buyer receives a private platform update. |
| Owner chooses to serve that website request | Select **Create assisted order** in Owner Operations | A linked `assisted_orders` record; the request moves to accepted | The owner now tracks a real fulfilment lifecycle rather than an unstructured note. |
| Customer comes to the owner in person, by phone, or by a permitted support channel | Select **Record an offline customer order** and enter only operational details | A new `assisted_orders` record | The owner can progress the order without requiring the customer to use the website. |

## Assisted-order lifecycle

The owner progresses an assisted order only in this order:

> **Recorded → Confirmed → Sourcing → Ready → Out for delivery → Completed**

The owner can cancel before completion. A completed or cancelled assisted order cannot be moved backward. This protects the order history from accidental changes.

## Privacy and platform control

Customer phone numbers, delivery notes, payment instructions, and private owner notes are stored for **MtaaMarket owner operations only**. Seller-facing order data is deliberately shaped to exclude these fields. A seller receives only the order reference, amount, high-level fulfilment method, collection point where applicable, and preparation status needed to fulfil through the platform.

## Listing and vendor governance

Approved sellers can publish physical-product listings immediately. The Owner Operations workspace can approve, suspend, or restore a seller, and can pause, restore, or remove an individual listing. Seller Studio shows listing-health checks for a clear product title, useful description, category, original photo, price/stock, and a Siaya fulfilment option. Passing the checks does **not** override owner moderation.

## Provider rule

The platform does not claim a relationship with Jumia, G4S, a courier, or any external supplier. If the owner chooses an external source or collection route for an Assisted Market order, that route is recorded privately as a source category. The owner must confirm genuine stock, total price, and the available fulfilment path before giving customer instructions or accepting payment.

## Not activated yet

External payments, courier APIs, supplier checkout automation, affiliate systems, and vendor payouts remain disabled. They require a real account, a written/approved provider arrangement where applicable, and a deliberate deployment decision. The platform currently supports the operational records and owner workflow without pretending those integrations exist.
