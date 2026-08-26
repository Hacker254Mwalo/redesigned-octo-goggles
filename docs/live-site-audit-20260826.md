# Live Site Audit — 26 August 2026

## Scope

This was a read-only review of the deployed MtaaMarket public homepage and Seller Studio entry point. No account, request, vendor application, payment, or configuration action was submitted.

| Area checked | Observed live state | Improvement implication |
|---|---|---|
| Public storefront | The homepage renders successfully, lists the current Supabase-backed categories including **Poultry & Livestock**, and shows an intentional empty-catalogue Request Desk state. | The upcoming local code changes will make gradual multi-vendor participation and livestock’s manual-confirmation requirement clearer in the production copy once deployed. |
| Product discovery | Public discovery is operational, but there are no verified listings yet. | Do not promise automated purchase, availability, or delivery. The Request Desk remains the correct initial route. |
| Seller Studio entry | The seller page explains approval, protected buyer contact, original listings, browser image compression, and fulfilment guidance. | The full Supabase sign-in/profile path must be completed before the listing form can safely serve production vendors. |
| AI experience | The public entry point does not yet explain the complete controlled AI toolkit. The current AI listing draft feature remains behind the seller workflow. | Add a concise, owner-controlled AI Toolkit section that explains assistance for listing drafts, original-photo readiness, item requests, owner triage, and support drafting—without delegating commercial decisions. |

## Current conclusion

The live MtaaMarket interface is rendering correctly for public discovery and seller introduction. It is **not yet ready for real vendor onboarding, checkout, payments, delivery promises, or live-animal transactions**. Those workflows remain deliberately gated until the authenticated UUID profile, protected PostgreSQL write path, and end-to-end validation are complete.

## Fresh callback, mobile, and runtime review

The deployed `/auth/callback` recovery route and same-device magic-link test now work end to end. The completed page accurately states that a lowest-privilege buyer profile is being prepared and continues to withhold orders, payments, seller actions, and owner access. This is a successful authentication repair, not an authorization migration or commerce-launch approval.

| Area checked | Fresh finding | Safe priority |
|---|---|---|
| Passwordless email | A branded temporary sender delivered the email and callback succeeded, but Gmail placed the first message in Spam. | **P0 before public account launch:** authenticate a founder-owned sender domain with aligned SPF, DKIM, and DMARC; the temporary Spam-folder recovery guidance is only a short-term aid. |
| Mobile public experience | Home, Request Desk, Seller Studio, stations, basket, and dashboard-entry routes were captured at a 375px width. The hierarchy, dialog controls, and main reading flow remain usable. | **P1:** keep mobile verification in the release checklist; replace abstract-only public visual areas with real, original local-commerce imagery only after a curated asset set exists. |
| Desktop public experience | The editorial typography, warm neutral palette, deep green actions, coral labels, and Request Desk framing make a coherent premium local-market surface. | **P1:** establish a stronger ownable MtaaMarket mark/icon system and a calmer back-office visual hierarchy before exposing a production operations workspace. |
| Public API health | Recent public discovery requests returned successful responses in the local audit, including Supabase-backed categories and pickup-station contracts. | **P0:** retain anonymous discovery as read-only and do not route UUID records into legacy numeric basket/order writes. |
| Protected preview boundary | The managed development preview can retain an older framework-authenticated legacy profile while Supabase buyer sessions remain lowest-privilege. This must never be interpreted as a production founder-role assignment. | **P0:** keep all protected owner/vendor/order/payment operations gated until a server-side, audited Supabase UUID role binding and PostgreSQL procedure migration are separately verified. |
| Observability | No new application crash was found in the recent development log review. | **P1:** introduce privacy-preserving error monitoring only after the project’s privacy notice and protected-traffic design are ready. |

### Prioritised safe implementation backlog

The next technical foundation work should focus on public performance, accessibility, and resilience rather than feature activation. The recommended sequence is: route-level code splitting for the non-home workspace pages; a small shared empty/error-state pattern with retry guidance; a web-app manifest and offline-safe shell that never stores customer data; semantic metadata and structured data for public discovery; and a consent-aware analytics/error-monitoring activation plan. These changes must leave payments, delivery, vendor writes, assisted-order execution, and livestock transactions disabled.

## Deployment verification

The Vercel deployment associated with the hardening checkpoint completed successfully. The public production domain now serves the MtaaMarket `manifest.webmanifest` with the expected standalone/mobile metadata rather than the single-page fallback. This confirms that the latest static asset deployment propagated; it does not activate offline caching, protected commerce, or an install prompt with custom icons.

## Expanded public-foundation deployment verification

The subsequent public deployment exposes the new `/auth/reset-password` recovery route. A visit without a recovery code renders the intentional safe recovery state rather than a 404 or a password form. The deployed Request Desk also accepts an item hand-off from discovery through a URL parameter, pre-filling the item text while keeping submission behind sign-in and keeping the collection area explicitly broad.

| Route | Observed production state | Boundary preserved |
|---|---|---|
| `/auth/reset-password` | Safe “Link needs attention” recovery state renders successfully with no token in the visible address. | No password change happens without a valid Supabase recovery session. |
| `/request?item=solar%20lantern` | The item field safely pre-fills as “solar lantern”; the form explains collection/data-minimisation limits. | No request, order, payment, vendor action, or delivery promise was submitted. |
| `/manifest.webmanifest` | Returns `200` with MtaaMarket app metadata after the latest GitHub-triggered deployment. | No service worker or protected-data caching is enabled. |
