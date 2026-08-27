# Live deployment check — 2026-08-27

The repository changes were committed and pushed to `main` at commit `6c95d2f`.

A browser check of `https://siayaonlinemarket.vercel.app/request` immediately after the push still displayed the previous copy: “MtaaMarket Request Desk”, “Cannot find it? Ask us for it.”, and the prior manual-review language. The updated Jumia Assisted Order wording was not yet visible at the time of verification, so the Vercel deployment may still be pending or the project may not be connected to this repository’s latest commit. Local `pnpm test`, `pnpm check`, and `pnpm build` passed before this check.


## Second deployment check

After commit `e570e14` was pushed to `main`, `https://siayaonlinemarket.vercel.app/jumia` returned the site’s route-not-found page. This confirms the latest build was not yet serving on the live Vercel URL at 2026-08-27 16:04 GMT+3. The new route exists in the repository and local production build, but Vercel deployment/connected-project status must be checked or manually retriggered.


## Homepage verification after storefront polish

At 2026-08-27 16:21 GMT+3, the live homepage still returned the previous copy (`Shop local. Or let MtaaMarket help.`, `Browse with confidence`, and the old search placeholder) after commit `e6d4d8a`. The repository and local build contain the refreshed product-led homepage, but the Vercel deployment has not yet switched to the latest `main` commit.


## Successful deployment check

At 2026-08-27 16:44 GMT+3, `https://siayaonlinemarket.vercel.app/jumia` served the updated Jumia storefront. The live page showed the normal order form, delivery or collection choices, pay-at-hand-off language, and no customer-facing founder/JForce wording. This confirms that the latest Vercel deployment is now serving the pushed implementation.


## Google discovery deployment check

At 2026-08-27 16:55 GMT+3, the live `/jumia` route served the latest storefront build with the new customer search panel, normal unpaid order form, collection/home-delivery options, and three-working-day refund copy. The Google discovery query is present in the deployed client/server build; result cards remain dependent on the server-only Google Custom Search credentials being configured in Vercel.


## Premium search deployment check

At 2026-08-27 17:06 GMT+3, the live `/jumia` route was checked with a cache-busting query after commit `331284f`. It was still serving the prior Jumia copy and did not yet show the new embedded Google search component or the refreshed hero wording. The latest local code and GitHub `main` contain the premium search redesign; Vercel had not switched the live domain to that commit at the time of this check.


## Final premium storefront verification

At 2026-08-27 17:07 GMT+3, the live `/jumia` route served the latest premium storefront build. The hero now reads “Shop Jumia, made easy in Siaya”, the page uses “Find what you want” and “Your selection”, and the public page no longer exposes founder, JForce, approval, or fulfilment-queue language. The live search panel is present; its result cards depend on the configured search-engine ID or server provider credentials.


## Pre-rotation Tavily and basket deployment check

At 2026-08-27 18:13–18:14 GMT+3, the canonical `https://siayaonlinemarket.vercel.app/jumia` route served Vercel production deployment commit `1390cc8` (`Polish Jumia basket journey and search tests`) with status Ready. This was the pre-rotation deployment: its Tavily request still contained provider parameters that were later shown to suppress results for the rotated free-tier key. The reliable request now retains the verified `site:jumia.co.ke <query>` operator, HTTPS Jumia hostname filtering, and explicit result sanitization.

Before credential rotation, live browser verification confirmed real result cards for `Samsung TV` (10 results), `school shoes` (10 results), and `solar battery` (10 results). Results included Jumia Kenya product URLs, product titles, snippets, and best-effort KES prices where indexed. A private post-rotation parameter matrix then showed that the rotated free-tier key returns results for the site-restricted query, but returns zero when the request adds `country` or `safe_search`; the source fix removing those fields is therefore required before the post-rotation production search can be called complete.

The first Samsung TV result was selected and added to the page-local Jumia basket without submitting an order. The basket showed one item and quantity one. The shared header and footer now identify the Jumia basket as page-local and link to `/jumia#jumia-basket` instead of the unrelated legacy `/cart` basket, so the Jumia journey no longer displays a misleading global zero-item count.

The public account dialog opened from the same header and showed the existing verified MtaaMarket session. No second founder account was introduced. A production profile query found one V3 profile with `role = admin`, `is_vendor = true`, `is_vendor_approved = false`, and a recorded vendor-agreement timestamp; this is consistent with the single founder account retaining owner access while vendor approval remains a separate governance flag. The live `public.jumia_orders` cleanup query returned no rows, so no test order was created.

Vercel Logs for the selected last-30-minute window showed 37 warnings, 0 errors, and 0 fatal entries. The warnings were successful HTTP 200 requests with expected optional-auth messages (`Missing session cookie`) and legacy-session verification noise when a Supabase bearer token is tested against the legacy HS256 verifier; they did not block the verified public Jumia routes. Supabase advisors reported informational RLS-without-policy notices on service-managed tables and performance notices for unindexed foreign keys/unused or duplicate legacy indexes, plus a warning that leaked-password protection is disabled. These are follow-up hardening items, not deployment failures; no broad production DDL was applied during this verification.

Local validation before this final source update passed: `pnpm check`, `pnpm test` with 124 passed and 5 skipped, `pnpm build`, and `git diff --check`. The repository remains pushed to GitHub `main` at `1390cc8`; the parameter-removal fix and corrected documentation are pending the next commit and production deployment.


## Post-rotation Tavily fix verification

At 2026-08-27 18:38 GMT+3, after updating the Vercel Production `TAVILY_API_KEY` and deploying commit `a4b6b38`, the canonical `/jumia` route returned `Jumia products found.` for `Samsung TV` with ten result cards. Cards contained Jumia Kenya URLs and titles; KES pricing was shown only when present in the indexed content. This confirms the rotated credential and the corrected request shape are working together in production. The private parameter matrix established why the correction was necessary: the current Tavily free-tier endpoint returned ten results for the site query alone, but zero when `country` or `safe_search` was added, so hostname filtering remains the safety boundary.
At 2026-08-27 18:39 GMT+3, the same production `/jumia` route returned `Jumia products found.` for `school shoes` with ten cards. The cards were shoe-related Jumia Kenya pages, and indexed KES prices appeared where available. No order was submitted.
At 2026-08-27 18:39–18:40 GMT+3, the corrected production route returned ten relevant Jumia Kenya cards for `solar battery`. The first result was selected and added to the page-local basket; the basket displayed one item, its product title, the indexed description, and quantity one. No real order was submitted, so production order data remained clean.
