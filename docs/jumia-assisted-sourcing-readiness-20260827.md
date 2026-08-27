# MtaaMarket Jumia-Assisted Sourcing Readiness — 27 August 2026

## Conclusion

**MtaaMarket must not connect to Jumia’s vendor APIs to copy or resell public Jumia catalogue listings.** Jumia’s documented Vendor Center APIs are for a Jumia seller to manage that seller’s own catalogue, stock, prices, order processing, and shipping operations. They require a Vendor Center application and OAuth access token.[1] Jumia’s terms also prohibit republishing, commercial exploitation, and systematic automated collection of its website material without permission.[2]

The truthful zero-cost launch route is **owner-managed assisted sourcing**. A buyer asks MtaaMarket for an item; the owner checks possible sources manually; MtaaMarket writes its own original offer and confirms the final item, availability, collection/delivery path, and payment instruction with the buyer before any customer payment or owner purchase. This is a managed local request—not a claim of Jumia affiliation, a live Jumia price feed, or automatic Jumia checkout.

| Route | Appropriate now | Conditions |
|---|---|---|
| Owner-managed assisted sourcing | **Yes** | Original MtaaMarket title, description, photos, price/availability confirmation, customer confirmation before payment, no claim of affiliation, and no automatic supplier order. |
| Linking a Jumia product page when a buyer asks | **Only after owner review** | A plain link may be shared privately as a reference. It must not be presented as MtaaMarket inventory or a live MtaaMarket offer. Jumia’s terms permit forwarding product links but restrict reuse of site material.[2] |
| Jumia Vendor Center API | **Not for this marketplace launch** | It is a seller-management integration. It should only be evaluated if MtaaMarket itself becomes an approved Jumia seller with a legitimate own catalogue and approved credentials.[1] |
| Scraping, copied titles/photos/reviews/prices, or price monitoring | **No** | This conflicts with Jumia’s terms and cannot be represented as a reliable or authorised feed.[2] |
| Automatic Jumia checkout or unattended purchasing | **No** | It would create an unapproved supplier action and bypass MtaaMarket’s customer-confirmation control. |

## Practical owner workflow

1. A buyer submits a MtaaMarket Request Desk request or speaks with the owner.
2. The owner identifies possible supply routes manually, including a Jumia link only where appropriate.
3. The owner prepares original MtaaMarket wording and records that the route is independent and manual.
4. The buyer explicitly confirms the exact offer, the current amount, and the planned fulfilment path.
5. The owner records the protected Assisted Market order only after that confirmation. No automated supplier action occurs.

> Jumia’s own Kenya vendor page currently says vendor onboarding requires operations in Nairobi and genuine, new products. This reinforces that MtaaMarket should not assume a Vendor Center connection is available or suitable for the Siaya local-market model.[3]

## Future API gate

Any future Jumia API work requires a separate review after MtaaMarket has an eligible Jumia seller account, a founder-controlled credential storage path, a documented data-use purpose, explicit permission for each requested operation, a customer-confirmation workflow, and tests that prove no unapproved listing copy, source order, price decision, or delivery promise occurs. The first application choice in Jumia Vendor Center cannot be changed later; its documentation distinguishes unattended self-authorisation from browser-based web applications.[1]

## References

[1]: https://vendorcenter.jumia.com/api-docs/ "Jumia Vendor Center API documentation"
[2]: https://www.jumia.co.ke/sp-terms-and-conditions "Jumia Kenya terms and conditions"
[3]: https://www.jumia.co.ke/sp-market-place/ "Jumia Kenya marketplace vendor information"
