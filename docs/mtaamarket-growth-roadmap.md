# MtaaMarket Growth-Stage Upgrade Roadmap

## Operating principle

MtaaMarket should grow **in layers, not by prematurely switching on commerce**. Public discovery, Request Desk, Seller Studio guidance, controlled AI drafts, and passwordless buyer sign-in can improve independently. Payments, vendor writes, delivery execution, owner access, live-animal transactions, and automatic supplier activity remain unavailable until their UUID-backed PostgreSQL procedures, ownership controls, and end-to-end validations are complete.

> **Launch discipline:** a polished public interface is not evidence that the marketplace is ready to take payment, promise fulfilment, or allow vendors to publish. Each capability below has a specific entry condition and an explicit no-go boundary.

## Current verified baseline

| Capability | Current state | Operating boundary |
|---|---|---|
| Public discovery | Live from isolated Supabase read models | Anonymous reads only; no UUID record reaches a legacy numeric order path. |
| Request Desk | Public collection form with controlled AI drafting | A request is not an order, quote, stock confirmation, or delivery promise. |
| Email sign-in | Callback-aware magic link verified on a founder device | Temporary sender delivered to Spam; do not invite public accounts until a custom sender domain is authenticated. |
| Public performance | Non-home routes load as independent client chunks; mobile metadata baseline added | No offline cache, service worker, or account-data persistence has been introduced. |
| Seller and owner operations | Policy and UI groundwork exists | Vendor writes, owner actions, storage uploads, orders, and payments are still gated. |
| Poultry & Livestock | Discovery/policy groundwork exists | No checkout, transport, health guarantee, or automated animal workflow. |

## Upgrade sequence and trigger rules

| Stage | Safe work to complete | Trigger to start | Evidence required before advancing | Explicitly out of scope |
|---|---|---|---|---|
| **0. Trust and public discovery** | Keep catalogue/read paths reliable; curate original product and local-market visuals; improve empty, error, and accessibility states; use the Request Desk as the fallback. | Immediate, with no budget. | Mobile and desktop route checks, no new runtime errors, and human review of all public claims. | Payments, vendor self-publishing, delivery guarantees. |
| **1. Email trust** | Acquire or use a founder-owned domain; authenticate it in Brevo; create an aligned MtaaMarket sender; run a low-volume placement test. | Before public account invitations. | Verified sender domain; SPF, DKIM, and DMARC alignment; inbox-placement result recorded. | Claiming guaranteed inbox placement or creating an automatic backup sender. |
| **2. Identity and founder governance** | Bind the actual signed-in founder UUID through a one-time audited server-side action; migrate buyer profile and protected role checks to PostgreSQL/Supabase. | Founder confirms the correct UUID after completing sign-in. | Token-bound role action, audit event, denial tests, and no email-string-based privilege rule. | Assigning admin access from an email address, client-side role logic. |
| **3. Controlled local vendors** | Migrate vendor application, owner approval/suspension, original-photo upload, moderation, and listing writes to protected PostgreSQL procedures. | Stage 2 role controls pass. | RLS review, owner approval audit trail, media validation/storage test, vendor denial-path tests. | Direct buyer/vendor contact disclosure, batch auto-approval, animal checkout. |
| **4. Managed requests and fulfilment** | Convert eligible requests into owner-mediated instructions, with clear collection/delivery preferences and private buyer details. | A small number of trusted local fulfilment cases can be manually reviewed. | Owner workflow acceptance tests, privacy checks, support escalation process, no misleading supplier affiliation. | Supplier scraping, bot checkout, price/stock automation, delivery promise before confirmation. |
| **5. Payments and disputes** | Decide on a legal, operationally supported payment path only after the prior stages operate reliably. | Written founder approval, provider readiness, and a completed manual order playbook. | Sandbox and failure-path tests; idempotency, refund/dispute rules, independent accounting review. | Turning on historic payment code merely because it exists. |

## Email deliverability workstream

The temporary Brevo sender reached Gmail Spam even though the passwordless flow itself works. The appropriate remedy is a custom domain, not repeated test sends. Brevo recommends an authenticated professional sender domain with aligned visible From-domain and DKIM/DMARC. [1] Google recommends SPF, DKIM, and DMARC for sending domains; it explains that messages without appropriate authentication can be marked as spam or rejected and that DMARC alignment depends on the From-domain matching the authenticated domain. [2]

| Decision | Now | Later after custom domain |
|---|---|---|
| Sender | Retain the temporary sender for founder-only, low-volume verification. | Move to an address on the authenticated MtaaMarket domain. |
| DNS | Do not use a free shared-hosting address as a purported domain solution. | Publish the exact Brevo-provided verification/DKIM records, include all senders in SPF, and start monitored DMARC at `p=none`. |
| User experience | Tell the founder to check Spam and mark a genuine MtaaMarket message as not spam. | Re-test low-volume inbox placement and document the result without promising universal inbox delivery. |
| Failover | Keep the documented Send Email Hook design dormant. | Enable only after both senders are domain-authenticated, provider outcomes are redacted, and duplicate-code behaviour is tested. |

## Technology adoption rules

| Technology area | Zero-cost baseline | Upgrade only when | Guardrail |
|---|---|---|---|
| Analytics | Built-in privacy-aware page analytics and manual funnel review. | A concrete acquisition or conversion question requires event-level analysis. | Do not add session replay or user profiling without a privacy notice and consent decision. |
| Error monitoring | Review deployment/browser logs during controlled tests. | Public protected traffic or repeated production errors appear. | Redact tokens, email links, contact data, locations, order notes, and secrets. |
| Images | Original photos, client-side compression, and strict quality guidance. | Seller onboarding has passed the protected storage migration. | Never accept copied supplier images or automated image-only listing approval. |
| AI | User-triggered editable drafting for listings and requests. | A named operator reviews outputs and measures actual time saved. | AI cannot set price, stock, eligibility, welfare, delivery, payment, role, or supplier decision. |
| PWA/offline | Manifest and mobile theme metadata only. | Public reading routes are stable and a privacy review approves caching. | Never cache sessions, customer data, order data, private media, or offline commerce actions. |

## Founder decision checklist

Before the next growth stage, the founder should decide whether to provide a domain for MtaaMarket email authentication. Once a domain exists, its registrar/DNS access can be used to apply only the exact Brevo records. The next identity decision should come **after** that: confirm the currently signed-in Supabase UUID and explicitly approve an audited founder role binding. This staged order prevents a sender-quality problem from being mistaken for a role or commerce migration problem.

## References

[1]: https://help.brevo.com/hc/en-us/articles/14925263522578-Comply-with-Gmail-Yahoo-and-Microsoft-s-requirements-for-email-senders "Brevo: Comply with Gmail, Yahoo, and Microsoft requirements for email senders"

[2]: https://support.google.com/mail/answer/81126?hl=en "Google: Email sender guidelines"
