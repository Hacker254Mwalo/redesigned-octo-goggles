# Poultry and livestock listing research notes

**Status:** Design input for a controlled MtaaMarket listing workflow, not legal advice or an authorisation to trade, transport, or sell a particular animal.

## Verified research direction

The Kenya Investment Authority’s eProcedures portal identifies domestic-animal movement as a county-veterinary procedure, although its current public page did not expose the detailed procedure text to the browser session.[1] Kenya Law’s Animal Diseases Rules define a permit framework for animal movement, require permits for defined animals within restricted areas, make unauthorised movement of animals infected with a notifiable disease an offence, and permit restrictions on animal sales in affected areas.[2] The Prevention of Cruelty to Animals (Transport of Animals) Regulations are a separate official source for a later transport review.[3]

| Design decision | Current marketplace treatment |
| --- | --- |
| Live-animal logistics | **Not offered.** MtaaMarket will not promise transport, delivery, named pickup, disease clearance, veterinary inspection, permit coverage, or fitness for sale. |
| Listing claims | A vendor or owner must give factual, original listing information and must not claim a permit, veterinary approval, animal health, breed, age, sex, or availability unless they can support it outside the public product copy. |
| Public visibility | A poultry or livestock record remains `PENDING` until the verified owner reviews it. Only an owner can make an approved record `ACTIVE`. |
| Fulfilment | Any potential handover stays manual and owner-confirmed. A later delivery feature requires separate legal, operational, welfare, movement-permit, and incident-handling review. |

## Implemented MtaaMarket boundary

The V3 product contract now requires a factual animal type, 10–500 character factual animal details, a welfare acknowledgement, and a manual-handover/movement acknowledgement whenever a listing uses the `poultry-livestock` category. These fields are visible only to the protected owner moderation queue before a record can be activated. Original JPEG, PNG, or WebP media validation remains unchanged.

MtaaMarket rejects a livestock listing that attempts to opt into pay on pickup, and the server-side hub-order helper independently rejects the poultry-and-livestock category even if malformed data bypassed the listing form. The platform therefore does not offer an automated animal order, payment, transport, collection-point, permit, or health-clearance workflow. It only preserves a manually reviewed local listing route, with any permitted next step handled outside the automated order flow.

## References

[1]: https://eprocedures.investkenya.go.ke/procedure/276?l "Kenya Investment Authority — Local animal movement permit"
[2]: https://kenyalaw.org/akn/ke/act/ln/1968/244/eng@2022-12-31 "Kenya Law — The Animal Diseases Rules"
[3]: https://new.kenyalaw.org/akn/ke/act/ln/1984/119/eng@2022-12-31 "Kenya Law — Prevention of Cruelty to Animals (Transport of Animals) Regulations"
