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

## Current production-route recheck

After the isolated governance and password-minimum hardening milestone, the public Vercel site was rechecked without submitting an account, request, basket, payment, or vendor action. The homepage continues to render the Siaya-focused public experience. The reset-password route again displayed its intentional no-code “Link needs attention” state. The Request Desk prefilled `solar lantern` from its public query parameter and continued to require sign-in before a request could be sent, while clearly prohibiting exact-address and payment-detail entry. The manifest remained available as a minimal standalone configuration with no service worker declaration or protected-data cache instruction.

These checks confirm that the currently deployed public boundary remains intact. The newer governance migration and hosted password minimum are production database/Auth configuration changes and will require the next GitHub/Vercel synchronization before the site’s deployed source record reflects the updated documentation and checklist.

The deployed homepage browser console was also reviewed immediately after this route recheck and had no current console output.

### Current mobile visual recheck

The current checkpoint was reviewed at a 375px-wide mobile viewport across Home, reset-password, Request Desk with a prefilled item, basket, and Seller Studio. Navigation, typography, buttons, and footer links remained readable without overlap. The reset page continued to expose only its safe no-code recovery state. The Request Desk showed the prefilling safely and retained a sign-in gate before sending. The empty basket had no checkout path. Seller Studio continued to state that seller applications are owner-invited while the protected UUID migration is verified. No visual check submitted a form or activated a protected operation.

## Runtime defect follow-up

The current Product Detail no-record route was rechecked after historic log review. The historic hooks-order error did not reproduce, but the route exposed a current query-client warning because the Supabase adapter returned `undefined` for a missing product. The adapter now returns explicit `null`, which is handled by the existing not-found page. A regression test covers the no-record response, TypeScript validation passed, and the page rendered correctly after the fix without a new matching console error.

Historic Google Maps script-load failures came from an optional pickup-map enhancement. MtaaMarket does not yet have verified public collection points or a configured production Maps provider, so the external map loader is now explicitly opt-in. The pickup-stations route retains its accessible text/card fallback and produced no new Maps load error during the current recheck. A future provider activation must be separately configured and verified; it is not required for the present public pickup-station boundary.

## Dependency-security hardening

The production dependency audit initially found 81 advisories, including one critical and 21 high-severity paths. The affected direct dependencies were upgraded within compatible majors, secure transitive overrides were added where the upstream framework ranges permitted them, and the unused Streamdown Markdown/Mermaid tree was removed. The reusable AI chat component retains assistant content as React plain text rather than importing the removed Markdown renderer.

The final `pnpm audit --prod` result reports **zero** info, low, moderate, high, and critical vulnerabilities across 286 production dependencies. TypeScript, the full 22-file / 59-test suite, and the Vercel build all passed after the update. A separate future maintenance item remains for the deprecated Recharts 2.x package, but it is not listed as a current vulnerability and should be upgraded only with its own visual/regression review.

The audit hardening is now durable across future project installs: the security overrides and Wouter patch registration were moved from the package manifest’s ignored pnpm section into `pnpm-workspace.yaml`, and the project declares pnpm 10.18.0, the verified runner that applies that workspace configuration. A clean install and audit through that runner preserved the zero-vulnerability result.

## Release-test resilience

The authenticated Supabase Storage verification creates and removes a temporary object in the isolated `catalogue-media` bucket. To prevent a transient remote cleanup delay from holding the entire release suite indefinitely, the test runner now executes external verification files serially and applies a 15-second timeout to tests and hooks. The production storage adapter itself was not modified. The full 22-file / 61-test suite completed in 13.76 seconds, including the real storage upload-and-cleanup check, followed by a passing TypeScript check, Vercel build, and zero-vulnerability production audit.

## Deployed account-dialog check

The deployed public Sign in dialog was opened without entering an email, password, code, or recovery request. It rendered the verified email-link method and the email/password route, disclosed that Google remains unavailable until a secure provider configuration exists, and repeated that the protected workspace remains unavailable pending the separate role migration. The deployed dialog’s close control and email input were present, and a direct Escape-key check closed the dialog without submitting an action. No sign-in, signup, reset, order, vendor, payment, delivery, or role action was submitted during this check.
