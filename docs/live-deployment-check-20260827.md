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

Local validation before the final source update passed: `pnpm check`, `pnpm test` with 124 passed and 5 skipped, `pnpm build`, and `git diff --check`. This pre-rotation note is superseded by the post-rotation production verification below; the parameter-removal fix was released in `a4b6b38`, the Supabase/legacy-auth log cleanup in `ea10ecb`, and the completed audit in `798ca5c`.


## Post-rotation Tavily fix verification

At 2026-08-27 18:38 GMT+3, after updating the Vercel Production `TAVILY_API_KEY` and deploying commit `a4b6b38`, the canonical `/jumia` route returned `Jumia products found.` for `Samsung TV` with ten result cards. Cards contained Jumia Kenya URLs and titles; KES pricing was shown only when present in the indexed content. This confirms the rotated credential and the corrected request shape are working together in production. The private parameter matrix established why the correction was necessary: the current Tavily free-tier endpoint returned ten results for the site query alone, but zero when `country` or `safe_search` was added, so hostname filtering remains the safety boundary.
At 2026-08-27 18:39 GMT+3, the same production `/jumia` route returned `Jumia products found.` for `school shoes` with ten cards. The cards were shoe-related Jumia Kenya pages, and indexed KES prices appeared where available. No order was submitted.
At 2026-08-27 18:39–18:40 GMT+3, the corrected production route returned ten relevant Jumia Kenya cards for `solar battery`. The first result was selected and added to the page-local basket; the basket displayed one item, its product title, the indexed description, and quantity one. No real order was submitted, so production order data remained clean.
At 2026-08-27 18:46–18:47 GMT+3, after ea10ecb (`Remove obsolete OAuth startup error log`) reached Ready, the canonical `/jumia` route returned ten Samsung TV result cards and the deployment-specific Vercel log view showed three fresh HTTP 200 requests (`auth.supabaseSession`, `marketplace.v3BuyerJumiaOrders`, and `marketplace.jumiaSearch`) with Warning 0, Error 0, and Fatal 0. The previous non-actionable `OAUTH_SERVER_URL` and JOSE verifier messages no longer appeared for this Supabase-native request path.


## Final catalogue-card hardening verification

At 2026-08-27 19:35–19:47 GMT+3, commits `6681ce8`, `c6cb11a`, and `9a340c2` were pushed to `main` and each reached Vercel Production Ready. The final deployment `9a340c2` (`Clean remaining Jumia result titles`) serves the canonical `/jumia` route and retains the founder’s visible `Owner` header state.

Local validation for the final source passed: `pnpm check`, the full Vitest suite with 129 passed and 5 skipped tests, `pnpm build`, and `git diff --check`. The Jumia search suite covers provider filtering, trusted images, fallback behavior, clean titles/snippets, product-like title extraction, visual-first ranking, and duplicate-image protection.

Live browser checks on the final Production route returned ten results for `Samsung TV`. Titles no longer expose `Add to cart`, `Best Price`, `Price Online`, or `Jumia Kenya` provider labels; snippets no longer expose provider image paths or navigation boilerplate. Searches for `school shoes` and `solar battery` also returned ten results with readable titles and honest `Price on product page` labels when exact values were absent. Trusted `ke.jumia.is` images render when the public index provides them; otherwise the branded product-photo fallback is shown. No unrelated stock images or fabricated prices are used.

A harmless live selection-to-basket check then confirmed that selecting a result does not reveal delivery details, adding it creates the page-local basket and reveals collection/home-delivery options, and removing the only item clears the basket and hides delivery details again. No irreversible order was submitted and no test order was created in production.

The remaining limitation is inherent to the current public-discovery source: some indexed entries are category/search/landing pages and may omit current product photos, exact prices, stock, variants, or delivery data. Full first-party catalogue fidelity requires a permitted Jumia catalogue feed, partner endpoint, or other approved data source. Supabase advisor findings, production SMTP/deliverability, custom-domain work, Vercel billing-address notice, and a customer-authorized end-to-end order test remain separate follow-up work.


## Real-time Smart TV result correction and official-feed assessment

At 2026-08-27 20:03–20:04 GMT+3, commit `a47b4b2` (`Filter Jumia landing pages from live results`) reached Vercel Production Ready. The previous screenshot was reproduced with `Smart TV`: the public Tavily response contained ten `/slp/` landing-page URLs, no trusted image URLs, and no structured prices. The deployed fix now removes `/slp`, `/mlp`, category, search, brand, and brands landing-page records from customer cards and displays `No individual Jumia product pages were found. Try a more specific product or model.` instead of rendering noisy landing-page text.

A subsequent live `Samsung 50U8000` search returned seven product-specific records and clean titles/descriptions, confirming that the real-time path still works when the provider index exposes individual product pages. Exact images and prices remained absent from that public response, so the UI continued to show the trusted branded fallback and `Price on product page` without fabrication.

The official Vendor Center documentation was reviewed. It documents `GET https://vendor-api.jumia.com/catalog/products` as a paginated, OAuth2-protected catalogue endpoint for an authorized Jumia seller/mastershop. The endpoint is seller-scoped and has no public buyer keyword-search parameter; integration would require a registered Vendor Center application, OAuth authorization, secure server-side token storage, and local matching over the authorized catalogue. JForce login alone is not documented as equivalent Vendor Center catalogue API access. No credentials were requested, stored, or exposed, and no unsupported official-feed claim was made.


## Catalog-first Production verification — 2026-08-28

At 2026-08-28 21:21–21:30 GMT+3, the catalog-first storefront was verified across immutable Production deployments and the canonical alias. Commit `531bcdc` reached Ready and its broad `Smart TV` response returned five concrete HTTPS Jumia product-detail URLs with zero detected landing URLs and zero generic-title records. The rendered cards showed Hisense, Globalstar, Xiaomi, and Samsung product records; missing prices remained honestly labeled `Price on product page` and no fabricated images or prices were introduced.

Commit `5d537d8` (`Remove remaining generic category cards`) then passed the complete local quality gate and reached Vercel Production Ready at immutable URL `https://siayaonlinemarket-5gvj1zc6j-hacker254mwalos-projects.vercel.app`. Its live default catalogue showed five smartphone-oriented product records. A Phones shortcut interaction updated the live query to `smartphone phone`, scrolled to the catalogue, and returned three live cards. The first result was selected and added to the page-local basket; checkout controls appeared only after the item existed. Removing the item cleared both the basket and checkout sections. No order was submitted.

The final mobile hardening commit `10f0222` (`Keep catalog actions visible on mobile`) passed `pnpm check`, the full Vitest suite with 136 passed and 5 skipped tests, `pnpm build`, `pnpm build:vercel`, and `git diff --check`, then pushed cleanly to `main`. Vercel deployment `AFL3u68R9Fpn5pK13FTE5rUt82mK` reports Ready in Production at `https://siayaonlinemarket-50rsbc8mz-hacker254mwalos-projects.vercel.app`. The canonical `https://siayaonlinemarket.vercel.app/jumia` alias loaded the latest catalog-first page with five live choices and the same honest missing-price state.

Responsive source verification confirms the header collapses at `max-width:760px`; the catalog action bar is fixed and visible through the 621–760px range as well as the existing 620px rules; category shortcuts become two columns at `max-width:900px`; and catalog bottom padding preserves clearance below fixed mobile actions. The browser environment did not permit resizing its 1280px inner viewport to 720px, so the 720px behavior was verified against the committed CSS breakpoint rules rather than claimed from a resized screenshot.

The canonical session recognized the existing single founder account as `Owner`. Its account menu exposed owner console, account/profile, and Seller Studio links. `/dashboard#profile` exposed Full name and Kenyan phone editing, email update, and new/confirm password controls. No account value or credential was changed. The 10f0222 deployment is the latest source on `main`; the repository remains clean after push.

The Vercel dashboard separately continues to show an account-level incomplete billing-address notice. It was not changed because billing is outside this production code task. The public discovery limitation also remains unchanged: this is not a first-party marketplace feed; current product price, photo, stock, variant, and delivery fidelity depends on the public index, and an approved Vendor Center or partner catalogue feed would be required for first-party completeness.

## Full-platform redesign release — 3852e67

At 2026-08-28 02:00–02:03 GMT+3, commit `3852e67` (`Polish marketplace shell and basket`) was confirmed at `main` and its GitHub/Vercel Production deployment reported `success` / `Deployment has completed` at immutable URL `https://siayaonlinemarket-iisyqlli3-hacker254mwalos-projects.vercel.app`. The canonical alias and immutable homepage both returned HTTP 200.

The canonical homepage served the revised icon-supported shell, local-first marketplace proposition, direct search, department entry points, honest local empty state, wider-selection/request actions, and share control. `/request` served the neutral Request Desk with protected submission handoff; `/vendor` served Seller Studio with one-time account approval and direct publishing after approval; `/admin` served the protected Owner control centre with live listings, sellers, requests, and orders metrics. No listing, seller, request, order, profile, or credential data was changed.

The immutable live catalogue opened on `Android smartphone` with eight varied concrete product-detail results. A real result was selected, which populated the selection panel; adding it revealed a one-item basket and checkout fields; removing it cleared both the basket and checkout. The final action remained sign-in-gated and no order was submitted. Honest `Price on product page` and `Product photo unavailable` states remained in place where the public index lacked trustworthy metadata.

The final local quality gate passed on the clean checkout: `pnpm check`; full Vitest with 137 passed and 5 skipped tests; `pnpm build:vercel`; `pnpm build`; and `git diff --check`. The browser’s current CSS viewport measured 1280px wide with no horizontal overflow. The browser could not be resized to a true 720px viewport, so mobile behavior remains supported by the committed responsive source rules: navigation and catalogue actions collapse through `max-width:760px`, catalogue shortcuts become two columns through `max-width:900px`, and bottom padding protects fixed mobile actions. The repository is clean and synchronized with `origin/main`.

## Final discovery polish — 51988ba

Commit `51988ba` (`Clean concatenated discovery navigation`) passed the focused live-search suite and the complete local quality gate, then reached Vercel Production success at immutable URL `https://siayaonlinemarket-36qmsicz8-hacker254mwalos-projects.vercel.app`. The final category smoke test triggered the Phones shortcut, settled the query to `smartphone phone`, and rendered five live choices. A production-shaped concatenated category/navigation tail observed in one indexed snippet was removed from customer-facing cards while a trusted product image remained visible on the first result and honest unavailable-photo/price states remained for the others. No order was submitted.
