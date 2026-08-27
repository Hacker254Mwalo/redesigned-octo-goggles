# Zero-Cost Account, Promotion, and Operations Path — 27 August 2026

## Recommendation

MtaaMarket should **keep Supabase Auth as the only identity system** while the site uses the default Vercel address. It already matches the isolated PostgreSQL database, current buyer-session bridge, email-link flow, email/password flow, password recovery, and future row-level-security model. Running a second identity platform alongside it would create two user records, two session systems, and a future role-mapping risk without solving the shared-domain Google production constraint.

Supabase’s current Free plan includes 50,000 monthly active users, social OAuth providers, custom SMTP, basic MFA, and 1 GB of storage, but free projects can pause after one week of inactivity. [1] This is enough for the current discovery-first MtaaMarket stage provided the public email-based sign-in flow is tested and sender-domain work is completed when a founder-owned domain is available.

| Approach | Trade-offs | Cost | Setup complexity |
|---|---|---:|---|
| **Keep Supabase Auth with email link and email/password** | One identity source; matches existing database, session, and future RLS work. Google stays hidden until a custom domain is available. | $0 at the current Free-plan limits. [1] | Low; existing foundation, but end-to-end password verification remains a required test. |
| Add Clerk beside Supabase | Clerk’s current free tier has email links, codes, passwords, and up to three social providers, but creates a second source of truth and an integration/migration burden. [2] | $0 within its stated Hobby limits. [2] | Medium/high; not recommended now. |
| Move to Firebase Authentication | A separate Google ecosystem with a no-cost Spark plan, but requires moving or synchronizing users and protected database access away from the current Supabase model. [3] | $0 for applicable Spark-plan services; usage/service constraints still apply. [3] | High; not recommended now. |

> **Decision:** Fix and test the current Supabase email-account experience. Do not add Clerk, Auth0, Firebase, or a second login database merely to work around a Google OAuth production domain restriction.

## Google sign-in status

Production Google sign-in remains unavailable on the shared `siayaonlinemarket.vercel.app` address. Google rejected the shared Vercel suffix as an authorised domain because it is not a top private domain. This is a Google production consent requirement, not a defect in the MtaaMarket email sign-in implementation. The app should therefore show an honest email-first account entry and must not show a Google button until the founder links and verifies a domain they own.

The later production sequence is straightforward: connect the founder-owned domain to the website, verify it with Google Search Console, add the homepage and privacy-page URLs in Google Auth Platform, create the Web OAuth client, enter its values only in the isolated Supabase Google provider panel, and complete a buyer-only callback test. The client secret must never enter the browser bundle, source control, chat, or public page. [4]

## Zero-cost promotion instead of ad networks

At the current empty-catalogue and owner-managed stage, MtaaMarket should not install advertising-network scripts or promise paid advertising. Such scripts add privacy, consent, performance, and measurement obligations before the platform has real vendor listings or a customer-support workflow.

The practical first marketing surfaces are owner-controlled and free to start: a WhatsApp Business profile with the MtaaMarket website link, clear service hours, quick replies, and carefully managed customer conversations; an accurate Google Business Profile only if the founder can truthfully provide its local business details; and a Facebook Page with original MtaaMarket content, transparent local-market descriptions, and no copied supplier catalogue. WhatsApp documents free entry points including QR codes, short links, and social-profile action buttons, while Google Business Profile and Facebook Page both offer free business-presence tools. [5] [6] [7]

| Channel | Use now | Do not do |
|---|---|---|
| WhatsApp Business | Put the public MtaaMarket link on a business profile; use manual replies, labels, and a truthful welcome message. | Do not collect passwords, verification codes, exact addresses, payment details, or automatically send buyer data to vendors. |
| Google Business Profile | Create one only when the listed business name, location/service area, contact route, hours, and photos are accurate. | Do not invent a storefront, operating hours, reviews, or delivery coverage. |
| Facebook Page | Share original local-market explanations, owner-created announcements, and links to the Request Desk. | Do not run paid boosts, collect data through messages without a process, or publish copied Jumia/Jiji listings. |
| MtaaMarket website | Use the Request Desk, Seller Studio guide, and future owner-authored public launch notice. | Do not activate ad scripts, tracking pixels, fake offers, testimonials, or ratings. |

## Background work while the founder is away

MtaaMarket does not currently need a continuous background job. The safest no-cost work is to continue short, bounded public hardening in the active project session and leave a checkpoint after each verified milestone. The site must not rely on a temporary development environment for unattended customer actions.

If the founder later needs a periodic health report a few times per day, it can run as a scheduled review that posts the results in the project. If the platform needs deterministic recurring cleanups or alerts, a server-side timed task is preferable to repeated AI-run polling. Event-driven actions should use a verified provider webhook only after the relevant service confirms webhook support. None of these should be activated until the founder chooses the exact trigger, frequency, data source, and destination; no recurring job has been enabled in this milestone.

## Immediate safe work sequence

1. Keep the default domain and an email-first account entry; remove the dormant Google browser bridge so no provider can be accidentally exposed.
2. Complete the controlled Supabase email/password signup, confirmation, sign-in, and reset test only after the founder explicitly approves the private browser test.
3. Clarify the protected dashboard entry so it directs visitors to the visible Seller Studio guide rather than implying that ordinary sign-in unlocks listings.
4. Keep the Seller Studio as an honest owner-reviewed readiness page until the UUID role, PostgreSQL write, media, moderation, and vendor workflow migration is complete.
5. Revisit Google sign-in only after a founder-owned domain is linked; avoid the paid-provider detour and retain the single Supabase identity source.

## References

[1]: https://supabase.com/pricing "Supabase Pricing"
[2]: https://clerk.com/pricing "Clerk Pricing"
[3]: https://firebase.google.com/pricing "Firebase Pricing"
[4]: https://support.google.com/cloud/answer/15549257?hl=en "Google Cloud Help — Manage OAuth clients"
[5]: https://whatsappbusiness.com/products/business-app-features/ "WhatsApp Business App Features"
[6]: https://business.google.com/us/business-profile/ "Google Business Profile"
[7]: https://www.facebook.com/business/help/473994396650734 "Meta Business Help — Create a Facebook Page for your business"
