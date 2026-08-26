# Production Readiness Record

MtaaMarket was validated as a secure, mobile-first marketplace foundation. The following operational boundaries are deliberate: the database is live, public discovery is live, the escrow and callback code is installed, and actual M-Pesa payment initiation is disabled until the required secrets are stored in the hosting environment.

| Check | Result | Evidence |
|---|---|---|
| Database foundation | Passed | The live database query returned six categories, four pickup stations, eight sample products, one profile, and no orders. |
| Static safety | Passed | `pnpm check` completed without TypeScript errors. |
| Unit coverage | Passed | `pnpm test` completed with 10 passing tests. |
| Production compilation | Passed | `pnpm build` produced a deployable server and client bundle. |
| Public flow | Passed | Discovery, product, basket, pickup station, seller, and dashboard routes were visually checked on desktop and mobile. |
| Map resilience | Passed | The station directory remains usable with direct directions, landmark, and hours even when the embedded map provider cannot load. |
| Payment safety | Passed | The payment status endpoint reports `configured: false` without secrets; the callback returns HTTP 503 until a server-side callback secret exists. |

## Security controls

The application uses protected tRPC procedures for all account-sensitive operations. Marketplace roles are checked server-side for buyer, vendor, and administrator areas. Product image bytes are compressed in the browser, validated as WebP, constrained to a small payload, and stored through the managed server-side storage helper. The browser never receives M-Pesa secrets.

The Daraja callback is designed around a public HTTPS callback address and a server-only callback token. Its payment update is idempotent by checkout request ID, so repeated callback deliveries do not duplicate an order payment. Escrow state transitions are controlled in server code and recorded in the order-event log.

## Items requiring operator action

The platform cannot safely perform a real STK Push without the owner’s Daraja values and final public callback URL. Once provided, run a sandbox payment test that covers: order creation, STK Push display, accepted callback, failed/cancelled callback, duplicate callback, vendor preparation, pickup confirmation, dispute opening, and scheduled release.

The published site must also have a protected Heartbeat job created for `/api/scheduled/release-escrow`. This job cannot be created against an unpublished development URL. The scheduled handler is installed and rejects non-scheduled requests.

## Public research incorporated

The pickup experience prioritizes visible collection options, station details, directions, and a direct dispute path. A Kenya-focused last-mile delivery study found stronger satisfaction with delivery options than with returns, which supports making collection detail and dispute/returns handling easy to find. [1] Safaricom’s Daraja portal is the source of the sandbox-first M-Pesa integration path. [2]

## References

[1]: https://scielo.org.za/scielo.php?script=sci_arttext&pid=S2310-87892023000100002 "Customer satisfaction with last-mile delivery in Kenya: An online customer perspective"
[2]: https://developer.safaricom.co.ke/ "Daraja 3.0 by Safaricom"
