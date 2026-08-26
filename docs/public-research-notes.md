# Public Research Notes

This project uses only public, lawful research. No user tracking, private data collection, competitor scraping, or surveillance is included.

The marketplace design prioritizes a visible pickup choice, clear station detail, order-status communication, and an explicit dispute or return path. A Kenya-focused study reported comparatively stronger satisfaction with delivery options while returns satisfaction was weaker, making clear fulfilment choices and a findable dispute path important to the product experience. [1]

The payment architecture uses Safaricom’s Daraja portal and sandbox-first development path. The portal states that Daraja provides access to Safaricom and M-PESA APIs for payment integration in web and mobile applications and supports sandbox testing. [2]

| Design decision | Public rationale | Product response |
|---|---|---|
| Mobile-first checkout | The target payment and marketplace flow is used on mobile devices. | Large touch targets, a short checkout, Kenyan phone validation, and a persistent basket summary. |
| Pickup clarity | Delivery-option satisfaction and pickup availability can affect trust. [1] | Station name, landmark, address, hours, map/directions, and post-payment pickup updates. |
| Findable dispute path | Returns are a reported weak point in the cited delivery study. [1] | A dedicated dispute action, explicit escrow state, and user-facing status history. |
| Sandbox-first payment verification | Daraja offers a sandbox app workflow. [2] | Server-only credentials, payment state transitions, callback validation, and controlled test modes. |

## References

[1]: https://scielo.org.za/scielo.php?script=sci_arttext&pid=S2310-87892023000100002 "Customer satisfaction with last-mile delivery in Kenya: An online customer perspective"
[2]: https://developer.safaricom.co.ke/ "Daraja 3.0 by Safaricom"
