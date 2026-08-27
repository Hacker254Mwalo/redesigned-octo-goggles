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

The subsequent email-first guidance update was also checked on the deployed Vercel site. The account dialog now visibly identifies the email-link flow as the recommended working method and labels its action as **Send secure sign-in link**. It continues to disclose the unavailable Google-provider boundary rather than displaying a non-functional Google sign-in control. No account form was submitted during this review.

## Browser-security header deployment verification

The browser-security hardening configuration was deployed through GitHub commit `136db47`, whose Vercel status reported a successful completed deployment. A non-mutating `HEAD` inspection then verified the expected headers on the homepage, `/auth/callback`, and the public category tRPC route. The compatibility-oriented policy intentionally constrains only browser capabilities that are not required by current public routes; it does **not** set a network-restrictive `default-src`, script policy, or connection policy before the exact Supabase, analytics, and future approved OAuth endpoints are fully catalogued.

| Header | Deployed value | Verified protection and compatibility boundary |
|---|---|---|
| `Content-Security-Policy` | `base-uri 'self'; frame-ancestors 'none'; form-action 'self'; object-src 'none'` | Prevents base-tag injection, embedding, off-site form posts, and plugin/object embedding without imposing an unverified restriction on public scripts or provider connections. |
| `X-Content-Type-Options` | `nosniff` | Stops MIME sniffing for the public static and API responses. |
| `X-Frame-Options` | `DENY` | Provides legacy clickjacking protection alongside CSP framing protection. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits cross-origin referrer detail while retaining normal same-origin navigation context. |
| `Permissions-Policy` | `camera=(), geolocation=(), microphone=(), payment=(), usb=()` | Disables browser capabilities that no current MtaaMarket public route needs. |

The deployment also retained Vercel’s HTTPS transport header. The Auth callback returned `200` with the configured headers, and the public category tRPC route returned its expected `204` response with the same controls. No account action, request submission, seller write, role assignment, payment, delivery, Google OAuth, or provider configuration was activated during this verification.

## Public recovery and discoverability deployment verification

The MtaaMarket public resilience and metadata update was released through commit `060c151`, and its Vercel deployment completed successfully. The default domain now serves a Siaya-specific document title, a truthful public description, a canonical URL, indexing guidance, and Open Graph/social summary metadata. The viewport no longer prevents browser zoom, preserving a user-controlled accessibility feature. The existing browser-security headers continued to be served after the release.

The deployed unknown-route path was opened at `https://siayaonlinemarket.vercel.app/route-that-does-not-exist`. It rendered the new MtaaMarket-branded recovery page with the route-guide label, plain-language explanation, and a **Return to MtaaMarket** action. The client error boundary now follows the same safe approach: it confirms that a request was not sent, provides retry and market-return routes, and deliberately does not render an internal stack trace or other technical diagnostics. This change does not submit a request, sign in a user, create an order, or expose a protected workflow.

| Public surface | Verified improvement | Boundary preserved |
|---|---|---|
| Default document head | Siaya-focused title, description, canonical, robots, Open Graph, and social summary are present; browser zoom remains user-controlled. | Metadata describes only public discovery and owner-managed item requests; it does not claim checkout, delivery, inventory, or provider approval. |
| Unknown application route | The deployed SPA presents a branded recovery screen with a route back to public discovery. | No debug data, account information, role hint, or protected action is exposed. |
| Unexpected client render failure | The global fallback no longer prints JavaScript stack traces and says that the request was not sent. | Users can retry or return to the public market without implying an order, request, or payment state. |

## Public analytics-reference cleanup

The deployed page source previously retained an unresolved analytics-template script reference. Because no privacy-reviewed analytics provider has been selected or configured for the production site, that reference could only produce a malformed browser request rather than measured analytics. The script was removed instead of silently substituting a provider, preserving the current no-new-provider and no-unreviewed-data-sharing boundary.

GitHub/Vercel deployment `144c83d` completed successfully. A live source inspection confirmed that the document now contains neither the `VITE_ANALYTICS` placeholder nor a `/umami` script reference. The Content Security Policy, anti-framing, nosniff, referrer, and device-permission response headers remained present after the release. Analytics is therefore intentionally **inactive**, not partially configured, until a separate privacy notice, provider assessment, and explicit activation decision are complete.

## Keyboard navigation deployment verification

The shared public layout now includes a **Skip to market content** link before the repeated market header and a focusable `#main-content` target. GitHub/Vercel deployment `b1a951a` completed successfully. A non-mutating live homepage review confirmed that the skip link is the first link exposed to keyboard and assistive-technology users, while the ordinary market navigation, basket, account trigger, search, Request Desk links, and public catalogue state remain available.

The link is visually hidden until keyboard focus and then receives a high-contrast outline, which makes the repeated navigation bypass discoverable without changing the visual landing-page composition. This is a public accessibility improvement only: no sign-in occurred and no request, seller, role, payment, delivery, or provider action was submitted.

## Seller-area visibility clarification

The deployed `/vendor` Seller Studio page was checked after the founder reported that the vendor area was not showing. The public page is loading normally and presents the Siaya seller-governance, original-listing, photo-readiness, and owner-reviewed support information. This is intentionally an information and readiness surface; it does not expose an unprotected seller workspace.

The deployed `/dashboard` route separately renders a sign-in entry panel. That route is intentionally gated because the protected PostgreSQL account/profile/role migration is incomplete; a Supabase email session alone must not unlock legacy seller, order, payment, or owner controls. The next safe improvement is clearer entry wording that distinguishes the visible Seller Studio guidance from the later protected workspace rather than implying that ordinary sign-in currently opens listing management.

## Default-domain account and workspace clarification

GitHub/Vercel deployment `c011d3f` completed successfully. A live `/dashboard` review now presents **Workspace access is being prepared**, explains that the public Seller Studio guide is ready to view, and provides direct guide and market-return actions. It accurately leaves buyer profiles, seller approval, listings, orders, payments, delivery updates, and owner tools locked behind the remaining protected account/role migration.

The live account dialog was opened without entering or submitting account data. It visibly prioritizes the verified email-link route, retains the email/password option, and now states that Google sign-in is not available on the current website address. The dialog links to the published account-data disclosure. The prior hidden Google OAuth bridge has been removed from the browser account context, so no unconfigured provider can be accidentally exposed. This verification submitted no sign-in, request, seller application, order, payment, delivery, provider, or role action.

## Zero-cost public sharing deployment verification

GitHub/Vercel deployment `2f972d8` completed successfully. The live MtaaMarket homepage now includes an owner-authored promotion card after the public market explanation. It invites visitors to share the public market link only when it would help someone find a physical product or use the Request Desk, and it explains that the site will not add tracking or send a message on the visitor’s behalf.

The **Share MtaaMarket** control relies on a visitor-initiated device share menu where available and falls back to copying the public link. It does not load an advertising network, tracking pixel, external promotion script, customer record, or background job. The initial public catalogue remains an intentionally honest empty state, and no share interaction was submitted during this review.

## Public crawl guidance and Request Desk boundary verification

GitHub/Vercel deployment `3c4dc92` completed successfully. The live `robots.txt` references `sitemap.xml`, allows the public site, and excludes the protected dashboard, session-only basket, authentication callback, and password-reset route. The live sitemap contains only the homepage, public Seller Studio guide, and published privacy disclosure; it does not expose a protected workspace, an account action, or a dynamic marketplace claim to crawlers.

The deployed Request Desk was reviewed without submitting a request. Its former AI draft control has been removed because it was coupled to a legacy protected account path that default-domain public users cannot safely use. In its place, the form now displays a plain request-quality reminder to include product type, size or quantity, desired condition, and required inclusions. It truthfully states that MtaaMarket will review the request manually and does not check supply, set price, or promise collection or delivery. The sign-in-to-send boundary remains unchanged.

## Truthful launch-stage catalogue wording verification

GitHub/Vercel deployment `a40d52c` completed successfully. A non-mutating live homepage review confirmed that the primary public message now says that **owner-reviewed listings are being added** and identifies MtaaMarket as an **owner-reviewed local market** built for **Siaya buyers and sellers**. The discovery surface asks visitors to search current listings or use the Request Desk when an item is unavailable.

The empty catalogue state now plainly says that the market is preparing its first verified listings and directs visitors to a managed request rather than an unconfirmed order. This change corrects launch-stage expectations without adding a vendor, listing, review, order, payment, fulfilment promise, public seller-write path, or automated AI action.

## Public assisted-sourcing guide verification

GitHub/Vercel deployment `2cd9f96` completed successfully. A non-mutating live review of `/how-it-works` confirmed a new responsive public guide is available from the primary navigation, footer, and Home page. It explains the four bounded stages of assisted sourcing: a buyer describes the item; the owner manually checks possible supply routes; MtaaMarket confirms the exact offer; and the buyer chooses whether to proceed before any payment instruction or fulfilment discussion.

The deployed guide explicitly states that MtaaMarket does not claim supplier affiliation, copy supplier catalogue content, represent a real-time source feed, or run automatic supplier checkout. Its calls to action only lead to the already-gated Request Desk or public discovery. No account, request, supplier, payment, delivery, seller, role, or AI action was submitted during this review.

## Public navigation accessibility verification

GitHub/Vercel deployment `b6dda66` completed successfully. A non-mutating live review of the public assisted-sourcing guide confirmed that the shared navigation retains the new **How it works** route alongside the public market, Request Desk, and Seller Studio paths. The release adds semantic current-page information to public links and gives the mobile navigation control an explicit open/close label plus expanded-state and menu relationship metadata.

The mobile menu is also designed to close on Escape and when its route changes, avoiding a stale open menu after navigation. Responsive Home and assisted-sourcing guide reviews remained visually clear at a 375px viewport. No account, request, supplier, payment, delivery, seller, role, data, or background-operation action was submitted during the verification.

## Post-release public-route audit and semantic markup repair

A local post-release runtime review identified a React DOM-nesting warning in the public assisted-sourcing guide: its boundary rows placed a `div` inside a `p`, which could produce a hydration mismatch. The affected boundary content is now a semantic unordered list with list items; the responsive grid styling, visible wording, and launch-stage limits are preserved.

The repair adds regression coverage that rejects the invalid paragraph pattern and requires the semantic list and its mobile layout rule. TypeScript, all 22 test files / 76 tests, the Vercel build, and the zero-vulnerability production dependency audit pass. A full mobile guide review after the repair retained the readable four-step and boundary layout. Existing console entries preserve the original warning for diagnostic history; no new occurrence was emitted after the corrected guide was rendered.
