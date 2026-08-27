# Jumia real-time collection research notes

**Research status:** Initial source capture only. These notes do not authorize any supplier data use, account access, catalogue display, pricing, delivery comparison, checkout, payment, scraping, automation, or AI activation.

| Source | Initial finding to verify | URL |
|---|---|---|
| Jumia Vendor Center | Public entry point appears to be a seller-facing Vendor Center. | https://vendorcenter.jumia.com/ |
| Jumia Vendor Center API | Previously identified public API material describes seller/ERP operations and must be checked for any explicit buyer-facing catalogue or order-on-behalf permission. | https://vendorcenter.jumia.com/api-docs/ |
| JumiaPay merchant API | A distinct merchant-payment documentation endpoint appears in current search results; its scope must not be inferred as marketplace catalogue or checkout permission. | https://merchant-api-doc-pay.jumia.co.ke/ |

The current search also returned several unaffiliated or third-party services describing product APIs, affiliate tools, or seller integrations. They are not authority for MtaaMarket to display, copy, scrape, or operationally rely on Jumia buyer-facing products, live stock, delivery fees, or ordering. Any later decision must rely on Jumia-provided terms or a written supplier authorization that explicitly covers MtaaMarket’s proposed use.

## Official documentation review

Jumia’s Vendor Center API documentation states that its catalogue API is designed for **Jumia sellers** integrating an ERP or API to manage their own catalogue end-to-end: creating products and managing their product content, stock, prices, and status. Its order API is likewise described for sellers managing their own Jumia orders, including cancellation, packing, shipping providers, and shipping labels.[1]

The same documentation requires an application registered in Vendor Center and OAuth 2.0 access tokens. It distinguishes unattended self-authorized integrations from a web application that sends a person to a Jumia login/consent flow. That is an authenticated seller-operations integration; the material reviewed does not state that it authorizes an independent buyer-facing catalogue mirror, customer stock/availability promise, delivery-fee comparison, or order-on-behalf service.[1]

The distinct JumiaPay merchant API describes merchant payment acceptance. It requires an API key shared by JumiaPay and its purchase endpoint contains customer, merchant, basket, payment, and shipping data. It is not evidence of permission for Jumia marketplace catalogue reuse or manual pay-on-handover sourcing; connecting it would also conflict with MtaaMarket’s current no-payment-collection boundary.[2]

The accessible JumiaPay Kenya customer terms state that an account must be used exclusively by the account holder and not on behalf of another person or entity. The terms also distinguish merchant payment acceptance from an underlying sale, require account credentials to remain confidential, and describe merchant/payment data and customer information as part of the payment service.[3] This is incompatible with using a founder’s JumiaPay account as a buyer-facing MtaaMarket checkout fallback or transmitting MtaaMarket buyer payment data through it without a separately agreed merchant relationship and explicit service authorization.

### Interim decision

No compatible real-time integration may be built from the reviewed material. The requested features—automatic availability, product display, delivery-fee comparison, and any buyer order hand-off—remain blocked unless the founder obtains written Jumia authorization that specifically covers the exact Kenyan buyer-facing data, refresh, commercial, branding/content, customer-data, ordering, cancellation, and logistics use. This research made no API request, registered no application, used no token, accessed no Jumia account, and changed no MtaaMarket runtime behavior.

## References

[1]: https://vendorcenter.jumia.com/api-docs/ "Jumia Vendor Center API documentation"

[2]: https://merchant-api-doc-pay.jumia.co.ke/ "JumiaPay API documentation"

[3]: https://pay.jumia.co.ke/cms/customers-terms-and-conditions.html "JumiaPay Kenya customer terms and conditions"
