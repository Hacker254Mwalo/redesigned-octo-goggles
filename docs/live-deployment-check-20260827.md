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
